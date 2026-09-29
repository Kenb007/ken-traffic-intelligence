import type { WeatherWarning } from "@/lib/types"

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

export function warningGlance(warnings: WeatherWarning[]): { label: string; tone: "red" | "amber" } | null {
  const first = warnings[0]
  if (!first) return null
  const extra = warnings.length - 1
  return {
    label: extra > 0 ? `${first.shortName} +${extra}` : first.shortName,
    tone: first.tone,
  }
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
