"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CityMap } from "@/components/city-map"
import { LayerDock } from "@/components/layer-dock"
import { OpsHud } from "@/components/ops-hud"
import type {
  ApproachesResponse,
  JourneyResponse,
  IncidentsResponse,
  PictureResponse,
  TrafficResponse,
  WatchLayer,
  WatchLayers,
  Basemap,
} from "@/lib/types"

const LAYERS_ON: WatchLayers = { speed: true, cameras: true, works: true, tolls: true, incidents: true }

function tunnelCount(tolls: GeoJSON.FeatureCollection): number {
  const codes = new Set<string>()
  for (const feature of tolls.features) {
    const code = feature.properties && typeof feature.properties.code === "string" ? feature.properties.code : ""
    if (code) codes.add(code)
  }
  return codes.size
}

export function Dashboard() {
  const search = useSearchParams()
  const forceDown = search.get("feed") === "down"
  const mapDown = search.get("map") === "down"
  const [flyToken, setFlyToken] = useState(0)
  const [mapLive, setMapLive] = useState(!mapDown)
  const [layers, setLayers] = useState<WatchLayers>(LAYERS_ON)
  const [basemap, setBasemap] = useState<Basemap>("satellite")
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null)
  const [trafficError, setTrafficError] = useState<string | null>(null)
  const [trafficLoading, setTrafficLoading] = useState(true)
  const [journey, setJourney] = useState<JourneyResponse | null>(null)
  const [approaches, setApproaches] = useState<ApproachesResponse | null>(null)
  const [picture, setPicture] = useState<PictureResponse | null>(null)
  const [pictureError, setPictureError] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<IncidentsResponse | null>(null)
  const [focus, setFocus] = useState<{ id: string; coordinates: [number, number] } | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const url = forceDown ? "/api/traffic?simulate=fail" : "/api/traffic"
      try {
        const response = await fetch(url, { cache: "no-store" })
        const body = (await response.json()) as TrafficResponse
        if (cancelled) return
        setTraffic(body)
        setTrafficError(body.ok ? null : body.error ?? `Speed feed failed (${response.status})`)
      } catch (error) {
        if (cancelled) return
        setTrafficError(error instanceof Error ? error.message : "Speed feed failed")
      } finally {
        if (!cancelled) setTrafficLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [forceDown])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/journey", { cache: "no-store" })
        const body = (await response.json()) as JourneyResponse
        if (!cancelled) setJourney(body)
      } catch {
        if (!cancelled) {
          setJourney({
            tdas: {
              ok: false,
              error: "Journey forecast failed to load.",
              speedText: null,
              eta: null,
              distance: null,
              tunnel: null,
              alternates: [],
            },
            jtis: {
              ok: false,
              error: "Journey time indicators failed to load.",
              capturedAt: null,
              red: 0,
              amber: 0,
              green: 0,
              other: 0,
              harbour: [],
            },
          })
        }
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/approaches", { cache: "no-store" })
        const body = (await response.json()) as ApproachesResponse
        if (cancelled) return
        setApproaches(body)
      } catch {
        if (!cancelled) {
          setApproaches({
            ok: false,
            error: "Crossing approaches failed to load.",
            capturedAt: null,
            points: [],
          })
        }
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/picture", { cache: "no-store" })
        const body = (await response.json()) as PictureResponse
        if (cancelled) return
        setPicture(body)
        setPictureError(body.error ?? (body.ok ? null : `Picture failed (${response.status})`))
      } catch (error) {
        if (cancelled) return
        setPictureError(error instanceof Error ? error.message : "Picture failed")
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/incidents", { cache: "no-store" })
        const body = (await response.json()) as IncidentsResponse
        if (!cancelled) setIncidents(body)
      } catch {
        if (!cancelled) {
          setIncidents({
            ok: false,
            error: "Special traffic news failed to load.",
            observedAt: null,
            incidents: { type: "FeatureCollection", features: [] },
          })
        }
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const toggleLayer = (layer: WatchLayer) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }))
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#061018]">
      <CityMap
        corridors={traffic?.ok ? traffic.corridors : []}
        approaches={approaches?.ok ? approaches.points : []}
        picture={picture}
        incidents={incidents?.ok ? incidents.incidents : null}
        layers={layers}
        basemap={basemap}
        flyToken={flyToken}
        focus={focus}
        disabled={mapDown}
        onMap={setMapLive}
      />
      <OpsHud
        traffic={traffic}
        trafficLoading={trafficLoading}
        trafficError={trafficError}
        approaches={approaches}
        journey={journey}
        incidents={incidents?.ok ? incidents.incidents : null}
        works={picture?.works ?? null}
        mapLive={mapLive}
        onFocus={setFocus}
      />
      <LayerDock
        layers={layers}
        basemap={basemap}
        counts={{
          speed: null,
          cameras: picture ? picture.cameras.features.length : null,
          works: picture ? picture.works.features.length : null,
          tolls: picture ? tunnelCount(picture.tolls) : null,
          incidents: incidents ? incidents.incidents.features.length : null,
        }}
        onToggle={toggleLayer}
        onBasemap={setBasemap}
        onReplay={() => setFlyToken((value) => value + 1)}
        mapLive={mapLive}
        pictureError={pictureError}
      />
    </main>
  )
}
