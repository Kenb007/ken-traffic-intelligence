import type { SpeedBand } from "@/lib/types"

/** Display bands for this dashboard. Not an official Transport Department legend. */
export function bandForSpeed(speedKmh: number | null): SpeedBand {
  if (speedKmh == null || Number.isNaN(speedKmh)) return "unknown"
  if (speedKmh < 30) return "congested"
  if (speedKmh < 50) return "slow"
  return "free"
}

export function bandLabel(band: SpeedBand): string {
  switch (band) {
    case "free":
      return "Free-flow"
    case "slow":
      return "Slow"
    case "congested":
      return "Congested"
    case "unknown":
      return "No reading"
    default: {
      const exhaustive: never = band
      return exhaustive
    }
  }
}

export function formatSpeed(speedKmh: number | null): string {
  if (speedKmh == null || Number.isNaN(speedKmh)) return "—"
  return `${Math.round(speedKmh)} km/h`
}
