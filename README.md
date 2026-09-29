# HK Traffic Intelligence

香港交通情報。三條過海隧道的行車時間、策略性道路車速、隧道口快拍、道路工程、交通意外、八個陸路管制站，以及生效中的天氣警告，同一畫面。

One live board for a Hong Kong trip. See which harbour crossing is moving, which strategic road is jammed, whether a land control point hall is busy, and whether a weather warning should change the plan. Public data. No account.

## What you get

**Pick a tunnel with the minutes in front of you.** Cross-Harbour, Eastern Harbour, and Western Harbour stay on the top bar. Click one and the map flies to the approach that produced that time.

**See the roads the Transport Department already classes as bad.** Strategic routes are drawn in the official colours: 暢順, 緩慢, 擠塞. Network speed sits at the end of the bar.

**Look through the public cameras, including the ones outside the tunnels.** Harbour cameras and tunnel-portal cameras stay visible while you are zoomed out. Click a cone for the snapshot.

**Check the land boundary, not only the harbour.** Eight control points. Passenger halls for residents and visitors, arrival and departure. Vehicle flow is the live speed on the strategic road that feeds the port.

**Read the warning that changes the drive.** Every Hong Kong Observatory warning in force is listed. Temperature and past-hour rain stay on the weather tab, and on the bar when no warning is up.

**Use it in written Chinese.** The board opens in Hong Kong written Traditional Chinese. Switch to Simplified Chinese or English from the control beside the clock.

The intel card ranks what needs a look first. Hide turns that list into a marquee. The bottom switches change the basemap (satellite, streets, 3D buildings) and turn speed, cameras, works, tunnels, incidents, and control points on or off.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

`?feed=down` shows the board when the speed feed fails. `?map=down` keeps the bar on screen without the map.

## Where the picture comes from

Road lines use the Transport Department strategic-road centreline, shifted from Hong Kong 1980 onto WGS84 with the Lands Department constants (longitude +8.8 arcseconds, latitude −5.5 arcseconds). Colour is the official saturation class. A segment with no class falls back to 50 km/h and 30 km/h. Elevation is the public Terrarium surface, smoothed so street-level tiles do not turn into cliffs. If that proxy fails, the map stays pitched over the satellite image.

| What you see | Source |
| --- | --- |
| Strategic-road speed and colour | [Traffic data of strategic / major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads) and the [HKeMobility](https://www.hkemobility.gov.hk/en/) saturation class |
| Road geometry | [Road Network, 2nd generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| Harbour crossing minutes | [HKeMobility](https://www.hkemobility.gov.hk/en/) journey-time boards |
| Cameras | [HKeMobility](https://www.hkemobility.gov.hk/en/) public snapshots |
| Road works | [HKeMobility](https://www.hkemobility.gov.hk/en/) lane closures on roads of 70 km/h or above |
| Tunnels | [HKeMobility](https://www.hkemobility.gov.hk/en/) toll points for the three harbour crossings and Tai Lam Tunnel |
| Open incidents | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| Lamppost speeds | [Smart lamppost detectors](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| Control-point halls | [Immigration Department waiting time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) |
| Weather | [Observatory warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [current weather](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| Streets and buildings | [OpenStreetMap](https://www.openstreetmap.org/copyright) and [OpenFreeMap](https://openfreemap.org) |
| Satellite | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

Lo Wu is a passenger crossing and has no vehicle approach on the strategic-road feed. Private-car queue counts are not in the public Immigration file.

## How this was built

Keith Li built this in 24 hours of spare time, without full focus, using Grok.

Designed and created by [Keith Li](https://www.linkedin.com/in/keithlihk).
