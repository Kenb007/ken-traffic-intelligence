import type { SpeedBand } from "@/lib/types"

/** Official Transport Department saturation on the live speed lines. */
export function bandForSaturation(level: string | null | undefined): SpeedBand | null {
  switch (level) {
    case "TRAFFIC GOOD":
      return "free"
    case "TRAFFIC AVERAGE":
      return "slow"
    case "TRAFFIC BAD":
      return "congested"
    default:
      return null
  }
}

/** Speed bands used only where the official saturation class is missing. */
export function bandForSpeed(speedKmh: number | null): SpeedBand {
  if (speedKmh == null || Number.isNaN(speedKmh)) return "unknown"
  if (speedKmh < 30) return "congested"
  if (speedKmh < 50) return "slow"
  return "free"
}

export function bandLabel(band: SpeedBand): string {
  switch (band) {
    case "free":
      return "Good"
    case "slow":
      return "Average"
    case "congested":
      return "Bad"
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
