import { nearestLrtStations } from "@/lib/lrt-network"
import { fetchUpstream } from "@/lib/upstream"
import type { LrtCall, LrtResponse, LrtStationBoard } from "@/lib/types"

const STATION_LIMIT = 8
const FETCH_LIMIT = 3
const REMEMBER_MS = 15_000

type TrainRow = {
  route_no?: string
  additionalInfo1?: string
  special?: number
  dest_ch?: string
  dest_en?: string
  time_ch?: string
  time_en?: string
  stop?: number
}

type Remembered = { at: number; calls: LrtCall[] }

const remembered = new Map<string, Remembered>()

export async function loadLrtNear(lng: number, lat: number, now = Date.now()): Promise<LrtResponse> {
  const nearest = nearestLrtStations(lng, lat, STATION_LIMIT)
  if (nearest.length === 0) return { ok: true, observedAt: new Date(now).toISOString(), stations: [] }
  await pool(nearest.map((station) => station.id), FETCH_LIMIT, async (stationId) => {
    const cached = remembered.get(stationId)
    if (cached && now - cached.at < REMEMBER_MS) return
    const calls = await fetchStation(stationId)
    if (calls) remembered.set(stationId, { at: now, calls })
  })

  const stations: LrtStationBoard[] = []
  for (const station of nearest) {
    const cached = remembered.get(station.id)
    if (!cached || now - cached.at > REMEMBER_MS) continue
    if (cached.calls.length === 0) continue
    stations.push({
      id: station.id,
      nameTc: station.tc,
      nameEn: station.en,
      lng: station.lng,
      lat: station.lat,
      calls: cached.calls,
    })
  }
  if (stations.length === 0) {
    return { ok: false, error: "Light Rail arrivals failed", observedAt: null, stations: [] }
  }
  return { ok: true, observedAt: new Date(now).toISOString(), stations }
}

async function fetchStation(stationId: string): Promise<LrtCall[] | null> {
  const url = `https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule?station_id=${encodeURIComponent(stationId)}&with_special=1`
  try {
    const response = await fetchUpstream(url, REMEMBER_MS, {
      timeoutMs: 5_000,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; HKTrafficIntelligence/1.0; +https://hktraffic.keith-li.workers.dev)",
      },
    })
    if (response.status !== 200) return null
    const body = JSON.parse(new TextDecoder().decode(response.body)) as {
      status?: number
      platform_list?: { route_list?: TrainRow[] }[]
    }
    if (body.status === 0) return []
    return callsFrom(body.platform_list ?? [])
  } catch {
    return null
  }
}

function callsFrom(platforms: { route_list?: TrainRow[] }[]): LrtCall[] {
  const calls: LrtCall[] = []
  for (const platform of platforms) {
    for (const row of platform.route_list ?? []) {
      if (row.stop === 1) continue
      const special = row.special === 1
      const route = special ? text(row.additionalInfo1) || text(row.route_no) : text(row.route_no)
      if (!route || route === "SPR") continue
      const minutes = minutesOf(text(row.time_en), text(row.time_ch))
      if (minutes == null) continue
      calls.push({
        route,
        destTc: text(row.dest_ch),
        destEn: text(row.dest_en),
        minutes,
        arriving: minutes === 0,
      })
    }
  }
  const soonest = new Map<string, LrtCall>()
  for (const call of calls) {
    const key = `${call.route}|${call.destTc}`
    const current = soonest.get(key)
    if (!current || call.minutes < current.minutes) soonest.set(key, call)
  }
  return [...soonest.values()].sort((a, b) => a.minutes - b.minutes || a.route.localeCompare(b.route)).slice(0, 8)
}

function minutesOf(timeEn: string, timeCh: string): number | null {
  const english = /(\d+)\s*mins?/i.exec(timeEn)
  if (english?.[1]) return Number(english[1])
  const chinese = /(\d+)\s*分鐘/.exec(timeCh)
  if (chinese?.[1]) return Number(chinese[1])
  if (/arriving|departing/i.test(timeEn) || timeEn === "-" || timeCh.includes("即將") || timeCh.includes("正在") || timeCh === "-") return 0
  return null
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
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
