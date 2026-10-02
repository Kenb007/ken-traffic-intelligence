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

打開網頁，最先見到的數字是三條過海隧道。紅磡海底隧道、東區海底隧道和西區海底隧道，顯示的是在真實進路上量度的行車時間。顏色跟隨該段行程。平常的行程維持綠色，已經形成的延誤轉為黃色，情況有變的過海路則轉為紅色。你點選其中一個時間，地圖便移到量度該時間的進路，卡片會告訴你是哪一條路、車流向哪個方向、附近是什麼地方，以及該進路所量度的每一條隧道當時要多少分鐘。

這些時間之下是策略性道路，用運輸署公布的暢順、緩慢和擠塞來著色。某一小段沒有這個等級時，顏色改以該段車速來表示。路段有實時車速時，圓點會沿路移動，快慢與車速相符，而且只在車速圖層開啟時才出現。

快拍是已經向公眾公布的畫面，包括隧道口。海港一帶和隧道口的快拍，在你尚未放大時仍然留在地圖上，其餘地方則隨你拉近才出現。打開一張快拍，會先看到它的位置和鏡頭朝向，然後才是畫面本身。在同一幅地圖上，你亦可以開啟較快速道路的工程、過海隧道和大欖隧道的收費點，以及尚未結束的特別交通消息。

八個陸路管制站是旅客大堂，分居民與訪客、入境與出境。每個大堂旁邊的車輛讀數，是通往該口岸的策略性道路的實時車速。羅湖供旅客過關，已公布的數字不包括私家車輪候，所以卡片該部分留空。頂端的天氣一列，列出所有生效中的天文台警告。當天沒有警告時，仍會顯示天文台的氣溫，以及過去一小時有沒有下雨。

港鐵一層跟隨港鐵公布的下一班車，包括還有多少分鐘、開往哪裏，以及使用哪個月台。路軌上的圓點，是把那些分鐘沿路線往回推算得出的位置，卡片會寫明它落在哪兩個站之間。輕鐵不在這一層。九巴跟隨九巴公布的到站時間，列為原定班次的亦留在班次表上。這些時間是按車站公布的，所以你把地圖拉近、看到畫面中間附近時，車站才會出現。

若同時有幾項事情值得留意，地圖旁邊的清單會把它們排好次序，先是尚未結束的交通消息、運輸署列為擠塞的道路、非常繁忙的旅客大堂，或天氣警告。收起清單之後，這些事項仍留在畫面上，改為沿底部顯示。底圖可以保持衛星照片，也可以換成 OSM Bright 街道圖，或用 OSM Liberty 把樓宇立起來。再選一次樓宇，便回到剛才的地圖；在樓宇畫面中，標籤位於屋頂之下。

你看到的，是本頁稍後說明的交通、口岸、天氣、港鐵和九巴資料。香港公開的數據，遠多於這幅地圖所用的部分。

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

地圖底部用來選擇你要看的內容。你可以保留 Esri 的衛星照片。畫面保持平坦，著色的道路才落在街上。你也可以改用 [OpenFreeMap](https://openfreemap.org) 提供的 [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) 街道圖，或用 [OSM Liberty](https://github.com/maputnik/osm-liberty) 把樓宇立起來，再選一次便回到剛才的地圖。其餘控制用來顯示或隱藏車速、快拍、工程、隧道、交通消息、陸路管制站、港鐵和九巴。

| 指令 | 作用 |
| --- | --- |
| `npm run dev` | 在 4317 埠啟動 Next.js |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | 在 4318 埠啟動面向 Cloudflare 的開發伺服器 |
| `npm run deploy:vinext` | 在已有 Cloudflare 憑證時部署 Worker |

若要查看車速資料未能讀取時的畫面，可在網址加上 `?feed=down`。若要在地圖不顯示時仍保留頂端那一列，可加上 `?map=down`。程式以 Next.js、React、MapLibre GL 和 Tailwind CSS 撰寫，公開網站以 Cloudflare Worker 提供。

## 同一份資料

任何人打開公開網站，讀到的都是每一項資料的共用副本，按 Cloudflare 的城市存放。副本大約跟隨畫面本身的節奏更新：港鐵約十五秒，九巴約三十秒，其餘約一分鐘。副本仍然有效時，下一位訪客讀的就是這份副本。只有在副本需要更新時，才會向公布資料的機構再讀取一次。這樣，網站可以給很多人同時閱讀，同時保持在這些已公布資料本身的更新節奏之內。

## 數字從哪裏來

策略性道路依運輸署的中心線繪製。檔案用香港 1980 坐標，再用地政總署公布的全港改正來移動，即經度加 8.8 角秒、緯度減 5.5 角秒，使道路線落在路面上。

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
