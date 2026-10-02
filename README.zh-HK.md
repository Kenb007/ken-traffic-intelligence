[English](README.md)

# HK Traffic Intelligence

香港交通的實時地圖。畫面上的數字，全部來自這個城市已經公布的開放數據。

[![實時示範](https://img.shields.io/badge/live_demo-hktraffic.keith--li.workers.dev-0891b2)](https://hktraffic.keith-li.workers.dev)

儀表板在 [hktraffic.keith-li.workers.dev](https://hktraffic.keith-li.workers.dev)。不需要帳戶，也不需要安裝。

![香港交通儀表板：衛星地圖、著色道路，以及頂端的實時讀數](docs/board.png)

畫面以繁體中文開啟，用的是香港通告的書面中文。英文在時鐘旁邊。這塊板用來讀一座城市，也用來說明公開數據怎樣變成同一幅畫面。它不提供行車路線。

## 目錄

- [功能](#功能)
- [快速開始](#快速開始)
- [可以開關的圖層](#可以開關的圖層)
- [數據來源](#數據來源)
- [共用的數據](#共用的數據)
- [開發](#開發)
- [作者](#作者)

## 功能

- **過海隧道。** 紅磡海底隧道、東區海底隧道、西區海底隧道各自顯示分鐘，分鐘來自真實的進路。綠色是平常的行程，黃色是已經形成的延誤，紅色是這條過海路已經變了。點一下讀數，地圖就移到那條進路。卡片寫出路名、方向、附近是什麼，以及該板正在量度的每一條隧道要多少分鐘。
- **車速。** 策略性道路用運輸署的飽和等級：暢順、緩慢、擠塞，顏色是 `#3DDC97`、`#FFC857`、`#FF5D73`。某一小段沒有等級時，顏色退回車速本身：低於 30 km/h、30 至 50、50 或更快。圖例保留官方用詞，不會把這個退回的讀法改成另一個名稱。有實時車速的路段上有流動的圓點，圓點表示的是該段車速。關掉車速，圓點一併消失。
- **快拍。** 運輸署公布的公共快拍，包括隧道口。海港一帶和隧道口的快拍，在尚未放大時就留在地圖上。其餘的要走近才出現。快拍卡片拆開道路、方向、附近的地方、地區、區域、鏡頭朝向和編號，然後才顯示畫面。中文名稱來自署方自己的中文圖層。
- **工程、隧道、意外。** 限速 70 km/h 或以上道路的工程、三條過海隧道和大欖隧道，以及尚未結束的特別交通消息。
- **陸路管制站。** 八個陸路口岸的旅客大堂：居民和訪客，入境和出境。大堂旁邊的車輛讀數，是通往該口岸的策略性道路的實時車速。羅湖是旅客過關的地方。公開檔案沒有私家車輪候，那一欄就留空。
- **天氣。** 生效中的香港天文台警告全部列出。嚴重的警告放在會被看見的地方。天色安靜時，這一列仍顯示天文台的氣溫，以及過去一小時有沒有下雨。
- **港鐵。** 到站分鐘、終點、月台是港鐵公布的下一班車。港鐵沒有公布列車位置。圓點把那些分鐘沿路軌往回推，卡片寫明它落在哪兩個站之間。輕鐵不在這一層。
- **九巴。** 車站上的時間是九巴公布的到站時間，原定班次也留在班次表上。把地圖拉近，才會看到畫面中間附近的車站。九巴沒有公布巴士所行的路，所以地圖只顯示車站。
- **情報。** 清單把值得先讀的事項排好：未結束的意外、擠塞的路、非常繁忙的大堂、警告。收起之後，同一批事項沿底部移動。收起和展開都有動畫。
- **底圖。** 衛星照片、街道圖，或立起來的樓宇。樓宇按鈕再按一次，就回到剛才的地圖。樓宇畫面裏，標籤和標記在屋頂之下。

## 快速開始

需要 Node.js 22。

```bash
git clone https://github.com/keithligh/hk-traffic-intelligence.git
cd hk-traffic-intelligence
npm install
npm run dev
```

開啟 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

## 可以開關的圖層

底部的一列用來換底圖和圖層。

| 控制 | 畫出來的是 |
| --- | --- |
| 衛星 | Esri 的照片。畫面保持平坦，著色的道路才落在街上。 |
| 街道 | OpenFreeMap 的向量街道圖，數據來自 OpenStreetMap，圖磚樣式來自 OpenMapTiles。 |
| 樓宇 | 同一張街道圖，樓宇立起來。屋頂蓋住標記。 |
| 車速 | 策略性道路的顏色，以及沿該車速移動的圓點。 |
| 快拍 | 公共快拍。 |
| 工程 | 快速公路上的道路工程。 |
| 隧道 | 過海隧道和大欖隧道的收費點。 |
| 意外 | 未結束的特別交通消息。 |
| 管制站 | 八個陸路管制站。 |
| 港鐵 | 公布的下一班車，以及按那些分鐘推算的位置。 |
| 九巴 | 附近車站公布的到站時間。 |

## 數據來源

每一個數字都來自香港早已公布的開放數據。

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
| 街道圖和樓宇 | [OpenStreetMap](https://www.openstreetmap.org/copyright) 貢獻者、[OpenMapTiles](https://openmaptiles.org/) 和 [OpenFreeMap](https://openfreemap.org) |
| 衛星照片 | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer)。影像 © Esri |

## 共用的數據

公開網站為每一項上游數據保留一份共用副本，訪客讀的是這份副本。副本仍然有效時，新的訪客不會再向部門的伺服器要一次。副本按 Cloudflare 的城市分開存放，有效時間和畫面的更新節奏一致：港鐵約 15 秒，九巴約 30 秒，其餘約一分鐘。

## 開發

| 指令 | 作用 |
| --- | --- |
| `npm run dev` | 在 [http://127.0.0.1:4317](http://127.0.0.1:4317) 啟動 Next.js |
| `npm run lint` | ESLint |
| `npm run dev:vinext` | 在 4318 埠啟動面向 Cloudflare 的開發伺服器 |
| `npm run deploy:vinext` | 在已有 Cloudflare 憑證時部署 Worker |

加上 `?feed=down`，可以看到車速數據失敗時的畫面。加上 `?map=down`，地圖不在的時候，頂端那一列仍在。

程式用 Next.js、React、MapLibre GL 和 Tailwind CSS，以 Cloudflare Worker 提供。

## 作者

[Keith Li](https://www.linkedin.com/in/keithlihk)。這塊板用在 Agentic Engineer 的課堂、公開演講，以及大學的客席講座。數據本來就是公開的。要做的，是讓這些數據成為一座人讀得懂的城市。
