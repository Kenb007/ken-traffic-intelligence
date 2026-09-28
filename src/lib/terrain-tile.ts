import { PNG } from "pngjs"

// Hong Kong land in these tiles is the SRTM radar surface measured in February 2000.
// Tai Mo Shan, the highest ground, is 957 m, and real steps in a tile stay under 60 m.
// A few pixels are voids: Sha Tin town contains a 2,436 m spike beside a -655 m hole.
const MIN_HEIGHT_M = -30
const MAX_HEIGHT_M = 980
const MAX_STEP_M = 70

export function repairTerrariumPng(bytes: Buffer): Buffer {
  const png = PNG.sync.read(bytes)
  const width = png.width
  const height = png.height
  const count = width * height
  const meters = new Float64Array(count)
  for (let index = 0; index < count; index += 1) {
    const offset = index * 4
    const red = png.data[offset] ?? 0
    const green = png.data[offset + 1] ?? 0
    const blue = png.data[offset + 2] ?? 0
    meters[index] = red * 256 + green + blue / 256 - 32768
  }

  const bad = markBadPixels(meters, width, height)
  fillBadPixels(meters, bad, width, height)
  writeTerrarium(png, meters)
  return PNG.sync.write(png)
}

function markBadPixels(meters: Float64Array, width: number, height: number): Uint8Array {
  const count = width * height
  const bad = new Uint8Array(count)
  for (let index = 0; index < count; index += 1) {
    const value = meters[index] ?? 0
    if (value < MIN_HEIGHT_M || value > MAX_HEIGHT_M) bad[index] = 1
  }
  let changed = true
  while (changed) {
    changed = false
    const next = bad.slice()
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x
        if (bad[index]) continue
        const samples: number[] = []
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            const neighbor = ny * width + nx
            if (bad[neighbor]) continue
            samples.push(meters[neighbor] ?? 0)
          }
        }
        if (samples.length < 4) continue
        const value = meters[index] ?? 0
        if (Math.abs(value - median(samples)) > MAX_STEP_M) {
          next[index] = 1
          changed = true
        }
      }
    }
    bad.set(next)
  }
  return bad
}

function fillBadPixels(meters: Float64Array, bad: Uint8Array, width: number, height: number) {
  for (let pass = 0; pass < 8; pass += 1) {
    const next = Float64Array.from(meters)
    const cleared: number[] = []
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x
        if (!bad[index]) continue
        const samples: number[] = []
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            const neighbor = ny * width + nx
            if (bad[neighbor]) continue
            samples.push(meters[neighbor] ?? 0)
          }
        }
        if (samples.length === 0) continue
        next[index] = median(samples)
        cleared.push(index)
      }
    }
    if (cleared.length === 0) break
    meters.set(next)
    for (const index of cleared) bad[index] = 0
  }
  for (let index = 0; index < meters.length; index += 1) {
    if (!bad[index]) continue
    meters[index] = 0
  }
}

function writeTerrarium(png: PNG, meters: Float64Array) {
  for (let index = 0; index < meters.length; index += 1) {
    const shifted = (meters[index] ?? 0) + 32768
    const red = Math.floor(shifted / 256)
    const rest = shifted - red * 256
    const green = Math.floor(rest)
    let blue = Math.round((rest - green) * 256)
    if (blue === 256) blue = 255
    const offset = index * 4
    png.data[offset] = clampByte(red)
    png.data[offset + 1] = clampByte(green)
    png.data[offset + 2] = clampByte(blue)
    png.data[offset + 3] = 255
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function clampByte(value: number): number {
  if (value < 0) return 0
  if (value > 255) return 255
  return value
}
