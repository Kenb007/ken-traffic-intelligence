export type KmbStopPoint = { id: string; lng: number; lat: number }

export type KmbVariantPath = {
  route: string
  bound: string
  service: string
  stops: string[]
}

export type KmbArrivalFix = {
  stopId: string
  route: string
  bound: string
  service: string
  etaMs: number
  scheduled: boolean
  destTc: string
  destEn: string
}

export type KmbBusDot = {
  id: string
  route: string
  bound: string
  service: string
  stopId: string
  fromStopId: string | null
  lng: number
  lat: number
  minutes: number
  eta: string
  destTc: string
  destEn: string
}

const APPROACH_MINUTES = 8

// One dot per route variant: the soonest published arrival that is not the timetable.
// The dot sits on the way into that stop. KMB does not say which bus it is.
export function placeKmbBuses(
  variants: KmbVariantPath[],
  stops: ReadonlyMap<string, KmbStopPoint>,
  arrivals: KmbArrivalFix[],
  nowMs: number,
): KmbBusDot[] {
  const dots: KmbBusDot[] = []
  for (const variant of variants) {
    const soonest = soonestArrival(variant, arrivals, nowMs)
    if (!soonest) continue
    const placed = placeArrival(variant, soonest, stops, nowMs)
    if (placed) dots.push(placed)
  }
  return dots
}

function soonestArrival(variant: KmbVariantPath, arrivals: KmbArrivalFix[], nowMs: number): KmbArrivalFix | null {
  const onRoute = new Set(variant.stops)
  let best: KmbArrivalFix | null = null
  for (const arrival of arrivals) {
    if (arrival.scheduled || arrival.etaMs <= nowMs) continue
    if (arrival.route !== variant.route || arrival.bound !== variant.bound || arrival.service !== variant.service) continue
    if (!onRoute.has(arrival.stopId)) continue
    if (!best || arrival.etaMs < best.etaMs) best = arrival
  }
  return best
}

function placeArrival(
  variant: KmbVariantPath,
  arrival: KmbArrivalFix,
  stops: ReadonlyMap<string, KmbStopPoint>,
  nowMs: number,
): KmbBusDot | null {
  const index = variant.stops.indexOf(arrival.stopId)
  const here = stops.get(arrival.stopId)
  if (index < 0 || !here) return null
  const minutes = (arrival.etaMs - nowMs) / 60_000
  const previousId = index === 0 ? null : variant.stops[index - 1] ?? null
  const previous = previousId ? stops.get(previousId) ?? null : null
  const point = previous ? approach(previous, here, minutes) : here
  return {
    id: `${variant.route}-${variant.bound}-${variant.service}-${arrival.stopId}`,
    route: variant.route,
    bound: variant.bound,
    service: variant.service,
    stopId: arrival.stopId,
    fromStopId: previous ? previous.id : null,
    lng: point.lng,
    lat: point.lat,
    minutes: Math.max(0, Math.round(minutes)),
    eta: new Date(arrival.etaMs).toISOString(),
    destTc: arrival.destTc,
    destEn: arrival.destEn,
  }
}

function approach(previous: KmbStopPoint, here: KmbStopPoint, minutes: number): KmbStopPoint {
  const travelled = 1 - Math.min(1, Math.max(0, minutes / APPROACH_MINUTES))
  return {
    id: here.id,
    lng: previous.lng + (here.lng - previous.lng) * travelled,
    lat: previous.lat + (here.lat - previous.lat) * travelled,
  }
}
