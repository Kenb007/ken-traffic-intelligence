"use client"

import type { WatchLayer, WatchLayers } from "@/lib/types"

type LayerDockProps = {
  layers: WatchLayers
  counts: Record<WatchLayer, number | null>
  onToggle: (layer: WatchLayer) => void
  onReplay: () => void
  mapLive: boolean
  pictureError: string | null
}

const LAYERS: { id: WatchLayer; label: string; swatch: string }[] = [
  { id: "speed", label: "Speed map", swatch: "bg-[#3DDC97]" },
  { id: "cameras", label: "Cameras", swatch: "bg-[#7DD3E8]" },
  { id: "works", label: "Works", swatch: "bg-[#FF5D73]" },
  { id: "tolls", label: "Tolls", swatch: "bg-[#E7FBFF]" },
]

export function LayerDock(props: LayerDockProps) {
  if (!props.mapLive) return null
  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 lg:left-16">
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
      {props.pictureError ? (
        <p className="basis-full text-xs text-red-100" role="alert">
          {props.pictureError}
        </p>
      ) : null}
    </div>
  )
}
