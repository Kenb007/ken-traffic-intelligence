[繁體中文](README.zh-HK.md)

# HK Traffic Intelligence

A live map of Hong Kong traffic, drawn from the open feeds the city already publishes.

[![Live demo](https://img.shields.io/badge/live_demo-hktraffic.keith--li.workers.dev-0891b2)](https://hktraffic.keith-li.workers.dev)

The board is at [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev). No account, and nothing to install.

![Hong Kong traffic board on a satellite map, with coloured roads and the live header](docs/board.png)

It opens in Traditional Chinese, the written Chinese of a Hong Kong notice. English sits beside the clock. The board is for reading the city, and for showing how public feeds become one picture. It does not give driving directions.

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [What you can turn on](#what-you-can-turn-on)
- [Data sources](#data-sources)
- [Shared feeds](#shared-feeds)
- [Development](#development)
- [Author](#author)

## Features

- **Harbour crossings.** The Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing each show minutes from a real approach road. Green is an ordinary run, amber is a delay that has settled in, and red is a crossing that has turned. Click a reading and the map moves to that approach. The card names the road, the direction, what is nearby, and the minutes to each crossing on that board.
- **Road speed.** Strategic roads use the Transport Department saturation class: Good, Average, and Bad, coloured `#3DDC97`, `#FFC857`, and `#FF5D73`. Where a segment has no class, the colour falls back to the speed itself: under 30 km/h, 30 to 50, and 50 or faster. The legend keeps the official words and does not relabel those bands. Moving dots follow corridors that have a live speed. They are that speed drawn along the road, and they are removed when the speed layer is off.
- **Cameras.** Public Transport Department snapshots, including the tunnel mouths. Harbour and tunnel-mouth cameras stay visible while zoomed out. The rest of the city appears as you come closer. A camera card separates the road, direction, nearby place, district, region, lens direction, and camera number, then shows the still.
- **Works, tunnels, and incidents.** Road works on roads with a limit of 70 km/h or above, the three harbour crossings and Tai Lam Tunnel, and special traffic news that is still open.
- **Land control points.** Passenger halls at the eight land crossings: residents and visitors, arriving and departing. The vehicle line beside a hall is the live speed on the strategic road that feeds that port. Lo Wu is a passenger crossing. The public file has no private-car queue, so that line stays empty.
- **Weather.** Every Hong Kong Observatory warning in force. A severe warning is placed where it will be seen. When the sky is quiet, the row still shows the temperature at the Observatory and whether the past hour brought rain.
- **MTR.** Next-train minutes, destination, and platform are the board MTR publishes. MTR does not publish a train position. The dot walks those minutes back along the track, and the card says which two stations it falls between. Light rail is not on this layer.
- **KMB.** The time on a stop is the arrival KMB publishes, including a scheduled row. Stops appear once you are zoomed in, near the middle of the map. KMB does not publish the path a bus takes, so the map shows the stop and leaves the road empty of buses.
- **Intel.** The list ranks what to read first: an open incident, a road that has gone bad, a hall that is very busy, a warning. Hide it and the same items run along the bottom. Show and hide animate.
- **Basemaps.** Satellite photography, the OSM Bright street map, or OSM Liberty with the buildings stood up. Press buildings again to return to the map you had. In the buildings view, labels and indicators sit under the roofs.

## Quick start

You need Node.js 22.

```bash
git clone https://github.com/keithligh/hk-traffic-intelligence.git
cd hk-traffic-intelligence
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

## What you can turn on

The dock along the bottom switches the ground and the layers.

| Control | What it draws |
| --- | --- |
| Satellite | Esri photography. The picture stays flat so the coloured roads stay on the streets. |
| Streets | [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style), served by OpenFreeMap. |
| Buildings | [OSM Liberty](https://github.com/maputnik/osm-liberty), with the buildings stood up. Roofs cover the markers. |
| Speed | Strategic-road colour, and the dots that move with that speed. |
| Cameras | Public snapshots. |
| Works | Road works on fast roads. |
| Tunnels | Toll points for the harbour crossings and Tai Lam Tunnel. |
| Incidents | Open special traffic news. |
| Boundary | The eight land control points. |
| MTR | Published next trains, and a position estimated from those minutes. |
| KMB | Published arrivals at nearby stops. |

## Data sources

Every number comes from an open feed Hong Kong had already published.

Road geometry is the Transport Department strategic centreline, stored in Hong Kong 1980 grid coordinates. The Lands Department correction for the whole territory is 8.8 arcseconds of longitude added, and 5.5 arcseconds of latitude subtracted. After that, the line lies on the road.

| On the board | Open data |
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

## Shared feeds

The live site keeps one shared copy of each upstream feed and serves that copy to visitors. A new visitor does not cause a new call to a department server while that copy is still fresh. The copy is per city on Cloudflare’s network, and it expires on the same rhythm as the board polls: about 15 seconds for MTR, 30 seconds for KMB, and about a minute for the other feeds.

## Development

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js on [http://127.0.0.1:4317](http://127.0.0.1:4317) |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | The Cloudflare-oriented dev server on port 4318 |
| `npm run deploy:vinext` | Deploy the worker, when Cloudflare credentials are available |

Add `?feed=down` to see the screen when the speed feed fails. Add `?map=down` and the header stays up while the map is absent.

The app is Next.js, React, MapLibre GL, and Tailwind CSS, served as a Cloudflare Worker.

## Author

[Keith Li](https://www.linkedin.com/in/keithlihk). This board is used in Agentic Engineer classes, in public talks, and in guest lectures. The data was already public. The work is to make those feeds one city a person can read.
