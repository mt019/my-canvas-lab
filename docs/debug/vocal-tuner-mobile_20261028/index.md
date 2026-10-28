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

## 第三輪（同日）

| 項目 | 內容 |
| --- | --- |
| 站主回報 | `116f99b` 上線後 iPad 仍無軌跡 |
| 排除 | 7 月 27 日兩個提交未改收音路徑；程式無依 UA 分支；音量門檻 0.001，iPad 收音偏小不致低於門檻 |
| 修改 | `startMic` 先 `getUserMedia` 再建 AudioContext，既有 ctx 的取樣率與麥克風 `getSettings().sampleRate` 不同時關閉重建；分析節點另經零增益節點接 destination |
| 診斷讀數 | 網址加 `?debug`，畫布底部顯示 ctx 狀態與取樣率、麥克風軌道狀態與取樣率、rms、自相關基頻 |
| 本機驗證 | `order.mjs`：Chromium（iPhone 13，220 Hz 假麥克風）與 WebKit（iPad Pro 11，內建假裝置）各跑直接 START、先彈琴再 START，四種情形都測得音高，無 JS 錯誤；模擬環境 ctx 與麥克風皆 44100 Hz，取樣率不一致的情形重現不出來 |
| 待站主回覆 | 若仍無軌跡，iPad 開 `/vocaltuner?debug` 唱幾秒，回報畫布底部那一列 |

## 第四輪（同日）

| 項目 | 內容 |
| --- | --- |
| 站主 iPad 讀數 | `ctx running 48000 Hz · mic live 48000 Hz · rms 4.02e-5 · f0 -1.0`，唱歌時仍無軌跡 |
| 判斷 | 取樣率一致，第三輪的取樣率推測排除；軌道為 live、未 muted，rms 約 -88 dBFS，iPad 交出的是底噪 |
| 時序 | `echoCancellation/noiseSuppression/autoGainControl: false` 自 `efb17bc`（6 月 25 日）即有，7 月未改；7 月 27 日起壞較可能對應 iPadOS 更新 |
| 修改 | `?mic=plain` 改以 `{ audio: true }` 取麥克風；讀數列補麥克風名稱與實際生效的 ec／ns／agc |
| 本機驗證 | Chromium 兩種順序通過；無頭 WebKit 的 `getUserMedia` 兩種要求都停在權限詢問，4 秒無回應（`gum-probe.mjs`），WebKit 本輪無法驗 |
| 待站主回覆 | iPad 開 `/vocaltuner?debug&mic=plain` 唱幾秒，回報軌跡有無與讀數列；`?debug` 那一列的麥克風名稱也一併回報 |

## 第五輪（同日）

| 項目 | 內容 |
| --- | --- |
| 站主要求 | 測試入口做成頁面上的按鈕，不靠網址參數 |
| 修改 | 畫布左下加「原始收音／預設收音」與「讀數」按鈕；收音中切換收音方式即重開麥克風；`?mic=plain`、`?debug` 仍作初始值 |
| 本機驗證 | `switch.mjs`，Chromium iPhone SE 與 iPad Pro 11 視窗：原始 ec 0 ns 0 agc 0，切到預設後 ec 1 ns 1 agc 1，仍測得 A3；按鈕在琴鍵右側 47px、畫布底緣上方 9px；截圖 `switch-*.png` |
| 待站主回覆 | iPad 上兩種收音各唱幾秒，回報軌跡有無與讀數列 |

## 第六輪：成因確定（同日）

| 項目 | 內容 |
| --- | --- |
| 站主 iPad 結果 | 原始收音無軌跡；預設收音有軌跡，讀數 `ctx running 48000 Hz · mic live 48000 Hz ec 1 ns 0 agc 0 [iPad麥克風] · rms 2.07e-2`，測得 A3 219.2 Hz |
| 成因 | Safari 只接受 `echoCancellation`，ns、agc 兩種要求下都回報 0；iPad Safari 在 `echoCancellation: false` 時交出底噪（rms 約 4e-5），開啟時音量正常。網站此要求自 6 月 25 日未改，7 月底起壞對應 iPadOS 的行為改變 |
| 修改 | 預設改為預設收音（瀏覽器處理）；`?mic=raw` 或按鈕「原始收音」仍可比對 |
| 未決 | 預設收音的軌跡在截圖中有大幅跳動；待站主以持續的單音確認是否為偵測問題。診斷按鈕與讀數列的去留待站主決定 |

## 檔案

- `repro.mjs`：重現腳本，第一個參數是輸出目錄，該目錄內須有 `a3.wav`（220 Hz、48 kHz、單聲道）；dev server 開在 5288 埠，腳本須放在能解析 `playwright` 的位置執行。
- `desktop.png`、`mobile.png`、`mobile-slow.png`：三種視窗的截圖。
- `apex-preview-smoke.json`：OpenTix 一項改為 `opentixRetired` 之後，以 preview 網址 `4be7ba94.phenom-home.pages.dev`、`ef4bfdfc.phenom-canvas.pages.dev` 實跑 `smoke-apex-preview.mjs` 的結果，十項全為 true。
