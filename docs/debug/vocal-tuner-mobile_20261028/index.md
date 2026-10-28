# 聲音調音器移動端軌跡不顯示：重現紀錄（2026-10-28）

站主回報：手機上按 START 唱歌，畫布上不出現收音軌跡。

| 項目 | 內容 |
| --- | --- |
| 測法 | Playwright Chromium，假麥克風餵 220 Hz 正弦波（48 kHz、20 秒 wav），開 `/vocaltuner` 按 START，等 4 秒後截圖 |
| 視窗 | 桌面 1200×800；iPhone 13 模擬；iPhone 13 模擬加 CPU 降速 6 倍 |
| 結果 | 三種視窗都測得 A3、220.2–220.3 Hz，軌跡也畫出來；降速 6 倍時 4 秒 71 幀 |
| 判斷 | Chromium 手機尺寸重現不出來，版面與繪圖可排除；待查真機瀏覽器（WebKit）與音訊路徑 |
| 待站主回覆 | 手機型號與瀏覽器；唱的時候右上角有沒有出現音名與 Hz，標題旁的小圓點會不會變綠 |
| 未驗證的推測 | iOS Safari 若 AudioContext 比 getUserMedia 先建立，麥克風來源可能只送出靜音；`startMic` 的順序正是先 `ensureCtx()` 再 `requestMicStream()` |

## 站主補充與第二輪（同日）

| 項目 | 內容 |
| --- | --- |
| 站主補充 | 壞的是 iPad Safari，手機正常；7 月 27 日那次更新之後才出現 |
| 7 月 27 日的改動 | `6dd8307`、`35eb399` 把壓縮器、增益、oversample 4x 的 WaveShaper 這條輸出鏈建在 `ensureCtx()` 裡並接到 destination；`startMic` 也呼叫 `ensureCtx()`，按 START 就會建出這條輸出鏈 |
| Vite 8 | 線上 bundle 帶 `rolldown-runtime`，正式站已是 Vite 8 建置；四支 JS 以 es-check 驗過符合 ES2020，未用到 Safari 15 之後的 API，排除打包語法 |
| 修改 | 輸出鏈抽成 `ensureBus()`，第一次彈琴才建；`startMic` 只建 AudioContext |
| 本機驗證 | WebKit（iPad Pro 11 視窗）與 Chromium（iPhone 13 視窗）各跑「直接 START」「先彈琴再 START」：直接 START 不建壓縮器，彈琴建一次，四種情形都測得音高、無 JS 錯誤 |
| 未驗證 | iPad Safari 真機；先彈琴再 START 的情形仍會有輸出鏈，若真機只在這個順序下壞，成因就確定是輸出鏈 |
| 截圖 | `wk-start.png`、`wk-piano-first.png`：修改前的 WebKit 模擬麥克風測試 |
| START 被網址列擋住 | 站主回報；外框原用 `h-screen`（100vh），iOS Safari 的 100vh 以網址列收起時計算。改為 `h-screen supports-[height:100dvh]:h-dvh`，寬螢幕的 `calc(100vh-2rem)` 同法加 dvh 版；舊版 Safari 仍用 vh |
| 版面驗證 | WebKit iPhone 13 視窗外框 664px＝innerHeight，START 底緣 654；iPad Pro 11 外框 1194px＝innerHeight。網址列展開與收起的切換，模擬環境測不到 |
| 站主再補充 | iOS 26 Safari 的底部是浮在內容上的半透明玻璃列，頁面延伸到它底下，dvh 無法讓底部按鈕避開 |
| 版面改動 | 底部按鈕列刪除；START/STOP 移到標題列右端；清空引導線的圓鈕移到畫布左上（琴鍵右側）；錯誤訊息改顯示在畫布頂端；`sm` 以下隱藏「▶ 音名」標籤與八度切換（八度只調電腦鍵盤快捷鍵） |
| 版面驗證 | WebKit iPhone SE（320）、iPhone 13（390）、iPad Pro 11（834）：無橫向捲動，標題列按鈕兩兩不重疊；截圖 `layout-*.png`（標題列 120px 高） |
| 推送 | Vite 8 升級在 origin 的 `1b9bcf7`（10-12）已提交；本機 main 落後 origin 8 個提交，工作樹那份升級檔是重複的。三個升級檔還原為 HEAD，本機 6 個未推提交 rebase 到 origin/main，本機 `npm run build` 以 Vite 8.3.4 通過，再提交本修正 |

## 檔案

- `repro.mjs`：重現腳本，第一個參數是輸出目錄，該目錄內須有 `a3.wav`（220 Hz、48 kHz、單聲道）；dev server 開在 5288 埠，腳本須放在能解析 `playwright` 的位置執行。
- `desktop.png`、`mobile.png`、`mobile-slow.png`：三種視窗的截圖。
