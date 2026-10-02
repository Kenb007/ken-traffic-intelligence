[繁體中文](README.zh-HK.md)

# HK Traffic Intelligence

Hong Kong's smart city programmes already put live traffic information in public hands. The Transport Department publishes speed on the strategic roads and journey times at the harbour crossings. HKeMobility publishes cameras, road works, and special traffic news. The Immigration Department publishes waiting times at the land control points. The Hong Kong Observatory publishes warnings. MTR and KMB publish the next train and the next bus.

This map reads those open feeds on one screen, so the same official numbers can be followed together. It does not give driving directions. It is a way to watch the city, and a way to show the data these organisations already release.

The site is [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev). There is no account. It opens in Traditional Chinese, the written Chinese used in Hong Kong, and you can switch to English beside the clock.

[![Live demo](https://img.shields.io/badge/▶_Open_live_board-hktraffic.keith--li.workers.dev-0891b2?style=for-the-badge)](https://hktraffic.keith-li.workers.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

![Hong Kong traffic map: satellite view, coloured strategic roads, live harbour minutes, and the header](docs/board.png)

If you find the map useful, please [star this repository](https://github.com/keithligh/hk-traffic-intelligence). A star is how more people discover an open source picture of Hong Kong's smart city, and it is the most direct way to support the work.

## What you will see

The three harbour crossings (Cross-Harbour, Eastern Harbour, and Western Harbour) show minutes measured from a real approach road. Green is an ordinary run, amber is a delay that has settled in, and red means that crossing has turned. Click a reading and the map moves to that approach.

Strategic roads are coloured with the Transport Department's own saturation classes: Good, Average, and Bad. Where a segment has no class, the colour falls back to the speed itself. Dots move along corridors that have a live speed, and they disappear when you turn the speed layer off.

Public cameras include the tunnel mouths. Harbour and tunnel-mouth cameras stay on the map when you are zoomed out. The rest of the city appears as you come closer. Road works on fast roads, toll points, and special traffic news that is still open sit on their own layers.

The eight land control points show passenger halls for residents and visitors, arriving and departing. The vehicle line beside a hall is the live speed on the strategic road that feeds that port. Lo Wu is a passenger crossing, so that line stays empty.

Every Hong Kong Observatory warning in force is listed. When the sky is quiet, you still see the temperature at the Observatory and whether the past hour brought rain.

MTR next-train minutes, destination, and platform are taken from the board MTR publishes. The dot walks those minutes back along the track, and the card says which two stations it falls between. Light rail is not on this layer. KMB shows the arrival time KMB publishes, including a scheduled row, once you are zoomed in near the middle of the map. The arrival feed names the stop, so the map shows the stop.

A list on the side ranks what to read first: an open incident, a road that has gone bad, a hall that is very busy, a warning. Hide it and the same items run along the bottom.

You can switch the ground between satellite photography, the OSM Bright street map, and OSM Liberty with the buildings stood up. In the buildings view, labels and markers sit under the roofs.

The map uses the traffic, border, weather, MTR, and KMB feeds listed below. Hong Kong publishes a great deal more open data than this one screen draws on.

## Open source

The code is open source under the [MIT License](LICENSE). You are welcome to install it yourself, change it, and fork it. If you fork or reuse the work, please keep the copyright notice and credit [HK Traffic Intelligence](https://github.com/keithligh/hk-traffic-intelligence) and [Keith Li](https://github.com/keithligh).

You need Node.js 22.

```bash
git clone https://github.com/keithligh/hk-traffic-intelligence.git
cd hk-traffic-intelligence
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

The bottom bar switches the ground and the layers: satellite (Esri photography, kept flat so the coloured roads stay on the streets), streets ([OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) from [OpenFreeMap](https://openfreemap.org)), buildings ([OSM Liberty](https://github.com/maputnik/osm-liberty), press again to return to the map you had), and the data layers for speed, cameras, works, tunnels, incidents, boundary, MTR, and KMB.

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 4317 |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | The Cloudflare-oriented dev server on port 4318 |
| `npm run deploy:vinext` | Deploy the worker, when Cloudflare credentials are available |

Add `?feed=down` to see the screen when the speed feed fails. Add `?map=down` and the header stays up while the map is absent. The app is Next.js, React, MapLibre GL, and Tailwind CSS, served as a Cloudflare Worker.

## One copy of each feed

The live site keeps one shared copy of each feed and serves that copy to visitors. While the copy is still fresh, a new visitor reads it here. The copy is kept per city on Cloudflare's network, and it expires on the same rhythm as the map polls: about fifteen seconds for MTR, thirty seconds for KMB, and about a minute for the other feeds. That rhythm follows the pace of the published feeds, so the site can be widely read while each department server is asked only when a fresh copy is due.

## Where the numbers come from

Road geometry is the Transport Department strategic centreline, stored in Hong Kong 1980 grid coordinates. The Lands Department correction for the whole territory is 8.8 arcseconds of longitude added, and 5.5 arcseconds of latitude subtracted. After that, the line lies on the road.

| On the map | Open data |
| --- | --- |
| Which strategic roads are moving, and the official colour | [Traffic data of strategic and major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads), classed on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The shape of those roads | [Road Network, second generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| Minutes for the harbour crossings | Journey-time boards on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Cameras, in English and Traditional Chinese | Snapshot layers on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Where a fast road is opened up | Road works on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Where a tunnel is | Toll points on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| What has just gone wrong | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| Detectors on urban lampposts | [Smart lamppost traffic detectors](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| Passenger halls at the land control points | Immigration Department, [land boundary control point waiting time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) |
| Next MTR train | [Next train](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data). Station locations are the Lands Department [indoor station footprints](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-indoor-mtr-station-map). |
| Next KMB arrival | [KMB and LWB estimated time of arrival](https://data.etabus.gov.hk/v1/transport/kmb/stop) |
| Warnings, temperature, and rain | Hong Kong Observatory [warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [current weather report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| Street map and buildings | [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) and [OSM Liberty](https://github.com/maputnik/osm-liberty), served by [OpenFreeMap](https://openfreemap.org) from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and [OpenMapTiles](https://openmaptiles.org/) |
| Satellite photograph | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

## Author

[Keith Li](https://www.linkedin.com/in/keithlihk) built this map for Agentic Engineer classes, public talks, and guest lectures. It is possible because the Transport Department, the Immigration Department, the Observatory, MTR, KMB, and the teams behind HKeMobility already publish the data.

Please [star the repository](https://github.com/keithligh/hk-traffic-intelligence) if you want this project to reach more people.

Created by [Keith Li](https://www.linkedin.com/in/keithlihk) / [GitHub](https://github.com/keithligh)
