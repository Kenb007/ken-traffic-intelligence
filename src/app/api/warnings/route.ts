import { EMPTY_CONDITIONS, parseConditions, parseWarnsum } from "@/lib/warnings"
import type { WarningsResponse, WeatherConditions } from "@/lib/types"

export const dynamic = "force-dynamic"

const WARNSUM_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en"
const CONDITIONS_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en"

export async function GET() {
  const [warningsResult, conditionsResult] = await Promise.allSettled([readJson(WARNSUM_URL), readJson(CONDITIONS_URL)])
  const warnings = warningsResult.status === "fulfilled" ? parseWarnsum(warningsResult.value) : []
  const conditions = conditionsResult.status === "fulfilled" ? parseConditions(conditionsResult.value) : EMPTY_CONDITIONS
  const error = feedError(warningsResult, conditionsResult, conditions)
  const body: WarningsResponse = {
    ok: error == null,
    error,
    observedAt: new Date().toISOString(),
    warnings,
    conditions,
  }
  return Response.json(body, { status: error && warnings.length === 0 && conditions.temperatureC == null ? 502 : 200 })
}

function feedError(
  warningsResult: PromiseSettledResult<unknown>,
  conditionsResult: PromiseSettledResult<unknown>,
  conditions: WeatherConditions,
): string | undefined {
  if (warningsResult.status === "rejected" && conditionsResult.status === "rejected") {
    return warningsResult.reason instanceof Error ? warningsResult.reason.message : "Weather warnings failed"
  }
  if (warningsResult.status === "rejected") {
    return warningsResult.reason instanceof Error ? warningsResult.reason.message : "Weather warnings failed"
  }
  if (conditions.temperatureC == null && conditions.rainfallMm == null && conditionsResult.status === "rejected") {
    return conditionsResult.reason instanceof Error ? conditionsResult.reason.message : "Current weather failed"
  }
  return undefined
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: { Accept: "application/json" },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} from the Observatory`)
  return response.json() as Promise<unknown>
}
