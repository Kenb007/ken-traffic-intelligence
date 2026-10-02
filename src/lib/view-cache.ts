type OkBody = { ok: boolean }

export function viewCachedGet<T extends OkBody>(options: {
  freshMs: number
  load: (lng: number, lat: number, now: number) => Promise<T>
  missing: () => T
  failed: (error: unknown) => T
}): (request: Request) => Promise<Response> {
  const pending = new Map<string, Promise<T>>()
  const cached = new Map<string, { at: number; body: T }>()
  return async function GET(request: Request) {
    const url = new URL(request.url)
    const lng = Number(url.searchParams.get("lng"))
    const lat = Number(url.searchParams.get("lat"))
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return Response.json(options.missing(), { status: 400 })
    }
    const key = `${lng.toFixed(3)},${lat.toFixed(3)}`
    const now = Date.now()
    const hit = cached.get(key)
    if (hit && now - hit.at < options.freshMs) return Response.json(hit.body)
    const current = pending.get(key) ?? options.load(lng, lat, now).finally(() => pending.delete(key))
    pending.set(key, current)
    try {
      const body = await current
      if (body.ok) cached.set(key, { at: Date.now(), body })
      else if (hit) return Response.json(hit.body)
      return Response.json(body, { status: body.ok ? 200 : 502 })
    } catch (error) {
      if (hit) return Response.json(hit.body)
      return Response.json(options.failed(error), { status: 502 })
    }
  }
}
