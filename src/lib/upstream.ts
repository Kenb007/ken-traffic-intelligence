type UpstreamBody = { status: number; body: ArrayBuffer; contentType: string }

type UpstreamOptions = {
  headers?: HeadersInit
  timeoutMs?: number
}

const memory = new Map<string, { expires: number; body: UpstreamBody }>()
const pending = new Map<string, Promise<UpstreamBody>>()

export async function fetchUpstream(url: string, ttlMs: number, options: UpstreamOptions = {}): Promise<UpstreamBody> {
  const fresh = memory.get(url)
  if (fresh && fresh.expires > Date.now()) return fresh.body
  const current = pending.get(url)
  if (current) return current
  const task = readThrough(url, ttlMs, options).finally(() => pending.delete(url))
  pending.set(url, task)
  return task
}

async function readThrough(url: string, ttlMs: number, options: UpstreamOptions): Promise<UpstreamBody> {
  const cache = edgeCache()
  const key = new Request(url)
  if (cache) {
    const cached = await cache.match(key)
    if (cached?.ok) {
      const body = await remember(url, ttlMs, cached)
      return body
    }
  }

  const seconds = Math.max(1, Math.round(ttlMs / 1000))
  const response = await fetch(url, {
    signal: AbortSignal.timeout(options.timeoutMs ?? 25_000),
    headers: options.headers,
    cf: { cacheEverything: true, cacheTtl: seconds },
  } as RequestInit)
  const contentType = response.headers.get("content-type") ?? ""
  const bytes = await response.arrayBuffer()
  const body: UpstreamBody = { status: response.status, body: bytes, contentType }
  if (response.ok) {
    memory.set(url, { expires: Date.now() + ttlMs, body })
    if (cache) {
      await cache.put(
        key,
        new Response(bytes.slice(0), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": `public, max-age=${seconds}`,
          },
        }),
      )
    }
  }
  return body
}

async function remember(url: string, ttlMs: number, response: Response): Promise<UpstreamBody> {
  const body: UpstreamBody = {
    status: response.status,
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "",
  }
  memory.set(url, { expires: Date.now() + ttlMs, body })
  return body
}

function edgeCache(): Cache | null {
  const storage = globalThis.caches as (CacheStorage & { default?: Cache }) | undefined
  return storage?.default ?? null
}
