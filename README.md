[繁體中文](README.zh-HK.md)

# HK Traffic Intelligence

A live board for the minute you have to choose a way across Hong Kong harbour.

![The harbour crossings, the coloured roads, the cameras, and the evening’s warnings on one screen](docs/board.png)

Someone has to be on the other side. The clock is not kind, and the person driving asks which tunnel. You know the three names. What you need, in that minute, is the number. The Transport Department publishes the minutes. HKeMobility publishes the roads, the cameras, and the works. The Observatory publishes the warning that changes the same decision. If the question is further north, the Immigration Department publishes how the passenger halls are doing. Each of those lives on its own page. This board reads the public files and puts the decision on one screen.

[What is on the screen](#what-is-on-the-screen) · [Run it](#run-it) · [Where the numbers come from](#where-the-numbers-come-from) · [How it was made](#how-it-was-made)

## What is on the screen

**The three crossings, with their minutes.** The Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing sit at the top. The colour of each number tells you whether that delay is ordinary or whether it has turned. An open incident sits in the same row, because a crash on the approach is the thing you needed to hear before you committed to the tunnel. At the far end is the speed of the strategic network as a whole, so you can tell a bad tunnel from a morning when the whole city is slow. You click the crossing you are considering, and the map moves to the road that produced the number.

**The roads, in the department’s own colours.** 暢順, when the road is moving. 緩慢, when it has settled into a delay. 擠塞, when it has stopped being a road and become a place you sit. The colour is the word the Transport Department already uses for that road.

**The cameras, so you can look.** The public snapshots around the harbour stay on the map while you are still zoomed out, and so do the cameras at the mouths of the tunnels, which are the pictures people actually want when they are deciding whether to enter. You click the cone and the still image loads.

**The eight land control points.** For each of them the Immigration Department says how the passenger hall is doing, for residents and for visitors, coming in and going out. Beside that, the vehicle side is the live speed on the strategic road that feeds the port. That is what the public speed feed can honestly say about cars. Lo Wu tells you about the hall. It is a passenger crossing. The public file has no private-car queue, so the board leaves that blank.

**The weather, on the same row.** Every Observatory warning that is in force is listed, and a severe one is placed where you will see it. When the sky is quiet, you still see the temperature at the Observatory and whether the past hour brought rain.

**A list, when you want the list.** The card on the lower right has already sorted what is worth reading first. You can hide it. It becomes a line moving along the bottom, so the urgent items stay in your eye while you look at the city. Along that edge you can change the ground under the roads: the satellite picture, a flat street map, or the buildings stood up. You can turn the speeds, the cameras, the works, the tunnels, the incidents, and the control points on and off.

The words on the screen are written the way a Hong Kong notice is written. The board opens in Traditional Chinese. English is beside the clock.

## Run it

You need Node.js. From this folder:

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4317](http://127.0.0.1:4317).

If you are working on the board, add `?feed=down` and you can see the screen when the speed feed fails. Add `?map=down` and the bar stays up while the map is absent. The numbers stand on their own.

## Where the numbers come from

None of this was measured by a private system. The departments had already published it, as separate files, for separate readers. What this board does is read those files and draw them as one city.

The roads are the Transport Department’s strategic centreline. The file is stored in Hong Kong 1980 latitude and longitude. Plot those numbers on a modern map and every road sits a little up and to the left of the real street. The Lands Department published the correction for the whole territory: add 8.8 arcseconds of longitude, and subtract 5.5 arcseconds of latitude. After that, the line lies on the road. The colour of the line is the department’s own saturation class. When a segment has no class, the board falls back to a plain reading: under 30 km/h, between 30 and 50, and 50 or faster. The hills under the satellite picture are the public Terrarium surface, smoothed so that a tile only a few metres wide does not turn a small radar jump into a cliff. If that surface fails to arrive, the map stays pitched over the satellite image, and the bar is still there.

| What you are looking at | Where Hong Kong published it |
| --- | --- |
| Which strategic roads are moving, and the official colour of that movement | [Traffic data of strategic and major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads), classed on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The geometry of those roads | [Road Network, second generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| How many minutes the three harbour crossings will take from the approach you are on | Journey-time boards on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| A look at the road, including outside the tunnels | Public cameras on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Who has a fast road opened up | Road works on [HKeMobility](https://www.hkemobility.gov.hk/en/), for roads with a limit of 70 km/h or above |
| Where the tunnel itself is | Toll points on [HKeMobility](https://www.hkemobility.gov.hk/en/) for the three harbour crossings and Tai Lam Tunnel |
| What has just gone wrong | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| A handful of detectors on lampposts in the urban area | [Smart lamppost traffic detectors](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| Whether the passenger hall will hold you | [Land boundary control point waiting time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time), from the Immigration Department |
| Whether the weather should change the plan | The Observatory’s [warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [current weather report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| A street map, and buildings you can pitch | [OpenStreetMap](https://www.openstreetmap.org/copyright) and [OpenFreeMap](https://openfreemap.org) |
| The photograph of the ground | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

## How it was made

I built this in twenty-four hours of spare time. I want to be plain about what that means, because “twenty-four hours” is easy to hear as a sprint, a locked door, a person who did nothing else. It was spare time, the kind that arrives in pieces, and I was giving the work only part of my attention while I was in it. I would come back, look at the harbour, notice that a road had been drawn in the wrong place, go and do something else, and come back again.

Grok was the other pair of hands. I would say what I was trying to see, and we would go and find whether the public feed actually contained it. A lot of the day was that kind of argument. The crossings became obvious once I admitted I kept wanting them. The cameras at the tunnel mouths took longer, because they were in the public list and still easy to miss on the map. The control points were the same question asked at the boundary: the same decision, with passengers in the hall and vehicles on the road that leads there. The weather stayed, because I wanted the warning to be in front of a person before the tunnel was chosen.

I began with a picture of the harbour. That was the decision I could not get from a single government page. The rest arrived because each new thing was another way of asking it. A day of spare time, with only part of my attention, and with Grok, was enough to put them on one screen. The data had been public the whole time. What it needed was someone willing to sit with it.

[Keith Li](https://www.linkedin.com/in/keithlihk)
