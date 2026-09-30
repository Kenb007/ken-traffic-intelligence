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
  type FilterSpecification,
  type LngLat,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useI18n } from "@/components/locale"
import {
  approachPopup,
  cameraPopup,
  controlPointPopup,
  corridorPopup,
  incidentPopup,
  tollPopup,
  workPopup,
} from "@/components/map-cards"
import { displayText, type Messages } from "@/lib/i18n"
import type { ApproachPoint, Basemap, Corridor, HarbourJourney, PictureResponse, SpeedBand, WatchLayer, WatchLayers } from "@/lib/types"

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

const CITY_LAYERS = ["city-land", "city-water", "city-roads", "buildings-3d"]

function showBasemap(map: Map, basemap: Basemap) {
  switch (basemap) {
    case "street":
      setRasterVisible(map, "osm", true)
      setRasterVisible(map, "satellite", false)
      setRasterVisible(map, "places", false)
      setCityVisible(map, false)
      map.setTerrain(null)
      map.easeTo({ pitch: 0, bearing: 0, duration: 650, essential: true })
      return
    case "satellite":
      setRasterVisible(map, "osm", false)
      setRasterVisible(map, "satellite", true)
      setRasterVisible(map, "places", true)
      setCityVisible(map, false)
      try {
        map.setTerrain({ source: "terrain", exaggeration: 1 })
      } catch {
        map.setTerrain(null)
      }
      map.easeTo({ pitch: OPENING.pitch, bearing: OPENING.bearing, duration: 650, essential: true })
      return
    case "buildings":
      setRasterVisible(map, "osm", false)
      setRasterVisible(map, "satellite", false)
      setRasterVisible(map, "places", false)
      setCityVisible(map, true)
      map.setTerrain(null)
      map.easeTo({
        pitch: 64,
        bearing: -18,
        zoom: Math.max(map.getZoom(), 15.4),
        duration: 800,
        essential: true,
      })
      return
    default: {
      const exhaustive: never = basemap
      return exhaustive
    }
  }
}

function setCityVisible(map: Map, visible: boolean) {
  for (const layerId of CITY_LAYERS) setRasterVisible(map, layerId, visible)
}

function tourCamera(step: (typeof FLYOVER)[number], basemap: Basemap) {
  switch (basemap) {
    case "street":
      return { ...step, pitch: 0, bearing: 0 }
    case "satellite":
      return step
    case "buildings":
      return { ...step, zoom: Math.max(step.zoom, 15.2), pitch: Math.max(step.pitch, 60) }
    default: {
      const exhaustive: never = basemap
      return exhaustive
    }
  }
}

function setRasterVisible(map: Map, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none")
}

const FLYOVER = [
  { center: [114.148, 22.3] as [number, number], zoom: 12.7, pitch: 60, bearing: -8, duration: 7000, curve: 1.25 },
  { center: [114.21, 22.3] as [number, number], zoom: 12.55, pitch: 54, bearing: 18, duration: 7600, curve: 1.25 },
  { center: [114.178, 22.292] as [number, number], zoom: 13.05, pitch: 52, bearing: -12, duration: 7200, curve: 1.2 },
]

const WATCH_HITS = ["incidents", "cameras-harbour", "cameras-portal", "cameras-city", "works", "tolls-portal", "tolls-overview", "control-points"]

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
  controlPoints: GeoJSON.FeatureCollection | null
  layers: WatchLayers
  basemap: Basemap
  flyToken: number
  focus: { id: string; coordinates: [number, number] } | null
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
  controlPoints,
  layers,
  basemap,
  flyToken,
  focus,
  onMap,
  disabled = false,
}: CityMapProps) {
  const { locale, messages } = useI18n()
  const copyRef = useRef(messages)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const linesRef = useRef<AnimLine[]>([])
  const particlesRef = useRef<Particle[]>([])
  const corridorsRef = useRef(corridors)
  const onMapRef = useRef(onMap)
  const readyRef = useRef(false)
  const basemapRef = useRef(basemap)
  const cancelFlyRef = useRef<(() => void) | null>(null)
  const appliedBasemap = useRef<Basemap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [gpuFailed, setGpuFailed] = useState(false)
  const [wasDisabled, setWasDisabled] = useState(disabled)
  if (disabled !== wasDisabled) {
    setWasDisabled(disabled)
    if (!disabled) setGpuFailed(false)
  }
  const unavailable = disabled || gpuFailed

  useEffect(() => {
    copyRef.current = messages
  }, [messages])

  useEffect(() => {
    corridorsRef.current = corridors
    const map = mapRef.current
    if (!map || !readyRef.current) return
    publishCorridors(map, corridors, linesRef, particlesRef, copyRef.current)
  }, [corridors, locale])

  useEffect(() => {
    onMapRef.current = onMap
  }, [onMap])

  useEffect(() => {
    basemapRef.current = basemap
  }, [basemap])

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
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              maxzoom: 19,
              attribution: "© OpenStreetMap contributors",
            },
            openmap: {
              type: "vector",
              url: "https://tiles.openfreemap.org/planet",
              attribution: "© OpenMapTiles © OpenFreeMap",
            },
            terrain: {
              type: "raster-dem",
              tiles: ["/api/dem/{z}/{x}/{y}.png?v=3"],
              encoding: "terrarium",
              tileSize: 256,
              maxzoom: 15,
            },
          },
          layers: [
            { id: "city-land", type: "background", paint: { "background-color": "#e6eef2" }, layout: { visibility: "none" } },
            {
              id: "city-water",
              type: "fill",
              source: "openmap",
              "source-layer": "water",
              layout: { visibility: "none" },
              paint: { "fill-color": "#b9d7e4" },
            },
            {
              id: "city-roads",
              type: "line",
              source: "openmap",
              "source-layer": "transportation",
              layout: { visibility: "none", "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#f7f4ee",
                "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.4, 15, 2.2, 17, 5],
              },
            },
            { id: "osm", type: "raster", source: "osm", layout: { visibility: "none" } },
            { id: "satellite", type: "raster", source: "imagery" },
            { id: "places", type: "raster", source: "labels", paint: { "raster-opacity": 0.88 } },
            {
              id: "buildings-3d",
              type: "fill-extrusion",
              source: "openmap",
              "source-layer": "building",
              minzoom: 14,
              filter: ["!=", ["get", "hide_3d"], true],
              layout: { visibility: "none" },
              paint: {
                "fill-extrusion-color": [
                  "interpolate",
                  ["linear"],
                  ["to-number", ["get", "render_height"], 0],
                  0,
                  "#d5dee6",
                  80,
                  "#b4c4d2",
                  200,
                  "#8ea6ba",
                  400,
                  "#6d8da6",
                ],
                "fill-extrusion-height": [
                  "case",
                  [">", ["to-number", ["get", "render_height"], 0], 0],
                  ["to-number", ["get", "render_height"], 0],
                  12,
                ],
                "fill-extrusion-base": ["to-number", ["get", "render_min_height"], 0],
                "fill-extrusion-opacity": 1,
              },
            },
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
        map.setTerrain({ source: "terrain", exaggeration: 1 })
      } catch {
        map.setTerrain(null)
      }

      map.addSource("cameras", { type: "geojson", data: emptyCollection() })
      map.addSource("works", { type: "geojson", data: emptyCollection() })
      map.addSource("tolls", { type: "geojson", data: emptyCollection() })
      map.addSource("incidents", { type: "geojson", data: emptyCollection() })
      map.addSource("control-points", {
        type: "geojson",
        data: emptyCollection(),
        attribution: "Passenger clearance © Immigration Department",
      })
      map.addSource("corridors", {
        type: "geojson",
        data: emptyCollection(),
        attribution: "© Transport Department",
      })
      map.addSource("particles", { type: "geojson", data: emptyCollection() })
      // MapLibre paints every layer above the first 3D layer on top of the buildings.
      // Keep the speed lines underneath so a pitched roof hides the road behind it.
      const underBuildings = "buildings-3d"
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
      }, underBuildings)
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
      }, underBuildings)
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
      }, underBuildings)
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
      }, underBuildings)
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
      }, underBuildings)

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
        showPopup(event.lngLat, corridorPopup(feature.properties ?? null, copyRef.current))
      }
      map.on("click", "corridor-line", onCorridorClick)
      map.on("click", "corridor-point", onCorridorClick)
      const featurePopups: Record<string, (properties: GeoJSON.GeoJsonProperties, copy: Messages) => HTMLElement> = {
        "cameras-harbour": cameraPopup,
        "cameras-portal": cameraPopup,
        "cameras-city": cameraPopup,
        works: workPopup,
        "tolls-portal": tollPopup,
        "tolls-overview": tollPopup,
        incidents: incidentPopup,
        "control-points": controlPointPopup,
      }
      for (const layerId of watchLayers) {
        const render = featurePopups[layerId]
        if (!render) continue
        map.on("click", layerId, (event) => openFeature(showPopup, event, (properties) => render(properties, copyRef.current)))
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
      publishCorridors(map, corridorsRef.current, linesRef, particlesRef, copyRef.current)
    })

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const current = mapRef.current
      if (current && readyRef.current && !document.hidden) {
        stepParticles(current, linesRef.current, particlesRef.current, dt)
        if (current.getLayer("control-points-ring")) {
          const pulse = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(now / 320))
          current.setPaintProperty("control-points-ring", "circle-opacity", pulse)
        }
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
    const cancel = () => {
      cancelled = true
    }
    cancelFlyRef.current = cancel
    const timeouts: number[] = []
    const start = window.setTimeout(() => {
      if (cancelled) return
      let index = 0
      const run = () => {
        if (cancelled || index >= FLYOVER.length) return
        const next = FLYOVER[index]
        index += 1
        if (!next) return
        map.flyTo({ ...tourCamera(next, basemapRef.current), essential: true })
        map.once("moveend", run)
      }
      run()
    }, 700)
    timeouts.push(start)
    return () => {
      cancel()
      if (cancelFlyRef.current === cancel) cancelFlyRef.current = null
      timeouts.forEach((id) => window.clearTimeout(id))
      if (mapRef.current === map) map.stop()
    }
  }, [disabled, flyToken, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!focus || disabled || !map || !mapReady) return
    cancelFlyRef.current?.()
    map.stop()
    map.flyTo({
      center: focus.coordinates,
      zoom: Math.max(map.getZoom(), basemapRef.current === "buildings" ? 15.6 : 14.2),
      duration: 900,
      essential: true,
    })
  }, [disabled, focus, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady) {
      appliedBasemap.current = null
      return
    }
    if (disabled || !map) return
    if (appliedBasemap.current === basemap) return
    const first = appliedBasemap.current === null
    appliedBasemap.current = basemap
    if (first && basemap === "satellite") return
    cancelFlyRef.current?.()
    showBasemap(map, basemap)
  }, [basemap, disabled, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (disabled || !map || !mapReady) return
    const markers = approaches.map((point) => {
      const popup = new Popup({ className: "city-popup", closeButton: true, maxWidth: "360px", offset: 16 }).setDOMContent(
        approachPopup(point, messages),
      )
      popup.on("open", () => keepCardInView(map, popup))
      const marker = new Marker({ element: approachButton(point, messages), anchor: "center" })
        .setLngLat(point.coordinates)
        .setPopup(popup)
        .addTo(map)
      return marker
    })
    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [approaches, disabled, mapReady, locale, messages])

  useEffect(() => {
    const map = mapRef.current
    if (disabled || !map || !mapReady) return
    geoJsonSource(map, "cameras")?.setData(picture?.cameras ?? emptyCollection())
    geoJsonSource(map, "works")?.setData(picture?.works ?? emptyCollection())
    geoJsonSource(map, "tolls")?.setData(picture?.tolls ?? emptyCollection())
    geoJsonSource(map, "incidents")?.setData(incidents ?? emptyCollection())
    geoJsonSource(map, "control-points")?.setData(controlPoints ?? emptyCollection())
  }, [controlPoints, disabled, incidents, mapReady, picture])

  useEffect(() => {
    const map = mapRef.current
    if (disabled || !map || !mapReady) return
    const kinds: WatchLayer[] = ["speed", "cameras", "works", "tolls", "incidents", "control"]
    for (const kind of kinds) {
      for (const layerId of layerIds(kind)) {
        if (!map.getLayer(layerId)) continue
        map.setLayoutProperty(layerId, "visibility", layers[kind] ? "visible" : "none")
      }
    }
  }, [disabled, layers, mapReady])

  function basemapTitle(mode: Basemap): string {
    switch (mode) {
      case "street":
        return messages.openStreet
      case "satellite":
        return messages.satelliteMap
      case "buildings":
        return messages.buildingsMap
      default: {
        const exhaustive: never = mode
        return exhaustive
      }
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-label={basemapTitle(basemap)}
      />
      {unavailable ? (
        <p className="pointer-events-none absolute inset-x-6 top-[28%] z-[1] max-w-md text-sm leading-relaxed text-zinc-300">
          {messages.mapFailed}
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

function approachButton(point: ApproachPoint, m: Messages): HTMLButtonElement {
  const minutes = shortestMinutes(point)
  const button = document.createElement("button")
  button.type = "button"
  button.className = "approach-time"
  button.textContent = minutes == null ? "—" : m.minutes(minutes)
  button.setAttribute("aria-label", `${displayText(m.locale, point.nameTc, point.name)}, ${button.textContent}`)
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
  m: Messages,
) {
  const source = geoJsonSource(map, "corridors")
  if (!source) return

  const features: GeoJSON.Feature[] = []
  for (const corridor of corridors) {
    const origin = corridor.coordinates[0]
    if (!origin) continue
    const color = BAND_COLOR[corridor.band]
    const properties = {
      name: displayText(m.locale, corridor.roadTc, corridor.roadEn),
      nameEn: m.locale === "en" ? "" : corridor.roadEn,
      direction: corridor.direction,
      speed: corridor.speedKmh == null ? m.noReading : m.speedKmh(Math.round(corridor.speedKmh)),
      band: corridor.band,
      color,
    }
    features.push({
      type: "Feature",
      properties,
      geometry:
        corridor.coordinates.length < 2
          ? { type: "Point", coordinates: origin }
          : { type: "LineString", coordinates: corridor.coordinates },
    })
  }
  source.setData({ type: "FeatureCollection", features })

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
  const features: GeoJSON.Feature[] = []
  for (const particle of particles) {
    const line = lines[particle.line]
    if (!line) continue
    const pace = Math.max(0.25, line.speed / 50) * 0.075
    particle.t = (particle.t + pace * dt) % 1
    features.push({
      type: "Feature",
      properties: { color: BAND_COLOR[line.band] },
      geometry: { type: "Point", coordinates: pointAlong(line, particle.t) },
    })
  }
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
    id: "control-points-ring",
    type: "circle",
    source: "control-points",
    filter: ["==", ["get", "worst"], 2],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 14, 14, 22],
      "circle-color": "rgba(255, 93, 115, 0.18)",
      "circle-stroke-color": "#FF5D73",
      "circle-stroke-width": 1,
      "circle-pitch-alignment": "map",
    },
  })
  map.addLayer({
    id: "control-points",
    type: "circle",
    source: "control-points",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 6, 14, 9],
      "circle-color": [
        "match",
        ["get", "worst"],
        0,
        "#3DDC97",
        1,
        "#FFC857",
        2,
        "#FF5D73",
        99,
        "#5C6B7A",
        "#C9D2DC",
      ],
      "circle-stroke-color": "#041018",
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
  addCameraLayer(map, "cameras-harbour", ["==", ["get", "harbour"], 1], 11.6)
  addCameraLayer(map, "cameras-portal", ["all", ["==", ["get", "portal"], 1], ["!=", ["get", "harbour"], 1]], 11.6)
  addCameraLayer(map, "cameras-city", ["all", ["!=", ["get", "harbour"], 1], ["!=", ["get", "portal"], 1]], 14)
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

function addCameraLayer(map: Map, id: string, filter: FilterSpecification, minzoom: number) {
  map.addLayer({
    id,
    type: "symbol",
    source: "cameras",
    minzoom,
    filter,
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
      return ["cameras-harbour", "cameras-portal", "cameras-city"]
    case "works":
      return ["works"]
    case "tolls":
      return ["tolls-portal", "tolls-overview"]
    case "incidents":
      return ["incidents"]
    case "control":
      return ["control-points", "control-points-ring"]
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
    active = new Popup({ className: "city-popup", closeButton: true, maxWidth: "360px", offset: 16 })
      .setLngLat(lngLat)
      .setDOMContent(content)
      .addTo(map)
    keepCardInView(map, active)
  }
}

function keepCardInView(map: Map, popup: Popup) {
  const element = popup.getElement()
  if (!element) return
  const mapBox = map.getContainer().getBoundingClientRect()
  const box = element.getBoundingClientRect()
  const pad = 18
  const topLimit = mapBox.top + 76
  let x = 0
  let y = 0
  if (box.top < topLimit) y = box.top - topLimit
  else if (box.bottom > mapBox.bottom - pad) y = box.bottom - (mapBox.bottom - pad)
  if (box.left < mapBox.left + pad) x = box.left - (mapBox.left + pad)
  else if (box.right > mapBox.right - pad) x = box.right - (mapBox.right - pad)
  if (x !== 0 || y !== 0) map.panBy([x, y], { duration: 280, essential: true })
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

