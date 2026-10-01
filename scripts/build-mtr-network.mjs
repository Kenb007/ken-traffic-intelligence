// Rebuilds data/mtr-network.json from two public sources:
// the MTR lines-and-stations file, and the Lands Department indoor station footprints.
// Run: node scripts/build-mtr-network.mjs

import { writeFile } from "node:fs/promises"

const LINES_URL = "https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv"
const VENUES_URL =
  "https://mapapi.hkmapservice.gov.hk/ogc/wfs/indoor/mtr_venue_polygon?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application/json"

const LINES = {
  AEL: ["Airport Express", "機場快綫", "#00888A"],
  DRL: ["Disneyland Resort Line", "迪士尼綫", "#F550A8"],
  EAL: ["East Rail Line", "東鐵綫", "#5EB6E4"],
  ISL: ["Island Line", "港島綫", "#007DC5"],
  KTL: ["Kwun Tong Line", "觀塘綫", "#00A651"],
  SIL: ["South Island Line", "南港島綫", "#BAC429"],
  TCL: ["Tung Chung Line", "東涌綫", "#F7943E"],
  TKL: ["Tseung Kwan O Line", "將軍澳綫", "#6B208B"],
  TML: ["Tuen Ma Line", "屯馬綫", "#9A3B26"],
  TWL: ["Tsuen Wan Line", "荃灣綫", "#E2231A"],
}

const response = await Promise.all([
  fetch(LINES_URL, { headers: { "User-Agent": "HKTrafficIntelligence/1.0" } }),
  fetch(VENUES_URL, { headers: { "User-Agent": "HKTrafficIntelligence/1.0" } }),
])
if (!response[0].ok || !response[1].ok) {
  throw new Error(`Download failed ${response[0].status} ${response[1].status}`)
}
const csv = await response[0].text()
const venues = await response[1].json()

const stations = new Map()
const routeRows = new Map()
for (const row of parseCsv(csv)) {
  const line = row["Line Code"]?.trim()
  const code = row["Station Code"]?.trim()
  const direction = row["Direction"]?.trim()
  if (!line || !code || !direction) continue
  stations.set(code, {
    en: row["English Name"].trim(),
    tc: row["Chinese Name"].normalize("NFKC").trim(),
  })
  const routeId = `${line}-${direction}`
  const list = routeRows.get(routeId) ?? []
  list.push({ line, code, sequence: Number(row["Sequence"]) })
  routeRows.set(routeId, list)
}

const byEnglish = new Map()
const byChinese = new Map()
for (const feature of venues.features ?? []) {
  const point = centroid(feature.geometry)
  const props = feature.properties ?? {}
  if (!point) continue
  const entry = {
    en: String(props.venue_name_en ?? ""),
    tc: String(props.venue_name_zh ?? ""),
    lng: round(point.lng),
    lat: round(point.lat),
  }
  byEnglish.set(normEn(entry.en), entry)
  byChinese.set(normZh(entry.tc), entry)
}

const located = {}
const missing = []
for (const [code, names] of stations) {
  const hit = byEnglish.get(normEn(names.en)) ?? byChinese.get(normZh(names.tc))
  if (!hit) {
    missing.push(`${code} ${names.en}`)
    continue
  }
  located[code] = { en: names.en, tc: names.tc, lng: hit.lng, lat: hit.lat }
}
if (missing.length > 0) {
  throw new Error(`No Lands Department footprint for ${missing.join(", ")}`)
}

// The lines file leaves out the race-day stop. The next-train API still uses RAC,
// and Lands Department publishes the footprint.
const racecourse = byEnglish.get("racecourse")
if (racecourse && !located.RAC) {
  located.RAC = { en: "Racecourse", tc: "馬場", lng: racecourse.lng, lat: racecourse.lat }
}

const lines = {}
for (const [code, [en, tc, color]] of Object.entries(LINES)) {
  lines[code] = { en, tc, color }
}
for (const routeId of routeRows.keys()) {
  const line = routeId.slice(0, routeId.indexOf("-"))
  if (!lines[line]) lines[line] = { en: line, tc: line, color: "#5C6B7A" }
}

const routes = [...routeRows.entries()]
  .map(([id, rows]) => ({
    id,
    line: rows[0].line,
    stations: rows
      .filter((row) => Number.isFinite(row.sequence))
      .sort((a, b) => a.sequence - b.sequence)
      .map((row) => row.code),
  }))
  .sort((a, b) => (a.id < b.id ? -1 : 1))

const body = {
  stations: Object.fromEntries(Object.entries(located).sort(([a], [b]) => (a < b ? -1 : 1))),
  lines,
  routes,
}
await writeFile(new URL("../data/mtr-network.json", import.meta.url), `${JSON.stringify(body, null, 2)}\n`)
console.log(`stations ${Object.keys(body.stations).length}, routes ${routes.length}`)

function parseCsv(text) {
  const rows = []
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/)
  const header = splitCsv(lines[0] ?? "")
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const cells = splitCsv(line)
    const row = {}
    header.forEach((key, index) => {
      row[key] = cells[index] ?? ""
    })
    rows.push(row)
  }
  return rows
}

function splitCsv(line) {
  const cells = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === "," && !quoted) {
      cells.push(current)
      current = ""
      continue
    }
    current += char
  }
  cells.push(current)
  return cells
}

function centroid(geometry) {
  const ring =
    geometry?.type === "Polygon"
      ? geometry.coordinates?.[0]
      : geometry?.type === "MultiPolygon"
        ? geometry.coordinates?.[0]?.[0]
        : null
  if (!ring?.length) return null
  let lng = 0
  let lat = 0
  for (const point of ring) {
    lng += point[0]
    lat += point[1]
  }
  return { lng: lng / ring.length, lat: lat / ring.length }
}

function normEn(value) {
  return value
    .toLowerCase()
    .replace(/\bstation\b/g, "")
    .replace(/[^a-z0-9]/g, "")
}

function normZh(value) {
  return value.replace(/鐵路站$/, "").replace(/站$/, "").trim()
}

function round(value) {
  return Math.round(value * 1e6) / 1e6
}
