# Harbour corridors

A Hong Kong traffic intelligence picture. Satellite imagery carries strategic-road speeds, journey-time boards, camera directions, road works, toll points, and open traffic incidents, plus the eight land control points. A short flyover stays over Victoria Harbour. The top bar is the overview: Hong Kong time, the three harbour crossing minutes, an open incident when one exists, passenger-hall status, weather, and network speed. Each of those readings can be clicked. A crossing moves the map to that approach. The others open the matching intel tab. The intel card has tabs for the ranked mix, roads, boundary halls, and weather. Harbour minutes stay on the bar, so they are not repeated as a tab. The ranked list keeps twelve items. Hide turns the open tab into a live marquee just above the credits. The map attributions stay at the lower right, and the credit line reads Designed and Created by Keith Li. Click a line to move the map there. Click a camera cone for the live snapshot, a work disc for the closure, a toll ring for the crossing, or an incident diamond for the special traffic news.

No account, no database, and no Mapbox or Cesium ion token. Elevation comes from the public AWS Terrarium tiles. On land that is the NASA SRTM radar surface measured in February 2000, about 30 metres across, published as Mapzen's tile set in 2017. It is not a current ground survey. Street-level tiles are only a few metres wide, so a 10–20 m radar jump becomes a cliff on flat ground in every district. The proxy removes anything above Tai Mo Shan, the highest mountain in Hong Kong at 957 m, and smooths the surface over about 140 m so flat districts stay flat. The map then draws height at true scale, and that summit stays the highest point. The tiles do not send a browser CORS header, so the app proxies them at `/api/dem/{z}/{x}/{y}.png`. If that proxy fails, the map drops terrain and stays pitched over the satellite imagery.

## Run

```bash
npm install
npm run dev
```

The dev server listens on `0.0.0.0:4317`. Open [http://127.0.0.1:4317](http://127.0.0.1:4317). The interface opens in Hong Kong written Traditional Chinese. The language control switches to Simplified Chinese or English.

Add `?feed=down` to force the speed request to fail. The status bar shows the fault and the satellite map stays up. Add `?map=down` to skip the map. Crossing minutes and network speed stay on screen.

Buttons along the bottom switch the picture between the pitched satellite view, a flat OpenStreetMap, and a pitched OpenFreeMap city with extruded buildings, and turn road speed, cameras, road works, toll points, and open incidents on and off. The speed key is the official class: good, average, and bad. The Boundary switch adds the eight land control points. Passenger arrival and departure come from the Immigration Department, about every 15 minutes. Vehicle flow is the live speed on the strategic road that feeds each port. Lo Wu is a passenger crossing and has no vehicle approach on that feed. Private-car queue counts are not in the public file.

## What the map uses

Road names stay as published, usually Traditional Chinese. The interface copy is English. Centreline colours are the Transport Department saturation class: good, average, and bad. A segment with no class falls back to 50 km/h and 30 km/h.

| Source | Record | What this app uses it for |
| --- | --- | --- |
| Traffic notices | [hk-td-tis_22-traffic-notices](https://data.gov.hk/en-data/dataset/hk-td-tis_22-traffic-notices) | Titles only, with no positions, so they are not drawn. |
| OpenStreetMap | [OpenStreetMap](https://www.openstreetmap.org/copyright) | Flat street map. The Streets button turns the pitched satellite picture off and draws this instead. © OpenStreetMap contributors. |
| OpenFreeMap buildings | [OpenFreeMap](https://openfreemap.org) | Pitched 3D buildings from OpenStreetMap heights, with no API key. The Buildings button zooms in and extrudes them. © OpenStreetMap © OpenMapTiles © OpenFreeMap. |
| Road Network (2nd generation) | [hk-td-tis_15-road-network-v2](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) | Centreline geometry for the strategic-road segments. `ROUTE_ID` matches the live segment id. Positions are Hong Kong 1980 latitude and longitude. The map adds 8.8 arcseconds of longitude and subtracts 5.5 arcseconds of latitude, the Lands Department constants, so the network sits on the WGS84 roads. |
| Traffic Data Analytics System | [hk-td-tis_28-traffic-data-tdas](https://data.gov.hk/en-data/dataset/hk-td-tis_28-traffic-data-tdas) | One shortest-time forecast, using the sample coordinates in the TDAS specification. The response has route ids, not a line, so it is not drawn. The three live crossing times on the bar are the harbour reading. |
| Traffic Data of Strategic / Major Roads | [hk-td-sm_4-traffic-data-strategic-major-roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads) | Processed segment speeds (about every two minutes) sit on the centreline. The line colour is the official saturation class from HKeMobility, good, average, or bad. Raw detector speeds remain the fallback if that geometry is missing. |
| Journey time indicators (2nd generation) | [hk-td-sm_8-journey-time-indicators-v2](https://data.gov.hk/en-data/dataset/hk-td-sm_8-journey-time-indicators-v2) | Related live feed from the same strategic-roads theme. Harbour indicator rows and the citywide colour tally. |
| HKeMobility journey-time boards | [HKeMobility](https://www.hkemobility.gov.hk/en/) | Board positions and live minutes to the Cross Harbour Tunnel, Eastern Harbour Crossing, and Western Harbour Crossing. The map pill is the fastest of those three. |
| HKeMobility speed map | [HKeMobility](https://www.hkemobility.gov.hk/en/) | Not drawn. The published image is a neon green, yellow, and red stroke with no speed key, and it sat on top of the detector lines. |
| HKeMobility cameras | [HKeMobility](https://www.hkemobility.gov.hk/en/) | Public snapshot points and facing direction. Harbour-district cameras, and cameras at a tunnel or toll portal, stay visible while zoomed out. Other cameras appear on a closer zoom. Clicking a cone loads the JPEG. |
| HKeMobility road works | [HKeMobility](https://www.hkemobility.gov.hk/en/) | Lane closures on roads with a speed limit of 70 km/h or above. Red is in progress, amber is under preparation. |
| HKeMobility toll points | [HKeMobility](https://www.hkemobility.gov.hk/en/) | Cross Harbour Tunnel, Eastern Harbour Crossing, Western Harbour Crossing, and Tai Lam Tunnel. |
| Smart lamppost detectors | [hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) | Live speed points for the 20 lamppost detectors in Yau Tsim Mong, Kwun Tong, and Wan Chai. |
| Special traffic news | [hk-td-tis_19-special-traffic-news-v2](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) | Open incidents. Latitude and longitude are often empty, so the road name is snapped to the centreline, beside the named landmark when that road is in the network. Closed incidents are not drawn. |
| Land boundary control point waiting time | [hk-immd-set28-land-boundary-control-points-waiting-time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) | Passenger hall status at the eight land control points, for residents and visitors, arrival and departure. The Boundary switch draws them. The Boundary tab lists every hall. Busy and very busy halls also enter the ranked list. |
| Weather Warning Summary | [Hong Kong Observatory](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) | Every warning in force, such as rainstorm, tropical cyclone, thunderstorm, and very hot weather. The Weather tab lists them all. A severe warning also enters the ranked list. |
| Current Weather Report | [Hong Kong Observatory](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) | Observatory temperature and the highest rainfall in the past hour. The top bar shows this when no warning is in force, and the Weather tab shows it either way. |

The Transport Department provider list also publishes red-light camera housings, speed-enforcement camera housings, and an annual junction blacksite list. Those are fixed sites or a yearly ranking, so they are not drawn. The official roadworks GeoJSON is the same set of works already on the map.

Basemap tiles are [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) with the Esri reference overlay for place names. Imagery © Esri.
