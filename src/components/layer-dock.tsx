"use client"

import { useI18n } from "@/components/locale"
import type { Messages } from "@/lib/i18n"
import type { Basemap, WatchLayer, WatchLayers } from "@/lib/types"

type LayerDockProps = {
  layers: WatchLayers
  basemap: Basemap
  counts: Record<WatchLayer, number | null>
  onToggle: (layer: WatchLayer) => void
  onBasemap: (basemap: Basemap) => void
  onReplay: () => void
  mapLive: boolean
  pictureError: string | null
  aboveMarquee: boolean
}

const SPEED_KEY = [
  { color: "#3DDC97", key: "good" },
  { color: "#FFC857", key: "average" },
  { color: "#FF5D73", key: "bad" },
] as const

function layerLabel(id: WatchLayer, m: Messages): string {
  switch (id) {
    case "speed":
      return m.speedLayer
    case "cameras":
      return m.cameras
    case "works":
      return m.worksLayer
    case "tolls":
      return m.tolls
    case "incidents":
      return m.incidentsLayer
    case "control":
      return m.boundary
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}

function basemapLabel(id: Basemap, m: Messages): string {
  switch (id) {
    case "satellite":
      return m.satellite
    case "street":
      return m.streets
    case "buildings":
      return m.buildings
    default: {
      const exhaustive: never = id
      return exhaustive
    }
  }
}

const BASEMAPS: Basemap[] = ["satellite", "street", "buildings"]
const LAYERS: { id: WatchLayer; swatch: string }[] = [
  { id: "speed", swatch: "bg-[#3DDC97]" },
  { id: "cameras", swatch: "bg-[#7DD3E8]" },
  { id: "works", swatch: "bg-[#FF5D73]" },
  { id: "tolls", swatch: "bg-[#E7FBFF]" },
  { id: "incidents", swatch: "bg-[#FF5D73]" },
  { id: "control", swatch: "bg-[#D7B4FF]" },
]

export function LayerDock(props: LayerDockProps) {
  const { messages: m } = useI18n()
  if (!props.mapLive) return null
  return (
    <div
      className={`pointer-events-auto absolute left-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 lg:left-16 ${
        props.aboveMarquee ? "bottom-36 sm:bottom-28" : "bottom-28 sm:bottom-14 lg:max-w-[calc(100%-30rem)]"
      }`}
    >
      <div className="inline-flex border border-white/15" role="group" aria-label={m.basemap}>
        {BASEMAPS.map((id) => {
          const on = props.basemap === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => props.onBasemap(id)}
              className={`px-2.5 py-1.5 font-[family-name:var(--font-hud)] text-[0.72rem] tracking-[0.08em] uppercase ${
                on ? "bg-[#041018]/80 text-white" : "bg-[#041018]/55 text-zinc-400"
              }`}
            >
              {basemapLabel(id, m)}
            </button>
          )
        })}
      </div>
      {LAYERS.map((layer) => {
        const on = props.layers[layer.id]
        const count = props.counts[layer.id]
        return (
          <button
            key={layer.id}
            type="button"
            aria-pressed={on}
            onClick={() => props.onToggle(layer.id)}
            className={`inline-flex items-center gap-2 border px-2.5 py-1.5 font-[family-name:var(--font-hud)] text-[0.72rem] tracking-[0.08em] uppercase ${
              on
                ? "border-cyan-200/50 bg-[#041018]/80 text-white"
                : "border-white/15 bg-[#041018]/55 text-zinc-400"
            }`}
          >
            <span className={`size-2 rounded-full ${layer.swatch} ${on ? "" : "opacity-35"}`} />
            {layerLabel(layer.id, m)}
            {count == null ? "" : ` ${count}`}
          </button>
        )
      })}
      <button
        type="button"
        onClick={props.onReplay}
        className="border border-white/15 bg-[#041018]/70 px-2.5 py-1.5 font-[family-name:var(--font-hud)] text-[0.72rem] tracking-[0.08em] text-cyan-50 uppercase"
      >
        {m.replay}
      </button>
      {props.layers.speed ? (
        <p
          className="basis-full flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-hud)] text-[0.68rem] tracking-[0.06em] text-cyan-50/90 uppercase"
          aria-label={m.speedKey}
        >
          {SPEED_KEY.map((band) => (
            <span key={band.key} className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full" style={{ background: band.color }} />
              {m[band.key]}
            </span>
          ))}
        </p>
      ) : null}
      {props.pictureError ? (
        <p className="basis-full text-xs text-red-100" role="alert">
          {m.locale === "en" ? props.pictureError : m.pictureFailed}
        </p>
      ) : null}
    </div>
  )
}
