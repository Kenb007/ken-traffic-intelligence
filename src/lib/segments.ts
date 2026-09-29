import { readFile } from "node:fs/promises"
import path from "node:path"
import { bandForSpeed } from "@/lib/speed"
import type { Corridor, SpeedSummary } from "@/lib/types"

export type Centerline = {
  id: string
  roadEn: string
  roadTc: string
  direction: string
  coordinates: [number, number][]
}

// One shift per road name, shared by every segment, so the pieces stay joined.
let geometry: Promise<Centerline[]> | null = null

export function loadCenterlines(): Promise<Centerline[]> {
  geometry ??= readFile(path.join(process.cwd(), "data/strategic-centerlines.json"), "utf8").then(
    (text) => JSON.parse(text) as Centerline[],
  )
  return geometry
}

export function corridorsFromSegments(lines: Centerline[], speeds: Map<string, number | null>): Corridor[] {
  return lines.map((line) => {
    const speedKmh = speeds.get(line.id) ?? null
    return {
      id: line.id,
      roadTc: line.roadTc || line.roadEn || "Strategic road",
      roadEn: line.roadEn,
      direction: "",
      speedKmh,
      band: bandForSpeed(speedKmh),
      lengthKm: lengthKm(line.coordinates),
      detectorCount: 0,
      coordinates: line.coordinates,
    }
  })
}

export type LamppostSite = {
  id: string
  roadTc: string
  roadEn: string
  lat: number
  lng: number
  direction: string
}

export function lamppostCorridors(sites: LamppostSite[], speeds: Map<string, number | null>): Corridor[] {
  return sites.flatMap((site) => {
    if (!Number.isFinite(site.lat) || !Number.isFinite(site.lng)) return []
    const speedKmh = speeds.get(site.id) ?? null
    return [
      {
        id: site.id,
        roadTc: site.roadTc,
        roadEn: site.roadEn,
        direction: site.direction,
        speedKmh,
        band: bandForSpeed(speedKmh),
        lengthKm: 0,
        detectorCount: 1,
        coordinates: [[site.lng, site.lat]],
      },
    ]
  })
}

export function summarizeCorridors(corridors: Corridor[], detectorCount: number): SpeedSummary {
  const summary: SpeedSummary = {
    corridorCount: corridors.length,
    detectorCount,
    meanSpeedKmh: null,
    free: 0,
    slow: 0,
    congested: 0,
    unknown: 0,
  }
  let weighted = 0
  let weight = 0
  for (const corridor of corridors) {
    summary[corridor.band] += 1
    if (corridor.speedKmh == null || corridor.lengthKm <= 0) continue
    weighted += corridor.speedKmh * corridor.lengthKm
    weight += corridor.lengthKm
  }
  summary.meanSpeedKmh = weight > 0 ? weighted / weight : null
  return summary
}

function lengthKm(coordinates: [number, number][]): number {
  let total = 0
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1]
    const point = coordinates[index]
    if (!previous || !point) continue
    total += haversineKm(previous, point)
  }
  return total
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const earthKm = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(h)))
}
