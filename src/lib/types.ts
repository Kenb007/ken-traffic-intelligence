export type SpeedBand = "free" | "slow" | "congested" | "unknown"

export type Corridor = {
  id: string
  roadTc: string
  roadEn: string
  direction: string
  speedKmh: number | null
  band: SpeedBand
  lengthKm: number
  detectorCount: number
  coordinates: [number, number][]
}

export type SpeedSummary = {
  corridorCount: number
  detectorCount: number
  meanSpeedKmh: number | null
  free: number
  slow: number
  congested: number
  unknown: number
}

export type SegmentSummary = {
  ok: boolean
  error?: string
  observedAt: string | null
  validCount: number
  invalidCount: number
  meanSpeedKmh: number | null
}

export type NetworkStatus = {
  ok: boolean
  error?: string
  revisionDate: string | null
  usedOnMap: boolean
  reason: string
}

export type TrafficResponse = {
  ok: boolean
  error?: string
  observedAt: string | null
  corridors: Corridor[]
  summary: SpeedSummary
  segments: SegmentSummary
  network: NetworkStatus
}

export type NoticeItem = {
  id: string
  category: string
  titleEn: string
  titleTc: string
  effective: string
}

export type NoticesResponse = {
  ok: boolean
  error?: string
  notices: NoticeItem[]
}

export type JourneyAlternate = {
  tunnel: string
  distance: string
  eta: string
}

export type TdasJourney = {
  ok: boolean
  error?: string
  speedText: string | null
  eta: string | null
  distance: string | null
  tunnel: string | null
  alternates: JourneyAlternate[]
}

export type HarbourJourney = {
  from: string
  to: string
  minutes: number | null
  colour: "red" | "amber" | "green" | "none"
  note: string | null
}

export type JtisSummary = {
  ok: boolean
  error?: string
  capturedAt: string | null
  red: number
  amber: number
  green: number
  other: number
  harbour: HarbourJourney[]
}

export type JourneyResponse = {
  tdas: TdasJourney
  jtis: JtisSummary
}

export type ApproachLeg = {
  code: string
  name: string
  minutes: number | null
  colour: HarbourJourney["colour"]
}

export type ApproachPoint = {
  id: string
  name: string
  coordinates: [number, number]
  legs: ApproachLeg[]
}

export type ApproachesResponse = {
  ok: boolean
  error?: string
  capturedAt: string | null
  points: ApproachPoint[]
}

export type PictureResponse = {
  ok: boolean
  error?: string
  cameras: GeoJSON.FeatureCollection
  works: GeoJSON.FeatureCollection
  tolls: GeoJSON.FeatureCollection
}

export type IncidentsResponse = {
  ok: boolean
  error?: string
  observedAt: string | null
  incidents: GeoJSON.FeatureCollection
}

export type WatchLayer = "speed" | "cameras" | "works" | "tolls" | "incidents"

export type WatchLayers = Record<WatchLayer, boolean>

export type Basemap = "satellite" | "street" | "buildings"
