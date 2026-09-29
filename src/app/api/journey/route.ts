import { fetchText } from "@/lib/fetch-text"
import type { HarbourJourney, JourneyResponse, JtisSummary, TdasJourney } from "@/lib/types"

export const dynamic = "force-dynamic"

const TDAS_URL = "https://tdas-api.hkemobility.gov.hk/tdas/api/route"
const JTIS_URL = "https://resource.data.one.gov.hk/td/jss/Journeytimev2.xml"

const TDAS_BODY = {
  start: { lat: 22.287826, long: 114.204979 },
  end: { lat: 22.342032, long: 114.154581 },
  departIn: 0,
  lang: "en",
  type: "ST",
}

const FROM: Record<string, string> = {
  H1: "告士打道 Gloucester Road",
  H2: "堅拿道天橋 Canal Road Flyover",
  H11: "東區走廊 Island Eastern Corridor",
}

const TO: Record<string, string> = {
  CH: "紅磡海底隧道 Cross-Harbour Tunnel",
  EH: "東區海底隧道 Eastern Harbour Crossing",
  WH: "西區海底隧道 Western Harbour Crossing",
}

const TUNNELS: Record<string, string> = {
  cht: "Cross-Harbour Tunnel",
  eht: "Eastern Harbour Crossing",
  wht: "Western Harbour Crossing",
}

export async function GET() {
  const [tdas, jtis] = await Promise.all([loadTdas(), loadJtis()])
  const body: JourneyResponse = { tdas, jtis }
  return Response.json(body)
}

async function loadTdas(): Promise<TdasJourney> {
  try {
    const response = await fetch(TDAS_URL, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(40_000),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(TDAS_BODY),
    })
    const payload: unknown = await response.json()
    if (!response.ok) {
      return failedTdas(messageFrom(payload) || `HTTP ${response.status} from TDAS`)
    }
    if (!isRecord(payload) || typeof payload.eta !== "string") {
      return failedTdas(messageFrom(payload) || "TDAS returned an unexpected payload")
    }
    const tunnel = payload.wht
      ? TUNNELS.wht
      : payload.cht
        ? TUNNELS.cht
        : payload.eht
          ? TUNNELS.eht
          : "No cross-harbour tunnel"
    const alternates = Array.isArray(payload.ar)
      ? payload.ar.flatMap((item) => {
          if (!isRecord(item)) return []
          const code = typeof item.name === "string" ? item.name : ""
          return [
            {
              tunnel: TUNNELS[code] ?? code,
              distance: typeof item.distU === "string" ? item.distU : "",
              eta: typeof item.eta === "string" ? item.eta : "",
            },
          ]
        })
      : []
    return {
      ok: true,
      speedText: typeof payload.jSpeed === "string" ? payload.jSpeed : null,
      eta: payload.eta,
      distance: typeof payload.distU === "string" ? payload.distU : null,
      tunnel: tunnel ?? null,
      alternates,
    }
  } catch (error) {
    return failedTdas(error instanceof Error ? error.message : "TDAS request failed")
  }
}

async function loadJtis(): Promise<JtisSummary> {
  try {
    const xml = await fetchText(JTIS_URL, 50_000)
    return parseJtis(xml)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Journey time indicators failed",
      capturedAt: null,
      red: 0,
      amber: 0,
      green: 0,
      other: 0,
      harbour: [],
    }
  }
}

function parseJtis(xml: string): JtisSummary {
  const summary: JtisSummary = {
    ok: true,
    capturedAt: null,
    red: 0,
    amber: 0,
    green: 0,
    other: 0,
    harbour: [],
  }
  for (const block of xml.split("<jtis_journey_time>").slice(1)) {
    const captured = block.match(/<CAPTURE_DATE>([^<]*)<\/CAPTURE_DATE>/)?.[1]
    if (captured && !summary.capturedAt) summary.capturedAt = captured
    const type = block.match(/<JOURNEY_TYPE>([^<]*)<\/JOURNEY_TYPE>/)?.[1]
    const colour = colourOf(block.match(/<COLOUR_ID>([^<]*)<\/COLOUR_ID>/)?.[1] ?? "")
    if (type === "1") {
      switch (colour) {
        case "red":
          summary.red += 1
          break
        case "amber":
          summary.amber += 1
          break
        case "green":
          summary.green += 1
          break
        case "none":
          summary.other += 1
          break
        default: {
          const exhaustive: never = colour
          return exhaustive
        }
      }
    }
    const fromId = block.match(/<LOCATION_ID>([^<]*)<\/LOCATION_ID>/)?.[1] ?? ""
    const toId = block.match(/<DESTINATION_ID>([^<]*)<\/DESTINATION_ID>/)?.[1] ?? ""
    if (!FROM[fromId] || !TO[toId]) continue
    const minutesText = block.match(/<JOURNEY_DATA>([^<]*)<\/JOURNEY_DATA>/)?.[1] ?? ""
    const desc = block.match(/<JOURNEY_DESC>([^<]*)<\/JOURNEY_DESC>/)?.[1]?.trim() || null
    const minutes = type === "1" ? Number(minutesText) : null
    const row: HarbourJourney = {
      from: FROM[fromId] ?? fromId,
      to: TO[toId] ?? toId,
      minutes: minutes != null && Number.isFinite(minutes) && minutes >= 0 ? minutes : null,
      colour,
      note: type === "2" ? desc || bitmapNote(minutesText) : null,
    }
    summary.harbour.push(row)
  }
  return summary
}

function colourOf(code: string): HarbourJourney["colour"] {
  switch (code) {
    case "1":
      return "red"
    case "2":
      return "amber"
    case "3":
      return "green"
    default:
      return "none"
  }
}

function bitmapNote(code: string): string {
  switch (code) {
    case "1":
      return "Traffic congestion"
    case "3":
      return "Tunnel closed"
    case "4":
      return "Blank"
    default:
      return "Indicator not showing a minute count"
  }
}

function failedTdas(error: string): TdasJourney {
  return {
    ok: false,
    error,
    speedText: null,
    eta: null,
    distance: null,
    tunnel: null,
    alternates: [],
  }
}

function messageFrom(payload: unknown): string | null {
  if (isRecord(payload) && typeof payload.Message === "string") return payload.Message
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
