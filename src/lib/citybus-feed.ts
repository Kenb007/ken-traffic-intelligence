import { citybusStop, nearestCitybusStops } from "@/lib/citybus-network"
import { pool } from "@/lib/pool"
import { fetchUpstream } from "@/lib/upstream"
import type { CitybusCall, CitybusResponse, CitybusStopBoard } from "@/lib/types"

const STOP_LIMIT = 6
const PAIR_BUDGET = 24
const FETCH_LIMIT = 4
const REMEMBER_MS = 60_000
const ETA_ROOT = "https://rt.data.gov.hk/v2/transport/citybus/eta/CTB"

type EtaRow = {
  route?: string
  dest_tc?: string
  dest_en?: string
  eta?: string | null
  eta_seq?: number
  rmk_en?: string
  rmk_tc?: string
}

type Remembered = { at: number; rows: EtaRow[] }

const remembered = new Map<string, Remembered>()

export async function loadCitybusNear(lng: number, lat: number, now = Date.now()): Promise<CitybusResponse> {
  const nearest = nearestCitybusStops(lng, lat, STOP_LIMIT)
  const pairs = arrivalPairs(nearest)
  await pool(pairs, FETCH_LIMIT, async (pair) => {
    const key = `${pair.stopId}/${pair.route}`
    const cached = remembered.get(key)
    if (cached && now - cached.at < REMEMBER_MS) return
    const rows = await fetchEta(pair.stopId, pair.route)
    if (rows) remembered.set(key, { at: now, rows })
  })

  const stops: CitybusStopBoard[] = []
  for (const stop of nearest) {
    const record = citybusStop(stop.id)
    if (!record) continue
    const rows: EtaRow[] = []
    for (const route of stop.routes) {
      const cached = remembered.get(`${stop.id}/${route}`)
      if (!cached || now - cached.at > REMEMBER_MS) continue
      rows.push(...cached.rows)
    }
    const calls = callsAt(rows, now)
    if (calls.length === 0) continue
    stops.push({ id: stop.id, nameTc: record.tc, nameEn: record.en, lng: record.lng, lat: record.lat, calls })
  }
  if (stops.length === 0) {
    return { ok: false, error: "Citybus arrivals failed", observedAt: null, stops: [] }
  }
  return { ok: true, observedAt: new Date(now).toISOString(), stops }
}

function arrivalPairs(stops: { id: string; routes: string[] }[]): { stopId: string; route: string }[] {
  const pairs: { stopId: string; route: string }[] = []
  const seen = new Set<string>()
  const add = (stopId: string, route: string) => {
    const key = `${stopId}/${route}`
    if (seen.has(key) || pairs.length >= PAIR_BUDGET) return
    seen.add(key)
    pairs.push({ stopId, route })
  }
  const closest = stops[0]
  if (closest) {
    for (const route of closest.routes.slice(0, 12)) add(closest.id, route)
  }
  const queues = stops.slice(1).map((stop) => ({ id: stop.id, routes: [...stop.routes] }))
  let added = true
  while (pairs.length < PAIR_BUDGET && added) {
    added = false
    for (const queue of queues) {
      const route = queue.routes.shift()
      if (!route) continue
      add(queue.id, route)
      added = true
      if (pairs.length >= PAIR_BUDGET) break
    }
  }
  return pairs
}

function callsAt(rows: EtaRow[], now: number): CitybusCall[] {
  const calls: CitybusCall[] = []
  for (const row of rows) {
    if (row.eta_seq !== 1) continue
    const route = text(row.route)
    if (!route) continue
    const etaMs = row.eta ? Date.parse(row.eta) : NaN
    const hasEta = Number.isFinite(etaMs)
    const remarkTc = isScheduled(row) ? "" : text(row.rmk_tc)
    const remarkEn = isScheduled(row) ? "" : text(row.rmk_en)
    if (!hasEta && !remarkTc && !remarkEn) continue
    calls.push({
      route,
      destTc: text(row.dest_tc),
      destEn: text(row.dest_en),
      eta: hasEta ? new Date(etaMs).toISOString() : "",
      minutes: hasEta ? Math.max(0, Math.round((etaMs - now) / 60_000)) : null,
      scheduled: isScheduled(row),
      remarkTc,
      remarkEn,
    })
  }
  calls.sort((a, b) => (a.minutes ?? 999) - (b.minutes ?? 999) || a.route.localeCompare(b.route, undefined, { numeric: true }))
  return calls.slice(0, 12)
}

function isScheduled(row: EtaRow): boolean {
  return row.rmk_en === "Scheduled Bus" || row.rmk_tc === "原定班次"
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

async function fetchEta(stopId: string, route: string): Promise<EtaRow[] | null> {
  try {
    const response = await fetchUpstream(`${ETA_ROOT}/${encodeURIComponent(stopId)}/${encodeURIComponent(route)}`, REMEMBER_MS, {
      timeoutMs: 5_000,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; HKTrafficIntelligence/1.0; +https://hktraffic.keith-li.workers.dev)",
      },
    })
    if (response.status !== 200) return null
    const body = JSON.parse(new TextDecoder().decode(response.body)) as { data?: EtaRow[] }
    return Array.isArray(body.data) ? body.data : []
  } catch {
    return null
  }
}
