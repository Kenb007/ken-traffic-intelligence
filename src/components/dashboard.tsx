"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { CityMap } from "@/components/city-map"
import { LayerDock } from "@/components/layer-dock"
import { OpsHud } from "@/components/ops-hud"
import { useLiveJson } from "@/components/use-live-json"
import { useI18n } from "@/components/locale"
import { decorateControlPoints } from "@/lib/control-points"
import { hkoLang } from "@/lib/i18n"
import type {
  ApproachesResponse,
  ControlPointsResponse,
  IncidentsResponse,
  MtrResponse,
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
  mtr: true,
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
  const { locale } = useI18n()
  const search = useSearchParams()
  const forceDown = search.get("feed") === "down"
  const mapDown = search.get("map") === "down"
  const [flyToken, setFlyToken] = useState(0)
  const [mapLive, setMapLive] = useState(!mapDown)
  const [layers, setLayers] = useState<WatchLayers>(LAYERS_ON)
  const [basemap, setBasemap] = useState<Basemap>("satellite")
  const [ground, setGround] = useState<Exclude<Basemap, "buildings">>("satellite")
  const trafficLive = useLiveJson<TrafficResponse>(forceDown ? "/api/traffic?simulate=fail" : "/api/traffic")
  const approachesLive = useLiveJson<ApproachesResponse>("/api/approaches")
  const pictureLive = useLiveJson<PictureResponse>("/api/picture")
  const incidentsLive = useLiveJson<IncidentsResponse>("/api/incidents")
  const controlLive = useLiveJson<ControlPointsResponse>("/api/control-points")
  const warningsLive = useLiveJson<WarningsResponse>(`/api/warnings?lang=${hkoLang(locale)}`)
  const mtrLive = useLiveJson<MtrResponse>("/api/mtr", 15_000)
  const traffic = trafficLive.data
  const approaches = approachesLive.data
  const picture = pictureLive.data
  const incidents = incidentsLive.data
  const controlPoints = controlLive.data
  const warnings = warningsLive.data
  const mtr = mtrLive.data
  const trafficLoading = traffic === null && trafficLive.error === null
  const trafficError = trafficLive.error ?? (traffic && !traffic.ok ? traffic.error ?? "Speed feed failed" : null)
  const pictureError = pictureLive.error ?? picture?.error ?? (picture && !picture.ok ? "Picture failed" : null)
  const [focus, setFocus] = useState<{ id: string; coordinates: [number, number] } | null>(null)
  const [intelOpen, setIntelOpen] = useState(true)

  const corridors = traffic?.ok ? traffic.corridors : []
  const boundary = controlPoints?.ok ? decorateControlPoints(controlPoints.points, corridors) : null

  const toggleLayer = (layer: WatchLayer) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }))
  }

  function selectBasemap(next: Basemap) {
    if (next === "buildings") {
      setBasemap((current) => (current === "buildings" ? ground : "buildings"))
      return
    }
    setGround(next)
    setBasemap(next)
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#061018]">
      <CityMap
        corridors={corridors}
        approaches={approaches?.ok ? approaches.points : []}
        picture={picture}
        incidents={incidents?.ok ? incidents.incidents : null}
        controlPoints={boundary}
        mtr={mtr?.ok ? mtr : null}
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
        incidentsError={incidentsLive.error ?? (incidents && !incidents.ok ? incidents.error ?? "Special traffic news failed." : null)}
        works={picture?.works ?? null}
        controlPoints={boundary}
        controlError={controlLive.error ?? (controlPoints && !controlPoints.ok ? controlPoints.error ?? "Control point waiting times failed." : null)}
        warnings={warnings?.warnings ?? []}
        warningsReady={warnings != null || warningsLive.error != null}
        warningsError={warningsLive.error ?? warnings?.error ?? null}
        conditions={warnings?.conditions ?? null}
        approachesError={approachesLive.error ?? (approaches && !approaches.ok ? approaches.error ?? "Crossing approaches failed." : null)}
        mapLive={mapLive}
        open={intelOpen}
        onOpenChange={setIntelOpen}
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
          mtr: mtr?.ok ? mtr.trains.length : null,
          control: controlPoints?.ok
            ? controlPoints.points.features.filter((feature) => {
                const worst = feature.properties && feature.properties.worst
                return worst === 1 || worst === 2
              }).length
            : null,
        }}
        onToggle={toggleLayer}
        onBasemap={selectBasemap}
        onReplay={() => setFlyToken((value) => value + 1)}
        mapLive={mapLive}
        pictureError={pictureError}
        mtrError={mtrLive.error ?? (mtr && !mtr.ok ? mtr.error ?? "Next train feed failed" : null)}
        aboveMarquee={!intelOpen}
      />
    </main>
  )
}
