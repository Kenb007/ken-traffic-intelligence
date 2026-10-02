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

The first numbers on the page are the three harbour crossings. For the Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing, you see the journey time measured on a real approach road. The colour follows that journey. An ordinary run stays green, a delay that has settled in turns amber, and a crossing that has changed turns red. When you click one of those times, the map moves to the approach it was measured on, and the card tells you which road it is, which way the traffic is heading, what is nearby, and how long each crossing on that approach is taking.

The roads under those times are the strategic network, coloured with the Good, Average, and Bad classes published by the Transport Department. A short length of road that has no class is coloured from its speed instead. Where a live speed is available, dots move along the road at a matching pace, and they are shown only while the speed layer is switched on.

The cameras are the stills already published for the public, including the mouths of the tunnels. Around the harbour, and at those mouths, they remain on the map while you are zoomed out. Elsewhere they appear as you come closer. Open one and you see where it is and which way it faces before the picture itself. From the same map you can also turn on road works along the faster roads, the toll points at the harbour crossings and at Tai Lam Tunnel, and any special traffic news that is still open.

The eight land control points are the passenger halls, for residents and visitors, arriving and departing. Beside each hall, the vehicle figure is the live speed on the strategic road that leads to that port. Lo Wu is a passenger crossing, and the published figures do not include a queue for private cars, so that part of the card is left empty. The weather line in the header lists every Observatory warning that is in force. On a day when none is in force, it still gives the temperature at the Observatory and says whether rain fell in the past hour.

The MTR layer follows the next train that MTR publishes, including how many minutes away it is, where it is going, and which platform it will use. The dot on the track is placed by taking those minutes back along the line, and the card names the two stations it falls between. KMB follows the arrivals that KMB publishes, and a trip shown as scheduled stays on the list. Those arrivals are given for a stop, so the stops appear when you zoom in toward the middle of the map.

When several things deserve attention at once, the list beside the map puts them in order, beginning with an open traffic notice, a road classed as bad, a hall that is very busy, or a weather warning. Closing the list keeps those items on screen. They continue along the bottom. Underneath all of this, you can leave the satellite photograph in place, change to the OSM Bright street map, or raise the buildings with OSM Liberty. Choosing the buildings a second time brings back the map you had, and in that view the labels sit beneath the roofs.

What you are looking at is the set of traffic, border, weather, MTR, and KMB feeds described later on this page. Hong Kong publishes much more open data than this map draws on.

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

Along the bottom of the map you choose what to look at. You can keep the Esri satellite photograph, which stays flat so the coloured roads remain on the streets, change to the [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) street map served by [OpenFreeMap](https://openfreemap.org), or raise the buildings with [OSM Liberty](https://github.com/maputnik/osm-liberty) and choose it again when you want the previous map back. The other controls show or hide speed, cameras, works, tunnels, incidents, the land control points, the MTR, and KMB.

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 4317 |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | The Cloudflare-oriented dev server on port 4318 |
| `npm run deploy:vinext` | Deploy the worker, when Cloudflare credentials are available |

If you want to see the screen when the speed feed cannot be reached, add `?feed=down` to the address. If you want to see the header while the map itself is absent, add `?map=down`. The application is written with Next.js, React, MapLibre GL, and Tailwind CSS, and the public site runs as a Cloudflare Worker.

## One copy of each feed

Anyone who opens the public site is reading a shared copy of each feed, kept on Cloudflare for that city. The copy is renewed at about the same pace as the map itself, roughly every fifteen seconds for the MTR, every thirty seconds for KMB, and about once a minute for the rest. While that copy is still current, the next visitor is served from it. A new request goes out to the publishing organisation only when the copy is ready to be renewed, so the site can be read widely while staying with the rhythm of the feeds that are already published.

## Where the numbers come from

The strategic roads are drawn from the Transport Department centreline. The file is held in Hong Kong 1980 grid coordinates, and it is shifted by the Lands Department correction for the whole territory, which adds 8.8 arcseconds of longitude and subtracts 5.5 arcseconds of latitude, so that the lines sit on the carriageway.

Each row below is one part of the screen and the publication it comes from. This is only what the map uses. The open data Hong Kong publishes as a whole is much larger.

| On the map | Open data |
| --- | --- |
| Speed and official colour on strategic roads | [Traffic data of strategic and major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads), classed on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The shape of those roads | [Road Network, second generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| Journey times at the harbour crossings | Journey-time information on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Cameras, in English and Traditional Chinese | Camera images on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Road works | Road works on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Toll points | Toll points on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Special traffic news | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| Traffic detectors on smart lampposts | [Traffic detectors installed at smart lampposts](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| Waiting times at land control points | Immigration Department, [waiting time at land boundary control points](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) |
| The next MTR train | [Next train](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data), with station locations from the Lands Department [indoor station footprints](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-indoor-mtr-station-map) |
| The next KMB arrival | [Estimated time of arrival for KMB and LWB](https://data.etabus.gov.hk/v1/transport/kmb/stop) |
| Warnings, temperature, and rainfall | Hong Kong Observatory [warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [regional weather report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| Street map and buildings | [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) and [OSM Liberty](https://github.com/maputnik/osm-liberty), served by [OpenFreeMap](https://openfreemap.org), from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and [OpenMapTiles](https://openmaptiles.org/) |
| Satellite photograph | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

## Author

[Keith Li](https://www.linkedin.com/in/keithlihk) made this map for Agentic Engineer classes, for public talks, and for guest lectures. It is possible because the Transport Department, the Immigration Department, the Observatory, MTR, KMB, and the teams behind HKeMobility already publish these figures for the public.

If the map is useful to you, please [star the repository](https://github.com/keithligh/hk-traffic-intelligence). That is how other people find it.

You can also find Keith on [LinkedIn](https://www.linkedin.com/in/keithlihk) and on [GitHub](https://github.com/keithligh).
