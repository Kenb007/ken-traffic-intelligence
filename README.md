# HK Traffic Intelligence

Hong Kong already publishes the numbers. The Transport Department knows which strategic roads are moving. HKeMobility knows how many minutes each harbour crossing will take from the approach you are actually on. Immigration knows whether the hall at a land control point is busy. The Observatory knows when a warning should change the trip.

That is four public sites, and one decision, usually made while you are already late.

This board is that decision. You open it and the top of the screen is the answer you came for: 紅隧, 東隧, 西隧, each with its minutes and the colour of the delay. An open incident sits in the same row, because a crash on the way in matters more than a tidy average. Network speed is at the far end, so you can tell a bad tunnel from a bad morning. Click a crossing and the map flies to the road that produced the number. You can see the approach, not only the minute.

The roads under the bar are coloured the way the department already classes them: 暢順, 緩慢, 擠塞. Public cameras stay drawn across the harbour and at the tunnel mouths. Click a cone and the snapshot loads, which is more useful than imagining the queue.

Further north, the same kind of choice. Eight land control points. The hall figure is Immigration’s, for residents and visitors, arrival and departure. The vehicle figure is the live speed on the strategic road that feeds the port. Lo Wu will tell you about the hall. It will not invent a private-car queue the public file does not contain.

Weather is on that bar because a rainstorm is a traffic fact. Every warning in force is listed. When the sky is quiet, you still get the Observatory temperature and whether the past hour brought rain.

The words on the board are Hong Kong written Chinese, the register of a notice, not of a chat. 简 and EN sit beside the clock.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

If you want to see the board survive a dead feed, add `?feed=down`. If you want the bar without the map, add `?map=down`.

Hide the intel card and the same ranked list keeps moving as a marquee. The switches along the bottom change the ground under it: satellite, streets, or 3D buildings, and each layer on its own.

## The numbers were already public

They were published as separate files, for separate audiences. This board reads them and draws one picture.

The road lines are the Transport Department strategic centreline, moved from Hong Kong 1980 onto the map you recognise. The Lands Department constants are small and specific: longitude plus 8.8 arcseconds, latitude minus 5.5. Colour is the official saturation class. A segment with no class falls back to 50 km/h and 30 km/h. The hills are the public Terrarium surface, smoothed so a street-level tile does not become a cliff. If that proxy fails, the picture stays pitched over the satellite image.

| What you are looking at | Where it was published |
| --- | --- |
| Which strategic roads are moving, and in which official colour | [Strategic / major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads), classed by [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Where those roads actually lie | [Road Network, 2nd generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| How long the three harbour crossings will take from this approach | [HKeMobility](https://www.hkemobility.gov.hk/en/) journey-time boards |
| What the road looks like right now | [HKeMobility](https://www.hkemobility.gov.hk/en/) public cameras, including the tunnel mouths |
| Who is digging up a fast road | [HKeMobility](https://www.hkemobility.gov.hk/en/) works on roads of 70 km/h or above |
| Where the tunnel is | [HKeMobility](https://www.hkemobility.gov.hk/en/) toll points: the three harbour crossings, and Tai Lam |
| What just went wrong | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| A few lamppost detectors in the urban area | [Smart lampposts](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| Whether the hall will hold you | [Immigration waiting time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time) at the eight land control points |
| Whether the weather should cancel the plan | [Observatory warnings](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and the [current report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| A flat street map, and a city of buildings | [OpenStreetMap](https://www.openstreetmap.org/copyright) and [OpenFreeMap](https://openfreemap.org) |
| The ground you are looking down on | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

## Twenty-four hours

I built this in 24 hours of spare time. I was not giving it my full attention. The other pair of hands was Grok: the map, the feeds, the argument about what deserved a place on the bar, the Chinese.

I did not start with a product plan. I started with a harbour picture, because that was the decision I kept wanting and could not get from one government page. The crossings, the cameras at the tunnel mouths, the halls at the land boundary, and the weather warning arrived because each of them is the same kind of question. A spare day, not fully focused, was enough to put them in one place. The data was already public. Someone had to sit with it.

[Keith Li](https://www.linkedin.com/in/keithlihk)

## 繁體中文

香港早已公布這些數字。運輸署知道策略性道路是否暢順。HKeMobility 知道你正要進入的路口，去紅隧、東隧、西隧還要多少分鐘。入境事務處知道管制站大堂是否繁忙。天文台知道一則警告會不會改變這趟行程。

這是四個公開網站，也是一個通常在遲到時才要做的決定。

這個畫面就是那個決定。打開之後，頂列先回答你：三條過海隧道的分鐘，以及延誤的顏色。有交通意外就放在同一列，因為路口上的一宗事故，比一個好看的平均數重要。路網車速在最右，讓你分辨是這條隧道慢，還是整個早上都慢。點一下過海時間，地圖飛到產生該數字的道路。你看到的是進路，不只是一個分鐘。

道路按運輸署的等級上色：暢順、緩慢、擠塞。海港一帶和隧道口的公共快拍保持可見。點一下鏡頭，快拍就載入。

再往北，是同一類選擇。八個陸路管制站。大堂數字來自入境處，分居民與訪客、入境與出境。車輛數字是通往口岸的策略性道路的實時車速。羅湖會告訴你大堂的情況。公開檔案沒有私家車輪候，它就不會編一個出來。

天氣在同一列，因為暴雨是交通事實。生效中的警告全部列出。天色平靜時，仍有天文台氣溫，以及過去一小時有沒有下雨。

介面以香港書面中文開啟，是通告的文體。時鐘旁可轉簡體中文或英文。

```bash
npm install
npm run dev
```

開啟 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

## 二十四小時

我用餘暇二十四小時做成這件事，期間沒有全程專注。另一雙手是 Grok：地圖、數據、頂列該放什麼的爭論，以及中文。

我沒有先寫一份產品計劃。我先做了一幅海港的畫面，因為那是我一再想要、卻不能從單一政府網頁得到的決定。過海時間、隧道口的快拍、陸路管制站的大堂、天氣警告，後來都進來了，因為它們是同一種問題。一個沒有全程專注的餘暇日子，足以把它們放在一起。數據本來就是公開的。要有人坐下來對着它。

[Keith Li](https://www.linkedin.com/in/keithlihk)

## 简体中文

香港早已公布这些数字。运输署知道策略性道路是否畅顺。HKeMobility 知道你正要进入的路口，去红隧、东隧、西隧还要多少分钟。入境事务处知道管制站大堂是否繁忙。天文台知道一则警告会不会改变这趟行程。

这是四个公开网站，也是一个通常在迟到时才要做的决定。

这个画面就是那个决定。打开之后，顶列先回答你：三条过海隧道的分钟，以及延误的颜色。有交通意外就放在同一列，因为路口上的一宗事故，比一个好看的平均数重要。路网车速在最右，让你分辨是这条隧道慢，还是整个早上都慢。点一下过海时间，地图飞到产生该数字的道路。你看到的是进路，不只是一个分钟。

道路按运输署的等级上色：畅顺、缓慢、挤塞。海港一带和隧道口的公共快拍保持可见。点一下镜头，快拍就载入。

再往北，是同一类选择。八个陆路管制站。大堂数字来自入境处，分居民与访客、入境与出境。车辆数字是通往口岸的策略性道路的实时车速。罗湖会告诉你大堂的情况。公开档案没有私家车轮候，它就不会编一个出来。

天气在同一列，因为暴雨是交通事实。生效中的警告全部列出。天色平静时，仍有天文台气温，以及过去一小时有没有下雨。

界面以香港书面中文开启，是通告的文体。时钟旁可转简体中文或英文。

```bash
npm install
npm run dev
```

开启 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

## 二十四小时

我用余暇二十四小时做成这件事，期间没有全程专注。另一双手是 Grok：地图、数据、顶列该放什么的争论，以及中文。

我没有先写一份产品计划。我先做了一幅海港的画面，因为那是我一再想要、却不能从单一政府网页得到的决定。过海时间、隧道口的快拍、陆路管制站的大堂、天气警告，后来都进来了，因为它们是同一种问题。一个没有全程专注的余暇日子，足以把它们放在一起。数据本来就是公开的。要有人坐下来对着它。

[Keith Li](https://www.linkedin.com/in/keithlihk)
