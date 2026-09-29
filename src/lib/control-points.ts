import { bandLabel } from "@/lib/speed"
import type { SpeedBand } from "@/lib/types"

export type ControlPointCode = "HYW" | "HZM" | "LMC" | "LSC" | "LWS" | "MKT" | "SBC" | "STK"

export type QueueFile = Record<ControlPointCode, { arrQueue: number; depQueue: number }>

const VEHICLE_ROADS: Record<ControlPointCode, string[]> = {
  HYW: ["HEUNG YUEN WAI"],
  HZM: ["TUEN MUN CHEK LAP KOK", "HONG KONG-ZHUHAI-MACAO", "HONG KONG ZHUHAI"],
  LMC: ["SAN TIN HIGHWAY", "LOK MA CHAU"],
  LSC: ["SAN TIN HIGHWAY", "LOK MA CHAU"],
  LWS: [],
  MKT: ["MAN KAM TO"],
  SBC: ["SHENZHEN BAY", "KONG SHAM", "HUNG TIN"],
  STK: ["SHA TAU KOK"],
}

const POINTS: { code: ControlPointCode; name: string; coordinates: [number, number] }[] = [
  { code: "HYW", name: "Heung Yuen Wai", coordinates: [114.1516, 22.5592] },
  { code: "HZM", name: "Hong Kong-Zhuhai-Macao Bridge", coordinates: [113.9542, 22.3166] },
  { code: "LMC", name: "Lok Ma Chau", coordinates: [114.0757, 22.5122] },
  { code: "LSC", name: "Lok Ma Chau Spur Line", coordinates: [114.0655, 22.5143] },
  { code: "LWS", name: "Lo Wu", coordinates: [114.1133, 22.5281] },
  { code: "MKT", name: "Man Kam To", coordinates: [114.1291, 22.5376] },
  { code: "SBC", name: "Shenzhen Bay", coordinates: [113.9444, 22.5021] },
  { code: "STK", name: "Sha Tau Kok", coordinates: [114.2236, 22.5472] },
]

export function controlPointFeatures(resident: QueueFile, visitor: QueueFile): GeoJSON.Feature[] {
  return POINTS.map((point) => {
    const residentArr = queueCode(resident[point.code]?.arrQueue)
    const residentDep = queueCode(resident[point.code]?.depQueue)
    const visitorArr = queueCode(visitor[point.code]?.arrQueue)
    const visitorDep = queueCode(visitor[point.code]?.depQueue)
    const worst = worstQueue([residentArr, residentDep, visitorArr, visitorDep])
    return {
      type: "Feature",
      properties: {
        code: point.code,
        name: point.name,
        worst,
        residentArr: queueLabel(residentArr, false),
        residentDep: queueLabel(residentDep, false),
        visitorArr: queueLabel(visitorArr, true),
        visitorDep: queueLabel(visitorDep, true),
        summary: busySummary([
          ["Resident arrival", residentArr],
          ["Resident departure", residentDep],
          ["Visitor arrival", visitorArr],
          ["Visitor departure", visitorDep],
        ]),
      },
      geometry: { type: "Point", coordinates: point.coordinates },
    }
  })
}

export function decorateControlPoints(
  collection: GeoJSON.FeatureCollection,
  corridors: { roadEn: string; roadTc: string; speedKmh: number | null; band: SpeedBand }[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => {
      const code = textCode(feature.properties?.code)
      const vehicle = code ? slowestApproach(corridors, VEHICLE_ROADS[code]) : null
      const vehicleLine = vehicle
        ? `${vehicle.road} ${Math.round(vehicle.speedKmh)} km/h, ${bandLabel(vehicle.band).toLowerCase()}`
        : ""
      return {
        ...feature,
        properties: {
          ...feature.properties,
          vehicleLine,
          vehicleBand: vehicle?.band ?? "",
        },
      }
    }),
  }
}

function slowestApproach(
  corridors: { roadEn: string; roadTc: string; speedKmh: number | null; band: SpeedBand }[],
  needles: string[],
): { road: string; speedKmh: number; band: SpeedBand } | null {
  let best: { road: string; speedKmh: number; band: SpeedBand } | null = null
  for (const corridor of corridors) {
    if (corridor.speedKmh == null) continue
    const name = `${corridor.roadEn} ${corridor.roadTc}`.toUpperCase()
    if (!needles.some((needle) => name.includes(needle))) continue
    const road = corridor.roadEn || corridor.roadTc || "Approach"
    if (!best || rankBand(corridor.band) > rankBand(best.band) || (corridor.band === best.band && corridor.speedKmh < best.speedKmh)) {
      best = { road, speedKmh: corridor.speedKmh, band: corridor.band }
    }
  }
  return best
}

function rankBand(band: SpeedBand): number {
  switch (band) {
    case "congested":
      return 3
    case "slow":
      return 2
    case "free":
      return 1
    case "unknown":
      return 0
    default: {
      const exhaustive: never = band
      return exhaustive
    }
  }
}

function textCode(value: unknown): ControlPointCode | null {
  if (value === "HYW" || value === "HZM" || value === "LMC" || value === "LSC" || value === "LWS" || value === "MKT" || value === "SBC" || value === "STK") {
    return value
  }
  return null
}

export function isQueueFile(value: unknown): value is QueueFile {
  if (typeof value !== "object" || value === null) return false
  return POINTS.every((point) => {
    const row = (value as Record<string, unknown>)[point.code]
    return typeof row === "object" && row !== null && "arrQueue" in row && "depQueue" in row
  })
}

function queueCode(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 4
}

function worstQueue(codes: number[]): number {
  return codes.reduce((worst, code) => (severity(code) > severity(worst) ? code : worst), 99)
}

function severity(code: number): number {
  switch (code) {
    case 2:
      return 3
    case 1:
      return 2
    case 0:
      return 1
    default:
      return 0
  }
}

function queueLabel(code: number, visitor: boolean): string {
  switch (code) {
    case 0:
      return visitor ? "Normal, under 30 min" : "Normal, under 15 min"
    case 1:
      return visitor ? "Busy, under 45 min" : "Busy, under 30 min"
    case 2:
      return visitor ? "Very busy, 45 min or more" : "Very busy, 30 min or more"
    case 99:
      return "Closed"
    case 4:
      return "Maintenance"
    default:
      return "No reading"
  }
}

function busySummary(rows: [string, number][]): string {
  const busy = rows.filter((row) => row[1] === 1 || row[1] === 2)
  if (busy.length > 0) {
    return busy.map(([name, code]) => `${name} ${code === 2 ? "very busy" : "busy"}`).join(" · ")
  }
  if (rows.every((row) => row[1] === 99)) return "Closed"
  return "Passenger halls normal"
}
