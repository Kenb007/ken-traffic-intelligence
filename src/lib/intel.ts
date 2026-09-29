import type { ApproachPoint, Corridor, TrafficResponse } from "@/lib/types"

export type IntelKind = "fault" | "incident" | "crossing" | "jam" | "works" | "slow"

export type IntelTone = "red" | "amber" | "green" | "none"

export type IntelItem = {
  id: string
  kind: IntelKind
  score: number
  urgent: boolean
  label: string
  title: string
  detail: string
  tone: IntelTone
  coordinates: [number, number] | null
}

export type IntelInput = {
  trafficError: string | null
  traffic: TrafficResponse | null
  incidents: GeoJSON.FeatureCollection | null
  works: GeoJSON.FeatureCollection | null
  approaches: ApproachPoint[]
}

const LIST_LIMIT = 6

// A harbour controller acts on an unplanned blockage first, then a crossing
// that is failing, then a jammed strategic road, then work that is already
// occupying a lane. Slow traffic and works still being prepared stay behind those.
export function rankIntel(input: IntelInput): IntelItem[] {
  const items: IntelItem[] = []
  if (input.trafficError || (input.traffic && !input.traffic.ok)) {
    items.push({
      id: "fault-speed",
      kind: "fault",
      score: 1_000_000,
      urgent: true,
      label: "Fault",
      title: "Speed picture unavailable",
      detail: input.trafficError || input.traffic?.error || "The speed feed did not answer.",
      tone: "red",
      coordinates: null,
    })
  }
  items.push(...incidentsOf(input.incidents))
  items.push(...crossingsOf(input.approaches))
  items.push(...jamsOf(input.traffic?.ok ? input.traffic.corridors : []))
  items.push(...worksOf(input.works))
  items.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  return items.slice(0, LIST_LIMIT)
}

function incidentsOf(collection: GeoJSON.FeatureCollection | null): IntelItem[] {
  if (!collection) return []
  const rows = collection.features.map((feature, index) => ({
    feature,
    announced: textProp(feature.properties, "announced"),
    index,
  }))
  rows.sort((a, b) => b.announced.localeCompare(a.announced) || a.index - b.index)
  return rows.slice(0, 3).map((row, index) => {
    const location = textProp(row.feature.properties, "locationEn") || textProp(row.feature.properties, "location")
    const direction = textProp(row.feature.properties, "direction")
    return {
      id: `incident-${index}-${location}`,
      kind: "incident" as const,
      score: 800_000 - index,
      urgent: true,
      label: "Incident",
      title: clip(textProp(row.feature.properties, "name") || "Open incident", 90),
      detail: [location, direction].filter(Boolean).join(" · "),
      tone: "red" as const,
      coordinates: pointOf(row.feature),
    }
  })
}

function crossingsOf(points: ApproachPoint[]): IntelItem[] {
  const best = new Map<string, { minutes: number; from: string; tone: IntelTone; coordinates: [number, number] }>()
  for (const point of points) {
    for (const leg of point.legs) {
      if (leg.minutes == null) continue
      if (leg.code !== "CH" && leg.code !== "EH" && leg.code !== "WH") continue
      if (leg.colour !== "red" && leg.colour !== "amber") continue
      const current = best.get(leg.code)
      if (current && current.minutes <= leg.minutes) continue
      best.set(leg.code, {
        minutes: leg.minutes,
        from: point.name,
        tone: leg.colour,
        coordinates: point.coordinates,
      })
    }
  }
  const label: Record<string, string> = {
    CH: "Cross Harbour",
    EH: "Eastern Harbour",
    WH: "Western Harbour",
  }
  return [...best.entries()].map(([code, row]) => ({
    id: `crossing-${code}`,
    kind: "crossing" as const,
    score: (row.tone === "red" ? 600_000 : 200_000) + row.minutes,
    urgent: row.tone === "red",
    label: "Crossing",
    title: `${label[code] ?? code} ${row.minutes} min`,
    detail: row.from,
    tone: row.tone,
    coordinates: row.coordinates,
  }))
}

function jamsOf(corridors: Corridor[]): IntelItem[] {
  const roads = new Map<string, { title: string; speed: number; lengthKm: number; coordinates: [number, number] | null; band: "jam" | "slow" }>()
  for (const corridor of corridors) {
    if (corridor.speedKmh == null) continue
    if (corridor.band !== "congested" && corridor.band !== "slow") continue
    const title = corridor.roadEn || corridor.roadTc || "Strategic road"
    const key = title.toUpperCase()
    const band = corridor.band === "congested" ? "jam" : "slow"
    const current = roads.get(key)
    if (!current) {
      roads.set(key, {
        title,
        speed: corridor.speedKmh,
        lengthKm: corridor.lengthKm,
        coordinates: midpoint(corridor.coordinates),
        band,
      })
      continue
    }
    current.lengthKm += corridor.lengthKm
    if (corridor.speedKmh < current.speed) {
      current.speed = corridor.speedKmh
      current.coordinates = midpoint(corridor.coordinates)
      current.band = band === "jam" ? "jam" : current.band
    }
  }
  const jams = [...roads.values()].filter((road) => road.band === "jam")
  jams.sort((a, b) => a.speed - b.speed || b.lengthKm - a.lengthKm)
  const slow = [...roads.values()].filter((road) => road.band === "slow")
  slow.sort((a, b) => a.speed - b.speed || b.lengthKm - a.lengthKm)
  return [
    ...jams.slice(0, 3).map((road) => ({
      id: `jam-${road.title}`,
      kind: "jam" as const,
      score: 400_000 + (30 - road.speed) * 1_000 + road.lengthKm * 10,
      urgent: true,
      label: "Jam",
      title: road.title,
      detail: `${Math.round(road.speed)} km/h · ${road.lengthKm.toFixed(1)} km`,
      tone: "red" as const,
      coordinates: road.coordinates,
    })),
    ...slow.slice(0, 1).map((road) => ({
      id: `slow-${road.title}`,
      kind: "slow" as const,
      score: 50_000 + (50 - road.speed) * 100,
      urgent: false,
      label: "Slow",
      title: road.title,
      detail: `${Math.round(road.speed)} km/h · ${road.lengthKm.toFixed(1)} km`,
      tone: "amber" as const,
      coordinates: road.coordinates,
    })),
  ]
}

function worksOf(collection: GeoJSON.FeatureCollection | null): IntelItem[] {
  if (!collection) return []
  const rows = collection.features.flatMap((feature) => {
    const status = textProp(feature.properties, "status")
    const live = /in progress/i.test(status)
    const preparing = /preparation/i.test(status)
    if (!live && !preparing) return []
    const road = textProp(feature.properties, "road") || "Road work"
    const place = textProp(feature.properties, "place")
    return [
      {
        id: `works-${textProp(feature.properties, "id") || road}`,
        kind: "works" as const,
        score: live ? 250_000 : 120_000,
        urgent: live,
        label: "Works",
        title: road,
        detail: [live ? "In progress" : "Preparing", place].filter(Boolean).join(" · "),
        tone: (live ? "red" : "amber") as IntelTone,
        coordinates: pointOf(feature),
      },
    ]
  })
  rows.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  return rows.slice(0, 2)
}

function midpoint(coordinates: [number, number][]): [number, number] | null {
  const point = coordinates[Math.floor(coordinates.length / 2)]
  return point ?? null
}

function pointOf(feature: GeoJSON.Feature): [number, number] | null {
  const geometry = feature.geometry
  if (geometry.type !== "Point") return null
  const [lng, lat] = geometry.coordinates
  if (typeof lng !== "number" || typeof lat !== "number") return null
  return [lng, lat]
}

function textProp(properties: GeoJSON.GeoJsonProperties, key: string): string {
  if (!properties) return ""
  const value = properties[key]
  return typeof value === "string" ? value.trim() : ""
}

function clip(value: string, limit: number): string {
  if (value.length <= limit) return value
  return `${value.slice(0, limit - 1).trimEnd()}…`
}
