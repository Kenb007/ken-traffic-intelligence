import {
  controlName,
  displayText,
  districtName,
  queueText,
  vehicleSentence,
  type Messages,
} from "@/lib/i18n"
import { isCameraSnapshotUrl } from "@/lib/picture"
import type { ApproachPoint, HarbourJourney } from "@/lib/types"

const TUNNEL_TC: Record<string, string> = {
  "Western Harbour Crossing": "西區海底隧道",
  "Eastern Harbour Crossing": "東區海底隧道",
  "Cross Harbour Tunnel": "紅磡海底隧道",
  "Tai Lam Tunnel": "大欖隧道",
}

export function approachPopup(point: ApproachPoint, m: Messages): HTMLElement {
  const card = openCard(m.crossing, displayText(m.locale, "", point.name))
  for (const leg of point.legs) {
    const name = crossingLegName(leg.code, leg.name, m)
    const value = leg.minutes == null ? m.noReading : m.minutes(leg.minutes)
    card.body.append(field(name, value, colourTone(leg.colour)))
  }
  return card.root
}

export function corridorPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const card = openCard(m.speedLayer, textProp(properties, "name"), textProp(properties, "nameEn"))
  const direction = textProp(properties, "direction")
  if (direction) card.body.append(field(m.roads, direction))
  const speed = textProp(properties, "speed")
  if (speed) card.body.append(field(m.network, speed, textProp(properties, "color")))
  return card.root
}

export function cameraPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const title = textProp(properties, "name") || m.cameras
  const card = openCard(m.cameras, title, districtName(m.locale, textProp(properties, "district")))
  const url = textProp(properties, "url")
  if (!isCameraSnapshotUrl(url)) return card.root
  const figure = document.createElement("figure")
  figure.className = "city-card-figure"
  const image = document.createElement("img")
  image.alt = title
  image.addEventListener("error", () => {
    figure.remove()
    card.root.append(note(m.snapshotFailed))
  })
  image.src = url
  figure.append(image)
  card.root.append(figure)
  return card.root
}

export function controlPointPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const title = controlName(m.locale, textProp(properties, "code"), textProp(properties, "name") || m.controlPoint)
  const card = openCard(m.boundary, title, m.passengerClearance)
  const rows = [
    [m.residentArrival, "residentArrCode", false],
    [m.residentDeparture, "residentDepCode", false],
    [m.visitorArrival, "visitorArrCode", true],
    [m.visitorDeparture, "visitorDepCode", true],
  ] as const
  for (const [label, key, visitor] of rows) {
    const code = properties?.[key]
    if (typeof code !== "number") {
      card.body.append(field(label, m.queueNone))
      continue
    }
    card.body.append(field(label, queueText(code, visitor, m), queueTone(code)))
  }
  const roadName = displayText(m.locale, textProp(properties, "vehicleRoadTc"), textProp(properties, "vehicleRoadEn"))
  const kmh = properties?.vehicleKmh
  const band = textProp(properties, "vehicleBand")
  const vehicle =
    roadName && typeof kmh === "number" && band
      ? vehicleSentence(roadName, kmh, band, m)
      : ""
  card.body.append(copy(vehicle || m.noVehicleApproach))
  return card.root
}

export function incidentPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const title = displayText(m.locale, textProp(properties, "nameTc"), textProp(properties, "name")) || m.incident
  const card = openCard(m.incidentsLayer, title)
  const location = displayText(m.locale, textProp(properties, "location"), textProp(properties, "locationEn"))
  const direction = displayText(m.locale, textProp(properties, "directionTc"), textProp(properties, "direction"))
  const place = [location, direction].filter(Boolean).join(" · ")
  if (place) card.body.append(copy(place))
  const landmark = displayText(m.locale, textProp(properties, "landmark"), textProp(properties, "landmarkEn"))
  if (landmark) card.body.append(copy(m.near(landmark)))
  const content = displayText(m.locale, textProp(properties, "contentTc"), textProp(properties, "content"))
  if (content) card.body.append(copy(content))
  const announced = clock(hongKongStamp(textProp(properties, "announced")))
  if (announced) card.body.append(field(m.live, announced))
  return card.root
}

export function workPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const card = openCard(m.worksLayer, textProp(properties, "road") || m.roadWork, textProp(properties, "place"))
  const statusText = textProp(properties, "status")
  const statusWord = /in progress/i.test(statusText) ? m.worksLive : /preparation/i.test(statusText) ? m.worksPrep : statusText
  if (statusWord) card.body.append(field(m.works, statusWord, /in progress/i.test(statusText) ? "#FF5D73" : "#FFC857"))
  const lane = textProp(properties, "lane")
  if (lane) card.body.append(field(m.roads, lane))
  const kind = textProp(properties, "kind")
  if (kind) card.body.append(field(m.worksLayer, kind))
  const when = timeRange(textProp(properties, "start"), textProp(properties, "end"))
  if (when) card.body.append(field(m.live, when))
  return card.root
}

export function tollPopup(properties: GeoJSON.GeoJsonProperties, m: Messages): HTMLElement {
  const name = textProp(properties, "name")
  const card = openCard(
    m.tolls,
    displayText(m.locale, TUNNEL_TC[name] ?? "", name) || m.tunnel,
    textProp(properties, "band") === "overview" ? m.tunnel : m.tunnelPortal,
  )
  return card.root
}

function crossingLegName(code: string, fallback: string, m: Messages): string {
  if (code === "CH") return m.crossFull
  if (code === "EH") return m.easternFull
  if (code === "WH") return m.westernFull
  return displayText(m.locale, "", fallback)
}

function openCard(kicker: string, title: string, subtitle = ""): { root: HTMLElement; body: HTMLElement } {
  const root = document.createElement("article")
  root.className = "city-card"
  const head = document.createElement("header")
  head.className = "city-card-head"
  head.append(text("span", "city-card-kicker uppercase", kicker))
  head.append(text("h2", "city-card-title", title))
  if (subtitle) head.append(text("p", "city-card-sub", subtitle))
  const body = document.createElement("div")
  body.className = "city-card-body"
  root.append(head, body)
  return { root, body }
}

function field(label: string, value: string, tone?: string): HTMLElement {
  const row = document.createElement("div")
  row.className = "city-card-row"
  row.append(text("span", "city-card-label", label))
  const valueNode = text("span", "city-card-value")
  if (tone) {
    const chip = document.createElement("span")
    chip.className = "city-chip"
    const dot = document.createElement("i")
    dot.style.background = tone
    dot.style.color = tone
    chip.append(dot, document.createTextNode(value))
    valueNode.append(chip)
  } else {
    valueNode.textContent = value
  }
  row.append(valueNode)
  return row
}

function copy(value: string): HTMLElement {
  return text("p", "city-card-copy", value)
}

function note(value: string): HTMLElement {
  return text("p", "city-card-note", value)
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, value = ""): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (value) node.textContent = value
  return node
}

function colourTone(colour: HarbourJourney["colour"]): string {
  switch (colour) {
    case "red":
      return "#FF5D73"
    case "amber":
      return "#FFC857"
    case "green":
      return "#3DDC97"
    case "none":
      return "#C9D2DC"
    default: {
      const exhaustive: never = colour
      return exhaustive
    }
  }
}

function queueTone(code: number): string {
  if (code === 2) return "#FF5D73"
  if (code === 1) return "#FFC857"
  if (code === 0) return "#3DDC97"
  return "#C9D2DC"
}

function timeRange(start: string, end: string): string {
  const from = clock(start)
  const to = clock(end)
  if (from && to) return `${from} – ${to}`
  return from || to
}

function hongKongStamp(value: string): string {
  if (!value || /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) return value
  return `${value}+08:00`
}

function clock(value: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    day: "numeric",
    month: "short",
  }).format(date)
}

function textProp(properties: GeoJSON.GeoJsonProperties, key: string): string {
  const value = properties?.[key]
  return typeof value === "string" ? value : ""
}
