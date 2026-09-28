const memory = new Map<string, { expires: number; value: string }>()

export async function fetchText(url: string, ttlMs: number): Promise<string> {
  const cached = memory.get(url)
  if (cached && cached.expires > Date.now()) return cached.value

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
    headers: { Accept: "application/xml, text/xml, text/csv, application/json, */*" },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${hostOf(url)}`)
  }
  const value = await response.text()
  memory.set(url, { expires: Date.now() + ttlMs, value })
  return value
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
