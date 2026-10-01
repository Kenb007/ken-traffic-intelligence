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

export type HarbourJourney = {
  from: string
  to: string
  minutes: number | null
  colour: "red" | "amber" | "green" | "none"
  note: string | null
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
  nameTc: string
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

export type ControlPointsResponse = {
  ok: boolean
  error?: string
  observedAt: string | null
  points: GeoJSON.FeatureCollection
}

export type WeatherWarning = {
  id: string
  code: string
  name: string
  shortName: string
  detail: string
  tone: "red" | "amber"
  urgent: boolean
  score: number
}

export type WeatherConditions = {
  temperatureC: number | null
  rainfallMm: number | null
  rainfallPlace: string
}

export type WarningsResponse = {
  ok: boolean
  error?: string
  observedAt: string | null
  warnings: WeatherWarning[]
  conditions: WeatherConditions
}

export type MtrTimeType = "A" | "D"

export type MtrTrain = {
  id: string
  line: string
  dest: string
  plat: string
  ttnt: number
  observedAt: string
  delay: boolean
  timeType: MtrTimeType
  anchor: string
  path: string[]
  hold: string[]
}

export type MtrCalling = {
  dest: string
  plat: string
  ttnt: number
  delay: boolean
  timeType: MtrTimeType
}

export type MtrBoard = {
  line: string
  station: string
  message: string
  trains: MtrCalling[]
}

export type MtrResponse = {
  ok: boolean
  error?: string
  observedAt: string | null
  trains: MtrTrain[]
  boards: MtrBoard[]
}

export type WatchLayer = "speed" | "cameras" | "works" | "tolls" | "incidents" | "control" | "mtr"

export type WatchLayers = Record<WatchLayer, boolean>

export type Basemap = "satellite" | "street" | "buildings"
