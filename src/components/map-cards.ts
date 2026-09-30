import { facingWord, parsePlace, type CameraPlace } from "@/lib/camera-place"
import {
  bandWord,
  controlName,
  displayText,
  districtName,
  queueText,
  regionName,
  vehicleSentence,
  type Locale,
  type Messages,
} from "@/lib/i18n"
import { isCameraSnapshotUrl } from "@/lib/picture"
import { isSpeedBand } from "@/lib/speed"
import type { ApproachPoint } from "@/lib/types"

const TUNNEL_TC: Record<string, string> = {
  "Western Harbour Crossing": "西區海底隧道",
  "Eastern Harbour Crossing": "東區海底隧道",
  "Cross Harbour Tunnel": "紅磡海底隧道",
  "Tai Lam Tunnel": "大欖隧道",
}

const BOUND_TC: Record<string, string> = {
  eastbound: "東行",
  westbound: "西行",
  northbound: "北行",
  southbound: "南行",
}

const BOUND_EN: Record<string, string> = {
  東行: "Eastbound",
  西行: "Westbound",
  北行: "Northbound",
  南行: "Southbound",
}

export function approachPopup(point: ApproachPoint, m: Messages): HTMLElement {
  const place = parsePlace(displayText(m.locale, point.nameTc, point.name))
  const card = openCard(place.road || displayText(m.locale, point.nameTc, point.name))
  const detail = placeLine(place, m)
  if (detail) card.head.append(paragraph("city-card-detail", detail))
  for (const leg of point.legs) {
    const name = crossingLegName(leg.code, leg.name, m)
    const value = leg.minutes == null ? m.noReading : m.minutes(leg.minutes)
    card.body.append(fact(name, value))
  }
  return card.root
}

export function corridorPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const card = openCard(textProp(properties, "name") || m.roads)
  const direction = presentBound(textProp(properties, "direction"), m.locale)
  if (direction) card.head.append(paragraph("city-card-detail", direction))
  const speed = textProp(properties, "speed")
  const band = textProp(properties, "band")
  if (speed) {
    const word = isSpeedBand(band) && band !== "unknown" && speed !== m.noReading ? bandWord(band, m) : ""
    card.head.append(paragraph("city-card-reading", word ? `${speed} · ${word}` : speed))
  }
  return card.root
}

export function cameraPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const description = displayText(m.locale, textProp(properties, "nameTc"), textProp(properties, "name"))
  const place = parsePlace(description)
  const card = openCard(place.road || description || m.cameras, place.reference)
  const detail = placeLine(place, m)
  if (detail) card.head.append(paragraph("city-card-detail", detail))
  const where = [
    localName(textProp(properties, "districtTc"), textProp(properties, "district"), districtName, m),
    localName(textProp(properties, "regionTc"), textProp(properties, "region"), regionName, m),
  ]
    .filter(Boolean)
    .join(" · ")
  if (where) card.head.append(paragraph("city-card-meta", where))
  const rotation = numberProp(properties, "rotation")
  if (rotation != null) card.head.append(paragraph("city-card-meta", m.facing(facingWord(rotation, m.locale))))
  const url = textProp(properties, "url")
  if (!isCameraSnapshotUrl(url)) return card.root
  const figure = document.createElement("figure")
  figure.className = "city-card-figure"
  const image = document.createElement("img")
  image.alt = [place.road, detail].filter(Boolean).join(m.locale === "en" ? ", " : "，")
  image.addEventListener("error", () => {
    figure.remove()
    card.root.append(paragraph("city-card-note", m.snapshotFailed))
  })
  image.src = url
  figure.append(image)
  card.root.append(figure)
  return card.root
}

export function controlPointPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const title = controlName(m.locale, textProp(properties, "code"), textProp(properties, "name") || m.controlPoint)
  const card = openCard(title)
  card.head.append(paragraph("city-card-meta", m.passengerClearance))
  const rows = [
    [m.residentArrival, "residentArrCode", false],
    [m.residentDeparture, "residentDepCode", false],
    [m.visitorArrival, "visitorArrCode", true],
    [m.visitorDeparture, "visitorDepCode", true],
  ] as const
  for (const [label, key, visitor] of rows) {
    const code = properties?.[key]
    const value = typeof code === "number" ? queueText(code, visitor, m) : m.queueNone
    card.body.append(fact(label, value))
  }
  const roadName = displayText(m.locale, textProp(properties, "vehicleRoadTc"), textProp(properties, "vehicleRoadEn"))
  const kmh = properties?.vehicleKmh
  const band = textProp(properties, "vehicleBand")
  const vehicle =
    roadName && typeof kmh === "number" && band
      ? vehicleSentence(roadName, kmh, band, m)
      : ""
  card.body.append(paragraph("city-card-copy", vehicle || m.noVehicleApproach))
  return card.root
}

export function incidentPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const title = displayText(m.locale, textProp(properties, "nameTc"), textProp(properties, "name")) || m.incident
  const card = openCard(title)
  const location = displayText(m.locale, textProp(properties, "location"), textProp(properties, "locationEn"))
  const direction = presentBound(
    displayText(m.locale, textProp(properties, "directionTc"), textProp(properties, "direction")),
    m.locale,
  )
  const place = [location, direction].filter(Boolean).join(" · ")
  if (place) card.head.append(paragraph("city-card-detail", place))
  const landmark = displayText(m.locale, textProp(properties, "landmark"), textProp(properties, "landmarkEn"))
  if (landmark) card.head.append(paragraph("city-card-detail", m.near(landmark)))
  const content = displayText(m.locale, textProp(properties, "contentTc"), textProp(properties, "content"))
  if (content) card.body.append(paragraph("city-card-copy", content))
  const announced = clock(hongKongStamp(textProp(properties, "announced")), m.locale)
  if (announced) card.body.append(paragraph("city-card-meta", announced))
  return card.root
}

export function workPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const road = displayText(m.locale, textProp(properties, "roadTc"), textProp(properties, "road")) || m.roadWork
  const card = openCard(road)
  const place = displayText(m.locale, textProp(properties, "placeTc"), textProp(properties, "place"))
  const bound = displayText(m.locale, textProp(properties, "boundTc"), textProp(properties, "bound"))
  const lane = displayText(m.locale, textProp(properties, "laneTc"), textProp(properties, "lane"))
  const extra = placeRemainder(road, place)
  const locationBits = [
    extra,
    bound && !extra.includes(bound) ? bound : "",
    lane && !extra.includes(lane) ? lane : "",
  ].filter(Boolean)
  const location = locationBits.join(" · ")
  if (location) card.head.append(paragraph("city-card-detail", location))
  const kind = displayText(m.locale, textProp(properties, "kindTc"), textProp(properties, "kind"))
  const status = workStatus(properties, m)
  const job = [kind, status].filter(Boolean).join(" · ")
  if (job) card.head.append(paragraph("city-card-detail", job))
  const district = localName(textProp(properties, "districtTc"), textProp(properties, "district"), districtName, m)
  if (district) card.head.append(paragraph("city-card-meta", district))
  const when = timeRange(textProp(properties, "start"), textProp(properties, "end"), m.locale)
  if (when) card.head.append(paragraph("city-card-meta", when))
  return card.root
}

export function tollPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const name = textProp(properties, "name")
  const card = openCard(displayText(m.locale, TUNNEL_TC[name] ?? "", name) || m.tunnel)
  if (textProp(properties, "band") === "portal") card.head.append(paragraph("city-card-detail", m.tunnelPortal))
  return card.root
}

function crossingLegName(code: string, fallback: string, m: Messages): string {
  if (code === "CH") return m.crossFull
  if (code === "EH") return m.easternFull
  if (code === "WH") return m.westernFull
  return displayText(m.locale, "", fallback)
}

function placeLine(place: CameraPlace, m: Messages): string {
  const parts = [
    place.bound ? presentBound(place.bound, m.locale) : "",
    place.side,
    place.near ? m.near(place.near) : "",
    place.towards ? m.towards(place.towards) : "",
  ].filter(Boolean)
  return parts.join(" · ")
}

function presentBound(bound: string, locale: Locale): string {
  const match = bound.match(/^([東南西北东]行|(?:east|west|north|south)bound)(?:\s+(\(\d+\)))?$/i)
  if (!match?.[1]) return bound
  const index = match[2] ? ` ${match[2]}` : ""
  const token = match[1].toLowerCase()
  if (token.endsWith("bound")) {
    const english = token.charAt(0).toUpperCase() + token.slice(1)
    const word = locale === "en" ? english : displayText(locale, BOUND_TC[token] ?? "", english)
    return `${word}${index}`
  }
  const traditional = token === "东行" ? "東行" : match[1]
  const word = locale === "en" ? BOUND_EN[traditional] ?? traditional : displayText(locale, traditional, BOUND_EN[traditional] ?? "")
  return `${word}${index}`
}

function localName(
  traditional: string,
  english: string,
  fallback: (locale: Locale, english: string) => string,
  m: Messages,
): string {
  if (traditional) return displayText(m.locale, traditional, english)
  return fallback(m.locale, english)
}

function workStatus(properties: GeoJSON.GeoJsonProperties, m: Messages): string {
  const traditional = textProp(properties, "statusTc")
  const english = textProp(properties, "status")
  if (traditional) return displayText(m.locale, traditional, english)
  if (/in progress/i.test(english)) return m.worksLive
  if (/preparation/i.test(english)) return m.worksPrep
  return english
}

function placeRemainder(road: string, place: string): string {
  let rest = place.trim()
  if (!rest || rest === road) return ""
  if (road && rest.startsWith(road)) rest = rest.slice(road.length).replace(/^[\s,，、:：\-–—]+/, "").trim()
  return rest
}

function openCard(title: string, reference = ""): { root: HTMLElement; head: HTMLElement; body: HTMLElement } {
  const root = document.createElement("article")
  root.className = "city-card"
  const head = document.createElement("header")
  head.className = "city-card-head"
  const row = document.createElement("div")
  row.className = "city-card-title-row"
  row.append(text("h2", "city-card-title", title))
  if (reference) row.append(text("span", "city-card-ref", reference))
  head.append(row)
  const body = document.createElement("div")
  body.className = "city-card-body"
  root.append(head, body)
  return { root, head, body }
}

function fact(label: string, value: string): HTMLElement {
  const row = document.createElement("div")
  row.className = "city-card-fact"
  row.append(text("span", "city-card-fact-label", label))
  row.append(text("span", "city-card-fact-value", value))
  return row
}

function paragraph(className: string, value: string): HTMLElement {
  return text("p", className, value)
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, value = ""): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (value) node.textContent = value
  return node
}

function timeRange(start: string, end: string, locale: Locale): string {
  const from = clock(start, locale)
  const to = clock(end, locale)
  if (from && to) return `${from} – ${to}`
  return from || to
}

function hongKongStamp(value: string): string {
  if (!value || /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) return value
  return `${value}+08:00`
}

function clock(value: string, locale: Locale): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Hong_Kong",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      day: "numeric",
      month: "short",
    }).format(date)
  }
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    day: "numeric",
    month: "numeric",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ""
  return `${part("month")}月${part("day")}日 ${part("hour")}:${part("minute")}`
}

function numberProp(properties: GeoJSON.GeoJsonProperties, key: string): number | null {
  const value = properties?.[key]
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return value
}

function textProp(properties: GeoJSON.GeoJsonProperties, key: string): string {
  const value = properties?.[key]
  return typeof value === "string" ? value : ""
}
