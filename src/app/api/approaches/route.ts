import { readApproachPoints } from "@/lib/approaches"
import type { ApproachesResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

const LOCATIONS_URL =
  "https://www.hkemobility.gov.hk/api/drss/layer/map?service=WFS&version=1.0.0&request=GetFeature&typeName=DRSS:VW_JOURNEY_TIME_LOCATION_EN&outputFormat=application/json&srsName=EPSG:4326"

const DETAIL_IDS = ["H1", "H2", "H3", "H4", "H11", "K02", "K03", "K07", "K08"]

export async function GET() {
  try {
    const locations = await readJson(LOCATIONS_URL)
    const details = await Promise.all(
      DETAIL_IDS.map(async (id) => {
        try {
          return [id, await readJson(detailUrl(id))] as const
        } catch (error) {
          return [id, error instanceof Error ? error.message : "Journey time board failed"] as const
        }
      }),
    )

    const detailsById: Record<string, unknown> = {}
    const failures: string[] = []
    for (const [id, body] of details) {
      if (typeof body === "string") {
        failures.push(`${id}: ${body}`)
        continue
      }
      detailsById[id] = body
    }

    const { points, capturedAt } = readApproachPoints(locations, detailsById)
    const body: ApproachesResponse = {
      ok: points.length > 0,
      error:
        points.length === 0
          ? failures[0] ?? "No harbour-approach journey times were returned."
          : undefined,
      capturedAt,
      points,
    }
    return Response.json(body, { status: points.length === 0 ? 502 : 200 })
  } catch (error) {
    const body: ApproachesResponse = {
      ok: false,
      error: error instanceof Error ? error.message : "Journey time boards failed",
      capturedAt: null,
      points: [],
    }
    return Response.json(body, { status: 502 })
  }
}

function detailUrl(id: string): string {
  return `https://www.hkemobility.gov.hk/api/drss/getTextInfo/JourneyTime/en/${encodeURIComponent(id)}`
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(40_000),
    headers: {
      Accept: "application/json",
      Referer: "https://www.hkemobility.gov.hk/en/",
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from hkemobility.gov.hk`)
  }
  return response.json() as Promise<unknown>
}
