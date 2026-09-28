"use client"

import { useEffect, useState } from "react"
import { bestCrossings } from "@/lib/crossings"
import { formatSpeed } from "@/lib/speed"
import type { ApproachesResponse, HarbourJourney, JourneyResponse, NoticesResponse, TrafficResponse } from "@/lib/types"

type OpsHudProps = {
  traffic: TrafficResponse | null
  trafficLoading: boolean
  trafficError: string | null
  approaches: ApproachesResponse | null
  journey: JourneyResponse | null
  notices: NoticesResponse | null
  mapLive: boolean
}

const TONE: Record<HarbourJourney["colour"], string> = {
  red: "#FF5D73",
  amber: "#FFC857",
  green: "#3DDC97",
  none: "#C9D2DC",
}

export function OpsHud(props: OpsHudProps) {
  const clock = useHongKongClock()
  const crossings = bestCrossings(props.approaches?.ok ? props.approaches.points : [])
  const summary = props.traffic?.ok ? props.traffic.summary : null
  const totalBands = summary ? summary.free + summary.slow + summary.congested : 0
  const titles = (props.notices?.notices ?? []).map((notice) => notice.titleEn || notice.titleTc).filter(Boolean)
  const ticker = titles.length > 0 ? titles : ["No traffic notices in the files that loaded"]
  const loop = [...ticker, ...ticker]
  const forecast = props.journey?.tdas.ok ? props.journey.tdas : null
  const live = Boolean(summary) && !props.trafficError

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <div className="hud-vignette absolute inset-0" />
      <div className="hud-scan absolute inset-x-0 top-0" />
      <header className="absolute top-3 right-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-2 border border-cyan-200/30 bg-[#041018]/80 px-3 py-2 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md lg:right-[26.5rem] lg:left-16">
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
      <div
        className="absolute right-[26.5rem] bottom-3 left-16 hidden overflow-hidden border border-cyan-200/20 bg-[#041018]/75 lg:block"
        aria-hidden="true"
      >
        <div className="hud-ticker flex w-max gap-8 py-1.5 pr-8">
          {loop.map((title, index) => (
            <span key={`${title}-${index}`} className="font-[family-name:var(--font-hud)] text-[0.72rem] text-cyan-50/90">
              <span className="mr-2 text-cyan-300/70">NOTICE</span>
              {title}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function useHongKongClock(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now)
}
