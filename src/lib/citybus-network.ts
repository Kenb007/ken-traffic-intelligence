import networkFile from "../../data/citybus-network.json"

type StopRecord = { tc: string; en: string; lng: number; lat: number; routes: string[] }
type NetworkFile = { stops: Record<string, StopRecord> }

export type CitybusStopPoint = { id: string; lng: number; lat: number; routes: string[] }

const network = networkFile as NetworkFile

const stopList: CitybusStopPoint[] = []
for (const [id, stop] of Object.entries(network.stops)) {
  stopList.push({ id, lng: stop.lng, lat: stop.lat, routes: stop.routes })
}

export function citybusStop(id: string): StopRecord | null {
  return network.stops[id] ?? null
}

export function nearestCitybusStops(lng: number, lat: number, limit: number): CitybusStopPoint[] {
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
