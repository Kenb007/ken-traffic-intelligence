import { estimateTrains, type TrainObservation } from "@/lib/mtr-estimate"
import { mtrQueries, networkRoutes, stationPoint } from "@/lib/mtr-network"
import { readSchedule } from "@/lib/mtr-schedule"
import type { MtrBoard, MtrResponse, MtrTrain } from "@/lib/types"

const REMEMBER_MS = 90_000
const FETCH_LIMIT = 4

type Remembered = { at: number; board: MtrBoard; observations: TrainObservation[] }

const remembered = new Map<string, Remembered>()
let blockedUntil = 0
let failures = 0

// One snapshot is about 120 station calls. The published feed has no network
// dump, and it answers 429 if those calls arrive in a burst. A short memory
// keeps one isolate from asking again for every visitor.
export async function loadMtrSnapshot(now = Date.now()): Promise<MtrResponse> {
  if (now >= blockedUntil) failures = 0
  if (now >= blockedUntil) {
    await pool(mtrQueries(), FETCH_LIMIT, async (pair) => {
      const key = `${pair.line}-${pair.station}`
      let parsed = await fetchPair(pair.line, pair.station)
      if (parsed && parsed.observations.length === 0) {
        const again = await fetchPair(pair.line, pair.station)
        if (again && again.observations.length > 0) parsed = again
      }
      if (!parsed) return
      const previous = remembered.get(key)
      if (parsed.observations.length === 0 && previous && previous.observations.length > 0 && now - previous.at < 180_000) return
      remembered.set(key, { at: now, board: parsed.board, observations: parsed.observations })
    })
  }

  const boards: MtrBoard[] = []
  const observations: TrainObservation[] = []
  for (const [key, item] of remembered) {
    if (now - item.at > REMEMBER_MS) {
      remembered.delete(key)
      continue
    }
    boards.push(item.board)
    observations.push(...item.observations)
  }
  if (boards.length === 0) {
    return { ok: false, error: "Next train feed failed", observedAt: null, trains: [], boards: [] }
  }
  const trains = estimateTrains(networkRoutes(), observations, stationPoint).map((train): MtrTrain => ({
    id: train.id,
    line: train.line,
    dest: train.dest,
    plat: train.plat,
    ttnt: train.ttnt,
    observedAt: new Date(train.observedAt).toISOString(),
    delay: train.delay,
    timeType: train.timeType,
    anchor: train.anchor,
    path: train.path,
    hold: train.hold,
  }))
  return { ok: true, observedAt: new Date(now).toISOString(), trains, boards }
}

async function fetchPair(line: string, station: string) {
  if (Date.now() < blockedUntil || failures >= 8) return null
  const url = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${encodeURIComponent(line)}&sta=${encodeURIComponent(station)}&lang=tc`
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; HKTrafficIntelligence/1.0; +https://hktraffic.keith-li.workers.dev)",
      },
    })
    if (response.status === 429) {
      blockedUntil = Date.now() + 45_000
      failures += 1
      return null
    }
    if (response.status >= 500) {
      failures += 1
      return null
    }
    if (!response.ok) return null
    failures = 0
    const payload: unknown = await response.json()
    return readSchedule(payload, line, station)
  } catch {
    failures += 1
    return null
  }
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0
  async function run(): Promise<void> {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      const item = items[index]
      if (item === undefined) return
      await worker(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
}
