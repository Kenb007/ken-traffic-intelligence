[繁體中文](README.zh-HK.md)

# HK Traffic Intelligence

This is a Hong Kong Smart City project. It puts the live city on one map: harbour crossings, roads, trains, Light Rail, buses, weather, and the land control points.

On a Friday evening the three harbour crossings publish their minutes, the strategic roads change colour as traffic settles, and a train keeps moving along the line you take home. The Light Rail runs on its own tracks through Tuen Mun, Yuen Long, and Tin Shui Wai. KMB, Long Win, and Citybus publish the next bus at the stop. The Observatory raises a warning when the weather turns. The Immigration Department publishes the wait at the land control points.

Those Smart City figures were already public. This map reads them together. It does not give driving directions. It is here because the Transport Department, HKeMobility, the Immigration Department, the Observatory, MTR, KMB, Long Win, and Citybus already release the numbers, and a person should be able to see that smart city as one place.

Open it at [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev). There is no account. The page opens in Traditional Chinese, the written Chinese of Hong Kong, and English sits beside the clock.

[![Live demo](https://img.shields.io/badge/▶_Open_the_map-hktraffic.keith--li.workers.dev-0891b2?style=for-the-badge)](https://hktraffic.keith-li.workers.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/keithligh/hk-traffic-intelligence?style=for-the-badge)](https://github.com/keithligh/hk-traffic-intelligence)

![Hong Kong traffic map: satellite view, coloured strategic roads, live harbour minutes, and the header](docs/board.png)

If this Smart City map saves you a crossing, or you want more people to find it, please [star the repository](https://github.com/keithligh/hk-traffic-intelligence). A star is how the project gets seen, and it is the most direct way to support the work.

## The smart city on this map

The Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing show the journey time measured on a real approach. Strategic roads use the Transport Department classes of Good, Average, and Bad, and a live speed appears where one has been published. You can open the public cameras, including the tunnel mouths, and follow road works on the faster roads, the toll points at the harbour crossings and Tai Lam Tunnel, and special traffic news that is still open.

The eight land control points show the passenger halls, for residents and visitors, arriving and departing, together with the live speed on the strategic road that leads to that port. Lo Wu is a passenger crossing, and the published figures do not include a queue for private cars. Every Hong Kong Observatory warning in force is listed. On a quiet day the site still gives the temperature at the Observatory and whether rain fell in the past hour.

The MTR draws its lines and moves each train from the next-train minutes, destination, and platform that MTR publishes. The Light Rail does the same on its own routes: the track is on the map, and the train moves along it from the minutes published for those stations. KMB and Long Win show the published arrival at a stop, including a trip shown as scheduled. Long Win on this feed is the airport and Tung Chung work, including the A, E, and S routes. Citybus shows the published arrival at its stops, on Hong Kong Island and on the routes it runs elsewhere.

When several of these need attention at once, the site puts them in order, starting with an open traffic notice, a road classed as bad, a hall that is very busy, or a weather warning.

Hong Kong publishes much more open data than this Smart City map uses. What you see here is the traffic, border, weather, MTR, Light Rail, KMB, Long Win, and Citybus information named further down.

## Open source

The code for this Smart City map is open source under the [MIT License](LICENSE). Clone it, run it, change it, and fork it. If you fork or reuse the work, please keep the copyright notice and credit [HK Traffic Intelligence](https://github.com/keithligh/hk-traffic-intelligence) and [Keith Li](https://github.com/keithligh).

You need Node.js 22.

```bash
git clone https://github.com/keithligh/hk-traffic-intelligence.git
cd hk-traffic-intelligence
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 4317 |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | The Cloudflare-oriented dev server on port 4318 |
| `npm run deploy:vinext` | Deploy the worker, when Cloudflare credentials are available |

The application is written with Next.js, React, MapLibre GL, and Tailwind CSS, and the public site runs as a Cloudflare Worker.

## One shared copy

Anyone who opens the public site reads a shared copy of each feed, kept on Cloudflare for that city. Trains are renewed about every fifteen seconds, KMB and Long Win about every thirty seconds, and Citybus and the other feeds about once a minute. While a copy is still current, the next visitor is served from it. A fresh request goes to the organisation that publishes the feed only when that copy is ready to be renewed, so many people can read the map while the site stays with the pace of the figures those organisations already release.

## Where the numbers come from

Each row is one part of the map and the publication it comes from. This is only what the map uses.

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
| The next Light Rail train | [Light Rail next train](https://data.gov.hk/en-data/dataset/mtr-lrnt_data-light-rail-nexttrain-data) |
| The next KMB or Long Win arrival | [Estimated time of arrival for KMB and LWB](https://data.etabus.gov.hk/v1/transport/kmb/stop) |
| The next Citybus arrival | [Citybus next bus](https://data.gov.hk/en-data/dataset/ctb-eta-transport-realtime-eta) |
| Warnings, temperature, and rainfall | Hong Kong Observatory [warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [regional weather report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| Street map and buildings | [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) and [OSM Liberty](https://github.com/maputnik/osm-liberty), served by [OpenFreeMap](https://openfreemap.org), from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and [OpenMapTiles](https://openmaptiles.org/) |
| Satellite photograph | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

## Author

[Keith Li](https://www.linkedin.com/in/keithlihk) made this Smart City map for Agentic Engineer classes, for public talks, and for guest lectures. It exists because the Transport Department, the Immigration Department, the Observatory, MTR, KMB, Long Win, Citybus, and the teams behind HKeMobility already publish these figures for the public.

If you have used the map, please [star the repository](https://github.com/keithligh/hk-traffic-intelligence). That star is how the next person finds this Smart City project.

Keith is on [LinkedIn](https://www.linkedin.com/in/keithlihk) and [GitHub](https://github.com/keithligh).
