import type { ApproachPoint, Corridor, TrafficResponse, WeatherWarning } from "@/lib/types"

export type IntelKind = "fault" | "incident" | "control" | "crossing" | "jam" | "works" | "slow" | "weather" | "forecast"

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

export type IntelTab = "ranked" | "roads" | "harbour" | "boundary" | "weather"

export const INTEL_TABS: { id: IntelTab; label: string }[] = [
  { id: "ranked", label: "Ranked" },
  { id: "roads", label: "Roads" },
  { id: "harbour", label: "Harbour" },
  { id: "boundary", label: "Boundary" },
  { id: "weather", label: "Weather" },
]

export const INTEL_EMPTY: Record<IntelTab, string> = {
  ranked: "Nothing urgent on the roads, harbour, boundary, or weather.",
  roads: "No open incident, bad road, or works.",
  harbour: "Waiting for crossing minutes.",
  boundary: "Waiting for the hall feed.",
  weather: "No weather warning in force.",
}

export type IntelInput = {
  trafficError: string | null
  traffic: TrafficResponse | null
  incidents: GeoJSON.FeatureCollection | null
  incidentsError: string | null
  works: GeoJSON.FeatureCollection | null
  controlPoints: GeoJSON.FeatureCollection | null
  controlError: string | null
  approaches: ApproachPoint[]
  approachesReady: boolean
  approachesError: string | null
  forecast: { eta: string; tunnel: string | null; distance: string | null } | null
  warnings: WeatherWarning[]
  warningsReady: boolean
  warningsError: string | null
}

const RANKED_LIMIT = 12

const CROSSING_LABEL: Record<string, string> = {
  CH: "Cross Harbour",
  EH: "Eastern Harbour",
  WH: "Western Harbour",
}

export function intelBoard(input: IntelInput): Record<IntelTab, IntelItem[]> {
  const incidents = incidentsOf(input.incidents, 8)
  const controls = controlPointsOf(input.controlPoints, 8)
  const crossings = crossingsOf(input.approaches)
  const jams = jamsOf(input.traffic?.ok ? input.traffic.corridors : [], 8, 3)
  const works = worksOf(input.works, 6)
  const warnings = warningsOf(input.warnings)
  const faults = faultsOf(input)
  const ranked = [...faults, ...incidents.slice(0, 5), ...controls, ...crossings, ...jams.slice(0, 6), ...works.slice(0, 4), ...warnings]
  ranked.sort(byScore)
  return {
    ranked: ranked.slice(0, RANKED_LIMIT),
    roads: [...faults.filter((item) => item.id === "fault-speed" || item.id === "fault-incidents"), ...incidents, ...jams, ...works].sort(byScore).slice(0, 16),
    harbour: harbourOf(input),
    boundary: boundaryOf(input),
    weather: weatherOf(input, warnings),
  }
}

export function rankIntel(input: IntelInput): IntelItem[] {
  return intelBoard(input).ranked
}

function faultsOf(input: IntelInput): IntelItem[] {
  const items: IntelItem[] = []
  if (input.trafficError || (input.traffic && !input.traffic.ok)) {
    items.push(fault("fault-speed", 1_000_000, "Speed picture unavailable", input.trafficError || input.traffic?.error || "The speed feed did not answer."))
  }
  if (input.incidentsError) items.push(fault("fault-incidents", 640_000, "Incident feed unavailable", input.incidentsError))
  if (input.approachesError) items.push(fault("fault-crossings", 620_000, "Crossing minutes unavailable", input.approachesError))
  if (input.controlError) items.push(fault("fault-boundary", 580_000, "Hall feed unavailable", input.controlError))
  if (input.warningsError) items.push(fault("fault-weather", 160_000, "Weather warnings unavailable", input.warningsError))
  return items
}

function fault(id: string, score: number, title: string, detail: string): IntelItem {
  return {
    id,
    kind: "fault",
    score,
    urgent: score >= 500_000,
    label: "Fault",
    title,
    detail,
    tone: score >= 500_000 ? "red" : "amber",
    coordinates: null,
  }
}

function incidentsOf(collection: GeoJSON.FeatureCollection | null, limit: number): IntelItem[] {
  if (!collection) return []
  const rows = collection.features.map((feature, index) => ({
    feature,
    announced: textProp(feature.properties, "announced"),
    index,
  }))
  rows.sort((a, b) => b.announced.localeCompare(a.announced) || a.index - b.index)
  return rows.slice(0, limit).map((row, index) => {
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

function controlPointsOf(collection: GeoJSON.FeatureCollection | null, limit: number): IntelItem[] {
  if (!collection) return []
  const rows = collection.features.flatMap((feature) => {
    const worst = numberProp(feature.properties, "worst")
    const vehicleBand = textProp(feature.properties, "vehicleBand")
    const passengerHot = worst === 1 || worst === 2
    const vehicleHot = vehicleBand === "congested" || vehicleBand === "slow"
    if (!passengerHot && !vehicleHot) return []
    return [controlItem(feature, worst, vehicleBand)]
  })
  rows.sort(byScore)
  return rows.slice(0, limit)
}

function boundaryOf(input: IntelInput): IntelItem[] {
  if (input.controlError) return [fault("fault-boundary", 580_000, "Hall feed unavailable", input.controlError)]
  if (!input.controlPoints) return []
  return input.controlPoints.features
    .map((feature) => controlItem(feature, numberProp(feature.properties, "worst"), textProp(feature.properties, "vehicleBand")))
    .sort(byScore)
}

function controlItem(feature: GeoJSON.Feature, worst: number | null, vehicleBand: string): IntelItem {
  const name = textProp(feature.properties, "name") || "Control point"
  const veryBusy = worst === 2 || vehicleBand === "congested"
  const score =
    worst === 2 ? 750_000 : vehicleBand === "congested" ? 420_000 : worst === 1 ? 230_000 : worst === 99 || worst === 4 ? 180_000 : vehicleBand === "slow" ? 60_000 : 1_000
  return {
    id: `control-${textProp(feature.properties, "code") || name}`,
    kind: "control",
    score,
    urgent: veryBusy,
    label: hallLabel(worst, vehicleBand),
    title: name,
    detail: [textProp(feature.properties, "summary"), textProp(feature.properties, "vehicleLine")].filter(Boolean).join(" · "),
    tone: veryBusy ? "red" : worst === 1 || worst === 99 || worst === 4 || vehicleBand === "slow" ? "amber" : "green",
    coordinates: pointOf(feature),
  }
}

function hallLabel(worst: number | null, vehicleBand: string): string {
  if (worst === 2) return "Very busy"
  if (vehicleBand === "congested") return "Bad approach"
  if (worst === 1) return "Busy"
  if (worst === 99) return "Closed"
  if (worst === 4) return "Maintenance"
  if (vehicleBand === "slow") return "Slow approach"
  return "Normal"
}

function crossingsOf(points: ApproachPoint[]): IntelItem[] {
  const best = bestCrossingRows(points)
  return [...best.entries()].flatMap(([code, row]) => {
    if (row.tone !== "red" && row.tone !== "amber") return []
    return [crossingItem(code, row)]
  })
}

function harbourOf(input: IntelInput): IntelItem[] {
  if (input.approachesError) return [fault("fault-crossings", 620_000, "Crossing minutes unavailable", input.approachesError)]
  if (!input.approachesReady) return []
  const best = bestCrossingRows(input.approaches)
  const items: IntelItem[] = ["CH", "EH", "WH"].map((code) => {
    const row = best.get(code)
    if (!row) {
      return {
        id: `crossing-${code}`,
        kind: "crossing" as const,
        score: 0,
        urgent: false,
        label: "Crossing",
        title: `${CROSSING_LABEL[code] ?? code} — no reading`,
        detail: "",
        tone: "none" as const,
        coordinates: null,
      }
    }
    return crossingItem(code, row)
  })
  if (input.forecast?.eta) {
    items.push({
      id: "forecast-sample",
      kind: "forecast",
      score: 0,
      urgent: false,
      label: "Sample route",
      title: input.forecast.eta,
      detail: [input.forecast.tunnel ? `via ${input.forecast.tunnel}` : "", input.forecast.distance].filter(Boolean).join(" · "),
      tone: "none",
      coordinates: null,
    })
  }
  return items
}

function bestCrossingRows(points: ApproachPoint[]) {
  const best = new Map<string, { minutes: number; from: string; tone: IntelTone; coordinates: [number, number] }>()
  for (const point of points) {
    for (const leg of point.legs) {
      if (leg.minutes == null) continue
      if (leg.code !== "CH" && leg.code !== "EH" && leg.code !== "WH") continue
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
  return best
}

function crossingItem(
  code: string,
  row: { minutes: number; from: string; tone: IntelTone; coordinates: [number, number] },
): IntelItem {
  return {
    id: `crossing-${code}`,
    kind: "crossing",
    score: (row.tone === "red" ? 600_000 : row.tone === "amber" ? 200_000 : 10_000) + row.minutes,
    urgent: row.tone === "red",
    label: "Crossing",
    title: `${CROSSING_LABEL[code] ?? code} ${row.minutes} min`,
    detail: row.from,
    tone: row.tone,
    coordinates: row.coordinates,
  }
}

function jamsOf(corridors: Corridor[], jamLimit: number, slowLimit: number): IntelItem[] {
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
    if (band === "jam") current.band = "jam"
    if (corridor.speedKmh < current.speed) {
      current.speed = corridor.speedKmh
      current.coordinates = midpoint(corridor.coordinates)
    }
  }
  const jams = [...roads.values()].filter((road) => road.band === "jam" && road.lengthKm >= 0.05)
  jams.sort((a, b) => a.speed - b.speed || b.lengthKm - a.lengthKm)
  const slow = [...roads.values()].filter((road) => road.band === "slow" && road.lengthKm >= 0.05)
  slow.sort((a, b) => a.speed - b.speed || b.lengthKm - a.lengthKm)
  return [
    ...jams.slice(0, jamLimit).map((road) => ({
      id: `jam-${road.title}`,
      kind: "jam" as const,
      score: 400_000 + (30 - road.speed) * 1_000 + road.lengthKm * 10,
      urgent: true,
      label: "Bad",
      title: road.title,
      detail: `${Math.round(road.speed)} km/h · ${road.lengthKm.toFixed(1)} km`,
      tone: "red" as const,
      coordinates: road.coordinates,
    })),
    ...slow.slice(0, slowLimit).map((road) => ({
      id: `slow-${road.title}`,
      kind: "slow" as const,
      score: 50_000 + (50 - road.speed) * 100,
      urgent: false,
      label: "Average",
      title: road.title,
      detail: `${Math.round(road.speed)} km/h · ${road.lengthKm.toFixed(1)} km`,
      tone: "amber" as const,
      coordinates: road.coordinates,
    })),
  ]
}

function worksOf(collection: GeoJSON.FeatureCollection | null, limit: number): IntelItem[] {
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
  rows.sort(byScore)
  return rows.slice(0, limit)
}

function warningsOf(warnings: WeatherWarning[]): IntelItem[] {
  return warnings.map((warning) => ({
    id: warning.id,
    kind: "weather" as const,
    score: warning.score,
    urgent: warning.urgent,
    label: "Weather",
    title: warning.name,
    detail: warning.detail,
    tone: warning.tone,
    coordinates: null,
  }))
}

function weatherOf(input: IntelInput, warnings: IntelItem[]): IntelItem[] {
  if (input.warningsError) return [fault("fault-weather", 160_000, "Weather warnings unavailable", input.warningsError)]
  if (!input.warningsReady) return []
  return warnings
}

function byScore(a: IntelItem, b: IntelItem): number {
  return b.score - a.score || a.title.localeCompare(b.title)
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

function numberProp(properties: GeoJSON.GeoJsonProperties, key: string): number | null {
  if (!properties) return null
  const value = properties[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function clip(value: string, limit: number): string {
  if (value.length <= limit) return value
  return `${value.slice(0, limit - 1).trimEnd()}…`
}
