<p align="center">
  <a href="https://github.com/keithligh/hk-traffic-intelligence/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/keithligh/hk-traffic-intelligence?style=flat"></a>
  <a href="https://github.com/keithligh/hk-traffic-intelligence/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/keithligh/hk-traffic-intelligence"></a>
  <a href="https://github.com/keithligh/hk-traffic-intelligence"><img alt="Top language" src="https://img.shields.io/github/languages/top/keithligh/hk-traffic-intelligence"></a>
</p>

<h1 align="center">HK Traffic Intelligence</h1>

<p align="center">
  <a href="#what-you-get">What you get</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#data">Data</a> ·
  <a href="#how-this-was-built">How this was built</a>
</p>

<p align="center">
  <b>English</b> |
  <a href="#繁體中文">繁體中文</a> |
  <a href="#简体中文">简体中文</a>
</p>

A live Hong Kong traffic board. Harbour crossing minutes, strategic-road speed, tunnel cameras, open incidents, eight land control points, and the weather warning that should change the trip. Public data. No account.

## What you get

- **Three harbour crossings, already compared.** Cross-Harbour, Eastern Harbour, and Western Harbour minutes stay on the top bar. Click one and the map flies to that approach.
- **Roads coloured the way the Transport Department classes them.** 暢順, 緩慢, 擠塞, with network speed at the end of the bar.
- **Public cameras, including the mouths of the tunnels.** Harbour cameras and tunnel-portal cameras stay on screen while you are zoomed out. Click a cone for the live snapshot.
- **The land boundary, not only the harbour.** Passenger halls at eight control points, for residents and visitors, arrival and departure. Vehicle flow is the live speed on the strategic road into the port.
- **The warning before you leave.** Every Observatory warning in force. Temperature and past-hour rain stay with it.
- **Written Chinese first.** The board opens in Hong Kong written Traditional Chinese. Switch to Simplified Chinese or English beside the clock.

Hide the intel card and the same list runs as a marquee. The switches along the bottom change satellite, streets, and 3D buildings, and turn each layer on or off.

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

`?feed=down` keeps the bar up when the speed feed fails. `?map=down` keeps the bar up without the map.

## Data

The lines are the Transport Department strategic-road centreline, moved from Hong Kong 1980 onto WGS84 with the Lands Department constants: longitude +8.8 arcseconds, latitude −5.5 arcseconds. Colour is the official saturation class. A segment with no class falls back to 50 km/h and 30 km/h. Elevation is the public Terrarium surface. If that proxy fails, the map stays pitched over the satellite image.

| On the board | Source |
| --- | --- |
| Road speed and colour | [Strategic / major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads) and the [HKeMobility](https://www.hkemobility.gov.hk/en/) saturation class |
| Road geometry | [Road Network, 2nd generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| Harbour minutes | [HKeMobility](https://www.hkemobility.gov.hk/en/) journey-time boards |
| Cameras | [HKeMobility](https://www.hkemobility.gov.hk/en/) public snapshots |
| Road works | [HKeMobility](https://www.hkemobility.gov.hk/en/) lane closures on roads of 70 km/h or above |
| Tunnels | [HKeMobility](https://www.hkemobility.gov.hk/en/) toll points: three harbour crossings and Tai Lam |
| Open incidents | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| Lamppost speeds | [Smart lamppost detectors](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| Control-point halls | [Immigration Department waiting time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) |
| Weather | [Warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [current report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| Streets and buildings | [OpenStreetMap](https://www.openstreetmap.org/copyright) and [OpenFreeMap](https://openfreemap.org) |
| Satellite | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

Lo Wu is a passenger crossing and has no vehicle approach on the strategic-road feed. Private-car queue counts are not in the public Immigration file.

## How this was built

Keith Li built this in 24 hours of spare time, without full focus, using Grok.

Designed and created by [Keith Li](https://www.linkedin.com/in/keithlihk).

## 繁體中文

香港交通情報。三條過海隧道的行車時間、策略性道路車速、隧道口快拍、道路工程、交通意外、八個陸路管制站，以及生效中的天氣警告，放在同一畫面。公開數據，不用帳戶。

畫面以香港書面繁體中文開啟，可轉簡體中文或英文。頂列是紅隧、東隧、西隧的分鐘、路網車速、管制站大堂，以及天氣。點一下過海時間，地圖飛到該進路口。情報卡按優先次序排列，收起後變成底部跑馬燈。

```bash
npm install
npm run dev
```

開啟 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

Keith Li 用餘暇 24 小時建成，期間沒有全程專注，並使用 Grok。設計及製作：[Keith Li](https://www.linkedin.com/in/keithlihk)。

## 简体中文

香港交通情报。三条过海隧道的行车时间、策略性道路车速、隧道口快拍、道路工程、交通意外、八个陆路管制站，以及生效中的天气警告，放在同一画面。公开数据，不用帐户。

画面以香港书面繁体中文开启，可转简体中文或英文。顶列是红隧、东隧、西隧的分钟、路网车速、管制站大堂，以及天气。点一下过海时间，地图飞到该进路口。情报卡按优先次序排列，收起后变成底部跑马灯。

```bash
npm install
npm run dev
```

开启 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

Keith Li 用余暇 24 小时建成，期间没有全程专注，并使用 Grok。设计及制作：[Keith Li](https://www.linkedin.com/in/keithlihk)。
