import { parseWarnsum } from "@/lib/warnings"
import type { WarningsResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

const WARNSUM_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en"

export async function GET() {
  try {
    const response = await fetch(WARNSUM_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "application/json" },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status} from the Observatory`)
    const payload: unknown = await response.json()
    const body: WarningsResponse = {
      ok: true,
      observedAt: new Date().toISOString(),
      warnings: parseWarnsum(payload),
    }
    return Response.json(body)
  } catch (error) {
    const body: WarningsResponse = {
      ok: false,
      error: error instanceof Error ? error.message : "Weather warnings failed",
      observedAt: null,
      warnings: [],
    }
    return Response.json(body, { status: 502 })
  }
}
