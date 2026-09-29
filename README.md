# HK Traffic Intelligence

If you live in Hong Kong, you already know the small argument that happens in the car. Someone has to be on the other side of the harbour, the clock is not kind, and the person driving asks which tunnel. The honest answer is that you do not know yet. You know the three names. You do not know, this minute, whether the Cross-Harbour Tunnel is crawling, whether the Eastern Harbour Crossing is the quieter way, or whether the Western Harbour Crossing is worth the detour. You could find out. The Transport Department publishes it. HKeMobility publishes it. You would open a page, find the board that matches the road you are actually on, read a number, then open another page for the weather, because a rainstorm warning changes the same decision, and if you were heading for a land control point you would open a third page for the hall. By the time you had done that, you would already be in the queue you were trying to avoid.

This board is for that moment. You open it and the top of the screen is already the conversation you were about to have. The Cross-Harbour Tunnel, the Eastern Harbour Crossing, and the Western Harbour Crossing are sitting there with their minutes, and the colour of each number tells you whether that delay is ordinary or whether it has turned. If there is an open incident, it is in the same row, because a crash on the approach is the thing you needed to hear before you committed to the tunnel. At the far end is the speed of the strategic network as a whole, so you can tell a bad tunnel from a morning when the whole city is slow. You click the crossing you are considering, and the map moves to the road that produced the number. You are looking at the approach, not at a figure that arrived from nowhere.

Under the bar, the roads are drawn in the colours the Transport Department already uses when it classes a strategic road. 暢順, when the road is moving. 緩慢, when it has settled into a delay. 擠塞, when it has stopped being a road and become a place you sit. You do not have to remember a private scale. The colour is the department’s own word for the road.

The cameras are there so you can look, instead of guessing from a colour. The public snapshots around the harbour stay on the map while you are still zoomed out, and so do the cameras at the mouths of the tunnels, which are the pictures people actually want when they are deciding whether to enter. You click the cone and the snapshot loads. It is a still image from a public camera, and it is often enough.

The same screen is for the land boundary, because the question is the same question asked further north. There are eight control points. For each of them the Immigration Department publishes how the passenger hall is doing, for residents and for visitors, coming in and going out. The board shows that. Beside it, the vehicle side is the live speed on the strategic road that feeds the port, which is what the public speed feed can honestly say about cars. Lo Wu will tell you about the hall. It is a passenger crossing. The public file does not contain a private-car queue, and the board does not invent one.

Weather belongs on the same bar, because you do not make the tunnel decision and then go and discover the warning. Every Observatory warning that is in force is listed, and a severe one is treated as something you should see without hunting for it. When there is no warning, you still see the temperature at the Observatory and whether the past hour brought rain, which is the quiet version of the same information.

The words on the screen are written the way a Hong Kong notice is written. The board opens in Traditional Chinese. If you want Simplified Chinese, or English, the switch is beside the clock.

When you want the list instead of the map, the intel card on the lower right has already sorted what is worth reading first. You can hide it. It does not disappear. It becomes a line moving along the bottom, so the urgent items are still in your eye while you look at the city. Along that bottom edge you can change the ground: the satellite picture, a flat street map, or the buildings stood up in three dimensions. You can turn the speeds, the cameras, the works, the tunnels, the incidents, and the control points on and off, because some mornings you want all of it and some mornings you want the roads alone.

If you want to run it yourself:

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4317](http://127.0.0.1:4317).

There are two addresses for people who are working on the board rather than using it. Add `?feed=down` and you can see what the screen does when the speed feed fails. Add `?map=down` and the bar stays up without the map, which is how you check that the numbers do not depend on the picture.

## Where the numbers come from

None of this was measured by a private system. The departments had already published it, as separate files, for separate readers. What this board does is read those files and draw them as one city, so that the person who has to choose can see them together.

The roads are the Transport Department’s strategic centreline. The file is stored in Hong Kong 1980 latitude and longitude. If you plot those numbers on a modern map, every road sits a little up and to the left of the real street. The Lands Department published the correction for the whole territory, and it is small enough to sound trivial until you see the tunnel miss its portal: add 8.8 arcseconds of longitude, and subtract 5.5 arcseconds of latitude. After that, the line lies on the road. The colour of the line is the department’s own saturation class. When a segment has no class, the board falls back to a simple reading, under 30 km/h, between 30 and 50, and 50 or faster. The hills under the satellite picture are the public Terrarium surface, smoothed so that a tile only a few metres wide does not turn a small radar jump into a cliff. If that proxy fails, the map does not go blank. It stays pitched over the satellite image, and the bar is still there.

| What you are looking at | Where Hong Kong published it |
| --- | --- |
| Which strategic roads are moving, and the official colour of that movement | [Traffic data of strategic and major roads](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads), classed on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| The geometry of those roads | [Road Network, second generation](https://data.gov.hk/en-data/dataset/hk-td-tis_15-road-network-v2) |
| How many minutes the three harbour crossings will take from the approach you are on | Journey-time boards on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| A look at the road, including outside the tunnels | Public cameras on [HKeMobility](https://www.hkemobility.gov.hk/en/) |
| Who has a fast road opened up | Road works on [HKeMobility](https://www.hkemobility.gov.hk/en/), for roads with a limit of 70 km/h or above |
| Where the tunnel itself is | Toll points on [HKeMobility](https://www.hkemobility.gov.hk/en/) for the three harbour crossings and Tai Lam Tunnel |
| What has just gone wrong | [Special traffic news](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) |
| A handful of detectors on lampposts in the urban area | [Smart lamppost traffic detectors](https://data.gov.hk/en-data/dataset/hk-td-tis_33-traffic-data-traffic-detectors-installed-at-smart-lampposts) |
| Whether the passenger hall will hold you | [Land boundary control point waiting time](https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time), from the Immigration Department |
| Whether the weather should change the plan | The Observatory’s [warning summary](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en) and [current weather report](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) |
| A street map, and buildings you can pitch | [OpenStreetMap](https://www.openstreetmap.org/copyright) and [OpenFreeMap](https://openfreemap.org) |
| The photograph of the ground | [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Imagery © Esri |

## How it was made

I built this in twenty-four hours of spare time. I want to be plain about what that means, because it is easy to hear “twenty-four hours” as a sprint, a locked door, a person who did nothing else. It was not that. It was spare time, the kind that arrives in pieces, and I was not giving the work my full attention while I was in it. I would come back, look at the harbour, notice that a road had been drawn in the wrong place, go and do something else, and come back again.

Grok was the other pair of hands. I would say what I was trying to see, and we would go and find whether the public feed actually contained it. A lot of the day was that kind of argument. The crossings were obvious once I admitted I kept wanting them. The cameras at the tunnel mouths took longer, because they were in the public list and still easy to miss on the map. The control points were the same question asked at the boundary: not a second product, the same decision, with passengers in the hall and vehicles on the road that leads there. The weather stayed, because I did not want a person to choose a tunnel and only then discover the warning.

I did not begin with a specification. I began with a picture of the harbour, which was the decision I could not get from a single government page. The rest arrived because each new thing was another way of asking it. A day of spare time, without full focus, with Grok, was enough to put them on one screen. The data had been public the whole time. What it needed was someone willing to sit with it.

[Keith Li](https://www.linkedin.com/in/keithlihk)

## 繁體中文

如果你在香港生活，你認識車廂裏那場很小的爭論。有人要到海港的另一邊，時間並不寬裕，開車的人問走哪一條隧道。誠實的答案是，你這一分鐘還不知道。你知道三個名字。你不知道紅磡海底隧道這一刻是不是在爬行，東區海底隧道是不是比較安靜的那條，西區海底隧道值不值得繞路。你查得到。運輸署公布了。HKeMobility 公布了。你要打開一個網頁，找到你真正正要進入的那個路口，讀一個數字，然後為了天氣再打開另一頁，因為暴雨警告改變的是同一個決定。如果你要去的是陸路管制站，你還要打開第三頁看大堂。等你做完這些，你已經在你本來想避開的車龍裏。

這個畫面是為那一刻而做的。你打開它，螢幕上方已經是你正要進行的那場對話。紅隧、東隧、西隧各自帶着分鐘，數字的顏色告訴你這次延誤是平常的，還是已經變了質。如果有一宗尚未結束的交通意外，它就在同一列，因為進路上一宗事故，是你在選定隧道之前應該聽到的事。最右邊是整個策略性路網的車速，讓你分辨是這一條隧道慢，還是整個早上都慢。你點一下正在考慮的那一條，地圖就移到產生該數字的道路。你看着的是進路，不是一個不知從何而來的數字。

橫列下方的道路，按運輸署已經在用的等級上色。暢順，是路還在走。緩慢，是它已經陷進一種延誤。擠塞，是它不再像一條路，而像一個你坐着的地方。你不必另記一套私人的尺度。顏色就是署方自己對這條路的說法。

快拍在那裏，是讓你看，而不是靠顏色去猜。海港一帶的公共快拍在你尚未放大時就留在地圖上，隧道口的快拍也是，因為人在決定要不要駛入的時候，想看的就是那些畫面。你點一下鏡頭，快拍載入。那是公共攝影機的一張靜止畫面，而它常常已經足夠。

同一個畫面也給陸路邊境，因為那是同一條問題，問在更北的地方。管制站有八個。入境事務處公布每個大堂的情況，居民和訪客，入境和出境。畫面顯示這些。旁邊的車輛，是通往口岸的策略性道路上的實時車速，這是公開車速檔案能够老實說出的部分。羅湖會告訴你大堂。它是旅客過關的地方。公開檔案沒有私家車的輪候，畫面就不會編一個出來。

天氣在同一列，因為你不應該先選定隧道，然後才發現警告。生效中的警告全部列出。嚴重的，你不需要再去找。沒有警告的時候，你仍看得到天文台的氣溫，以及過去一小時有沒有下雨，那是同一項資訊的安靜版本。

螢幕上的文字，是香港通告所用的書面中文。畫面以繁體中文開啟。你要簡體中文或英文，開關在時鐘旁邊。

你想看清單而不是地圖的時候，右下方的情報卡已經把值得先讀的事項排好。你可以把它收起。它不是消失。它變成底部移動的一行，讓你看着城市的時候，緊急的事項仍在眼前。沿底部的開關可以換脚下的地面：衛星、街道，或者立起來的三維樓宇。車速、快拍、工程、隧道、意外、管制站，都可以各自打開或關掉。有些早上你要全部，有些早上你只要道路。

如果你想自己跑起來：

```bash
npm install
npm run dev
```

然後開啟 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

## 這是怎樣做成的

我用餘暇的二十四小時做成這件事。我想把這句話說清楚，因為「二十四小時」很容易聽成一場衝刺，一扇鎖上的門，一個人什麼都不做。不是那樣。那是一段一段來的餘暇，我在做的時候，也沒有把全部注意力放在上面。我會回來，看着海港，發現一條路畫錯了位置，然後去做別的事，再回來。

Grok 是另一雙手。我會說我想看到什麼，然後我們去查公開的資料裏究竟有沒有。那一天有很多時間是在這種爭論裏。過海時間，是我承認自己一再想要它之後，就變得明顯。隧道口的快拍比較久，因為它們在公開清單裏，在地圖上卻很容易被漏掉。管制站是同一個問題問在邊境：不是另一件產品，是同一個決定，大堂裏是旅客，路上是駛向口岸的車。天氣留了下來，因為我不想有人先選了隧道，然後才發現警告。

我開始的時候沒有一份規格。我開始的是一幅海港的畫面，那是我不能從單一政府網頁得到的決定。其餘的東西後來都來了，因為每一件新的，都是在用另一種方式問它。一段沒有全程專注的餘暇，加上 Grok，足以把它們放在同一個螢幕上。數據一直都是公開的。它需要的是有人願意坐下來對着它。

[Keith Li](https://www.linkedin.com/in/keithlihk)

## 简体中文

如果你在香港生活，你认识车厢里那场很小的争论。有人要到海港的另一边，时间并不宽裕，开车的人问走哪一条隧道。诚实的答案是，你这一分钟还不知道。你知道三个名字。你不知道红磡海底隧道这一刻是不是在爬行，东区海底隧道是不是比较安静的那条，西区海底隧道值不值得绕路。你查得到。运输署公布了。HKeMobility 公布了。你要打开一个网页，找到你真正正要进入的那个路口，读一个数字，然后为了天气再打开另一页，因为暴雨警告改变的是同一个决定。如果你要去的是陆路管制站，你还要打开第三页看大堂。等你做完这些，你已经在你本来想避开的车龙里。

这个画面是为那一刻而做的。你打开它，屏幕上方已经是你正要进行的那场对话。红隧、东隧、西隧各自带着分钟，数字的颜色告诉你这次延误是平常的，还是已经变了质。如果有一宗尚未结束的交通意外，它就在同一列，因为进路上的一宗事故，是你在选定隧道之前应该听到的事。最右边是整个策略性路网的车速，让你分辨是这一条隧道慢，还是整个早上都慢。你点一下正在考虑的那一条，地图就移到产生该数字的道路。你看着的是进路，不是一个不知从何而来的数字。

横列下方的道路，按运输署已经在用的等级上色。畅顺，是路还在走。缓慢，是它已经陷进一种延误。挤塞，是它不再像一条路，而像一个你坐着的地方。你不必另记一套私人的尺度。颜色就是署方自己对这条路的说法。

快拍在那里，是让你看，而不是靠颜色去猜。海港一带的公共快拍在你尚未放大时就留在地图上，隧道口的快拍也是，因为人在决定要不要驶入的时候，想看的就是那些画面。你点一下镜头，快拍载入。那是公共摄影机的一张静止画面，而它常常已经足够。

同一个画面也给陆路边境，因为那是同一条问题，问在更北的地方。管制站有八个。入境事务处公布每个大堂的情况，居民和访客，入境和出境。画面显示这些。旁边的车辆，是通往口岸的策略性道路上的实时车速，这是公开车速档案能够老实说出的部分。罗湖会告诉你大堂。它是旅客过关的地方。公开档案没有私家车的轮候，画面就不会编一个出来。

天气在同一列，因为你不应该先选定隧道，然后才发现警告。生效中的警告全部列出。严重的，你不需要再去找。没有警告的时候，你仍看得到天文台的气温，以及过去一小时有没有下雨，那是同一项信息的安静版本。

屏幕上的文字，是香港通告所用的书面中文。画面以繁体中文开启。你要简体中文或英文，开关在时钟旁边。

你想看清单而不是地图的时候，右下方的情报卡已经把值得先读的事项排好。你可以把它收起。它不是消失。它变成底部移动的一行，让你看着城市的时候，紧急的事项仍在眼前。沿底部的开关可以换脚下的地面：卫星、街道，或者立起来的三维楼宇。车速、快拍、工程、隧道、意外、管制站，都可以各自打开或关掉。有些早上你要全部，有些早上你只要道路。

如果你想自己跑起来：

```bash
npm install
npm run dev
```

然后开启 [http://127.0.0.1:4317](http://127.0.0.1:4317)。

## 这是怎样做成的

我用余暇的二十四小时做成这件事。我想把这句话说清楚，因为「二十四小时」很容易听成一场冲刺，一扇锁上的门，一个人什么都不做。不是那样。那是一段一段来的余暇，我在做的时候，也没有把全部注意力放在上面。我会回来，看着海港，发现一条路画错了位置，然后去做别的事，再回来。

Grok 是另一双手。我会说我想看到什么，然后我们去查公开的资料里究竟有没有。那一天有很多时间是在这种争论里。过海时间，是我承认自己一再想要它之后，就变得明显。隧道口的快拍比较久，因为它们在公开清单里，在地图上却很容易被漏掉。管制站是同一个问题问在边境：不是另一件产品，是同一个决定，大堂里是旅客，路上是驶向口岸的车。天气留了下来，因为我不想有人先选了隧道，然后才发现警告。

我开始的时候没有一份规格。我开始的是一幅海港的画面，那是我不能从单一政府网页得到的决定。其余的东西后来都来了，因为每一件新的，都是在用另一种方式问它。一段没有全程专注的余暇，加上 Grok，足以把它们放在同一个屏幕上。数据一直都是公开的。它需要的是有人愿意坐下来对着它。

[Keith Li](https://www.linkedin.com/in/keithlihk)
