"use client"

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

const BASEMAPS: { id: Basemap; label: string }[] = [
  { id: "satellite", label: "Satellite" },
  { id: "street", label: "Streets" },
  { id: "buildings", label: "Buildings" },
]

const LAYERS: { id: WatchLayer; label: string; swatch: string }[] = [
  { id: "speed", label: "Speed", swatch: "bg-[#3DDC97]" },
  { id: "cameras", label: "Cameras", swatch: "bg-[#7DD3E8]" },
  { id: "works", label: "Works", swatch: "bg-[#FF5D73]" },
  { id: "tolls", label: "Tolls", swatch: "bg-[#E7FBFF]" },
  { id: "incidents", label: "Incidents", swatch: "bg-[#FF5D73]" },
  { id: "control", label: "Boundary", swatch: "bg-[#D7B4FF]" },
]

const SPEED_KEY = [
  { color: "#3DDC97", name: "Good" },
  { color: "#FFC857", name: "Average" },
  { color: "#FF5D73", name: "Bad" },
] as const

export function LayerDock(props: LayerDockProps) {
  if (!props.mapLive) return null
  return (
    <div
      className={`pointer-events-auto absolute left-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 lg:left-16 ${
        props.aboveMarquee ? "bottom-24" : "bottom-14 lg:max-w-[calc(100%-28rem)]"
      }`}
    >
      <div className="inline-flex border border-white/15" role="group" aria-label="Basemap">
        {BASEMAPS.map((item) => {
          const on = props.basemap === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => props.onBasemap(item.id)}
              className={`px-2.5 py-1.5 font-[family-name:var(--font-hud)] text-[0.72rem] tracking-[0.08em] uppercase ${
                on ? "bg-[#041018]/80 text-white" : "bg-[#041018]/55 text-zinc-400"
              }`}
            >
              {item.label}
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
            {layer.label}
            {count == null ? "" : ` ${count}`}
          </button>
        )
      })}
      <button
        type="button"
        onClick={props.onReplay}
        className="border border-white/15 bg-[#041018]/70 px-2.5 py-1.5 font-[family-name:var(--font-hud)] text-[0.72rem] tracking-[0.08em] text-cyan-50 uppercase"
      >
        Replay
      </button>
      {props.layers.speed ? (
        <p
          className="basis-full flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-hud)] text-[0.68rem] tracking-[0.06em] text-cyan-50/90 uppercase"
          aria-label="Official traffic class. Good, average, and bad are the Transport Department saturation levels."
        >
          {SPEED_KEY.map((band) => (
            <span key={band.name} className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full" style={{ background: band.color }} />
              {band.name}
            </span>
          ))}
          <span className="text-cyan-100/60">km/h</span>
        </p>
      ) : null}
      {props.pictureError ? (
        <p className="basis-full text-xs text-red-100" role="alert">
          {props.pictureError}
        </p>
      ) : null}
    </div>
  )
}
