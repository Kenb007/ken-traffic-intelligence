"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { bandLabel, formatSpeed } from "@/lib/speed"
import type {
  HarbourJourney,
  JourneyResponse,
  NoticesResponse,
  SpeedBand,
  TrafficResponse,
} from "@/lib/types"

const BANDS: SpeedBand[] = ["free", "slow", "congested"]

const SWATCH: Record<SpeedBand, string> = {
  free: "bg-[#3DDC97]",
  slow: "bg-[#FFC857]",
  congested: "bg-[#FF5D73]",
  unknown: "bg-[#C9D2DC]",
}

type SidePanelProps = {
  open: boolean
  onToggle: () => void
  onReplay: () => void
  traffic: TrafficResponse | null
  trafficLoading: boolean
  trafficError: string | null
  notices: NoticesResponse | null
  noticesLoading: boolean
  noticesError: string | null
  journey: JourneyResponse | null
  journeyLoading: boolean
  terrain: "pending" | "on" | "off"
}

export function SidePanel(props: SidePanelProps) {
  const mean = props.traffic?.summary.meanSpeedKmh ?? null
  return (
    <aside
      className={`pointer-events-auto absolute z-10 flex flex-col overflow-hidden border border-white/15 bg-[#07131c]/88 text-zinc-100 shadow-2xl backdrop-blur-xl ${
        props.open
          ? "inset-x-3 bottom-3 max-h-[min(52vh,34rem)] rounded-2xl lg:inset-x-auto lg:top-4 lg:right-4 lg:bottom-4 lg:w-[24.5rem] lg:max-h-none"
          : "inset-x-3 bottom-3 rounded-2xl lg:inset-x-auto lg:top-auto lg:right-4 lg:bottom-4 lg:w-[24.5rem]"
      }`}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div>
          <p className="text-[0.7rem] tracking-[0.16em] text-teal-200/80 uppercase">
            Transport Department
          </p>
          <h1 className="font-[family-name:var(--font-newsreader)] text-2xl leading-tight text-white">
            Harbour corridors
          </h1>
          <p className="mt-1 text-sm text-zinc-300">
            Live speeds on strategic roads, over a satellite view of Hong Kong.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={props.onReplay}>
            Replay flyover
          </Button>
          <Button size="sm" variant="outline" className="border-white/15 bg-transparent text-zinc-100" onClick={props.onToggle}>
            {props.open ? "Hide detail" : "Show detail"}
          </Button>
        </div>
      </header>
      {!props.open ? (
        <p className="px-4 pb-4 text-sm text-zinc-200">
          Citywide detector speed {formatSpeed(mean)}. The map stays up either way.
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <SpeedSection
            traffic={props.traffic}
            loading={props.trafficLoading}
            error={props.trafficError}
            terrain={props.terrain}
          />
          <JourneySection journey={props.journey} loading={props.journeyLoading} />
          <NoticeSection
            notices={props.notices}
            loading={props.noticesLoading}
            error={props.noticesError}
          />
          <SourceSection traffic={props.traffic} notices={props.notices} journey={props.journey} />
        </div>
      )}
    </aside>
  )
}

function SpeedSection({
  traffic,
  loading,
  error,
  terrain,
}: {
  traffic: TrafficResponse | null
  loading: boolean
  error: string | null
  terrain: "pending" | "on" | "off"
}) {
  return (
    <Card size="sm" className="border-white/10 bg-white/5 text-zinc-100 ring-white/10">
      <CardHeader>
        <CardTitle>Citywide speed</CardTitle>
        <CardDescription className="text-zinc-400">
          Free-flow is 50 km/h or faster, slow is 30 to 49, congested is under 30. Bands are for this
          view, weighted by corridor length.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Skeleton className="h-16 w-full bg-white/10" /> : null}
        {error ? <ErrorNote message={error} /> : null}
        {traffic?.ok ? (
          <>
            <p className="font-[family-name:var(--font-newsreader)] text-4xl text-white">
              {formatSpeed(traffic.summary.meanSpeedKmh)}
            </p>
            <p className="text-sm text-zinc-300">
              {traffic.summary.corridorCount} corridors from {traffic.summary.detectorCount} detectors
              {traffic.observedAt ? ` · raw feed ${traffic.observedAt}` : ""}.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BANDS.map((band) => (
                <div key={band} className="rounded-lg bg-black/25 px-2 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <span className={`size-2 rounded-full ${SWATCH[band]}`} />
                    {bandLabel(band)}
                  </div>
                  <div className="mt-1 text-lg">{traffic.summary[band]}</div>
                </div>
              ))}
            </div>
            <Separator className="bg-white/10" />
            {traffic.segments.ok ? (
              <p className="text-sm text-zinc-300">
                Processed segment speeds average {formatSpeed(traffic.segments.meanSpeedKmh)} across{" "}
                {traffic.segments.validCount.toLocaleString("en-HK")} valid segments
                {traffic.segments.observedAt ? ` at ${traffic.segments.observedAt}` : ""}. The segment
                file has ids and speeds only, so the moving traffic follows detector coordinates.
              </p>
            ) : (
              <ErrorNote message={traffic.segments.error ?? "Segment speeds did not load."} />
            )}
          </>
        ) : null}
        {!loading && !error && !traffic?.ok ? (
          <p className="text-sm text-zinc-300">No speed reading yet.</p>
        ) : null}
        {terrain === "off" ? (
          <p className="text-sm text-amber-100">
            Terrain tiles did not load. The map stays pitched over the satellite imagery.
          </p>
        ) : null}
        {traffic?.network ? (
          <p className="text-xs leading-relaxed text-zinc-400">
            Road Network (2nd generation)
            {traffic.network.revisionDate ? ` revised ${traffic.network.revisionDate}` : ""}.{" "}
            {traffic.network.reason}
            {traffic.network.error ? ` Date file: ${traffic.network.error}` : ""}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function JourneySection({ journey, loading }: { journey: JourneyResponse | null; loading: boolean }) {
  return (
    <Card size="sm" className="border-white/10 bg-white/5 text-zinc-100 ring-white/10">
      <CardHeader>
        <CardTitle>Journey time</CardTitle>
        <CardDescription className="text-zinc-400">
          TDAS forecasts one cross-harbour drive from the API specification sample, 22.288°N 114.205°E
          to 22.342°N 114.155°E. Indicator minutes come from the journey-time feed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Skeleton className="h-20 w-full bg-white/10" /> : null}
        {journey ? (
          <>
            {journey.tdas.ok ? (
              <div>
                <p className="text-sm text-zinc-300">Shortest time now</p>
                <p className="text-lg text-white">
                  {journey.tdas.eta} · {journey.tdas.speedText} · {journey.tdas.distance}
                </p>
                <p className="text-sm text-zinc-300">Via {journey.tdas.tunnel}</p>
                {journey.tdas.alternates.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                    {journey.tdas.alternates.map((alternate) => (
                      <li key={alternate.tunnel}>
                        {alternate.tunnel}: {alternate.eta} · {alternate.distance}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <ErrorNote message={journey.tdas.error ?? "TDAS did not respond."} />
            )}
            <Separator className="bg-white/10" />
            {journey.jtis.ok ? (
              <div className="space-y-2">
                <p className="text-sm text-zinc-300">
                  Indicators {journey.jtis.capturedAt ?? "just updated"}: {journey.jtis.green} green,{" "}
                  {journey.jtis.amber} amber, {journey.jtis.red} red.
                </p>
                <ul className="space-y-2">
                  {journey.jtis.harbour.map((row) => (
                    <li key={`${row.from}-${row.to}`} className="text-sm">
                      <HarbourRow row={row} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ErrorNote message={journey.jtis.error ?? "Journey time indicators did not load."} />
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function HarbourRow({ row }: { row: HarbourJourney }) {
  const tone =
    row.colour === "red"
      ? "bg-[#FF5D73]"
      : row.colour === "amber"
        ? "bg-[#FFC857]"
        : row.colour === "green"
          ? "bg-[#3DDC97]"
          : "bg-zinc-400"
  return (
    <div className="flex gap-2">
      <span className={`mt-1 size-2 shrink-0 rounded-full ${tone}`} />
      <div>
        <div className="text-zinc-100">
          {row.from} → {row.to}
        </div>
        <div className="text-zinc-400">
          {row.minutes != null ? `${row.minutes} min` : row.note ?? "No minute count"}
        </div>
      </div>
    </div>
  )
}

function NoticeSection({
  notices,
  loading,
  error,
}: {
  notices: NoticesResponse | null
  loading: boolean
  error: string | null
}) {
  return (
    <Card size="sm" className="border-white/10 bg-white/5 text-zinc-100 ring-white/10">
      <CardHeader>
        <CardTitle>Traffic notices</CardTitle>
        <CardDescription className="text-zinc-400">
          Special arrangements, closures, expressways, and temporary speed limits. English titles, with
          the Traditional Chinese title underneath.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Skeleton className="h-24 w-full bg-white/10" /> : null}
        {error ? <ErrorNote message={error} /> : null}
        {notices && notices.notices.length === 0 && !loading ? (
          <p className="text-sm text-zinc-300">No notices in the files that loaded.</p>
        ) : null}
        <ul className="space-y-3">
          {notices?.notices.map((notice) => (
            <li key={`${notice.category}-${notice.id}`} className="border-t border-white/10 pt-3 first:border-0 first:pt-0">
              <Badge variant="outline" className="border-white/20 text-zinc-200">
                {notice.category}
              </Badge>
              <p className="mt-1 text-sm text-white">{notice.titleEn || notice.titleTc}</p>
              {notice.titleTc ? <p className="text-sm text-zinc-300">{notice.titleTc}</p> : null}
              {notice.effective ? (
                <p className="text-xs text-zinc-500">Effective {formatEffective(notice.effective)}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function SourceSection({
  traffic,
  notices,
  journey,
}: {
  traffic: TrafficResponse | null
  notices: NoticesResponse | null
  journey: JourneyResponse | null
}) {
  const rows = [
    {
      name: "Traffic notices",
      href: "https://data.gov.hk/en-data/dataset/hk-td-tis_22-traffic-notices",
      state: notices == null ? "Checking" : notices.ok ? "Live" : "Error",
      detail: "Four XML notice files in the side list.",
    },
    {
      name: "Road Network (2nd generation)",
      href: "https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2",
      state: "Not drawn",
      detail: traffic?.network.revisionDate
        ? `Revision date ${traffic.network.revisionDate}. Centreline is too large for the browser.`
        : "Centreline extract is too large for the browser.",
    },
    {
      name: "Traffic Data Analytics System",
      href: "https://data.gov.hk/en-data/dataset/hk-td-tis_28-traffic-data-tdas",
      state: journey == null ? "Checking" : journey.tdas.ok ? "Live" : "Error",
      detail: "One shortest-time harbour forecast. The response has route ids, not a drawable line.",
    },
    {
      name: "Strategic / major roads",
      href: "https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads",
      state: traffic == null ? "Checking" : traffic.ok ? "Live" : "Error",
      detail: "Detector locations, raw lane speeds, and processed segment speeds.",
    },
    {
      name: "Journey time indicators (2nd generation)",
      href: "https://data.gov.hk/en-data/dataset/hk-td-sm_8-journey-time-indicators-v2",
      state: journey == null ? "Checking" : journey.jtis.ok ? "Live" : "Error",
      detail: "Related live feed from the strategic-roads theme. Harbour rows are listed above.",
    },
  ]
  return (
    <Card size="sm" className="border-white/10 bg-white/5 text-zinc-100 ring-white/10">
      <CardHeader>
        <CardTitle>Datasets in this slice</CardTitle>
        <CardDescription className="text-zinc-400">
          Open the catalogue record for each source. A failed feed stays in this list and leaves the map
          in place.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.name}>
            <div className="flex items-center justify-between gap-2">
              <a className="text-sm text-teal-100 underline-offset-2 hover:underline" href={row.href}>
                {row.name}
              </a>
              <Badge variant={row.state === "Error" ? "destructive" : "secondary"}>{row.state}</Badge>
            </div>
            <p className="text-xs text-zinc-400">{row.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-100" role="alert">
      {message}
    </p>
  )
}

function formatEffective(value: string): string {
  const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!match) return value
  const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}
