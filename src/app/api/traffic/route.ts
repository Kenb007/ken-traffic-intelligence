import { parseCsv } from "@/lib/csv"
import { buildCorridors, laneSpeed, type DetectorSite } from "@/lib/corridors"
import { fetchText } from "@/lib/fetch-text"
import type { NetworkStatus, SegmentSummary, SpeedSummary, TrafficResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

const LOCATIONS =
  "https://static.data.gov.hk/td/traffic-data-strategic-major-roads/info/traffic_speed_volume_occ_info.csv"
const RAW_SPEEDS = "https://resource.data.one.gov.hk/td/traffic-detectors/rawSpeedVol-all.xml"
const SEGMENT_SPEEDS = "https://resource.data.one.gov.hk/td/traffic-detectors/irnAvgSpeed-all.xml"
const NETWORK_DATE = "https://static.data.gov.hk/td/road-network-v2/DATA_LAST_UPDATED_DATE.csv"

const NETWORK_REASON =
  "The 2nd-generation centreline is about 125 MB compressed (486 MB as GML). This view does not load it. Corridors are traced through detector coordinates on the strategic-road feed."

function emptySummary(): SpeedSummary {
  return {
    corridorCount: 0,
    detectorCount: 0,
    meanSpeedKmh: null,
    free: 0,
    slow: 0,
    congested: 0,
    unknown: 0,
  }
}

function failedSegments(error: string): SegmentSummary {
  return {
    ok: false,
    error,
    observedAt: null,
    validCount: 0,
    invalidCount: 0,
    meanSpeedKmh: null,
  }
}

function failedNetwork(error?: string): NetworkStatus {
  return {
    ok: false,
    error,
    revisionDate: null,
    usedOnMap: false,
    reason: NETWORK_REASON,
  }
}

export async function GET(request: Request) {
  const simulate = new URL(request.url).searchParams.get("simulate")
  if (simulate === "fail") {
    const body: TrafficResponse = {
      ok: false,
      error:
        "Speed feed was forced down for this view. The satellite map does not depend on it.",
      observedAt: null,
      corridors: [],
      summary: emptySummary(),
      segments: failedSegments("Skipped while the speed request is forced down."),
      network: {
        ok: true,
        revisionDate: null,
        usedOnMap: false,
        reason: NETWORK_REASON,
      },
    }
    return Response.json(body, { status: 502 })
  }

  const [locations, raw, segments, network] = await Promise.allSettled([
    fetchText(LOCATIONS, 6 * 60 * 60 * 1000),
    fetchText(RAW_SPEEDS, 45_000),
    fetchText(SEGMENT_SPEEDS, 45_000),
    fetchText(NETWORK_DATE, 6 * 60 * 60 * 1000),
  ])

  const networkStatus = networkStatusFrom(network)
  const segmentSummary = segments.status === "fulfilled" ? parseSegments(segments.value) : failedSegments(reason(segments))

  if (locations.status === "rejected" || raw.status === "rejected") {
    const body: TrafficResponse = {
      ok: false,
      error: [locations, raw]
        .flatMap((result) => (result.status === "rejected" ? [reason(result)] : []))
        .join(" "),
      observedAt: null,
      corridors: [],
      summary: emptySummary(),
      segments: segmentSummary,
      network: networkStatus,
    }
    return Response.json(body, { status: 502 })
  }

  const sites = parseSites(locations.value)
  const speeds = parseRawSpeeds(raw.value)
  const { corridors, summary } = buildCorridors(sites, speeds.byId)
  const body: TrafficResponse = {
    ok: true,
    observedAt: speeds.observedAt,
    corridors,
    summary,
    segments: segmentSummary,
    network: networkStatus,
  }
  return Response.json(body)
}

function reason(result: PromiseRejectedResult): string {
  return result.reason instanceof Error ? result.reason.message : "Request failed"
}

function parseSites(csv: string): DetectorSite[] {
  return parseCsv(csv).flatMap((row) => {
    const lat = Number(row.Latitude)
    const lng = Number(row.Longitude)
    const id = row.AID_ID_Number
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return []
    return [
      {
        id,
        roadTc: row.Road_TC ?? "",
        roadEn: row.Road_EN ?? "",
        lat,
        lng,
        direction: row.Direction ?? "",
      },
    ]
  })
}

function parseRawSpeeds(xml: string): { observedAt: string | null; byId: Map<string, number | null> } {
  const date = xml.match(/<date>([^<]+)<\/date>/)?.[1] ?? null
  const from = xml.match(/<period_from>([^<]+)<\/period_from>/)?.[1] ?? null
  const byId = new Map<string, number | null>()
  for (const block of xml.split("<detector>").slice(1)) {
    const id = block.match(/<detector_id>([^<]+)<\/detector_id>/)?.[1]
    if (!id) continue
    const lanes = [...block.matchAll(
      /<speed>([^<]*)<\/speed>\s*<occupancy>[^<]*<\/occupancy>\s*<volume>([^<]*)<\/volume>[\s\S]*?<valid>([YN])<\/valid>/g,
    )].map((match) => ({
      speed: Number(match[1]),
      volume: Number(match[2]),
      valid: match[3] === "Y",
    }))
    byId.set(id, laneSpeed(lanes))
  }
  return { observedAt: date && from ? `${date} ${from}` : date, byId }
}

function parseSegments(xml: string): SegmentSummary {
  const date = xml.match(/<date>([^<]+)<\/date>/)?.[1] ?? null
  const time = xml.match(/<time>([^<]+)<\/time>/)?.[1] ?? null
  let validSum = 0
  let validCount = 0
  let invalidCount = 0
  for (const match of xml.matchAll(
    /<speed>([^<]*)<\/speed>\s*<valid>([YN])<\/valid>/g,
  )) {
    const speed = Number(match[1])
    if (match[2] !== "Y" || !Number.isFinite(speed)) {
      invalidCount += 1
      continue
    }
    validSum += speed
    validCount += 1
  }
  return {
    ok: true,
    observedAt: date && time ? `${date} ${time}` : date,
    validCount,
    invalidCount,
    meanSpeedKmh: validCount > 0 ? validSum / validCount : null,
  }
}

function networkStatusFrom(result: PromiseSettledResult<string>): NetworkStatus {
  if (result.status === "rejected") return failedNetwork(reason(result))
  const date = result.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^\d{4}-\d{2}-\d{2}$/.test(line))
  return {
    ok: true,
    revisionDate: date ?? null,
    usedOnMap: false,
    reason: NETWORK_REASON,
  }
}
