import stationsFile from "../../data/light-rail-stations.json"

export type LrtStation = { id: string; tc: string; en: string; lng: number; lat: number }

type File = { stations: LrtStation[] }

const stations = (stationsFile as File).stations

// About 1.2 km. Stops farther than this are left alone so a view of Hong Kong Island does not call the Light Rail feed.
const NEAR_LIMIT = 0.00018

export function nearestLrtStations(lng: number, lat: number, limit: number): LrtStation[] {
  const cos = Math.cos((lat * Math.PI) / 180)
  const ranked = stations
    .map((station) => {
      const x = (station.lng - lng) * cos
      const y = station.lat - lat
      return { station, distance: x * x + y * y }
    })
    .sort((a, b) => a.distance - b.distance)
  const nearest = ranked[0]
  if (!nearest || nearest.distance > NEAR_LIMIT) return []
  return ranked.slice(0, limit).map((item) => item.station)
}
