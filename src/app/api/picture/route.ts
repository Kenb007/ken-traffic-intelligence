import { camerasFromWfs, tollsFromWfs, worksFromWfs } from "@/lib/picture"
import type { PictureResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

const REFERER = "https://www.hkemobility.gov.hk/en/"

let cache: { expires: number; body: PictureResponse } | null = null

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return Response.json(cache.body)
  }

  const [camerasResult, worksResult, tollsResult] = await Promise.all([
    loadLayer("DRSS:VW_SNAPSHOT_IMAGE_EN", camerasFromWfs),
    loadLayer("DRSS:VW_ROAD_WORK_EN", worksFromWfs),
    loadLayer("DRSS:DRSS_TOLL_POINT", tollsFromWfs),
  ])

  const errors = [camerasResult.error, worksResult.error, tollsResult.error].filter(
    (error): error is string => Boolean(error),
  )
  const featureCount =
    camerasResult.features.features.length +
    worksResult.features.features.length +
    tollsResult.features.features.length
  const body: PictureResponse = {
    ok: featureCount > 0 || errors.length === 0,
    error: errors.length > 0 ? errors.join(" ") : undefined,
    cameras: camerasResult.features,
    works: worksResult.features,
    tolls: tollsResult.features,
  }
  cache = { expires: Date.now() + (body.ok ? 30_000 : 10_000), body }
  return Response.json(body, { status: body.ok ? 200 : 502 })
}

async function loadLayer(
  typeName: string,
  read: (wfs: unknown) => GeoJSON.FeatureCollection,
): Promise<{ features: GeoJSON.FeatureCollection; error?: string }> {
  try {
    const wfs = await readJson(wfsUrl(typeName))
    return { features: read(wfs) }
  } catch (error) {
    return {
      features: { type: "FeatureCollection", features: [] },
      error: error instanceof Error ? error.message : `${typeName} failed`,
    }
  }
}

function wfsUrl(typeName: string): string {
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
  })
  return `https://www.hkemobility.gov.hk/api/drss/layer/map?${params}`
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: "application/json",
      Referer: REFERER,
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from hkemobility.gov.hk`)
  }
  return response.json() as Promise<unknown>
}
