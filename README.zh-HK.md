[English](README.md)

# HK Traffic Intelligence

這是一個香港智慧城市項目。它把這座城市的實時情況放在同一幅地圖上：過海隧道、道路、港鐵、輕鐵、巴士、天氣，以及陸路管制站。

星期五傍晚，三條過海隧道公布行車分鐘，策略性道路隨車流改變顏色，你回家的那條港鐵綫上有一班車在走。輕鐵有自己的路軌，穿過屯門、元朗和天水圍。九巴、龍運和城巴公布車站的下一班車。天氣轉壞時，天文台發出警告。入境事務處公布陸路管制站的輪候。

這些智慧城市的數字本來已經公開。這幅地圖把它們放在同一個畫面，讓你可以一起留意。它不提供行車路線。它之所以做得到，是因為運輸署、HKeMobility、入境事務處、香港天文台、港鐵、九巴、龍運和城巴已經把資料向公眾公布，而一個人應該可以把這個智慧城市看成同一個地方。

網站在 [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev)。不需要帳戶。畫面以繁體中文開啟，用的是香港通告的書面中文；英文在時鐘旁邊。

[![開啟地圖](https://img.shields.io/badge/▶_開啟地圖-hktraffic.keith--li.workers.dev-0891b2?style=for-the-badge)](https://hktraffic.keith-li.workers.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/keithligh/hk-traffic-intelligence?style=for-the-badge)](https://github.com/keithligh/hk-traffic-intelligence)

![香港交通地圖：衛星底圖、著色道路，以及頂端的實時讀數](docs/board.png)

如果這幅智慧城市地圖幫你少等一次過海，又或者你希望更多人看見它，請在 GitHub [按 star](https://github.com/keithligh/hk-traffic-intelligence)。Star 會讓這個項目被人看見，也是支持它最直接的方法。

## 這幅智慧城市地圖有什麼

紅磡海底隧道、東區海底隧道和西區海底隧道，顯示在真實進路上量度的行車時間。策略性道路用運輸署的暢順、緩慢和擠塞，已公布車速的路段會顯示該車速。你可以打開公共快拍，包括隧道口，亦可查看較快速道路的工程、過海隧道和大欖隧道的收費點，以及尚未結束的特別交通消息。

八個陸路管制站顯示旅客大堂，分居民與訪客、入境與出境，並一併看到通往該口岸的策略性道路車速。羅湖供旅客過關，已公布的數字不包括私家車輪候。生效中的香港天文台警告都會列出。天色平靜時，網站仍會提供天文台的氣溫，以及過去一小時有沒有下雨。

港鐵把路線畫在地圖上，並按已公布的下一班車分鐘、終點和月台移動列車。輕鐵同樣畫出路軌，列車按那些車站已公布的分鐘沿路移動。九巴和龍運顯示車站已公布的到站時間，包括列為原定班次的班次。這份資料裏的龍運，是機場和東涌一帶的服務，包括 A、E 和 S 線。城巴顯示其車站已公布的到站時間，包括港島和城巴行走的其他路線。

若幾項情況需要一併留意，網站會把它們排好次序，先是尚未結束的交通消息、列為擠塞的道路、非常繁忙的旅客大堂，或天氣警告。

香港公開的數據，遠多於這幅智慧城市地圖所用的部分。你在這裏看到的，是本頁稍後列出的交通、口岸、天氣、港鐵、輕鐵、九巴、龍運和城巴資料。

## 開源

這個智慧城市地圖的程式以 [MIT License](LICENSE) 開源。歡迎你複製、在本機運行、修改，以及 fork。如果你 fork 或重用這些程式，請保留版權聲明，並致謝 [HK Traffic Intelligence](https://github.com/keithligh/hk-traffic-intelligence) 和 [Keith Li](https://github.com/keithligh)。

需要 Node.js 22。

```bash
git clone https://github.com/keithligh/hk-traffic-intelligence.git
cd hk-traffic-intelligence
npm install
npm run dev
```

開啟 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

| 指令 | 作用 |
| --- | --- |
| `npm run dev` | 在 4317 埠啟動 Next.js |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | 在 4318 埠啟動面向 Cloudflare 的開發伺服器 |
| `npm run deploy:vinext` | 在已有 Cloudflare 憑證時部署 Worker |

程式以 Next.js、React、MapLibre GL 和 Tailwind CSS 撰寫，公開網站以 Cloudflare Worker 提供。

## 同一份資料

任何人打開公開網站，讀到的都是每一項資料的共用副本，按 Cloudflare 的城市存放。列車大約每十五秒更新，九巴和龍運大約每三十秒，城巴和其他資料大約每一分鐘。副本仍然有效時，下一位訪客讀的就是這份副本。只有在副本需要更新時，才會向公布該資料的機構再讀取一次。這樣，很多人可以同時閱讀這幅地圖，而網站仍跟隨這些機構本身公布資料的節奏。

## 數字從哪裏來

下表每一列都是地圖的一部分，以及它所採用的公布來源。表內只是這幅地圖用到的資料。

| 畫面上的 | 開放數據 |
| --- | --- |
| 策略性道路的車速和官方顏色 | [策略性道路及主要道路交通數據](https://data.gov.hk/tc-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads)，等級見 [HKeMobility](https://www.hkemobility.gov.hk/tc/) |
| 這些道路的形狀 | [道路網絡（第二代）](https://data.gov.hk/tc-data/dataset/hk-td-tis_15-road-network-v2) |
| 過海隧道的行車時間 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的行車時間 |
| 英文和繁體中文的快拍 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的快拍 |
| 道路工程 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的道路工程 |
| 收費點 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的收費點 |
| 特別交通消息 | [特別交通消息](https://data.gov.hk/tc-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| 智慧燈柱上的交通探測器 | [裝設於智慧燈柱的交通探測器](https://data.gov.hk/tc-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| 陸路管制站的輪候時間 | 入境事務處，[陸路管制站輪候時間](https://data.gov.hk/tc-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) |
| 下一班港鐵 | [下一班車](https://data.gov.hk/tc-data/dataset/mtr-data2-nexttrain-data)，車站位置來自地政總署的[車站室內平面](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-indoor-mtr-station-map) |
| 下一班輕鐵 | [輕鐵實時列車服務資訊](https://data.gov.hk/tc-data/dataset/mtr-lrnt_data-light-rail-nexttrain-data) |
| 下一班九巴或龍運 | [九巴及龍運的預計到站時間](https://data.etabus.gov.hk/v1/transport/kmb/stop) |
| 下一班城巴 | [城巴實時到站時間](https://data.gov.hk/tc-data/dataset/ctb-eta-transport-realtime-eta) |
| 警告、氣溫和雨量 | 香港天文台的[警告摘要](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc)和[本港地區天氣報告](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc) |
| 街道圖和樓宇 | [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) 和 [OSM Liberty](https://github.com/maputnik/osm-liberty)，由 [OpenFreeMap](https://openfreemap.org) 提供，數據來自 [OpenStreetMap](https://www.openstreetmap.org/copyright) 貢獻者和 [OpenMapTiles](https://openmaptiles.org/) |
| 衛星照片 | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer)。影像 © Esri |

## 作者

[Keith Li](https://www.linkedin.com/in/keithlihk) 製作這幅智慧城市地圖，用於 Agentic Engineer 的課堂、公開演講和大學客席講座。地圖之所以做得到，是因為運輸署、入境事務處、香港天文台、港鐵、九巴、龍運、城巴，以及負責 HKeMobility 的團隊，已經把這些數字向公眾公布。

如果你用過這幅地圖，請 [按 star](https://github.com/keithligh/hk-traffic-intelligence)。下一個人就是這樣找到這個智慧城市項目的。

Keith 的 [LinkedIn](https://www.linkedin.com/in/keithlihk) 和 [GitHub](https://github.com/keithligh)。
