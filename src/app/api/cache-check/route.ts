import { fetchUpstream, lastCacheOutcome } from "@/lib/upstream"

export const dynamic = "force-dynamic"

const REFERER = "https://www.hkemobility.gov.hk/en/"
const JSON_HEADERS = { Accept: "application/json" }
const MOBILITY_HEADERS = { Accept: "application/json", Referer: REFERER }
const LIVE_HEADERS = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; HKTrafficIntelligence/1.0; +https://hktraffic.keith-li.workers.dev)",
}

const FEEDS: { name: string; url: string; ttlMs: number; headers?: HeadersInit; timeoutMs?: number }[] = [
  {
    name: "approaches",
    url: "https://www.hkemobility.gov.hk/api/drss/layer/map?service=WFS&version=1.0.0&request=GetFeature&typeName=DRSS:VW_JOURNEY_TIME_LOCATION_EN&outputFormat=application/json&srsName=EPSG:4326",
    ttlMs: 60_000,
    headers: MOBILITY_HEADERS,
    timeoutMs: 40_000,
  },
  {
    name: "picture",
    url: new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "DRSS:VW_SNAPSHOT_IMAGE_EN",
      outputFormat: "application/json",
      srsName: "EPSG:4326",
    }).toString().replace(/^/, "https://www.hkemobility.gov.hk/api/drss/layer/map?"),
    ttlMs: 30_000,
    headers: MOBILITY_HEADERS,
    timeoutMs: 40_000,
  },
  {
    name: "mtr",
    url: "https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=TWL&sta=CEN&lang=tc",
    ttlMs: 15_000,
    headers: LIVE_HEADERS,
    timeoutMs: 5_000,
  },
  {
    name: "kmb",
    url: "https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/18492910339410B1",
    ttlMs: 30_000,
    headers: LIVE_HEADERS,
    timeoutMs: 5_000,
  },
  {
    name: "traffic",
    url: "https://www.hkemobility.gov.hk/api/drss/layer/map?service=WFS&version=1.0.0&request=GetFeature&typeName=DRSS:VW_IRN_AVG_SPEED_MAP&outputFormat=application/json&propertyName=SEGMENT_ID,ROAD_SATURATION_LEVEL",
    ttlMs: 60_000,
    headers: MOBILITY_HEADERS,
    timeoutMs: 40_000,
  },
  {
    name: "warnings",
    url: "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc",
    ttlMs: 60_000,
    headers: JSON_HEADERS,
    timeoutMs: 20_000,
  },
  {
    name: "control-points",
    url: "https://secure1.info.gov.hk/immd/mobileapps/2bb9ae17/data/CPQueueTimeR.json",
    ttlMs: 60_000,
    headers: JSON_HEADERS,
    timeoutMs: 15_000,
  },
  {
    name: "incidents",
    url: "https://www.td.gov.hk/en/special_news/trafficnews.xml",
    ttlMs: 20_000,
    timeoutMs: 25_000,
  },
]

export async function GET() {
  const results = []
  for (const feed of FEEDS) {
    const started = Date.now()
    try {
      const response = await fetchUpstream(feed.url, feed.ttlMs, {
        bypassMemory: true,
        timeoutMs: feed.timeoutMs,
        headers: feed.headers,
      })
      results.push({
        name: feed.name,
        status: response.status,
        bytes: response.body.byteLength,
        cache: lastCacheOutcome,
        ms: Date.now() - started,
      })
    } catch (error) {
      results.push({
        name: feed.name,
        status: 0,
        bytes: 0,
        cache: lastCacheOutcome,
        ms: Date.now() - started,
        error: error instanceof Error ? error.message : "probe failed",
      })
    }
  }
  const stored = results.every((result) => result.cache === "hit" || result.cache === "stored+cache-api")
  return Response.json({ ok: stored, results })
}
