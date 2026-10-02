[English](README.md)

# HK Traffic Intelligence

香港的智慧城市工作，已經把實時交通資料向公眾開放。運輸署公布策略性道路的車速和過海隧道的行車時間。HKeMobility 公布快拍、道路工程和特別交通消息。入境事務處公布陸路管制站的輪候時間。香港天文台公布天氣警告。港鐵和九巴公布下一班車。

這幅地圖把這些已公布的資料放在同一個畫面閱讀，讓官方的數字可以一併查看。它不提供行車路線。它用來留心城市的交通情況，也用來展示這些機構已經公開的數據。

網站在 [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev)。不需要帳戶。畫面以繁體中文開啟，用的是香港通告的書面中文；英文在時鐘旁邊。

[![實時示範](https://img.shields.io/badge/▶_開啟_live_board-hktraffic.keith--li.workers.dev-0891b2?style=for-the-badge)](https://hktraffic.keith-li.workers.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

![香港交通地圖：衛星底圖、著色道路，以及頂端的實時讀數](docs/board.png)

如果你覺得這幅地圖有用，請在 GitHub [按 star](https://github.com/keithligh/hk-traffic-intelligence)。Star 會讓更多人發現這個開源的香港智慧城市地圖，也是支持這個項目最直接的方法。

## 畫面上有什麼

紅磡海底隧道、東區海底隧道和西區海底隧道各自顯示分鐘，分鐘來自真實的進路。綠色是平常的行程，黃色是已經形成的延誤，紅色是這條過海路已經變了。點一下讀數，地圖就移到那條進路。

策略性道路用運輸署的飽和等級著色：暢順、緩慢、擠塞。某一小段沒有等級時，顏色退回車速本身。有實時車速的路段上有流動的圓點；關掉車速，圓點一併消失。

快拍包括隧道口。海港一帶和隧道口的快拍，在尚未放大時就留在地圖上，其餘的要走近才出現。限速每小時七十公里或以上道路的工程、收費點，以及尚未結束的特別交通消息，各有自己的圖層。

八個陸路口岸顯示旅客大堂：居民和訪客，入境和出境。大堂旁邊的車輛讀數，是通往該口岸的策略性道路的實時車速。羅湖是旅客過關的地方，公開檔案沒有私家車輪候，那一欄就留空。

生效中的香港天文台警告全部列出。天色安靜時，這一列仍顯示天文台的氣溫，以及過去一小時有沒有下雨。

港鐵的到站分鐘、終點和月台，取自港鐵公布的下一班車。圓點把那些分鐘沿路軌往回推，卡片寫明它落在哪兩個站之間。輕鐵不在這一層。九巴顯示九巴公布的到站時間，原定班次也留在班次表上；把地圖拉近，才會看到畫面中間附近的車站。到站資料以車站為單位，所以地圖顯示車站。

旁邊的清單把值得先讀的事項排好：未結束的意外、擠塞的路、非常繁忙的大堂、警告。收起之後，同一批事項沿底部移動。

底圖可以在衛星照片、OSM Bright 街道圖，以及立起來的 OSM Liberty 樓宇之間切換。樓宇畫面裏，標籤和標記在屋頂之下。

畫面用下面列出的交通、口岸、天氣、港鐵和九巴資料。香港公開的數據，遠多於這一個畫面所用的部分。

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

底部一列用來換底圖和圖層。衛星是 Esri 的照片，畫面保持平坦，著色的道路才落在街上。街道是 [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style)，由 [OpenFreeMap](https://openfreemap.org) 提供。樓宇是 [OSM Liberty](https://github.com/maputnik/osm-liberty)，再按一次就回到剛才的地圖。其餘按鈕開關車速、快拍、工程、隧道、意外、管制站、港鐵和九巴。

| 指令 | 作用 |
| --- | --- |
| `npm run dev` | 在 4317 埠啟動 Next.js |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | 在 4318 埠啟動面向 Cloudflare 的開發伺服器 |
| `npm run deploy:vinext` | 在已有 Cloudflare 憑證時部署 Worker |

加上 `?feed=down`，可以看到車速數據失敗時的畫面。加上 `?map=down`，地圖不在的時候，頂端那一列仍在。程式用 Next.js、React、MapLibre GL 和 Tailwind CSS，以 Cloudflare Worker 提供。

## 同一份資料

公開網站為每一項資料保留一份共用副本，訪客讀的是這份副本。副本仍然有效時，新的訪客在這裡讀取。副本按 Cloudflare 的城市分開存放，有效時間和畫面的更新節奏一致：港鐵大約十五秒，九巴大約三十秒，其餘大約一分鐘。這個節奏跟隨已公布資料的更新，讓網站可以給很多人同時閱讀，並在需要新副本時才向各部門的伺服器讀取。

## 數字從哪裏來

道路形狀是運輸署的策略性中心線，檔案用香港 1980 坐標。地政總署公布的全港改正是經度加 8.8 角秒、緯度減 5.5 角秒。改完，線就落在路上。

| 畫面上的 | 開放數據 |
| --- | --- |
| 哪些策略性道路在走，以及官方的顏色 | [策略性道路及主要道路交通數據](https://data.gov.hk/tc-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads)，等級見 [HKeMobility](https://www.hkemobility.gov.hk/tc/) |
| 那些道路的形狀 | [道路網絡（第二代）](https://data.gov.hk/tc-data/dataset/hk-td-tis_15-road-network-v2) |
| 過海隧道的分鐘 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的行車時間 |
| 快拍，英文和繁體中文 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的快拍圖層 |
| 快速公路正在開挖的位置 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的道路工程 |
| 隧道的位置 | [HKeMobility](https://www.hkemobility.gov.hk/tc/) 的收費點 |
| 剛剛出了什麼事 | [特別交通消息](https://data.gov.hk/tc-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| 市區燈柱上的探測器 | [智慧燈柱交通探測器](https://data.gov.hk/tc-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| 陸路管制站的旅客大堂 | 入境事務處，[陸路管制站輪候時間](https://data.gov.hk/tc-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) |
| 下一班港鐵 | [下一班車](https://data.gov.hk/tc-data/dataset/mtr-data2-nexttrain-data)。車站位置是地政總署的[車站室內平面](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-indoor-mtr-station-map)。 |
| 下一班九巴 | [九巴及龍運預計到站時間](https://data.etabus.gov.hk/v1/transport/kmb/stop) |
| 警告、氣溫和雨 | 香港天文台的[警告摘要](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc)和[本港地區天氣報告](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc) |
| 街道圖和樓宇 | [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) 和 [OSM Liberty](https://github.com/maputnik/osm-liberty)，由 [OpenFreeMap](https://openfreemap.org) 提供，數據來自 [OpenStreetMap](https://www.openstreetmap.org/copyright) 貢獻者和 [OpenMapTiles](https://openmaptiles.org/) |
| 衛星照片 | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer)。影像 © Esri |

## 作者

[Keith Li](https://www.linkedin.com/in/keithlihk)。這幅地圖用在 Agentic Engineer 的課堂、公開演講，以及大學的客席講座。它之所以做得到，是因為運輸署、入境事務處、香港天文台、港鐵、九巴，以及 HKeMobility 背後的團隊，已經把資料公開。

如果你希望更多人看見這個項目，請 [按 star](https://github.com/keithligh/hk-traffic-intelligence)。

製作：[Keith Li](https://www.linkedin.com/in/keithlihk) / [GitHub](https://github.com/keithligh)
