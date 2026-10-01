import networkFile from "../../data/kmb-network.json"

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
