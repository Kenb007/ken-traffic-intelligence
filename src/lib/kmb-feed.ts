import { placeKmbBuses, type KmbArrivalFix, type KmbStopPoint, type KmbVariantPath } from "@/lib/kmb-estimate"
import { kmbStop, nearestKmbStops, variantsThrough } from "@/lib/kmb-network"
import type { KmbCall, KmbResponse, KmbStopBoard } from "@/lib/types"

const STOP_LIMIT = 24
const FETCH_LIMIT = 4
const REMEMBER_MS = 30_000
const ETA_ROOT = "https://data.etabus.gov.hk/v1/transport/kmb/stop-eta"

type EtaRow = {
  route?: string
  dir?: string
  service_type?: number | string
  dest_tc?: string
  dest_en?: string
  eta?: string | null
  eta_seq?: number
  rmk_en?: string
  rmk_tc?: string
}

type Remembered = { at: number; rows: EtaRow[] }

const remembered = new Map<string, Remembered>()

export async function loadKmbNear(lng: number, lat: number, now = Date.now()): Promise<KmbResponse> {
  const nearest = nearestKmbStops(lng, lat, STOP_LIMIT)
  await pool(nearest.map((stop) => stop.id), FETCH_LIMIT, async (stopId) => {
    const cached = remembered.get(stopId)
    if (cached && now - cached.at < REMEMBER_MS) return
    const rows = await fetchStop(stopId)
    if (rows) remembered.set(stopId, { at: now, rows })
  })

  const stops: KmbStopBoard[] = []
  const arrivals: KmbArrivalFix[] = []
  for (const stop of nearest) {
    const cached = remembered.get(stop.id)
    if (!cached || now - cached.at > REMEMBER_MS) continue
    const record = kmbStop(stop.id)
    if (!record) continue
    const calls = callsAt(cached.rows, now)
    if (calls.length > 0) {
      stops.push({ id: stop.id, nameTc: record.tc, nameEn: record.en, lng: record.lng, lat: record.lat, calls })
    }
    for (const row of cached.rows) {
      const fix = arrivalFix(row, stop.id)
      if (fix) arrivals.push(fix)
    }
  }
  if (stops.length === 0) {
    return { ok: false, error: "KMB arrivals failed", observedAt: null, stops: [], buses: [] }
  }
  const paths = variantsThrough(stops.map((stop) => stop.id))
  const buses = placeKmbBuses(paths, pointsOn(paths), arrivals, now).map((bus) => {
    const here = kmbStop(bus.stopId)
    const from = bus.fromStopId ? kmbStop(bus.fromStopId) : null
    return {
      id: bus.id,
      route: bus.route,
      destTc: bus.destTc,
      destEn: bus.destEn,
      stopId: bus.stopId,
      stopTc: here?.tc ?? "",
      stopEn: here?.en ?? "",
      fromTc: from?.tc ?? "",
      fromEn: from?.en ?? "",
      lng: bus.lng,
      lat: bus.lat,
      minutes: bus.minutes,
      eta: bus.eta,
    }
  })
  return { ok: true, observedAt: new Date(now).toISOString(), stops, buses }
}

function pointsOn(variants: KmbVariantPath[]): Map<string, KmbStopPoint> {
  const points = new Map<string, KmbStopPoint>()
  for (const variant of variants) {
    for (const id of variant.stops) {
      if (points.has(id)) continue
      const record = kmbStop(id)
      if (record) points.set(id, { id, lng: record.lng, lat: record.lat })
    }
  }
  return points
}

function callsAt(rows: EtaRow[], now: number): KmbCall[] {
  const calls: KmbCall[] = []
  for (const row of rows) {
    if (row.eta_seq !== 1) continue
    const route = text(row.route)
    if (!route) continue
    const etaMs = row.eta ? Date.parse(row.eta) : NaN
    const scheduled = isScheduled(row)
    calls.push({
      route,
      destTc: text(row.dest_tc),
      destEn: text(row.dest_en),
      eta: Number.isFinite(etaMs) ? new Date(etaMs).toISOString() : "",
      minutes: Number.isFinite(etaMs) ? Math.max(0, Math.round((etaMs - now) / 60_000)) : null,
      scheduled,
    })
  }
  calls.sort((a, b) => (a.minutes ?? 999) - (b.minutes ?? 999) || a.route.localeCompare(b.route))
  return calls.slice(0, 12)
}

function arrivalFix(row: EtaRow, stopId: string): KmbArrivalFix | null {
  const route = text(row.route)
  const etaMs = row.eta ? Date.parse(row.eta) : NaN
  if (!route || !Number.isFinite(etaMs)) return null
  const bound = row.dir === "I" ? "I" : "O"
  return {
    stopId,
    route,
    bound,
    service: String(row.service_type ?? "1"),
    etaMs,
    scheduled: isScheduled(row),
    destTc: text(row.dest_tc),
    destEn: text(row.dest_en),
  }
}

function isScheduled(row: EtaRow): boolean {
  return row.rmk_en === "Scheduled Bus" || row.rmk_tc === "原定班次"
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

async function fetchStop(stopId: string): Promise<EtaRow[] | null> {
  try {
    const response = await fetch(`${ETA_ROOT}/${encodeURIComponent(stopId)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; HKTrafficIntelligence/1.0; +https://hktraffic.keith-li.workers.dev)",
      },
    })
    if (!response.ok) return null
    const body = (await response.json()) as { data?: EtaRow[] }
    return Array.isArray(body.data) ? body.data : []
  } catch {
    return null
  }
}

async function pool<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index]
      index += 1
      if (current === undefined) return
      await task(current)
    }
  })
  await Promise.all(workers)
}
