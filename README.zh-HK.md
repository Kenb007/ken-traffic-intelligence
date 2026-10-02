[English](README.md)

# HK Traffic Intelligence

香港的智慧城市工作，已經把實時交通資料向公眾開放。運輸署公布策略性道路的車速和過海隧道的行車時間。HKeMobility 公布快拍、道路工程和特別交通消息。入境事務處公布陸路管制站的輪候時間。香港天文台公布天氣警告。港鐵和九巴公布下一班車。

這幅地圖把這些已公布的資料放在同一個畫面閱讀，讓官方的數字可以一併查看。它不提供行車路線。它用來留心城市的交通情況，也用來展示這些機構已經公開的數據。

網站在 [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev)。不需要帳戶。畫面以繁體中文開啟，用的是香港通告的書面中文；英文在時鐘旁邊。

[![實時示範](https://img.shields.io/badge/▶_開啟_live_board-hktraffic.keith--li.workers.dev-0891b2?style=for-the-badge)](https://hktraffic.keith-li.workers.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

![香港交通地圖：衛星底圖、著色道路，以及頂端的實時讀數](docs/board.png)

如果你覺得這幅地圖有用，請在 GitHub [按 star](https://github.com/keithligh/hk-traffic-intelligence)。Star 會讓更多人發現這個開源的香港智慧城市地圖，也是支持這個項目最直接的方法。

## 這個網站做什麼

你可以查看紅磡海底隧道、東區海底隧道和西區海底隧道的行車時間，時間在真實的進路上量度。你可以按運輸署的暢順、緩慢和擠塞閱讀策略性道路，並在已公布車速的路段看到該車速。你可以打開公共快拍，包括隧道口的快拍，亦可查看較快速道路的工程、過海隧道和大欖隧道的收費點，以及尚未結束的特別交通消息。

在八個陸路管制站，你可以查看旅客大堂的情況，分居民與訪客、入境與出境，並一併看到通往該口岸的策略性道路車速。羅湖供旅客過關，已公布的數字不包括私家車輪候。你亦可以查看所有生效中的香港天文台警告。當天沒有警告時，網站仍會提供天文台的氣溫，以及過去一小時有沒有下雨。

港鐵方面，你可以查看已公布的下一班車，包括還有多少分鐘、開往哪裏，以及使用哪個月台。列車在兩站之間的位置，是按這些分鐘推算的。九巴方面，你可以查看某車站已公布的到站時間，包括列為原定班次的班次。

若幾項情況需要一併留意，網站會把它們排好次序，先是尚未結束的交通消息、列為擠塞的道路、非常繁忙的旅客大堂，或天氣警告。

以上是本頁稍後說明的交通、口岸、天氣、港鐵和九巴資料。香港公開的數據，遠多於這個網站所用的部分。

## 開源

程式以 [MIT License](LICENSE) 開源。歡迎你自行安裝、修改，以及 fork。如果你 fork 或重用這些程式，請保留版權聲明，並致謝 [HK Traffic Intelligence](https://github.com/keithligh/hk-traffic-intelligence) 和 [Keith Li](https://github.com/keithligh)。

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

任何人打開公開網站，讀到的都是每一項資料的共用副本，按 Cloudflare 的城市存放。副本大約跟隨畫面本身的節奏更新：港鐵約十五秒，九巴約三十秒，其餘約一分鐘。副本仍然有效時，下一位訪客讀的就是這份副本。只有在副本需要更新時，才會向公布資料的機構再讀取一次。這樣，網站可以給很多人同時閱讀，同時保持在這些已公布資料本身的更新節奏之內。

## 數字從哪裏來

下表每一列都是畫面的一部分，以及它所採用的公布來源。表內只是這幅地圖用到的資料。香港整體公開的數據遠多於此。

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
| 下一班九巴 | [九巴及龍運的預計到站時間](https://data.etabus.gov.hk/v1/transport/kmb/stop) |
| 警告、氣溫和雨量 | 香港天文台的[警告摘要](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc)和[本港地區天氣報告](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc) |
| 街道圖和樓宇 | [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) 和 [OSM Liberty](https://github.com/maputnik/osm-liberty)，由 [OpenFreeMap](https://openfreemap.org) 提供，數據來自 [OpenStreetMap](https://www.openstreetmap.org/copyright) 貢獻者和 [OpenMapTiles](https://openmaptiles.org/) |
| 衛星照片 | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer)。影像 © Esri |

## 作者

[Keith Li](https://www.linkedin.com/in/keithlihk) 製作這幅地圖，用於 Agentic Engineer 的課堂、公開演講和大學客席講座。地圖之所以做得到，是因為運輸署、入境事務處、香港天文台、港鐵、九巴，以及負責 HKeMobility 的團隊，已經把這些數字向公眾公布。

如果這幅地圖對你有用，請在 GitHub [按 star](https://github.com/keithligh/hk-traffic-intelligence)。其他人就是這樣找到這個項目的。

你亦可以在 [LinkedIn](https://www.linkedin.com/in/keithlihk) 和 [GitHub](https://github.com/keithligh) 找到 Keith。
