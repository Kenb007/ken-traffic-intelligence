"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CityMap } from "@/components/city-map"
import { LayerDock } from "@/components/layer-dock"
import { OpsHud } from "@/components/ops-hud"
import { useI18n } from "@/components/locale"
import { decorateControlPoints } from "@/lib/control-points"
import { hkoLang } from "@/lib/i18n"
import { EMPTY_CONDITIONS } from "@/lib/warnings"
import type {
  ApproachesResponse,
  ControlPointsResponse,
  IncidentsResponse,
  PictureResponse,
  TrafficResponse,
  WarningsResponse,
  WatchLayer,
  WatchLayers,
  Basemap,
} from "@/lib/types"

const LAYERS_ON: WatchLayers = {
  speed: true,
  cameras: true,
  works: true,
  tolls: true,
  incidents: true,
  control: true,
}

function tunnelCount(tolls: GeoJSON.FeatureCollection): number {
  const codes = new Set<string>()
  for (const feature of tolls.features) {
    const code = feature.properties && typeof feature.properties.code === "string" ? feature.properties.code : ""
    if (code) codes.add(code)
  }
  return codes.size
}

export function Dashboard() {
  const { locale, messages: m } = useI18n()
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
  const [approaches, setApproaches] = useState<ApproachesResponse | null>(null)
  const [picture, setPicture] = useState<PictureResponse | null>(null)
  const [pictureError, setPictureError] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<IncidentsResponse | null>(null)
  const [controlPoints, setControlPoints] = useState<ControlPointsResponse | null>(null)
  const [warnings, setWarnings] = useState<WarningsResponse | null>(null)
  const [focus, setFocus] = useState<{ id: string; coordinates: [number, number] } | null>(null)
  const [intelOpen, setIntelOpen] = useState(true)

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

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/control-points", { cache: "no-store" })
        const body = (await response.json()) as ControlPointsResponse
        if (!cancelled) setControlPoints(body)
      } catch {
        if (!cancelled) {
          setControlPoints({
            ok: false,
            error: "Control point waiting times failed to load.",
            observedAt: null,
            points: { type: "FeatureCollection", features: [] },
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
        const response = await fetch(`/api/warnings?lang=${hkoLang(locale)}`, { cache: "no-store" })
        const body = (await response.json()) as WarningsResponse
        if (!cancelled) setWarnings(body)
      } catch {
        if (!cancelled) {
          setWarnings({
            ok: false,
            error: "Weather warnings failed to load.",
            observedAt: null,
            warnings: [],
            conditions: EMPTY_CONDITIONS,
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
  }, [locale])

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
        controlPoints={
          controlPoints?.ok ? decorateControlPoints(controlPoints.points, traffic?.ok ? traffic.corridors : []) : null
        }
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
        incidents={incidents?.ok ? incidents.incidents : null}
        incidentsError={incidents && !incidents.ok ? incidents.error ?? "Special traffic news failed." : null}
        works={picture?.works ?? null}
        controlPoints={
          controlPoints?.ok ? decorateControlPoints(controlPoints.points, traffic?.ok ? traffic.corridors : []) : null
        }
        controlError={controlPoints && !controlPoints.ok ? controlPoints.error ?? "Control point waiting times failed." : null}
        warnings={warnings?.warnings ?? []}
        warningsReady={warnings != null}
        warningsError={warnings?.error ?? null}
        conditions={warnings?.conditions ?? null}
        approachesError={approaches && !approaches.ok ? approaches.error ?? "Crossing approaches failed." : null}
        mapLive={mapLive}
        open={intelOpen}
        onOpenChange={setIntelOpen}
        onFocus={setFocus}
      />
      <p
        className="pointer-events-auto absolute left-16 z-30 max-w-[calc(100%-6rem)] bg-[#041018]/92 px-2 py-1 font-[family-name:var(--font-hud)] text-[0.72rem] leading-snug text-white sm:left-3 sm:max-w-[min(34rem,calc(100%-19rem))]"
        style={{ bottom: "0.4rem" }}
      >
        {m.creditBy}{" "}
        <a
          href="https://www.linkedin.com/in/keithlihk"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-100 underline decoration-cyan-200/60 underline-offset-2"
        >
          {m.creditLink}
        </a>
      </p>
      <LayerDock
        layers={layers}
        basemap={basemap}
        counts={{
          speed: null,
          cameras: picture ? picture.cameras.features.length : null,
          works: picture ? picture.works.features.length : null,
          tolls: picture ? tunnelCount(picture.tolls) : null,
          incidents: incidents ? incidents.incidents.features.length : null,
          control: controlPoints?.ok
            ? controlPoints.points.features.filter((feature) => {
                const worst = feature.properties && feature.properties.worst
                return worst === 1 || worst === 2
              }).length
            : null,
        }}
        onToggle={toggleLayer}
        onBasemap={setBasemap}
        onReplay={() => setFlyToken((value) => value + 1)}
        mapLive={mapLive}
        pictureError={pictureError}
        aboveMarquee={!intelOpen}
      />
    </main>
  )
}
