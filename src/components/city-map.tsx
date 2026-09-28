"use client"

import { useEffect, useRef, useState, type MutableRefObject } from "react"
import {
  GeoJSONSource,
  GPUInitializationError,
  Map,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type ErrorEvent,
  type LngLat,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { isCameraSnapshotUrl } from "@/lib/picture"
import type { ApproachPoint, Corridor, HarbourJourney, PictureResponse, SpeedBand, WatchLayer, WatchLayers } from "@/lib/types"

// Turbopack rewrites MapLibre's own worker URL into a chunk the worker cannot run.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")

const BAND_COLOR: Record<SpeedBand, string> = {
  free: "#3DDC97",
  slow: "#FFC857",
  congested: "#FF5D73",
  unknown: "#C9D2DC",
}

const OPENING = {
  center: [114.175, 22.293] as [number, number],
  zoom: 12.55,
  pitch: 58,
  bearing: -20,
}

const FLYOVER = [
  { center: [114.148, 22.3] as [number, number], zoom: 12.7, pitch: 60, bearing: -8, duration: 7000, curve: 1.25 },
  { center: [114.21, 22.3] as [number, number], zoom: 12.55, pitch: 54, bearing: 18, duration: 7600, curve: 1.25 },
  { center: [114.178, 22.292] as [number, number], zoom: 13.05, pitch: 52, bearing: -12, duration: 7200, curve: 1.2 },
]

const WATCH_HITS = ["incidents", "cameras-harbour", "cameras-city", "works", "tolls-portal", "tolls-overview"]

type AnimLine = {
  coords: [number, number][]
  cum: number[]
  band: SpeedBand
  speed: number
}

type Particle = { line: number; t: number }

type CityMapProps = {
  corridors: Corridor[]
  approaches: ApproachPoint[]
  picture: PictureResponse | null
  incidents: GeoJSON.FeatureCollection | null
  layers: WatchLayers
  flyToken: number
  onMap: (available: boolean) => void
  disabled?: boolean
}

const PILL: Record<HarbourJourney["colour"], string> = {
  red: "#FF5D73",
  amber: "#FFC857",
  green: "#3DDC97",
  none: "#C9D2DC",
}

export function CityMap({
  corridors,
  approaches,
  picture,
  incidents,
  layers,
  flyToken,
  onMap,
  disabled = false,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const linesRef = useRef<AnimLine[]>([])
  const particlesRef = useRef<Particle[]>([])
  const corridorsRef = useRef(corridors)
  const onMapRef = useRef(onMap)
  const readyRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [gpuFailed, setGpuFailed] = useState(false)
  const [wasDisabled, setWasDisabled] = useState(disabled)
  if (disabled !== wasDisabled) {
    setWasDisabled(disabled)
    if (!disabled) setGpuFailed(false)
  }
  const unavailable = disabled || gpuFailed

  useEffect(() => {
    corridorsRef.current = corridors
    const map = mapRef.current
    if (!map || !readyRef.current) return
    publishCorridors(map, corridors, linesRef, particlesRef)
  }, [corridors])

  useEffect(() => {
    onMapRef.current = onMap
  }, [onMap])

  useEffect(() => {
    onMapRef.current(!unavailable)
  }, [unavailable])

  useEffect(() => {
    if (disabled) return

    const container = containerRef.current
    if (!container) return

    let active = true
    let map: Map
    try {
      map = new Map({
        container,
        attributionControl: { compact: true },
        maxPitch: 72,
        maxBounds: [
          [113.62, 21.98],
          [114.62, 22.72],
        ],
        style: {
          version: 8,
          sources: {
            imagery: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              attribution: "Imagery © Esri",
            },
            labels: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
            },
            terrain: {
              type: "raster-dem",
              tiles: ["/api/dem/{z}/{x}/{y}.png"],
              encoding: "terrarium",
              tileSize: 256,
              maxzoom: 15,
            },
          },
          layers: [
            { id: "satellite", type: "raster", source: "imagery" },
            { id: "places", type: "raster", source: "labels", paint: { "raster-opacity": 0.88 } },
          ],
        },
        ...OPENING,
      })
    } catch (error) {
      if (!isGpuFailure(error)) throw error
      queueMicrotask(() => {
        if (active) setGpuFailed(true)
      })
      return () => {
        active = false
      }
    }
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-left")
    mapRef.current = map

    let terrainFailed = false
    let removed = false
    const dropMap = () => {
      if (removed) return
      removed = true
      readyRef.current = false
      mapRef.current = null
      setMapReady(false)
      setGpuFailed(true)
      map.remove()
    }
    map.on("error", (event: ErrorEvent & { sourceId?: string }) => {
      if (isGpuFailure(event.error)) {
        dropMap()
        return
      }
      if (terrainFailed) return
      if (event.sourceId === "terrain") {
        terrainFailed = true
        map.setTerrain(null)
      }
    })

    map.on("load", () => {
      map.resize()
      try {
        map.setTerrain({ source: "terrain", exaggeration: 1.35 })
      } catch {
        map.setTerrain(null)
      }

      map.addSource("cameras", { type: "geojson", data: emptyCollection() })
      map.addSource("works", { type: "geojson", data: emptyCollection() })
      map.addSource("tolls", { type: "geojson", data: emptyCollection() })
      map.addSource("incidents", { type: "geojson", data: emptyCollection() })
      map.addSource("corridors", {
        type: "geojson",
        data: emptyCollection(),
        attribution: "Road centreline and speeds © Transport Department",
      })
      map.addSource("particles", { type: "geojson", data: emptyCollection() })
      map.addLayer({
        id: "corridor-glow",
        type: "line",
        source: "corridors",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 7, 13, 12, 15, 16],
          "line-opacity": 0.32,
          "line-blur": 4,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      })
      map.addLayer({
        id: "corridor-casing",
        type: "line",
        source: "corridors",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": "#041018",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3.2, 13, 4.6, 15, 6.5],
          "line-opacity": 0.45,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      })
      map.addLayer({
        id: "corridor-line",
        type: "line",
        source: "corridors",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 13, 2.4, 15, 3.4],
          "line-opacity": 0.95,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      })
      map.addLayer({
        id: "corridor-point",
        type: "circle",
        source: "corridors",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 13, 5.5],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#f7fbff",
          "circle-stroke-width": 1,
          "circle-pitch-alignment": "map",
        },
      })
      map.addLayer({
        id: "traffic-particles",
        type: "circle",
        source: "particles",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 2.2, 13, 3.6],
          "circle-color": "#f4fff8",
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 1.6,
          "circle-pitch-alignment": "map",
        },
      })

      addWatchLayers(map)
      const showPopup = popupOpener(map)
      const watchLayers = WATCH_HITS.filter((layerId) => map.getLayer(layerId))
      const onCorridorClick = (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const target = event.originalEvent.target
        if (target instanceof Element && target.closest(".approach-time")) return
        if (watchLayers.length > 0) {
          const covering = map.queryRenderedFeatures(event.point, { layers: watchLayers })
          if (covering.length > 0) return
        }
        const feature = event.features?.[0]
        if (!feature) return
        showPopup(event.lngLat, corridorPopup(feature.properties ?? null))
      }
      map.on("click", "corridor-line", onCorridorClick)
      map.on("click", "corridor-point", onCorridorClick)
      const featurePopups: Record<string, (properties: GeoJSON.GeoJsonProperties) => HTMLElement> = {
        "cameras-harbour": cameraPopup,
        "cameras-city": cameraPopup,
        works: workPopup,
        "tolls-portal": tollPopup,
        "tolls-overview": tollPopup,
        incidents: incidentPopup,
      }
      for (const layerId of watchLayers) {
        const render = featurePopups[layerId]
        if (!render) continue
        map.on("click", layerId, (event) => openFeature(showPopup, event, render))
      }
      for (const layerId of ["corridor-line", ...watchLayers]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = ""
        })
      }

      readyRef.current = true
      setMapReady(true)
      publishCorridors(map, corridorsRef.current, linesRef, particlesRef)
    })

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const current = mapRef.current
      if (current && readyRef.current && !document.hidden) {
        stepParticles(current, linesRef.current, particlesRef.current, dt)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      active = false
      cancelAnimationFrame(frame)
      readyRef.current = false
      if (!removed) {
        removed = true
        map.remove()
      }
      mapRef.current = null
    }
  }, [disabled])

  useEffect(() => {
    const map = mapRef.current
    if (disabled || !map || !mapReady) return
    let cancelled = false
    const timeouts: number[] = []
    const start = window.setTimeout(() => {
      if (cancelled) return
      let index = 0
      const run = () => {
        if (cancelled || index >= FLYOVER.length) return
        const next = FLYOVER[index]
        index += 1
        if (!next) return
        map.flyTo({ ...next, essential: true })
        map.once("moveend", run)
      }
      run()
    }, 700)
    timeouts.push(start)
    return () => {
      cancelled = true
      timeouts.forEach((id) => window.clearTimeout(id))
      if (mapRef.current === map) map.stop()
    }
  }, [disabled, flyToken, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (disabled || !map || !mapReady) return
    const markers = approaches.map((point) => {
      const marker = new Marker({ element: approachButton(point), anchor: "center" })
        .setLngLat(point.coordinates)
        .setPopup(new Popup({ closeButton: true, maxWidth: "280px", offset: 16 }).setDOMContent(approachPopup(point)))
        .addTo(map)
      return marker
    })
    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [approaches, disabled, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (disabled || !map || !mapReady) return
    geoJsonSource(map, "cameras")?.setData(picture?.cameras ?? emptyCollection())
    geoJsonSource(map, "works")?.setData(picture?.works ?? emptyCollection())
    geoJsonSource(map, "tolls")?.setData(picture?.tolls ?? emptyCollection())
    geoJsonSource(map, "incidents")?.setData(incidents ?? emptyCollection())
  }, [disabled, incidents, mapReady, picture])

  useEffect(() => {
    const map = mapRef.current
    if (disabled || !map || !mapReady) return
    const kinds: WatchLayer[] = ["speed", "cameras", "works", "tolls", "incidents"]
    for (const kind of kinds) {
      for (const layerId of layerIds(kind)) {
        if (!map.getLayer(layerId)) continue
        map.setLayoutProperty(layerId, "visibility", layers[kind] ? "visible" : "none")
      }
    }
  }, [disabled, layers, mapReady])

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-label="Satellite map of Hong Kong"
      />
      {unavailable ? (
        <p className="pointer-events-none absolute inset-x-6 top-[28%] z-[1] max-w-md text-sm leading-relaxed text-zinc-300">
          The satellite map did not start. Crossing minutes and network speed stay on screen.
        </p>
      ) : null}
    </>
  )
}

function isGpuFailure(error: unknown): boolean {
  if (error instanceof GPUInitializationError) return true
  const message = error instanceof Error ? error.message : ""
  return /webgl|gpu initialization/i.test(message)
}

function approachButton(point: ApproachPoint): HTMLButtonElement {
  const minutes = shortestMinutes(point)
  const button = document.createElement("button")
  button.type = "button"
  button.className = "approach-time"
  button.textContent = minutes == null ? "—" : `${minutes} min`
  button.setAttribute("aria-label", `${point.name}, ${button.textContent}`)
  button.style.cssText = [
    "border:0",
    "border-radius:999px",
    "padding:3px 8px",
    "font:600 12px/1.2 Outfit,sans-serif",
    "color:#07131c",
    `background:${PILL[worstColour(point)]}`,
    `box-shadow:0 0 14px ${PILL[worstColour(point)]}, 0 1px 4px rgba(0,0,0,.45)`,
    "cursor:pointer",
  ].join(";")
  return button
}

function approachPopup(point: ApproachPoint): HTMLElement {
  const root = document.createElement("div")
  root.style.cssText = "font:13px/1.45 Outfit,sans-serif;color:#102033"
  const title = document.createElement("strong")
  title.textContent = point.name
  root.append(title)
  for (const leg of point.legs) {
    const line = document.createElement("div")
    line.textContent = leg.minutes == null ? leg.name : `${leg.name} · ${leg.minutes} min`
    root.append(line)
  }
  return root
}

function shortestMinutes(point: ApproachPoint): number | null {
  let best: number | null = null
  for (const leg of point.legs) {
    if (leg.minutes == null) continue
    if (best == null || leg.minutes < best) best = leg.minutes
  }
  return best
}

function worstColour(point: ApproachPoint): HarbourJourney["colour"] {
  const rank: Record<HarbourJourney["colour"], number> = { none: 0, green: 1, amber: 2, red: 3 }
  return point.legs.reduce<HarbourJourney["colour"]>((worst, leg) => {
    return rank[leg.colour] > rank[worst] ? leg.colour : worst
  }, "none")
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] }
}

function publishCorridors(
  map: Map,
  corridors: Corridor[],
  linesRef: MutableRefObject<AnimLine[]>,
  particlesRef: MutableRefObject<Particle[]>,
) {
  const source = geoJsonSource(map, "corridors")
  if (!source) return

  const features: GeoJSON.Feature[] = corridors.map((corridor) => {
    const color = BAND_COLOR[corridor.band]
    const properties = {
      name: corridor.roadTc,
      nameEn: corridor.roadEn,
      direction: corridor.direction,
      speed: corridor.speedKmh == null ? "No reading" : `${Math.round(corridor.speedKmh)} km/h`,
      color,
    }
    if (corridor.coordinates.length < 2) {
      return {
        type: "Feature",
        properties,
        geometry: { type: "Point", coordinates: corridor.coordinates[0] ?? [114.15, 22.3] },
      }
    }
    return {
      type: "Feature",
      properties,
      geometry: { type: "LineString", coordinates: corridor.coordinates },
    }
  })
  ;(source as GeoJSONSource).setData({ type: "FeatureCollection", features })

  const lines: AnimLine[] = []
  corridors.forEach((corridor) => {
    if (corridor.coordinates.length < 2 || corridor.band === "unknown" || corridor.speedKmh == null) return
    const cum = [0]
    for (let index = 1; index < corridor.coordinates.length; index += 1) {
      const previous = corridor.coordinates[index - 1]
      const point = corridor.coordinates[index]
      if (!previous || !point) continue
      const dLng = (point[0] - previous[0]) * 102
      const dLat = (point[1] - previous[1]) * 111
      cum.push((cum[cum.length - 1] ?? 0) + Math.hypot(dLng, dLat))
    }
    lines.push({
      coords: corridor.coordinates,
      cum,
      band: corridor.band,
      speed: corridor.speedKmh,
    })
  })
  linesRef.current = lines
  const particles: Particle[] = []
  const ranked = lines
    .map((line, lineIndex) => ({ line, lineIndex, distance: harbourDistance(line.coords) }))
    .sort((a, b) => a.distance - b.distance)
  for (const entry of ranked) {
    const total = entry.line.cum[entry.line.cum.length - 1] ?? 0
    const count = Math.max(1, Math.min(4, Math.round(total / 1.2)))
    for (let index = 0; index < count; index += 1) {
      particles.push({ line: entry.lineIndex, t: (index + 0.15) / count })
      if (particles.length >= 280) break
    }
    if (particles.length >= 280) break
  }
  particlesRef.current = particles
}

function harbourDistance(coords: [number, number][]): number {
  const mid = coords[Math.floor(coords.length / 2)]
  if (!mid) return 99
  const dLng = (mid[0] - 114.175) * 102
  const dLat = (mid[1] - 22.293) * 111
  return Math.hypot(dLng, dLat)
}

function stepParticles(map: Map, lines: AnimLine[], particles: Particle[], dt: number) {
  const source = geoJsonSource(map, "particles")
  if (!source || lines.length === 0) {
    source?.setData(emptyCollection())
    return
  }
  const features: GeoJSON.Feature[] = particles.map((particle) => {
    const line = lines[particle.line]
    if (!line) {
      return {
        type: "Feature",
        properties: { color: BAND_COLOR.unknown },
        geometry: { type: "Point", coordinates: [114.15, 22.3] },
      }
    }
    const pace = Math.max(0.25, line.speed / 50) * 0.075
    particle.t = (particle.t + pace * dt) % 1
    return {
      type: "Feature",
      properties: { color: BAND_COLOR[line.band] },
      geometry: { type: "Point", coordinates: pointAlong(line, particle.t) },
    }
  })
  source.setData({ type: "FeatureCollection", features })
}

function pointAlong(line: AnimLine, t: number): [number, number] {
  const total = line.cum[line.cum.length - 1] ?? 0
  const first = line.coords[0]
  if (!first || total <= 0) return first ?? [114.15, 22.3]
  const target = t * total
  let index = 1
  while (index < line.cum.length - 1 && (line.cum[index] ?? 0) < target) index += 1
  const start = line.cum[index - 1] ?? 0
  const end = line.cum[index] ?? start
  const span = end - start || 1
  const mix = (target - start) / span
  const a = line.coords[index - 1] ?? first
  const b = line.coords[index] ?? a
  return [a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix]
}

function geoJsonSource(map: Map, id: string): GeoJSONSource | null {
  const source = map.getSource(id)
  return source instanceof GeoJSONSource ? source : null
}

function addWatchLayers(map: Map) {
  const cone = cameraCone()
  if (cone && !map.hasImage("camera-cone")) {
    map.addImage("camera-cone", cone, { pixelRatio: 2 })
  }
  map.addLayer({
    id: "tolls-overview",
    type: "circle",
    source: "tolls",
    maxzoom: 12.4,
    filter: ["==", ["get", "band"], "overview"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 6, 15, 11],
      "circle-color": "rgba(125, 211, 232, 0.18)",
      "circle-stroke-color": "#E7FBFF",
      "circle-stroke-width": 2,
      "circle-pitch-alignment": "map",
    },
  })
  map.addLayer({
    id: "tolls-portal",
    type: "circle",
    source: "tolls",
    minzoom: 12.4,
    filter: ["==", ["get", "band"], "portal"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 6, 15, 11],
      "circle-color": "rgba(125, 211, 232, 0.18)",
      "circle-stroke-color": "#E7FBFF",
      "circle-stroke-width": 2,
      "circle-pitch-alignment": "map",
    },
  })
  map.addLayer({
    id: "works",
    type: "circle",
    source: "works",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 6, 14, 9],
      "circle-color": ["match", ["get", "status"], "In Progress", "#FF5D73", "Under Preparation", "#FFC857", "#C9D2DC"],
      "circle-stroke-color": "#041018",
      "circle-stroke-width": 2,
      "circle-pitch-alignment": "map",
    },
  })
  const mark = incidentMark()
  if (mark && !map.hasImage("incident-mark")) {
    map.addImage("incident-mark", mark, { pixelRatio: 2 })
  }
  if (map.hasImage("incident-mark")) {
    map.addLayer({
      id: "incidents",
      type: "symbol",
      source: "incidents",
      layout: {
        "icon-image": "incident-mark",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.72, 14, 1.05],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-pitch-alignment": "viewport",
      },
    })
  }
  if (!map.hasImage("camera-cone")) return
  addCameraLayer(map, "cameras-harbour", 1, 11.6)
  addCameraLayer(map, "cameras-city", 0, 14)
}

function incidentMark(): ImageData | null {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null
  context.clearRect(0, 0, size, size)
  context.translate(size / 2, size / 2)
  context.beginPath()
  context.moveTo(0, -22)
  context.lineTo(18, 0)
  context.lineTo(0, 22)
  context.lineTo(-18, 0)
  context.closePath()
  context.fillStyle = "#FF5D73"
  context.fill()
  context.lineWidth = 4
  context.strokeStyle = "#FFF7F8"
  context.stroke()
  context.beginPath()
  context.moveTo(0, -8)
  context.lineTo(0, 4)
  context.lineWidth = 3
  context.strokeStyle = "#041018"
  context.stroke()
  context.beginPath()
  context.arc(0, 10, 1.8, 0, Math.PI * 2)
  context.fillStyle = "#041018"
  context.fill()
  return context.getImageData(0, 0, size, size)
}

function addCameraLayer(map: Map, id: string, harbour: 0 | 1, minzoom: number) {
  map.addLayer({
    id,
    type: "symbol",
    source: "cameras",
    minzoom,
    filter: ["==", ["get", "harbour"], harbour],
    layout: {
      "icon-image": "camera-cone",
      "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.42, 14, 0.85, 16, 1.05],
      "icon-rotate": ["get", "rotation"],
      "icon-rotation-alignment": "map",
      "icon-pitch-alignment": "viewport",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  })
}

function cameraCone(): ImageData | null {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null
  context.clearRect(0, 0, size, size)
  context.translate(size / 2, size / 2)
  context.beginPath()
  context.moveTo(0, 2)
  context.lineTo(-18, -26)
  context.quadraticCurveTo(0, -18, 18, -26)
  context.closePath()
  context.fillStyle = "rgba(125, 211, 232, 0.72)"
  context.fill()
  context.lineWidth = 2
  context.strokeStyle = "rgba(236, 254, 255, 0.95)"
  context.stroke()
  context.beginPath()
  context.arc(0, 2, 5, 0, Math.PI * 2)
  context.fillStyle = "#F4FEFF"
  context.fill()
  context.lineWidth = 1.5
  context.strokeStyle = "#083044"
  context.stroke()
  return context.getImageData(0, 0, size, size)
}

function layerIds(kind: WatchLayer): string[] {
  switch (kind) {
    case "speed":
      return ["corridor-glow", "corridor-casing", "corridor-line", "corridor-point", "traffic-particles"]
    case "cameras":
      return ["cameras-harbour", "cameras-city"]
    case "works":
      return ["works"]
    case "tolls":
      return ["tolls-portal", "tolls-overview"]
    case "incidents":
      return ["incidents"]
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

function popupOpener(map: Map) {
  let active: Popup | null = null
  return (lngLat: LngLat, content: HTMLElement) => {
    active?.remove()
    active = new Popup({ closeButton: true, maxWidth: "320px", offset: 16 }).setLngLat(lngLat).setDOMContent(content).addTo(map)
  }
}

function openFeature(
  showPopup: (lngLat: LngLat, content: HTMLElement) => void,
  event: MapMouseEvent & { features?: MapGeoJSONFeature[] },
  render: (properties: GeoJSON.GeoJsonProperties) => HTMLElement,
) {
  const target = event.originalEvent.target
  if (target instanceof Element && target.closest(".approach-time")) return
  const feature = event.features?.[0]
  if (!feature) return
  showPopup(event.lngLat, render(feature.properties ?? null))
}

function corridorPopup(properties: GeoJSON.GeoJsonProperties): HTMLElement {
  const root = document.createElement("div")
  root.style.cssText = "font:13px/1.4 Outfit,sans-serif;color:#102033"
  const title = document.createElement("strong")
  title.textContent = textProp(properties, "name")
  const detail = document.createElement("div")
  const direction = textProp(properties, "direction")
  const speed = textProp(properties, "speed")
  detail.textContent = direction ? `${direction} · ${speed}` : speed
  const english = document.createElement("div")
  english.style.color = "#526170"
  english.textContent = textProp(properties, "nameEn")
  root.append(title, detail, english)
  return root
}

function cameraPopup(properties: GeoJSON.GeoJsonProperties): HTMLElement {
  const root = popupRoot()
  const title = document.createElement("strong")
  title.textContent = textProp(properties, "name")
  const district = document.createElement("div")
  district.style.color = "#526170"
  district.textContent = textProp(properties, "district")
  root.append(title, district)
  const url = textProp(properties, "url")
  if (!isCameraSnapshotUrl(url)) return root
  const image = document.createElement("img")
  image.alt = title.textContent
  image.width = 300
  image.style.cssText = "display:block;width:100%;height:auto;margin-top:6px;background:#d7dee6"
  image.addEventListener("error", () => {
    image.remove()
    const note = document.createElement("p")
    note.textContent = "Snapshot did not load."
    root.append(note)
  })
  image.src = url
  root.append(image)
  return root
}

function incidentPopup(properties: GeoJSON.GeoJsonProperties): HTMLElement {
  const root = popupRoot()
  const title = document.createElement("strong")
  title.textContent = textProp(properties, "name") || "Incident"
  const place = document.createElement("div")
  const location = textProp(properties, "location")
  const locationEn = textProp(properties, "locationEn")
  const direction = textProp(properties, "direction")
  place.textContent = [location || locationEn, direction].filter(Boolean).join(" · ")
  root.append(title, place)
  const landmark = textProp(properties, "landmark")
  if (landmark) {
    const near = document.createElement("div")
    near.textContent = `Near ${landmark}`
    root.append(near)
  }
  const content = textProp(properties, "content")
  if (content) {
    const line = document.createElement("div")
    line.textContent = content
    root.append(line)
  }
  const announced = clock(hongKongStamp(textProp(properties, "announced")))
  if (announced) {
    const when = document.createElement("div")
    when.style.color = "#526170"
    when.textContent = announced
    root.append(when)
  }
  return root
}

function workPopup(properties: GeoJSON.GeoJsonProperties): HTMLElement {
  const root = popupRoot()
  const title = document.createElement("strong")
  title.textContent = textProp(properties, "road") || "Road work"
  const place = document.createElement("div")
  place.textContent = textProp(properties, "place")
  const status = document.createElement("div")
  const lane = textProp(properties, "lane")
  const kind = textProp(properties, "kind")
  status.textContent = [textProp(properties, "status"), lane, kind].filter(Boolean).join(" · ")
  root.append(title, place, status)
  const when = timeRange(textProp(properties, "start"), textProp(properties, "end"))
  if (when) {
    const line = document.createElement("div")
    line.style.color = "#526170"
    line.textContent = when
    root.append(line)
  }
  return root
}

function tollPopup(properties: GeoJSON.GeoJsonProperties): HTMLElement {
  const root = popupRoot()
  const title = document.createElement("strong")
  title.textContent = textProp(properties, "name")
  const band = document.createElement("div")
  band.textContent = textProp(properties, "band") === "overview" ? "Tunnel" : "Tunnel portal"
  root.append(title, band)
  return root
}

function popupRoot(): HTMLElement {
  const root = document.createElement("div")
  root.style.cssText = "font:13px/1.4 Outfit,sans-serif;color:#102033;width:300px"
  return root
}

function timeRange(start: string, end: string): string {
  const from = clock(start)
  const to = clock(end)
  if (from && to) return `${from} – ${to} HKT`
  return from || to
}

function hongKongStamp(value: string): string {
  if (!value || /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) return value
  return `${value}+08:00`
}

function clock(value: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    day: "numeric",
    month: "short",
  }).format(date)
}

function textProp(properties: GeoJSON.GeoJsonProperties, key: string): string {
  const value = properties?.[key]
  return typeof value === "string" ? value : ""
}
