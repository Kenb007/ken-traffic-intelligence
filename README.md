[繁體中文](README.zh-HK.md)

# HK Traffic Intelligence

A smart city dashboard for Hong Kong. It reads the open data APIs the city already publishes, and draws them as one live picture of the place.

The board is running at [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev). You do not need an account, and you do not need to install anything to look.

![The harbour crossings, the coloured roads, the cameras, and the evening’s warnings on one screen](docs/board.png)

Open it and the harbour is the first reading. The Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing each carry a number of minutes. The colour of that number is how the journey is going. In the same row you can see an incident that is still open, the passenger halls at the eight land control points, every Observatory warning that is in force, and the speed of the strategic road network as a whole. A slow crossing means something different on a morning when the whole city is slow. The number on its own cannot say that. The row can.

Under the row, the map is the city. The roads are coloured the way the Transport Department colours them. The cameras can be opened. The works on the fast roads are marked. The tunnels are there to be found. Click a crossing and the map moves to the approach that produced the minutes.

This is a dashboard for reading the city, and for showing how public APIs become a picture a person can use. It is not a navigation aid for someone driving. The board opens in Traditional Chinese, the written Chinese of a Hong Kong notice. English is beside the clock.

[What is on the screen](#what-is-on-the-screen) · [Run it](#run-it) · [Where the numbers come from](#where-the-numbers-come-from) · [How it was made](#how-it-was-made)

## What is on the screen

**The three harbour crossings.** Each minute-count is the journey time from a real approach road, not a guess painted on the tunnel. Click it and you are taken to that approach. From there the card names the road, the direction, what it is near, and the minutes to each crossing that the board is measuring. Green is an ordinary run. Amber is a delay that has settled in. Red is a crossing that has turned.

**The strategic roads, in the department’s own words.** On the English board those words are Good, Average, and Bad. Good is a road that is moving. Average is a road that has settled into a delay. Bad is a road that has stopped behaving like a road. The colour is the Transport Department’s saturation class, taken from the live feed. Where a segment has no class, the dashboard falls back to the speed itself: under 30 km/h, from 30 to 50, and 50 or faster. The legend does not pretend those bands are the official names.

**The cameras.** These are the public snapshots the Transport Department already publishes, including the ones at the mouths of the tunnels. Harbour cameras and tunnel-mouth cameras stay on the map while you are still zoomed out. The rest of the city appears as you come closer. Click a camera and the card separates what the feed had glued into one English sentence: the road, the direction, the place it is near, the district, the region, which way the lens is facing, and the camera number. Then the still image. The Traditional Chinese name comes from the department’s own Chinese layer, not from a translation invented for the card.

**The eight land control points.** The Immigration Department publishes the passenger hall at each of them: residents and visitors, arriving and departing. The vehicle line beside that is the live speed on the strategic road that feeds the port, which is as much as the public speed API can say. Lo Wu reports the hall. It is a passenger crossing. The public file has no private-car queue, so the card leaves that blank rather than inventing one.

**The weather.** Every Observatory warning in force is listed, and a severe one is placed where it will be seen. When the sky is quiet, the row still shows the temperature at the Observatory and whether the past hour brought rain. The city and the sky are on the same board because a warning changes how you read a slow road.

**The list of what the feeds are saying.** The panel on the lower right has already sorted what is worth reading first: an open incident, a road that has gone bad, a hall that is very busy, a warning. You can hide it. It becomes a line moving along the bottom, so the urgent items stay in view while you look at the map. Along that edge you can change the ground under the roads — the satellite picture, a street map, or the buildings stood up — and you can turn the speeds, the cameras, the works, the tunnels, the incidents, and the control points on and off. The buildings button toggles. Press it again and you are back on the map you had.

## Run it

The public copy is [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev).

To run it yourself you need Node.js. From this folder:

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4317](http://127.0.0.1:4317).

If you are changing the dashboard, add `?feed=down` and you can see the screen when the speed API fails. Add `?map=down` and the bar stays up while the map is absent. The numbers are meant to stand on their own. A map that did not start is not a reason to hide the city.

## Where the numbers come from

Every number on the screen comes from an open data API Hong Kong had already published. The departments publish them as separate feeds, for separate pages. The work of this dashboard is to read those feeds and draw them as one city.

The roads are the Transport Department’s strategic centreline. The file is stored in Hong Kong 1980 grid coordinates. Plot those numbers on a modern map and every road sits a little up and to the left of the real street. The Lands Department published the correction for the whole territory: add 8.8 arcseconds of longitude, and subtract 5.5 arcseconds of latitude. After that, the line lies on the road. The colour is the department’s saturation class. The hills under the satellite picture are the public Terrarium surface, smoothed so that a tile only a few metres wide does not turn a small radar jump into a cliff. If that surface fails to arrive, the map stays pitched over the satellite image, and the bar is still there.

| What you are looking at | The open data |
| --- | --- |
| Which strategic roads are moving, and the official colour of that movement | [Traffic data of strategic and major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads), classed on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The geometry of those roads | [Road Network, second generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| How many minutes the three harbour crossings are taking | Journey-time boards on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The public cameras, in English and in Traditional Chinese | Snapshot layers on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
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
