import { loadKmbNear } from "@/lib/kmb-feed"
import type { KmbResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

const FRESH_MS = 30_000

const pending = new Map<string, Promise<KmbResponse>>()
const cached = new Map<string, { at: number; body: KmbResponse }>()

export async function GET(request: Request) {
  const url = new URL(request.url)
  const lng = Number(url.searchParams.get("lng"))
  const lat = Number(url.searchParams.get("lat"))
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    const body: KmbResponse = { ok: false, error: "KMB centre missing", observedAt: null, stops: [], buses: [] }
    return Response.json(body, { status: 400 })
  }
  const key = `${lng.toFixed(3)},${lat.toFixed(3)}`
  const now = Date.now()
  const hit = cached.get(key)
  if (hit && now - hit.at < FRESH_MS) return Response.json(hit.body)
  const current = pending.get(key) ?? loadKmbNear(lng, lat, now).finally(() => pending.delete(key))
  pending.set(key, current)
  try {
    const body = await current
    if (body.ok) cached.set(key, { at: Date.now(), body })
    else if (hit) return Response.json(hit.body)
    return Response.json(body, { status: body.ok ? 200 : 502 })
  } catch (error) {
    if (hit) return Response.json(hit.body)
    const body: KmbResponse = {
      ok: false,
      error: error instanceof Error ? error.message : "KMB arrivals failed",
      observedAt: null,
      stops: [],
      buses: [],
    }
    return Response.json(body, { status: 502 })
  }
}
