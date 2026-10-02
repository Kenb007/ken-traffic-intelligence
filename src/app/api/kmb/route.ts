import { viewCachedGet } from "@/lib/view-cache"
import { loadKmbNear } from "@/lib/kmb-feed"
import type { KmbResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

const empty = (error: string): KmbResponse => ({ ok: false, error, observedAt: null, stops: [] })

export const GET = viewCachedGet({
  freshMs: 30_000,
  load: loadKmbNear,
  missing: () => empty("KMB centre missing"),
  failed: (error) => empty(error instanceof Error ? error.message : "KMB arrivals failed"),
})
