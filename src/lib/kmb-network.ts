import networkFile from "../../data/kmb-network.json"
import type { KmbStopPoint, KmbVariantPath } from "@/lib/kmb-estimate"

type StopRecord = { tc: string; en: string; lng: number; lat: number }
type VariantRecord = KmbVariantPath & { origTc: string; destTc: string; origEn: string; destEn: string }
type NetworkFile = { stops: Record<string, StopRecord>; variants: VariantRecord[] }

const network = networkFile as NetworkFile

const stopList: KmbStopPoint[] = []
for (const [id, stop] of Object.entries(network.stops)) {
  stopList.push({ id, lng: stop.lng, lat: stop.lat })
}

const variantsByStop = new Map<string, number[]>()
network.variants.forEach((variant, index) => {
  for (const stopId of variant.stops) {
    const list = variantsByStop.get(stopId) ?? []
    list.push(index)
    variantsByStop.set(stopId, list)
  }
})

export function kmbStop(id: string): StopRecord | null {
  return network.stops[id] ?? null
}

export function nearestKmbStops(lng: number, lat: number, limit: number): KmbStopPoint[] {
  const cos = Math.cos((lat * Math.PI) / 180)
  const ranked = stopList
    .map((stop) => {
      const x = (stop.lng - lng) * cos
      const y = stop.lat - lat
      return { stop, distance: x * x + y * y }
    })
    .sort((a, b) => a.distance - b.distance)
  return ranked.slice(0, limit).map((item) => item.stop)
}

export function variantsThrough(stopIds: string[]): KmbVariantPath[] {
  const seen = new Set<number>()
  const variants: KmbVariantPath[] = []
  for (const stopId of stopIds) {
    for (const index of variantsByStop.get(stopId) ?? []) {
      if (seen.has(index)) continue
      seen.add(index)
      const variant = network.variants[index]
      if (!variant) continue
      variants.push(variant)
    }
  }
  return variants
}
