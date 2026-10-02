import networkFile from "../../data/kmb-network.json"
import { nearestPoints } from "@/lib/nearest"

type StopRecord = { tc: string; en: string; lng: number; lat: number }
type NetworkFile = { stops: Record<string, StopRecord> }

export type KmbStopPoint = { id: string; lng: number; lat: number }

const network = networkFile as NetworkFile

const stopList: KmbStopPoint[] = []
for (const [id, stop] of Object.entries(network.stops)) {
  stopList.push({ id, lng: stop.lng, lat: stop.lat })
}

export function kmbStop(id: string): StopRecord | null {
  return network.stops[id] ?? null
}

export function nearestKmbStops(lng: number, lat: number, limit: number): KmbStopPoint[] {
  return nearestPoints(stopList, lng, lat, limit)
}
