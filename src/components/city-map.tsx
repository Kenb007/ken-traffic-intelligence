"use client"

import { useEffect, useRef, useState, type MutableRefObject } from "react"
import {
  GeoJSONSource,
  GPUInitializationError,
  Map,
  NavigationControl,
  Popup,
  type ErrorEvent,
  type LngLat,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Corridor, SpeedBand } from "@/lib/types"

const BAND_COLOR: Record<SpeedBand, string> = {
  free: "#3DDC97",
  slow: "#FFC857",
  congested: "#FF5D73",
  unknown: "#C9D2DC",
}

const OPENING = {
  center: [114.172, 22.292] as [number, number],
  zoom: 12.15,
  pitch: 64,
  bearing: -28,
}

const FLYOVER = [
  { center: [114.142, 22.304] as [number, number], zoom: 12.6, pitch: 60, bearing: -6, duration: 7800, curve: 1.3 },
  { center: [114.182, 22.336] as [number, number], zoom: 12.2, pitch: 56, bearing: 16, duration: 8200, curve: 1.3 },
  { center: [114.11, 22.35] as [number, number], zoom: 10.55, pitch: 48, bearing: -14, duration: 7400, curve: 1.25 },
]

type AnimLine = {
  coords: [number, number][]
  cum: number[]
  band: SpeedBand
  speed: number
}

type Particle = { line: number; t: number }

type CityMapProps = {
  corridors: Corridor[]
  flyToken: number
  onTerrain: (available: boolean) => void
  onMap: (available: boolean) => void
  disabled?: boolean
}

export function CityMap({ corridors, flyToken, onTerrain, onMap, disabled = false }: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const linesRef = useRef<AnimLine[]>([])
  const particlesRef = useRef<Particle[]>([])
  const corridorsRef = useRef(corridors)
  const onTerrainRef = useRef(onTerrain)
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
    onTerrainRef.current = onTerrain
  }, [onTerrain])

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
        onTerrainRef.current(false)
      }
    })

    map.on("load", () => {
      try {
        map.setTerrain({ source: "terrain", exaggeration: 1.35 })
        onTerrainRef.current(true)
      } catch {
        onTerrainRef.current(false)
      }

      map.addSource("corridors", { type: "geojson", data: emptyCollection() })
      map.addSource("particles", { type: "geojson", data: emptyCollection() })
      map.addLayer({
        id: "corridor-casing",
        type: "line",
        source: "corridors",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": "#041018",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2.4, 12, 5.5, 14, 9],
          "line-opacity": 0.55,
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
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.4, 12, 3.4, 14, 6],
          "line-opacity": 0.92,
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

      const onCorridorClick = (event: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const feature = event.features?.[0]
        if (!feature) return
        openPopup(map, event.lngLat, feature.properties ?? null)
      }
      map.on("click", "corridor-line", onCorridorClick)
      map.on("click", "corridor-point", onCorridorClick)
      map.on("mouseenter", "corridor-line", () => {
        map.getCanvas().style.cursor = "pointer"
      })
      map.on("mouseleave", "corridor-line", () => {
        map.getCanvas().style.cursor = ""
      })

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

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" aria-label="Satellite map of Hong Kong" />
      {unavailable ? (
        <p className="pointer-events-none absolute inset-x-6 top-[28%] z-[1] max-w-md text-sm leading-relaxed text-zinc-300">
          The satellite map did not start. Speeds, journey time, and notices stay available.
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
  lines.forEach((line, lineIndex) => {
    const total = line.cum[line.cum.length - 1] ?? 0
    const count = Math.max(1, Math.min(8, Math.round(total / 0.85)))
    for (let index = 0; index < count; index += 1) {
      particles.push({ line: lineIndex, t: (index + Math.random() * 0.2) / count })
    }
  })
  particlesRef.current = particles.slice(0, 420)
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

function openPopup(map: Map, lngLat: LngLat, properties: GeoJSON.GeoJsonProperties) {
  const name = textProp(properties, "name")
  const direction = textProp(properties, "direction")
  const speed = textProp(properties, "speed")
  const english = textProp(properties, "nameEn")
  new Popup({ closeButton: true, maxWidth: "260px" })
    .setLngLat(lngLat)
    .setHTML(
      `<div style="font: 13px/1.4 Outfit, sans-serif; color: #102033">
        <strong>${escapeHtml(name)}</strong>
        <div>${escapeHtml(direction)} · ${escapeHtml(speed)}</div>
        <div style="color:#526170">${escapeHtml(english)}</div>
      </div>`,
    )
    .addTo(map)
}

function textProp(properties: GeoJSON.GeoJsonProperties, key: string): string {
  const value = properties?.[key]
  return typeof value === "string" ? value : ""
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
