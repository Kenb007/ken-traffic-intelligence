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

The header begins with the three harbour crossings. The Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing each show the minutes measured on a real approach road. Green is an ordinary run, amber is a delay that has already settled in, and red means that crossing has changed. If you click a reading, the map moves to the approach those minutes came from, and the card names the road, the direction, what is nearby, and the time to each crossing on that approach.

Under the crossings, the strategic roads use the saturation classes the Transport Department publishes: Good, Average, and Bad. When a short segment has no class, the colour follows the speed on that segment. Where a live speed is available, dots travel along the corridor at a pace that matches it. Turn the speed layer off, and the dots leave with it.

The same map carries the public cameras, including the mouths of the tunnels. Cameras around the harbour and at those mouths stay visible while you are still zoomed out, and the rest of the city appears as you move closer. A camera card separates the road, the direction, the nearby place, the district, the region, the way the lens faces, and the camera number, and then shows the still. Road works on roads with a limit of 70 km/h or above, the toll points for the harbour crossings and Tai Lam Tunnel, and special traffic news that is still open each have their own layer, which you can switch from the bar along the bottom.

The eight land control points show the passenger halls, for residents and for visitors, arriving and departing. The vehicle figure beside a hall is the live speed on the strategic road that feeds that port. Lo Wu is a passenger crossing. The published file has no private-car queue there, so that line is left blank. Weather sits in the header with them. Every Observatory warning in force is listed, and on a quiet day you still see the temperature at the Observatory and whether the past hour brought rain.

MTR and KMB are drawn from the figures those operators publish. For the MTR, the minutes, the destination, and the platform are the next train on the published board. A dot walks those minutes back along the track, and the card says which two stations it falls between. Light rail is not included. For KMB, the time on a stop is the published arrival, and a scheduled trip stays on the list. The stops appear once you have zoomed in, near the middle of the map, because the arrival information is given stop by stop.

Beside the map, a list puts the items worth reading first in order: an incident that is still open, a road the Transport Department has classed as bad, a hall that is very busy, or a warning. Hide the list and those same items run along the bottom. You can also change the ground. Satellite photography, the OSM Bright street map, and OSM Liberty with the buildings stood up are all available. Press buildings again and you return to the map you had. In the buildings view, the labels and the markers sit under the roofs.

Everything above is drawn from the traffic, border, weather, MTR, and KMB feeds named later on this page. Hong Kong publishes much more open data than this one map uses.

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

The bar along the bottom is where you choose the ground and the layers. Satellite is Esri photography, kept flat so the coloured roads stay on the streets. Streets is [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style), served by [OpenFreeMap](https://openfreemap.org). Buildings is [OSM Liberty](https://github.com/maputnik/osm-liberty). Press that button again and you return to the map you were on. The remaining buttons turn speed, cameras, works, tunnels, incidents, the land control points, MTR, and KMB on and off.

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 4317 |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | The Cloudflare-oriented dev server on port 4318 |
| `npm run deploy:vinext` | Deploy the worker, when Cloudflare credentials are available |

If you want to see the screen when the speed feed cannot be reached, add `?feed=down` to the address. If you want to see the header while the map itself is absent, add `?map=down`. The application is written with Next.js, React, MapLibre GL, and Tailwind CSS, and the public site runs as a Cloudflare Worker.

## One copy of each feed

The live site keeps one shared copy of each feed and serves that copy to visitors. While the copy is still fresh, a new visitor reads it here. The copy is kept per city on Cloudflare's network, and it expires on the same rhythm as the map polls: about fifteen seconds for MTR, thirty seconds for KMB, and about a minute for the other feeds. That rhythm follows the pace of the published feeds, so the site can be widely read while each department server is asked only when a fresh copy is due.

## Where the numbers come from

The roads on the map follow the Transport Department strategic centreline. The file is stored in Hong Kong 1980 grid coordinates. The Lands Department correction for the whole territory adds 8.8 arcseconds of longitude and subtracts 5.5 arcseconds of latitude. After that correction, the line lies on the road.

The table below names the published source for each part of the screen. Hong Kong's open-data catalogues contain far more than this list. These are the feeds the map reads.

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
