// Builds data/kmb-network.json from the public KMB/LWB list.
// Run: node scripts/build-kmb-network.mjs

import { writeFile } from "node:fs/promises"

const ROOT = "https://data.etabus.gov.hk/v1/transport/kmb"
const HEADERS = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; HKTrafficIntelligence/1.0; +https://hktraffic.keith-li.workers.dev)",
}

async function load(path) {
  const response = await fetch(`${ROOT}/${path}`, { headers: HEADERS })
  if (!response.ok) throw new Error(`${path} ${response.status}`)
  const body = await response.json()
  if (!Array.isArray(body.data)) throw new Error(`${path} has no data`)
  return body.data
}

const [routeRows, stopRows, visitRows] = await Promise.all([
  load("route"),
  load("stop"),
  load("route-stop"),
])

const stops = {}
for (const row of stopRows) {
  const lng = Number(row.long)
  const lat = Number(row.lat)
  if (!row.stop || !Number.isFinite(lng) || !Number.isFinite(lat)) continue
  stops[row.stop] = {
    tc: String(row.name_tc ?? "").trim(),
    en: String(row.name_en ?? "").trim(),
    lng,
    lat,
  }
}

const routeNames = new Map()
for (const row of routeRows) {
  routeNames.set(`${row.route}|${row.bound}|${row.service_type}`, row)
}

const grouped = new Map()
for (const row of visitRows) {
  if (!stops[row.stop]) continue
  const key = `${row.route}|${row.bound}|${row.service_type}`
  const seq = Number(row.seq)
  if (!Number.isFinite(seq)) continue
  const list = grouped.get(key) ?? []
  list.push({ seq, stop: row.stop })
  grouped.set(key, list)
}

const variants = []
for (const [key, list] of grouped) {
  const names = routeNames.get(key)
  if (!names) continue
  list.sort((a, b) => a.seq - b.seq)
  const ordered = []
  for (const item of list) {
    if (ordered[ordered.length - 1] !== item.stop) ordered.push(item.stop)
  }
  if (ordered.length === 0) continue
  variants.push({
    route: String(names.route),
    bound: names.bound === "I" ? "I" : "O",
    service: String(names.service_type),
    origTc: String(names.orig_tc ?? "").trim(),
    destTc: String(names.dest_tc ?? "").trim(),
    origEn: String(names.orig_en ?? "").trim(),
    destEn: String(names.dest_en ?? "").trim(),
    stops: ordered,
  })
}

variants.sort((a, b) => a.route.localeCompare(b.route) || a.bound.localeCompare(b.bound) || a.service.localeCompare(b.service))

const file = { stops, variants }
await writeFile(new URL("../data/kmb-network.json", import.meta.url), JSON.stringify(file))
console.log(`kmb network: ${Object.keys(stops).length} stops, ${variants.length} variants`)
