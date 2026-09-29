import type { WeatherConditions, WeatherWarning } from "@/lib/types"

export const EMPTY_CONDITIONS: WeatherConditions = {
  temperatureC: null,
  rainfallMm: null,
  rainfallPlace: "",
}

const SHORT_NAME: Record<string, string> = {
  WFIRE: "Fire",
  WFROST: "Frost",
  WHOT: "Very hot",
  WCOLD: "Cold",
  WMSGNL: "Monsoon",
  WRAIN: "Rainstorm",
  WFNTSA: "Flooding",
  WL: "Landslip",
  WTCSGNL: "Cyclone",
  WTMW: "Tsunami",
  WTS: "Thunderstorm",
}

export function parseWarnsum(payload: unknown): WeatherWarning[] {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Weather warnings were not in the published shape")
  }
  const warnings: WeatherWarning[] = []
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value !== "object" || value === null) continue
    const row = value as Record<string, unknown>
    const action = text(row.actionCode)
    const code = text(row.code) || key
    if (action === "CANCEL" || code === "CANCEL") continue
    const name = text(row.name) || SHORT_NAME[key] || "Weather warning"
    const type = text(row.type)
    const rank = classify(code)
    warnings.push({
      id: `weather-${key}-${code}`,
      code,
      name,
      shortName: shortName(key, code, type),
      detail: detailOf(type, text(row.updateTime) || text(row.issueTime)),
      tone: rank.tone,
      urgent: rank.urgent,
      score: rank.score,
    })
  }
  warnings.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  return warnings
}

export function parseConditions(payload: unknown): WeatherConditions {
  if (!isRecord(payload)) throw new Error("Current weather was not in the published shape")
  const temperatures = rowsOf(payload.temperature)
  const observatory = temperatures.find((row) => /observatory/i.test(text(row.place))) ?? temperatures[0]
  const temperatureC = numberOf(observatory?.value)
  let rainfallMm: number | null = null
  let rainfallPlace = ""
  for (const row of rowsOf(payload.rainfall)) {
    const max = numberOf(row.max)
    if (max == null) continue
    if (rainfallMm == null || max > rainfallMm) {
      rainfallMm = max
      rainfallPlace = text(row.place)
    }
  }
  return { temperatureC, rainfallMm, rainfallPlace }
}

export function weatherBar(
  warnings: WeatherWarning[],
  conditions: WeatherConditions | null,
): { label: string; tone: "red" | "amber" | "green" } | null {
  const first = warnings[0]
  if (first) {
    const second = warnings[1]
    const extra = warnings.length - (second ? 2 : 1)
    const names = second ? `${first.shortName} · ${second.shortName}` : first.shortName
    return {
      label: extra > 0 ? `${first.shortName} +${warnings.length - 1}` : names,
      tone: first.tone,
    }
  }
  if (!conditions || (conditions.temperatureC == null && conditions.rainfallMm == null)) return null
  const temperature = conditions.temperatureC == null ? "" : `${Math.round(conditions.temperatureC)}°C`
  const rain = conditions.rainfallMm == null ? "" : conditions.rainfallMm > 0 ? `${conditions.rainfallMm} mm` : "Dry"
  const wet = conditions.rainfallMm != null && conditions.rainfallMm >= 10
  const hot = conditions.temperatureC != null && conditions.temperatureC >= 33
  return { label: [temperature, rain].filter(Boolean).join(" · "), tone: wet || hot ? "amber" : "green" }
}

function shortName(key: string, code: string, type: string): string {
  if (key === "WTCSGNL") return cycloneShort(code)
  if (key === "WRAIN" && type) return `${type} rain`
  if (key === "WFIRE" && type) return `${type} fire`
  return SHORT_NAME[key] ?? "Warning"
}

function cycloneShort(code: string): string {
  if (code.startsWith("TC8")) return "Signal 8"
  if (code === "TC9") return "Signal 9"
  if (code === "TC10") return "Signal 10"
  if (code === "TC3") return "Signal 3"
  if (code === "TC1") return "Signal 1"
  return "Cyclone"
}

function classify(code: string): { tone: "red" | "amber"; urgent: boolean; score: number } {
  if (code.startsWith("TC8") || code === "TC9" || code === "TC10" || code === "WRAINB" || code === "WTMW") {
    return { tone: "red", urgent: true, score: 900_000 }
  }
  if (code === "WRAINR" || code === "TC3" || code === "WL" || code === "WFNTSA") {
    return { tone: "red", urgent: true, score: 720_000 }
  }
  if (code === "WRAINA" || code === "WTS" || code === "WMSGNL" || code === "WFIRER" || code === "TC1") {
    return { tone: "amber", urgent: false, score: 260_000 }
  }
  if (code === "WHOT" || code === "WCOLD" || code === "WFROST" || code === "WFIREY") {
    return { tone: "amber", urgent: false, score: 90_000 }
  }
  return { tone: "amber", urgent: false, score: 200_000 }
}

function detailOf(type: string, iso: string): string {
  const clock = clockOf(iso)
  const when = clock ? `updated ${clock}` : ""
  const detail = [type, when].filter(Boolean).join(" · ")
  return detail || "In force"
}

function clockOf(iso: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date)
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function rowsOf(value: unknown): Record<string, unknown>[] {
  if (!isRecord(value) || !Array.isArray(value.data)) return []
  return value.data.flatMap((row) => (isRecord(row) ? [row] : []))
}

function numberOf(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}
