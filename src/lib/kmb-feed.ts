import { busCompany } from "@/lib/bus-company"
import { kmbStop, kmbStopsWithin } from "@/lib/kmb-network"
import { isListedKmbRow, kmbReachMetres, STOP_CAP } from "@/lib/kmb-reach"
import { pool } from "@/lib/pool"
import { fetchUpstream } from "@/lib/upstream"
import type { KmbCall, KmbResponse, KmbStopBoard } from "@/lib/types"

const FETCH_LIMIT = 8
const REMEMBER_MS = 30_000
const ETA_ROOT = "https://data.etabus.gov.hk/v1/transport/kmb/stop-eta"

type EtaRow = {
  co?: string
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

export async function loadKmbNear(lng: number, lat: number, now = Date.now(), zoom = Number.NaN): Promise<KmbResponse> {
  const nearest = kmbStopsWithin(lng, lat, kmbReachMetres(zoom, lat), STOP_CAP)
  let missed = 0
  await pool(nearest.map((stop) => stop.id), FETCH_LIMIT, async (stopId) => {
    const cached = remembered.get(stopId)
    if (cached && now - cached.at < REMEMBER_MS) return
    const rows = await fetchStop(stopId)
    if (rows) remembered.set(stopId, { at: now, rows })
    else missed += 1
  })

  const stops: KmbStopBoard[] = []
  for (const stop of nearest) {
    const cached = remembered.get(stop.id)
    if (!cached || now - cached.at > REMEMBER_MS) continue
    const record = kmbStop(stop.id)
    if (!record) continue
    const calls = callsAt(cached.rows, now)
    if (calls.length === 0) continue
    stops.push({ id: stop.id, nameTc: record.tc, nameEn: record.en, lng: record.lng, lat: record.lat, calls })
  }
  if (stops.length === 0) {
    return { ok: false, error: "KMB arrivals failed", observedAt: null, stops: [], cacheable: false }
  }
  return { ok: true, observedAt: new Date(now).toISOString(), stops, cacheable: missed === 0 }
}

function callsAt(rows: EtaRow[], now: number): KmbCall[] {
  const calls: KmbCall[] = []
  for (const row of rows) {
    if (row.eta_seq !== 1) continue
    if (!isListedKmbRow(row)) continue
    const route = text(row.route)
    if (!route) continue
    const etaMs = row.eta ? Date.parse(row.eta) : NaN
    const hasEta = Number.isFinite(etaMs)
    const remarkTc = isScheduled(row) ? "" : text(row.rmk_tc)
    const remarkEn = isScheduled(row) ? "" : text(row.rmk_en)
    calls.push({
      route,
      destTc: text(row.dest_tc),
      destEn: text(row.dest_en),
      eta: hasEta ? new Date(etaMs).toISOString() : "",
      minutes: hasEta ? Math.max(0, Math.round((etaMs - now) / 60_000)) : null,
      scheduled: isScheduled(row),
      remarkTc,
      remarkEn,
      company: busCompany(route, text(row.co)),
    })
  }
  calls.sort((a, b) => (a.minutes ?? 999) - (b.minutes ?? 999) || a.route.localeCompare(b.route))
  return calls.slice(0, 12)
}

function isScheduled(row: EtaRow): boolean {
  return row.rmk_en === "Scheduled Bus" || row.rmk_tc === "原定班次"
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

async function fetchStop(stopId: string): Promise<EtaRow[] | null> {
  try {
    const response = await fetchUpstream(`${ETA_ROOT}/${encodeURIComponent(stopId)}`, REMEMBER_MS, {
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
