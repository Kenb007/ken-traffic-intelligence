import { request as httpsRequest } from "node:https"
import { inflateSync } from "node:zlib"
import { tileLngLatBounds } from "@/lib/web-mercator"

export const dynamic = "force-dynamic"

const REFERER = "https://www.hkemobility.gov.hk/en/"
const TILE_TTL_MS = 20_000
const CLEAR_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  ),
)

const tiles = new Map<string, { expires: number; bytes: Uint8Array }>()

export async function GET(
  _request: Request,
  context: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await context.params
  const zN = Number(z)
  const xN = Number(x)
  const yN = Number(y.replace(/\.png$/i, ""))
  if (!Number.isInteger(zN) || zN < 0 || zN > 18) {
    return new Response("Tile zoom out of range", { status: 400 })
  }
  const limit = 2 ** zN
  if (!Number.isInteger(xN) || !Number.isInteger(yN) || xN < 0 || yN < 0 || xN >= limit || yN >= limit) {
    return new Response("Tile index out of range", { status: 400 })
  }

  const key = `${zN}/${xN}/${yN}`
  const cached = tiles.get(key)
  if (cached && cached.expires > Date.now()) {
    return png(cached.bytes)
  }

  const bytes = await speedTile(zN, xN, yN)
  if (!bytes) return png(CLEAR_PNG)
  if (hasInk(bytes)) remember(key, bytes)
  return png(bytes)
}

async function speedTile(zoom: number, x: number, y: number): Promise<Uint8Array | null> {
  // SPEED_MAP is blank in EPSG:3857. WMS 1.3.0 expects EPSG:4326 with latitude first.
  // The same bbox sometimes comes back fully transparent, so a blank image is tried again.
  const bounds = tileLngLatBounds(zoom, x, y)
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
  const path = [
    "/api/drss/layer/map?service=WMS",
    "version=1.3.0",
    "request=GetMap",
    "layers=DRSS:SPEED_MAP",
    "styles=",
    `bbox=${bbox}`,
    "width=256",
    "height=256",
    "crs=EPSG:4326",
    "format=image/png",
    "transparent=true",
  ].join("&")

  let blank: Uint8Array | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const bytes = await readPng(path)
    if (!bytes) continue
    if (hasInk(bytes)) return bytes
    blank = bytes
  }
  return blank
}

function readPng(path: string): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const req = httpsRequest(
      {
        hostname: "www.hkemobility.gov.hk",
        path,
        method: "GET",
        timeout: 20_000,
        headers: {
          Referer: REFERER,
          Accept: "image/png",
          "User-Agent": "Mozilla/5.0",
        },
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on("data", (chunk: Buffer) => {
          chunks.push(chunk)
        })
        response.on("end", () => {
          const type = String(response.headers["content-type"] ?? "")
          if (response.statusCode !== 200 || !type.includes("image/png")) {
            resolve(null)
            return
          }
          const bytes = new Uint8Array(Buffer.concat(chunks))
          resolve(isPng(bytes) ? bytes : null)
        })
      },
    )
    req.on("error", () => resolve(null))
    req.on("timeout", () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

function remember(key: string, bytes: Uint8Array) {
  if (tiles.size > 400) {
    const oldest = tiles.keys().next().value
    if (oldest) tiles.delete(oldest)
  }
  tiles.set(key, { expires: Date.now() + TILE_TTL_MS, bytes })
}

function png(bytes: Uint8Array): Response {
  const body = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(body).set(bytes)
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=20",
    },
  })
}

function isPng(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
}

function hasInk(bytes: Uint8Array): boolean {
  try {
    const image = decodeRgba(bytes)
    if (!image) return true
    for (let index = 3; index < image.length; index += 4) {
      if ((image[index] ?? 0) > 10) return true
    }
    return false
  } catch {
    return true
  }
}

function decodeRgba(bytes: Uint8Array): Uint8Array | null {
  let width = 0
  let height = 0
  let colorType = -1
  const idat: Buffer[] = []
  let offset = 8
  while (offset + 8 <= bytes.length) {
    const length = readUint32(bytes, offset)
    const type = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString("ascii")
    const start = offset + 8
    const end = start + length
    if (end + 4 > bytes.length) return null
    if (type === "IHDR") {
      width = readUint32(bytes, start)
      height = readUint32(bytes, start + 4)
      colorType = bytes[start + 9] ?? -1
      if (bytes[start + 8] !== 8 || colorType !== 6 || width !== 256 || height !== 256) return null
    } else if (type === "IDAT") {
      idat.push(Buffer.from(bytes.subarray(start, end)))
    } else if (type === "IEND") {
      break
    }
    offset = end + 4
  }
  if (width !== 256 || idat.length === 0) return null
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * 4
  const pixels = new Uint8Array(width * height * 4)
  let source = 0
  const previous = new Uint8Array(stride)
  for (let row = 0; row < height; row += 1) {
    const filter = raw[source] ?? 0
    source += 1
    const current = raw.subarray(source, source + stride)
    source += stride
    const out = pixels.subarray(row * stride, (row + 1) * stride)
    for (let column = 0; column < stride; column += 1) {
      const left = column >= 4 ? (out[column - 4] ?? 0) : 0
      const up = previous[column] ?? 0
      const upLeft = column >= 4 ? (previous[column - 4] ?? 0) : 0
      const value = current[column] ?? 0
      out[column] = (value + predictor(filter, left, up, upLeft)) & 255
    }
    previous.set(out)
  }
  return pixels
}

function predictor(filter: number, left: number, up: number, upLeft: number): number {
  switch (filter) {
    case 0:
      return 0
    case 1:
      return left
    case 2:
      return up
    case 3:
      return Math.floor((left + up) / 2)
    case 4: {
      const estimate = left + up - upLeft
      const leftDistance = Math.abs(estimate - left)
      const upDistance = Math.abs(estimate - up)
      const upLeftDistance = Math.abs(estimate - upLeft)
      if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left
      if (upDistance <= upLeftDistance) return up
      return upLeft
    }
    default:
      return 0
  }
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  ) >>> 0
}
