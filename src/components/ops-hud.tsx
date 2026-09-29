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
  const crossings = bestCrossings(props.approaches?.ok ? props.approaches.points : [])
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
  const urgentCount = intel.filter((item) => item.urgent).length
  const marqueeSeconds = Math.max(28, intel.length * 9)

  return (
    <div className="pointer-events-none absolute top-3 right-3 left-3 z-[5] flex flex-col gap-2 lg:right-4 lg:left-16">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-cyan-200/30 bg-[#041018]/80 px-3 py-2 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.22em] text-cyan-200/80 uppercase">
            Victoria Harbour
          </p>
          <p className="font-[family-name:var(--font-hud)] text-sm text-white">Operations</p>
        </div>
        <p className="font-[family-name:var(--font-hud)] text-sm text-cyan-50 tabular-nums">{clock} HKT</p>
        <p className="w-full font-[family-name:var(--font-hud)] text-xs text-cyan-50 lg:hidden">
          {crossings.map((crossing) => `${crossing.label} ${crossing.minutes}m`).join(" · ")}
          {summary ? ` · ${formatSpeed(summary.meanSpeedKmh)}` : ""}
        </p>
        <p className="flex items-center gap-1.5 font-[family-name:var(--font-hud)] text-[0.7rem] tracking-[0.16em] text-cyan-100 uppercase">
          <span className={`size-1.5 rounded-full ${live ? "hud-pulse bg-[#3DDC97]" : "bg-[#FFC857]"}`} />
          {live ? "Live" : props.trafficLoading ? "Sync" : "Fault"}
          {props.mapLive ? "" : " · map off"}
        </p>
        <div className="hidden h-8 w-px bg-cyan-200/25 sm:block" />
        <div className="hidden items-stretch gap-2 lg:flex">
          {crossings.map((crossing) => (
            <div key={crossing.code} className="min-w-[7.5rem] border border-white/10 bg-black/30 px-2 py-1">
              <p className="font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.14em] text-cyan-100/80 uppercase">
                {crossing.label}
              </p>
              <p className="font-[family-name:var(--font-hud)] text-xl leading-none text-white tabular-nums">
                <span style={{ color: TONE[crossing.colour] }}>{crossing.minutes}</span>
                <span className="ml-1 text-xs text-cyan-100/80">min</span>
              </p>
              <p className="truncate text-[0.7rem] text-zinc-300">{crossing.from}</p>
            </div>
          ))}
        </div>
        {forecast ? (
          <p className="hidden max-w-[14rem] font-[family-name:var(--font-hud)] text-[0.72rem] leading-snug text-cyan-50/90 xl:block">
            Forecast {forecast.eta}
            <span className="block text-zinc-300">
              via {forecast.tunnel}
              {forecast.distance ? ` · ${forecast.distance}` : ""}
            </span>
          </p>
        ) : null}
        <div className="ml-auto hidden min-w-[9rem] lg:block">
          <p className="font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.14em] text-cyan-100/80 uppercase">
            Network speed
          </p>
          <p className="font-[family-name:var(--font-hud)] text-xl leading-none text-white tabular-nums">
            {props.trafficLoading ? "…" : formatSpeed(summary?.meanSpeedKmh ?? null)}
          </p>
          {summary && totalBands > 0 ? (
            <div className="mt-1.5 flex h-1.5 overflow-hidden bg-white/10" title="Free-flow, slow, and congested corridors">
              <span className="bg-[#3DDC97]" style={{ width: `${(summary.free / totalBands) * 100}%` }} />
              <span className="bg-[#FFC857]" style={{ width: `${(summary.slow / totalBands) * 100}%` }} />
              <span className="bg-[#FF5D73]" style={{ width: `${(summary.congested / totalBands) * 100}%` }} />
            </div>
          ) : null}
        </div>
      </header>
      <section
        id="harbour-intel"
        className={`pointer-events-auto border border-cyan-200/30 bg-[#041018]/88 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md ${open ? "w-full lg:w-[24rem]" : ""}`}
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="harbour-intel-list"
            onClick={() => setOpen((current) => !current)}
            className="shrink-0 border border-white/15 px-2 py-1 font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.12em] text-cyan-50 uppercase"
          >
            {open ? "Hide" : "Intel"}
          </button>
          {urgentCount > 0 ? (
            <span className="shrink-0 font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.12em] text-[#FF5D73] uppercase">
              {urgentCount}
            </span>
          ) : null}
          {open ? (
            <p className="font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.16em] text-cyan-100/80 uppercase">
              Ranked live
            </p>
          ) : (
            <IntelMarquee items={intel} seconds={marqueeSeconds} onFocus={props.onFocus} />
          )}
        </div>
        {open ? (
          <div id="harbour-intel-list" className="max-h-[min(26rem,46dvh)] overflow-y-auto border-t border-white/10 px-2 py-2">
            {intel.length === 0 ? (
              <p className="px-1 py-2 text-sm text-zinc-300">No open incident, jam, or delayed crossing.</p>
            ) : (
              <ol className="flex flex-col gap-1">
                {intel.map((item) => (
                  <li key={item.id}>
                    <IntelRow item={item} onFocus={props.onFocus} />
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function IntelMarquee(props: {
  items: ReturnType<typeof rankIntel>
  seconds: number
  onFocus: OpsHudProps["onFocus"]
}) {
  const items = props.items.length > 0 ? props.items : [quietIntel]
  return (
    <div className="min-w-0 flex-1 overflow-hidden" aria-label="Live intel">
      <div className="intel-marquee flex w-max" style={{ animationDuration: `${props.seconds}s` }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="intel-marquee-copy flex shrink-0 items-center" aria-hidden={copy === 1}>
            {items.map((item) => (
              <button
                key={`${copy}-${item.id}`}
                type="button"
                tabIndex={copy === 1 ? -1 : 0}
                disabled={item.coordinates == null}
                onClick={() => {
                  if (!item.coordinates) return
                  props.onFocus({ id: item.id, coordinates: item.coordinates })
                }}
                className="mx-5 whitespace-nowrap font-[family-name:var(--font-hud)] text-[0.72rem] text-cyan-50 disabled:cursor-default"
              >
                <span style={{ color: TONE[item.tone] }}>{item.label}</span>
                <span className="text-white"> · {item.title}</span>
                {item.detail ? <span className="text-zinc-300"> — {item.detail}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function IntelRow(props: { item: ReturnType<typeof rankIntel>[number]; onFocus: OpsHudProps["onFocus"] }) {
  const { item } = props
  return (
    <button
      type="button"
      disabled={item.coordinates == null}
      onClick={() => {
        if (!item.coordinates) return
        props.onFocus({ id: item.id, coordinates: item.coordinates })
      }}
      className="flex w-full items-start gap-2 px-1 py-1 text-left enabled:hover:bg-white/5 disabled:cursor-default"
    >
      <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: TONE[item.tone] }} />
      <span className="min-w-0">
        <span className="block font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.14em] text-cyan-100/80 uppercase">
          {item.label}
        </span>
        <span className="block truncate text-sm text-white">{item.title}</span>
        {item.detail ? <span className="block truncate text-xs text-zinc-300">{item.detail}</span> : null}
      </span>
    </button>
  )
}

const quietIntel = {
  id: "intel-clear",
  kind: "slow" as const,
  score: 0,
  urgent: false,
  label: "Clear",
  title: "No open incident, jam, or delayed crossing",
  detail: "",
  tone: "green" as const,
  coordinates: null,
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
