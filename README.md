[繁體中文](README.zh-HK.md)

# HK Traffic Intelligence

A smart city dashboard for Hong Kong, built on the open data APIs the city already publishes.

![The harbour crossings, the coloured roads, the cameras, and the evening’s warnings on one screen](docs/board.png)

Hong Kong already measures itself in public. The Transport Department publishes the harbour crossings, the strategic roads, the cameras, the works, and the incidents. The Immigration Department publishes the eight land control points. The Observatory publishes the warnings and the weather. Each of those is an open data API, and each of them was built to feed its own page. This dashboard reads those APIs and draws them as one city, so the live state of the place is visible together: how the crossings are moving, how the roads are coloured, what the cameras show, how the boundary halls are doing, and what the weather is doing over all of it.

[What is on the screen](#what-is-on-the-screen) · [Run it](#run-it) · [Where the numbers come from](#where-the-numbers-come-from) · [How it was made](#how-it-was-made)

## What is on the screen

**The live state, across the top.** The Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing sit there with their minutes, and the colour of each number says whether that delay is ordinary or whether it has turned. An open incident sits in the same row. At the far end is the speed of the strategic network as a whole, so a slow crossing can be read against a morning when the whole city is slow. Click a crossing and the map moves to the approach that produced the number.

**The roads, in the department’s own colours.** Good, when the road is moving. Average, when it has settled into a delay. Bad, when it has stopped being a road and become a place the city is sitting in. Those are the Transport Department’s saturation levels, and they are the words on the English board.

**The cameras, so the city can be seen.** The public snapshots around the harbour stay on the map while you are still zoomed out, and so do the cameras at the mouths of the tunnels. Click the cone and the still image loads. A number says what the feed measured. The picture says what the road looks like.

**The eight land control points.** For each of them the Immigration Department publishes how the passenger hall is doing, for residents and for visitors, coming in and going out. Beside that, the vehicle side is the live speed on the strategic road that feeds the port, which is what the public speed API can say about vehicles. Lo Wu reports the hall. It is a passenger crossing. The public file has no private-car queue, so the dashboard leaves that blank.

**The weather, on the same row.** Every Observatory warning that is in force is listed, and a severe one is placed where it will be seen. When the sky is quiet, the dashboard still shows the temperature at the Observatory and whether the past hour brought rain.

**A ranked list of what the feeds are saying.** The card on the lower right has already sorted what is worth reading first. You can hide it. It becomes a line moving along the bottom, so the urgent items stay in view while you look at the city. Along that edge you can change the ground under the roads: the satellite picture, a flat street map, or the buildings stood up. You can turn the speeds, the cameras, the works, the tunnels, the incidents, and the control points on and off.

The words on the screen are written the way a Hong Kong notice is written. The board opens in Traditional Chinese. English is beside the clock.

## Run it

You need Node.js. From this folder:

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4317](http://127.0.0.1:4317).

If you are working on the dashboard, add `?feed=down` and you can see the screen when the speed API fails. Add `?map=down` and the bar stays up while the map is absent. The numbers stand on their own.

## Where the numbers come from

Every number on the screen comes from an open data API Hong Kong had already published. The departments publish them as separate feeds, for separate readers. What this dashboard does is read those feeds and draw them as one city.

The roads are the Transport Department’s strategic centreline. The file is stored in Hong Kong 1980 latitude and longitude. Plot those numbers on a modern map and every road sits a little up and to the left of the real street. The Lands Department published the correction for the whole territory: add 8.8 arcseconds of longitude, and subtract 5.5 arcseconds of latitude. After that, the line lies on the road. The colour of the line is the department’s own saturation class. When a segment has no class, the dashboard falls back to a plain reading: under 30 km/h, between 30 and 50, and 50 or faster. The hills under the satellite picture are the public Terrarium surface, smoothed so that a tile only a few metres wide does not turn a small radar jump into a cliff. If that surface fails to arrive, the map stays pitched over the satellite image, and the bar is still there.

| What you are looking at | The open data |
| --- | --- |
| Which strategic roads are moving, and the official colour of that movement | [Traffic data of strategic and major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads), classed on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The geometry of those roads | [Road Network, second generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| How many minutes the three harbour crossings are taking | Journey-time boards on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The public cameras, including the ones at the tunnel mouths | Cameras on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Where a fast road is opened up | Road works on [HKeMobility](https://www.hkemobility.gov.hk/en/), for roads with a limit of 70 km/h or above |
| Where the tunnel itself is | Toll points on [HKeMobility](https://www.hkemobility.gov.hk/en/) for the three harbour crossings and Tai Lam Tunnel |
| What has just gone wrong | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| A handful of detectors on lampposts in the urban area | [Smart lamppost traffic detectors](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| How the passenger halls at the land control points are doing | [Land boundary control point waiting time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time), from the Immigration Department |
| Warnings, temperature, and rain over the city | The Observatory’s [warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [current weather report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| A street map, and buildings you can pitch | [OpenStreetMap](https://www.openstreetmap.org/copyright) and [OpenFreeMap](https://openfreemap.org) |
| The photograph of the ground | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

## How it was made

I made this in twenty-four hours. The hours were spare, and they came out of other work. I was already running several AI coding projects at the same time. An agent takes a while. It writes, it thinks, it sits with a problem. While I wait for it, I switch to another project and keep moving. This dashboard is one of those switches.

I started it for two reasons that belong together. I wanted to experiment in Cursor, and see what Grok 4.7 could actually code. I also wanted a demonstration of how public APIs become a dashboard with a meaning, something I could put on a screen and talk through. Hong Kong already publishes the live city. The Transport Department has the crossings, the roads, the cameras, the works, and the incidents. The Immigration Department has the control points. The Observatory has the weather. The day was Grok 4.7 and me, reading those feeds until they were one picture.

The project is mainly for education. I am [Keith Li](https://www.linkedin.com/in/keithlihk), and I use this dashboard in my Agentic Engineer classes, in public talks, and in guest lectures at universities. The room gets the same lesson as the repository. An agent did a great deal of the coding. The data was already public. What you are looking at is a city, assembled from those APIs, that a person can read.
