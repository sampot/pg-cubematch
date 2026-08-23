# 方塊寵物配（`pg-cubematch`）— 遊戲規劃文檔

> **用途：** 本 repo 的遊戲權威規格——coding agent 改動前必讀：這個遊戲是什麼、規則、設計限制、優化方向。
> **整理方式：** 從本 repo 實作反向整理（2026-08-23）。**改玩法先改此檔再改碼**；本檔與程式碼衝突時，以「規則（§3）」描述的設計意圖為準回報差異。
> **上游契約：** [PG-GAME-AGENT-GUIDE.md](https://github.com/sampot/playgrounds/blob/main/docs/PG-GAME-AGENT-GUIDE.md)（唯一必讀；本檔不重複其全文）· 型錄條目 `playgrounds/catalog/entries/pg-cubematch.yaml`

## 1. 一句話

六對 Kenney 方塊寵物的迷你翻牌配對：點兩張蓋牌找相同、全部配對即過關，步數越少分數越高——系列裡最精簡的一局三分鐘小品；致敬 Memory 類型玩法，非任一商業作品復刻。

## 2. 定案速覽

| 項 | 值 |
| --- | --- |
| catalog id / kind / series | `pg-cubematch` / `game` / `懷舊` |
| status | `listed` |
| 模式 | 單人單局制；**固定 6 對 12 張**（邏輯層 `pairs` 已參數化但 UI 未開放） |
| 牌組 | cat/dog/fox/panda/pig/bunny 六隻寵物各兩張；Fisher–Yates 洗散 |
| 計分 | 完成時 `max(0, 1000 − 步數×10)`（完美約 12 步＝880 分起）；未完成 null |
| 持久化 | `pg-cubematch-best`（`/api/kv`）：**每次過關直接 PUT，無讀回、無破紀錄判定** |
| 素材 | Kenney Cube Pets PNG ×6（CC0）；**無音效** |
| 交付形 | 純 HTML＋CSS＋ESM JS；無 build；`npx --yes vitest run` 測試 |

## 3. 完整規則（現行實作）

### 3.1 發牌與翻牌

- `newGame(6)`：`createDeck` 產生 `[0,0,1,1,…,5,5]` 洗散成 12 張蓋牌序列；state 只有 `{cards, open, matched, moves, over}`。
- `flip(s,i)` 合法性：已結束、桌上已有兩張開著、該張已開或已配對→`invalid`（不改變狀態）。第一張→事件 `first`；第二張→步數 +1 後判定。
- 同 id→`match`：兩張進入 `matched`（永久攤開）、清空 `open`；全數配對即 `over=true`。不同 id→`miss`：兩張維持翻開，由 UI 於 **700ms** 後呼叫 `collapse()` 收回並解鎖輸入。

### 3.2 計分與結束

- 分數只在過關時計：基礎 1000 扣每步 10，下限 0——唯一的技術軸就是「用更少步數」；沒有連對/時間要素。
- 過關時全螢幕 overlay 面板顯示「全部配對！N 步 · S 分」＋再玩一次；同時把分數 PUT 到 KV（見 §5 的語意缺口）。
- 「重新洗牌」任何時候可用，重發整副（非破壞性，不需確認）。

### 3.3 呈現

- 蓋牌顯示「?」字樣；翻開/已配對顯示寵物 PNG；aria-label 隨狀態切換（蓋牌／寵物名），HUD `aria-live=polite`。
- HUD 三格：步數／配對進度（n/6）／當局分數；訊息列提示「不一樣，再記一下」等回饋。

## 4. 操作與畫面

| 輸入 | 動作 |
| --- | --- |
| 點蓋牌 | 兩段式翻牌配對 |
| 重新洗牌 | 重發整副（隨時可用） |
| 再玩一次 | 勝利面板內重開 |

- 版面：標題＋懷舊徽章→HUD→12 張卡格線→訊息列→控制列；手機直欄優先。
- 全 DOM 渲染（每次 render 重建 innerHTML）；禁 `alert`/`confirm`/`prompt`。

## 5. 持久化（KV 權威）

| key | 內容 | 讀寫時機 |
| --- | --- | --- |
| `pg-cubematch-best`（`/api/kv`） | 每次過關的分數（PUT body 為數字字串） | **僅寫不讀**：過關即 PUT（失敗靜默），啟動時沒有 GET、UI 也從不顯示歷史最佳——「best」命名與實際行為不符（§9 高優先 2） |
| （無）localStorage | — | 本 repo 完全未用 localStorage |

- 自訂 functions.js：stub（回 `{ok,name,path}` JSON），無自訂 API；KV 由前端直接 fetch。

## 6. 美術／音效／署名

- `assets/animal-{cat,dog,fox,panda,pig,bunny}.png`：Kenney Cube Pets（Kenney Vleugels，CC0 1.0）六隻寵物預覽圖；原授權副本 `assets/License.txt`。素材自 `playgrounds/game-assets/` 複製，執行時不依賴該目錄；詳 `ATTRIBUTION.md`（CC0 不要求署名，專案慣例仍署名）。
- **無音效系統**（無 audio.js），互動全程靜音。
- 新增素材規則：拷進 `assets/`、更新 `ATTRIBUTION.md`、同步 `sam-manifest.json` files 清單。

## 7. 測試（`npx --yes vitest run`）

現有覆蓋（`game.test.js`，4 例）：createDeck 恰為成對且種類數正確；配到最後一對時 over 成立；collapse 清空開著的牌；分數公式（1 步完成得 990）。

改動規則必補邊界測試；建議最小新增：flip 對 invalid 三種情況（over/兩張已開/重複點同一張）皆不改狀態、score 未過關回 null、下限 0（步數 ≥100 時）。

## 8. 硬約束（不可違反）

1. 僅 HTML＋CSS＋JS（ESM）；**無 build**、不入庫 `node_modules`、不安套件；工具一律 `npx <pkg>` 臨時執行。
2. 禁瀏覽器原生 `alert`／`confirm`／`prompt`；提示一律訊息列與頁內面板。
3. Mobile-first；主操作不可 hover-only。
4. 新增存檔一律以 `fetch('/api/kv/…')` 為權威；禁止裸 `localStorage` 當權威（本作現完全未用 LS）。
5. 不自行載入 `sdk.js`；宿主注入 `window.PG`（本作未用 PG，直接 fetch `/api/kv`）。
6. 改動可執行邏輯前先寫失敗測試（TDD）。
7. 檔案清單變動須同步 `sam-manifest.json`（下載契約，含六張寵物 PNG）。
8. 遊戲邏輯維持純函式（state in/state out、可注入 rand），DOM 只做呈現——這是本 repo 測試策略的根基。

## 9. 優化建議（可玩性與樂趣）

依優先級；實作前先在此登記並補測試。原則：把「一次性玩具」補成有目標的小品，不改變「六對寵物翻牌」的輕量認同。

**高優先**

1. **盤面難度選擇**：固定 6 對毫無成長曲線。`createDeck/newGame(pairs)` 已支援任意對數——加 4 對（新手）/6 對（現行）/10 對（20 張挑戰）三檔下拉，格線自動調整。
2. **最高分接通**：現在 KV 是「只丟不收」。啟動 GET 讀回最佳分、HUD 常駐顯示、僅破紀錄才 PUT（比照 pg-memory 的 updateBest 模式）——讓「更少步數」有真實的比較對象。
3. **合成音效**：全程靜音是同系列中的異類。補 WebAudio 翻牌/配對/誤翻/勝利四音色（pg-memory 的 audio.js 可直接參考），首次互動 unlock。

**中優先**

4. **計時與評級**：加秒錶並在結算給 S/A/B 評級（步數門檻如 ≤14/S、≤18/A），讓同一副牌有反覆刷的目標；時間可只展示不計分以免懲罰深思型玩家。
5. **主題包切換**：寵物寫死一組；依 `game-assets/` 可得的 Kenney 角色擴充第二主題（恐龍/太空等），下拉切換提升新鮮感。
6. **連對獎勵**：連續配對成功（miss 不出現）額外加分的簡易 combo，豐富單薄的 1000−10×moves 公式（公式變更須同步 §2/§3 數值與測試）。

**低優先**

7. **翻牌動畫**：CSS 3D flip（rotateY）取代瞬間換圖，手感立刻升級；overlay 面板淡入。
8. **生涯統計**：總場次/平均步數存 KV 單一 JSON key，勝利面板秀摘要。
