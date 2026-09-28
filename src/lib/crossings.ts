import type { ApproachPoint, HarbourJourney } from "@/lib/types"

const CODES = ["CH", "EH", "WH"] as const

export type CrossingCode = (typeof CODES)[number]

const LABEL: Record<CrossingCode, string> = {
  CH: "Cross Harbour",
  EH: "Eastern",
  WH: "Western",
}

export type CrossingBest = {
  code: CrossingCode
  label: string
  minutes: number
  from: string
  colour: HarbourJourney["colour"]
}

export function bestCrossings(points: ApproachPoint[]): CrossingBest[] {
  const found = new Map<CrossingCode, CrossingBest>()
  for (const point of points) {
    for (const leg of point.legs) {
      if (leg.minutes == null || !isCrossing(leg.code)) continue
      const current = found.get(leg.code)
      if (current && current.minutes <= leg.minutes) continue
      found.set(leg.code, {
        code: leg.code,
        label: LABEL[leg.code],
        minutes: leg.minutes,
        from: shortPlace(point.name),
        colour: leg.colour,
      })
    }
  }
  return CODES.flatMap((code) => {
    const row = found.get(code)
    return row ? [row] : []
  })
}

function isCrossing(code: string): code is CrossingCode {
  return code === "CH" || code === "EH" || code === "WH"
}

function shortPlace(name: string): string {
  const [road] = name.split(/\s+(?:east|west|north|south)bound\b/i)
  return road && road.length > 0 ? road : name
}
