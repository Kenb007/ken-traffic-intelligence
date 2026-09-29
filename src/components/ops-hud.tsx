"use client"

import { useEffect, useState } from "react"
import { bestCrossings } from "@/lib/crossings"
import { rankIntel } from "@/lib/intel"
import { formatSpeed } from "@/lib/speed"
import type { ApproachesResponse, HarbourJourney, JourneyResponse, TrafficResponse } from "@/lib/types"

type OpsHudProps = {
  traffic: TrafficResponse | null
  trafficLoading: boolean
  trafficError: string | null
  approaches: ApproachesResponse | null
  journey: JourneyResponse | null
  incidents: GeoJSON.FeatureCollection | null
  works: GeoJSON.FeatureCollection | null
  mapLive: boolean
  onFocus: (focus: { id: string; coordinates: [number, number] }) => void
}

const TONE: Record<HarbourJourney["colour"], string> = {
  red: "#FF5D73",
  amber: "#FFC857",
  green: "#3DDC97",
  none: "#C9D2DC",
}

export function OpsHud(props: OpsHudProps) {
  const clock = useHongKongClock()
  const [open, setOpen] = useState(true)
  const crossings = bestCrossings(props.approaches?.ok ? props.approaches.points : []).slice().sort(byCrossingUrgency)
  const summary = props.traffic?.ok ? props.traffic.summary : null
  const totalBands = summary ? summary.free + summary.slow + summary.congested : 0
  const forecast = props.journey?.tdas.ok ? props.journey.tdas : null
  const live = Boolean(summary) && !props.trafficError
  const intel = rankIntel({
    trafficError: props.trafficError,
    traffic: props.traffic,
    incidents: props.incidents,
    works: props.works,
    approaches: props.approaches?.ok ? props.approaches.points : [],
  })
  const lead = intel[0] ?? null
  const urgentCount = intel.filter((item) => item.urgent).length

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <section
        id="harbour-intel"
        className="pointer-events-auto absolute top-3 right-3 left-3 border border-cyan-200/30 bg-[#041018]/88 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md lg:right-auto lg:left-16 lg:w-[24rem]"
      >
        <header className="flex items-center gap-2 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.22em] text-cyan-200/80 uppercase">
              Victoria Harbour
            </p>
            <p className="truncate font-[family-name:var(--font-hud)] text-sm text-white">
              {open ? "Intel" : lead ? `${lead.label} · ${lead.title}` : "No urgent traffic"}
            </p>
          </div>
          {urgentCount > 0 ? (
            <span className="font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.12em] text-[#FF5D73] uppercase">
              {urgentCount}
            </span>
          ) : null}
          <p className="hidden font-[family-name:var(--font-hud)] text-xs text-cyan-50 tabular-nums sm:block">{clock}</p>
          <p className="flex items-center gap-1.5 font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.14em] text-cyan-100 uppercase">
            <span className={`size-1.5 rounded-full ${live ? "hud-pulse bg-[#3DDC97]" : "bg-[#FFC857]"}`} />
            {live ? "Live" : props.trafficLoading ? "Sync" : "Fault"}
            {props.mapLive ? "" : " · map off"}
          </p>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="harbour-intel-list"
            onClick={() => setOpen((current) => !current)}
            className="border border-white/15 px-2 py-1 font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.12em] text-cyan-50 uppercase"
          >
            {open ? "Hide" : "Open"}
          </button>
        </header>
        {open ? (
          <div id="harbour-intel-list" className="max-h-[min(26rem,46dvh)] overflow-y-auto border-t border-white/10 px-2 py-2">
            {intel.length === 0 ? (
              <p className="px-1 py-2 text-sm text-zinc-300">No open incident, jam, or delayed crossing.</p>
            ) : (
              <ol className="flex flex-col gap-1">
                {intel.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={item.coordinates == null}
                      onClick={() => {
                        if (!item.coordinates) return
                        props.onFocus({ id: item.id, coordinates: item.coordinates })
                      }}
                      className="flex w-full items-start gap-2 px-1 py-1 text-left enabled:hover:bg-white/5 disabled:cursor-default"
                    >
                      <span
                        className="mt-1 size-1.5 shrink-0 rounded-full"
                        style={{ background: TONE[item.tone] }}
                      />
                      <span className="min-w-0">
                        <span className="block font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.14em] text-cyan-100/80 uppercase">
                          {item.label}
                        </span>
                        <span className="block truncate text-sm text-white">{item.title}</span>
                        {item.detail ? <span className="block truncate text-xs text-zinc-300">{item.detail}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-2 flex flex-wrap items-end justify-between gap-2 border-t border-white/10 px-1 pt-2">
              <p className="font-[family-name:var(--font-hud)] text-[0.65rem] leading-snug text-cyan-50/90">
                {crossings.length > 0
                  ? crossings.map((crossing) => `${crossing.label} ${crossing.minutes}m`).join(" · ")
                  : "Crossings unavailable"}
                {forecast?.eta ? ` · forecast ${forecast.eta}` : ""}
              </p>
              <p className="font-[family-name:var(--font-hud)] text-sm text-white tabular-nums">
                {props.trafficLoading ? "…" : formatSpeed(summary?.meanSpeedKmh ?? null)}
              </p>
            </div>
            {summary && totalBands > 0 ? (
              <div className="mx-1 mt-1.5 flex h-1.5 overflow-hidden bg-white/10" title="Free-flow, slow, and congested corridors">
                <span className="bg-[#3DDC97]" style={{ width: `${(summary.free / totalBands) * 100}%` }} />
                <span className="bg-[#FFC857]" style={{ width: `${(summary.slow / totalBands) * 100}%` }} />
                <span className="bg-[#FF5D73]" style={{ width: `${(summary.congested / totalBands) * 100}%` }} />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function byCrossingUrgency(
  a: { colour: HarbourJourney["colour"]; minutes: number },
  b: { colour: HarbourJourney["colour"]; minutes: number },
): number {
  return toneWeight(b.colour) - toneWeight(a.colour) || b.minutes - a.minutes
}

function toneWeight(colour: HarbourJourney["colour"]): number {
  switch (colour) {
    case "red":
      return 3
    case "amber":
      return 2
    case "green":
      return 1
    case "none":
      return 0
    default: {
      const exhaustive: never = colour
      return exhaustive
    }
  }
}

const CLOCK_PLACEHOLDER = "--:--:--"

function useHongKongClock(): string {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])
  if (!now) return CLOCK_PLACEHOLDER
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now)
}
