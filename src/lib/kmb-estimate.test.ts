import assert from "node:assert/strict"
import { placeKmbBuses, type KmbArrivalFix, type KmbStopPoint, type KmbVariantPath } from "./kmb-estimate.ts"

const stops = new Map<string, KmbStopPoint>([
  ["a", { id: "a", lng: 114, lat: 22 }],
  ["b", { id: "b", lng: 114.008, lat: 22 }],
  ["c", { id: "c", lng: 114.016, lat: 22 }],
])

const variant: KmbVariantPath = { route: "1", bound: "O", service: "1", stops: ["a", "b", "c"] }
const now = Date.parse("2026-10-01T12:00:00Z")

function arrival(partial: Partial<KmbArrivalFix> & Pick<KmbArrivalFix, "stopId" | "etaMs">): KmbArrivalFix {
  return {
    route: "1",
    bound: "O",
    service: "1",
    scheduled: false,
    destTc: "尖沙咀",
    destEn: "Star Ferry",
    ...partial,
  }
}

const atStop = placeKmbBuses([variant], stops, [arrival({ stopId: "a", etaMs: now + 60_000 })], now)
assert.equal(atStop.length, 1)
assert.equal(atStop[0]?.lng, 114)
assert.equal(atStop[0]?.fromStopId, null)

const due = placeKmbBuses([variant], stops, [arrival({ stopId: "b", etaMs: now + 30_000 })], now)
assert.ok((due[0]?.lng ?? 0) > 114.007)

const halfway = placeKmbBuses([variant], stops, [arrival({ stopId: "b", etaMs: now + 4 * 60_000 })], now)
assert.ok(Math.abs((halfway[0]?.lng ?? 0) - 114.004) < 1e-9)

const waiting = placeKmbBuses([variant], stops, [arrival({ stopId: "b", etaMs: now + 20 * 60_000 })], now)
assert.ok(Math.abs((waiting[0]?.lng ?? 0) - 114) < 1e-9)

const ignored = placeKmbBuses(
  [variant],
  stops,
  [
    arrival({ stopId: "c", etaMs: now + 60_000, scheduled: true }),
    arrival({ stopId: "b", etaMs: now - 60_000 }),
    arrival({ stopId: "c", etaMs: now + 5 * 60_000, service: "2" }),
  ],
  now,
)
assert.equal(ignored.length, 0)

const soonest = placeKmbBuses(
  [variant],
  stops,
  [arrival({ stopId: "c", etaMs: now + 10 * 60_000 }), arrival({ stopId: "b", etaMs: now + 2 * 60_000 })],
  now,
)
assert.equal(soonest[0]?.stopId, "b")

console.log("kmb estimate ok")
