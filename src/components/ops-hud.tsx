"use client"

import { useEffect, useState, type KeyboardEvent } from "react"
import { boundaryGlance } from "@/lib/control-points"
import { bestCrossings } from "@/lib/crossings"
import { INTEL_EMPTY, INTEL_TABS, intelBoard, type IntelItem, type IntelTab } from "@/lib/intel"
import { formatSpeed } from "@/lib/speed"
import type { ApproachesResponse, HarbourJourney, JourneyResponse, TrafficResponse, WeatherWarning } from "@/lib/types"
import { warningGlance } from "@/lib/warnings"

type OpsHudProps = {
  traffic: TrafficResponse | null
  trafficLoading: boolean
  trafficError: string | null
  approaches: ApproachesResponse | null
  approachesError: string | null
  journey: JourneyResponse | null
  incidents: GeoJSON.FeatureCollection | null
  incidentsError: string | null
  works: GeoJSON.FeatureCollection | null
  controlPoints: GeoJSON.FeatureCollection | null
  controlError: string | null
  warnings: WeatherWarning[]
  warningsReady: boolean
  warningsError: string | null
  mapLive: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onFocus: (focus: { id: string; coordinates: [number, number] }) => void
}

const TONE: Record<HarbourJourney["colour"], string> = {
  red: "#FF5D73",
  amber: "#FFC857",
  green: "#3DDC97",
  none: "#C9D2DC",
}

const BAR_LABEL: Record<string, string> = {
  CH: "Cross",
  EH: "Eastern",
  WH: "Western",
}

export function OpsHud(props: OpsHudProps) {
  const clock = useHongKongClock()
  const [tab, setTab] = useState<IntelTab>("ranked")
  const open = props.open
  const crossings = bestCrossings(props.approaches?.ok ? props.approaches.points : [])
  const summary = props.traffic?.ok ? props.traffic.summary : null
  const totalBands = summary ? summary.free + summary.slow + summary.congested : 0
  const forecast = props.journey?.tdas.ok ? props.journey.tdas : null
  const live = Boolean(summary) && !props.trafficError
  const board = intelBoard({
    trafficError: props.trafficError,
    traffic: props.traffic,
    incidents: props.incidents,
    incidentsError: props.incidentsError,
    works: props.works,
    controlPoints: props.controlPoints,
    controlError: props.controlError,
    approaches: props.approaches?.ok ? props.approaches.points : [],
    approachesReady: props.approaches != null,
    approachesError: props.approachesError,
    forecast: forecast?.eta
      ? { eta: forecast.eta, tunnel: forecast.tunnel, distance: forecast.distance }
      : null,
    warnings: props.warnings,
    warningsReady: props.warningsReady,
    warningsError: props.warningsError,
  })
  const intel = board[tab]
  const urgentCount = intel.filter((item) => item.urgent).length
  const marqueeSeconds = Math.max(28, intel.length * 9)
  const halls = boundaryGlance(props.controlPoints, props.controlError)
  const weather = warningGlance(props.warnings)
  const tabLabel = INTEL_TABS.find((item) => item.id === tab)?.label ?? "Ranked"

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <header className="absolute top-3 right-3 left-3 flex flex-col gap-1.5 border border-cyan-200/30 bg-[#041018]/80 px-2 py-1.5 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md sm:flex-row sm:items-center lg:right-4 lg:left-16">
        <div className="flex shrink-0 items-center gap-3 pr-1">
          <div>
            <p className="font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.18em] text-cyan-200/80 uppercase">Hong Kong</p>
            <p className="font-[family-name:var(--font-hud)] text-sm whitespace-nowrap text-white">Traffic Intelligence</p>
          </div>
          <div className="shrink-0">
            <p className="font-[family-name:var(--font-hud)] text-sm text-cyan-50 tabular-nums">{clock}</p>
            <p className="flex items-center gap-1.5 font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.14em] text-cyan-100 uppercase">
              <span className={`size-1.5 rounded-full ${live ? "hud-pulse bg-[#3DDC97]" : "bg-[#FFC857]"}`} />
              {live ? "Live" : props.trafficLoading ? "Sync" : "Fault"}
              {props.mapLive ? "" : " · map off"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:flex-nowrap sm:overflow-x-auto">
          {crossings.map((crossing) => (
            <Metric key={crossing.code} label={BAR_LABEL[crossing.code] ?? crossing.label} value={`${crossing.minutes} min`} tone={TONE[crossing.colour]} hint={crossing.from} />
          ))}
          <Metric label="Boundary" value={halls.label} tone={TONE[halls.tone]} hint="Passenger halls at the eight land control points" />
          {weather ? <Metric label="Weather" value={weather.label} tone={TONE[weather.tone]} hint="Hong Kong Observatory warning in force" /> : null}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 border border-white/10 bg-black/30 px-1.5 py-1 sm:block sm:px-2" title={bandTitle(summary)}>
            <p className="font-[family-name:var(--font-hud)] text-[0.58rem] tracking-[0.14em] text-cyan-100/80 uppercase">Network</p>
            <div className="flex items-center gap-2">
              <p className="font-[family-name:var(--font-hud)] text-sm leading-none text-white tabular-nums sm:text-base">
                {props.trafficLoading ? "…" : formatSpeed(summary?.meanSpeedKmh ?? null)}
              </p>
              {summary && totalBands > 0 ? (
                <div className="flex h-1.5 w-14 overflow-hidden bg-white/10" aria-label={bandTitle(summary)}>
                  <span className="bg-[#3DDC97]" style={{ width: `${(summary.free / totalBands) * 100}%` }} />
                  <span className="bg-[#FFC857]" style={{ width: `${(summary.slow / totalBands) * 100}%` }} />
                  <span className="bg-[#FF5D73]" style={{ width: `${(summary.congested / totalBands) * 100}%` }} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <section
        id="harbour-intel"
        className={
          open
            ? "pointer-events-auto absolute right-3 bottom-36 z-[6] w-[min(26rem,calc(100%-1.5rem))] border border-cyan-200/30 bg-[#041018]/88 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md lg:right-4 lg:bottom-14"
            : "pointer-events-auto absolute inset-x-0 bottom-14 z-[6] border-t border-cyan-200/30 bg-[#041018]/88 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-md"
        }
      >
        <div className="flex items-center gap-1 px-1.5 py-1">
          {open ? (
            <>
              <div role="tablist" aria-label="Intel types" className="flex min-w-0 flex-1 flex-wrap gap-0.5">
                {INTEL_TABS.map((item, index) => {
                  const selected = tab === item.id
                  const urgent = board[item.id].some((row) => row.urgent)
                  return (
                    <button
                      key={item.id}
                      id={`intel-tab-${item.id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls="harbour-intel-list"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setTab(item.id)}
                      onKeyDown={(event) => onTabKey(event, index, setTab)}
                      className={`inline-flex shrink-0 items-center gap-1 px-1.5 py-1 font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.08em] uppercase ${
                        selected ? "border-b-2 border-cyan-200 text-white" : "border-b-2 border-transparent text-cyan-100/70"
                      }`}
                    >
                      {item.label}
                      {urgent ? <span className="size-1 rounded-full bg-[#FF5D73]" /> : null}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                aria-expanded={open}
                aria-controls="harbour-intel-list"
                onClick={() => props.onOpenChange(false)}
                className="ml-auto shrink-0 border border-white/15 px-2 py-1 font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.12em] text-cyan-50 uppercase"
              >
                Hide
              </button>
            </>
          ) : (
            <>
              <span className="shrink-0 font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.14em] text-cyan-100/70 uppercase">{tabLabel}</span>
              <IntelMarquee items={intel} empty={INTEL_EMPTY[tab]} seconds={marqueeSeconds} onFocus={props.onFocus} />
              {urgentCount > 0 ? (
                <span className="shrink-0 font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.12em] text-[#FF5D73] uppercase">{urgentCount}</span>
              ) : null}
              <button
                type="button"
                aria-expanded={open}
                aria-controls="harbour-intel-list"
                onClick={() => props.onOpenChange(true)}
                className="ml-1 shrink-0 border border-white/15 px-2 py-1 font-[family-name:var(--font-hud)] text-[0.65rem] tracking-[0.12em] text-cyan-50 uppercase"
              >
                Intel
              </button>
            </>
          )}
        </div>
        {open ? (
          <div
            id="harbour-intel-list"
            role="tabpanel"
            aria-labelledby={`intel-tab-${tab}`}
            className="intel-scroll max-h-[min(26rem,46dvh)] overflow-y-auto border-t border-white/10 px-2 py-2"
          >
            {intel.length === 0 ? (
              <p className="px-1 py-2 text-sm text-zinc-300">{INTEL_EMPTY[tab]}</p>
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

function Metric(props: { label: string; value: string; tone: string; hint?: string }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1 border border-white/10 bg-black/30 px-1.5 py-1 sm:block sm:px-2" title={props.hint}>
      <p className="font-[family-name:var(--font-hud)] text-[0.58rem] tracking-[0.14em] text-cyan-100/80 uppercase">{props.label}</p>
      <p className="font-[family-name:var(--font-hud)] text-sm leading-none whitespace-nowrap tabular-nums sm:text-base" style={{ color: props.tone }}>
        {props.value}
      </p>
    </div>
  )
}

function bandTitle(summary: { free: number; slow: number; congested: number } | null): string {
  if (!summary) return "Network speed"
  return `Good ${summary.free}, average ${summary.slow}, bad ${summary.congested}`
}

function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number, setTab: (tab: IntelTab) => void) {
  const last = INTEL_TABS.length - 1
  let next = index
  if (event.key === "ArrowRight") next = index === last ? 0 : index + 1
  else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1
  else if (event.key === "Home") next = 0
  else if (event.key === "End") next = last
  else return
  event.preventDefault()
  const id = INTEL_TABS[next]?.id
  if (!id) return
  setTab(id)
  requestAnimationFrame(() => document.getElementById(`intel-tab-${id}`)?.focus())
}

function IntelMarquee(props: { items: IntelItem[]; empty: string; seconds: number; onFocus: OpsHudProps["onFocus"] }) {
  const items = props.items.length > 0 ? props.items : [quietItem(props.empty)]
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

function IntelRow(props: { item: IntelItem; onFocus: OpsHudProps["onFocus"] }) {
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
        <span className="block font-[family-name:var(--font-hud)] text-[0.62rem] tracking-[0.14em] text-cyan-100/80 uppercase">{item.label}</span>
        <span className="block truncate text-sm text-white">{item.title}</span>
        {item.detail ? <span className="block truncate text-xs text-zinc-300">{item.detail}</span> : null}
      </span>
    </button>
  )
}

function quietItem(title: string): IntelItem {
  return {
    id: "intel-clear",
    kind: "slow",
    score: 0,
    urgent: false,
    label: "Clear",
    title,
    detail: "",
    tone: "green",
    coordinates: null,
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
