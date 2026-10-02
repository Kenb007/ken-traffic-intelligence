type UpstreamBody = { status: number; body: ArrayBuffer; contentType: string }

type UpstreamOptions = {
  headers?: HeadersInit
  timeoutMs?: number
  bypassMemory?: boolean
}

export let lastCacheOutcome = "none"

const memory = new Map<string, { expires: number; body: UpstreamBody }>()
const pending = new Map<string, Promise<UpstreamBody>>()

export async function fetchUpstream(url: string, ttlMs: number, options: UpstreamOptions = {}): Promise<UpstreamBody> {
  if (!options.bypassMemory) {
    const fresh = memory.get(url)
    if (fresh && fresh.expires > Date.now()) {
      lastCacheOutcome = "memory"
      return fresh.body
    }
  }
  const current = pending.get(url)
  if (current) return current
  const task = readThrough(url, ttlMs, options).finally(() => pending.delete(url))
  pending.set(url, task)
  return task
}

async function readThrough(url: string, ttlMs: number, options: UpstreamOptions): Promise<UpstreamBody> {
  const shared = await readShared(url, ttlMs)
  if (shared) {
    lastCacheOutcome = "hit"
    return shared
  }

  const seconds = Math.max(1, Math.round(ttlMs / 1000))
  let response: Response
  try {
    // vinext's fetch adds cache: no-store inside force-dynamic routes, and
    // Cloudflare rejects cacheTtl together with no-store. The saved fetch is
    // the one that can keep the response.
    response = await rawFetch()(url, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 25_000),
      headers: options.headers,
      cf: {
        cacheEverything: true,
        cacheTtl: seconds,
        cacheTtlByStatus: { "200-299": seconds, "300-599": 0 },
      },
    } as RequestInit)
    lastCacheOutcome = "stored"
  } catch {
    lastCacheOutcome = "fetched"
    response = await rawFetch()(url, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 25_000),
      headers: options.headers,
    })
  }

  const contentType = response.headers.get("content-type") ?? ""
  const bytes = await response.arrayBuffer()
  const body: UpstreamBody = { status: response.status, body: bytes, contentType }
  if (response.ok) {
    memory.set(url, { expires: Date.now() + ttlMs, body })
    await writeShared(url, ttlMs, body)
  }
  return body
}

async function readShared(url: string, ttlMs: number): Promise<UpstreamBody | null> {
  const cache = await openCache()
  if (!cache) return null
  try {
    const cached = await cache.match(new Request(url))
    if (!cached?.ok) return null
    return remember(url, ttlMs, cached)
  } catch {
    return null
  }
}

async function writeShared(url: string, ttlMs: number, body: UpstreamBody): Promise<void> {
  const cache = await openCache()
  if (!cache) {
    if (lastCacheOutcome === "stored") lastCacheOutcome = "stored-no-cache-api"
    return
  }
  const seconds = Math.max(1, Math.round(ttlMs / 1000))
  try {
    await cache.put(
      new Request(url),
      new Response(body.body.slice(0), {
        status: 200,
        headers: {
          "Content-Type": body.contentType,
          "Cache-Control": `public, max-age=${seconds}`,
        },
      }),
    )
    if (lastCacheOutcome === "stored") lastCacheOutcome = "stored+cache-api"
  } catch {
    lastCacheOutcome = `${lastCacheOutcome}; put-failed`
    // A rejected write must not fail the feed. The caller already has the body.
  }
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

async function openCache(): Promise<Cache | null> {
  const storage = globalThis.caches as (CacheStorage & { default?: Cache }) | undefined
  if (!storage) return null
  if (storage.default) return storage.default
  try {
    return await storage.open("hktraffic-feeds")
  } catch {
    return null
  }
}

function rawFetch(): typeof fetch {
  const saved = (globalThis as unknown as Record<symbol, typeof fetch | undefined>)[
    Symbol.for("vinext.fetchCache.originalFetch")
  ]
  return typeof saved === "function" ? saved : globalThis.fetch
}
