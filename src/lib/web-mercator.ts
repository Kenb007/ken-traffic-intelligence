export type LngLatBounds = {
  west: number
  south: number
  east: number
  north: number
}

export function tileLngLatBounds(zoom: number, x: number, y: number): LngLatBounds {
  const scale = 2 ** zoom
  const west = (x / scale) * 360 - 180
  const east = ((x + 1) / scale) * 360 - 180
  const north = mercatorToLat(Math.PI * (1 - (2 * y) / scale))
  const south = mercatorToLat(Math.PI * (1 - (2 * (y + 1)) / scale))
  return { west, south, east, north }
}

function mercatorToLat(y: number): number {
  return (Math.atan(Math.sinh(y)) * 180) / Math.PI
}
