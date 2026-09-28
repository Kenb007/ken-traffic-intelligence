# Harbour corridors

A Hong Kong smart-city view for the Transport Department open data Keith Li asked to study. It draws live strategic-road speeds as moving traffic over Esri satellite imagery, with a short flyover of Victoria Harbour. An operations strip across the top shows the fastest minute to each harbour crossing, the network speed, and a Hong Kong clock. Journey-time boards sit on the map as minute counts, and a notice line runs along the bottom.

No account, no database, and no Mapbox or Cesium ion token. Elevation comes from the public AWS Terrarium tiles. Those tiles do not send a browser CORS header, so the app proxies them at `/api/dem/{z}/{x}/{y}.png`. If that proxy fails, the map drops terrain and stays pitched over the satellite imagery.

## Run

```bash
npm install
npm run dev
```

The dev server listens on `0.0.0.0:4317`. Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

Add `?feed=down` to force the speed request to fail. The panel shows the error and the satellite map stays up. Add `?map=down` to skip the map. Speeds, journey time, and notices stay on screen.

## What the map uses

Road names stay as published, usually Traditional Chinese. The interface copy is English. Speed colours are for this view: free-flow is 50 km/h or faster, slow is 30–49, congested is under 30. They are not an official Transport Department legend.

| Source | Record | What this app uses it for |
| --- | --- | --- |
| Traffic notices | [hk-td-tis_22-traffic-notices](https://data.gov.hk/en-data/dataset/hk-td-tis_22-traffic-notices) | Special arrangements, temporary closures, expressways, and temporary speed limits in the side list. |
| Road Network (2nd generation) | [hk-td-tis_15-road-network-v2](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) | Revision date only. The centreline (about 125 MB KMZ, 486 MB GML) is not drawn. |
| Traffic Data Analytics System | [hk-td-tis_28-traffic-data-tdas](https://data.gov.hk/en-data/dataset/hk-td-tis_28-traffic-data-tdas) | One shortest-time forecast, using the sample coordinates in the TDAS specification. The response has route ids, not a line. |
| Traffic Data of Strategic / Major Roads | [hk-td-sm_4-traffic-data-strategic-major-roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads) | Detector coordinates, raw lane speeds (about every minute), and processed segment speeds (about every two minutes). Moving particles follow the detector chains. |
| Journey time indicators (2nd generation) | [hk-td-sm_8-journey-time-indicators-v2](https://data.gov.hk/en-data/dataset/hk-td-sm_8-journey-time-indicators-v2) | Related live feed from the same strategic-roads theme. Harbour indicator rows and the citywide colour tally. |
| HKeMobility journey-time boards | [HKeMobility](https://www.hkemobility.gov.hk/en/) | Board positions and live minutes to the Cross Harbour Tunnel, Eastern Harbour Crossing, and Western Harbour Crossing. The map pill is the fastest of those three. |

Basemap tiles are [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) with the Esri reference overlay for place names. Imagery © Esri.
