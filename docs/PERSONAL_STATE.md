# 帳號與個人狀態

Canvas 的公共頁面永遠不要求登入。Supabase 只保存登入者的「看過、留著、要去、去過」；活動、文章、海報與研究資料仍由各自的資料倉管理。

## 邊界

- `brief-data`：公共活動與文章的 source of truth。
- `src/data/brief-events.json`：部署時公開的前端快照。
- Supabase `personal_states`：私人、即時、以 `user_id` 隔離的狀態。
- localStorage：未登入模式、本機快取與舊資料遷移來源。
- `canvaslab:personal-state:outbox`：登入後尚未成功送出的操作。

GitHub 頭像、使用者名稱與完整 Email 不得渲染到 Canvas。GitHub 只負責驗證身分；Canvas 不要求 repo 權限。

## 建立正式環境

1. 在 Supabase 建立 Tokyo (`ap-northeast-1`) 專案。
2. 用 Supabase CLI 套用 `supabase/migrations/001_personal_states.sql`，或先在 SQL Editor 執行同一檔案。
3. 在 GitHub Settings > Developer settings > OAuth Apps 建立 OAuth App。
4. Homepage URL 填 `https://my-canvas-lab.vercel.app`；Authorization callback URL 填 Supabase GitHub provider 頁顯示的 `https://<project-ref>.supabase.co/auth/v1/callback`。GitHub OAuth App 只接受一個 callback URL，因此本機測試也沿用雲端 Supabase callback。
5. 在 Supabase Authentication > Providers 啟用 GitHub，填入 client ID 與 client secret。
6. 在 Authentication > URL Configuration 加入本機與正式站的 redirect URL：
   - `http://localhost:5173/**`
   - `https://my-canvas-lab.vercel.app/**`
7. 在本機 `.env.local` 與 Vercel Environment Variables 設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

只能使用 publishable key。`service_role` 或 secret key 不得使用 `VITE_` 前綴、不得送進瀏覽器、不得 commit。

## 運作方式

未設定 Supabase 時，帳號入口不渲染，Canvas 與 Brief 保持純本機模式。設定後，未登入者仍寫入原有 localStorage。使用者第一次登入時，現有標記只遷移一次，之後由資料庫狀態覆蓋本機快取。

操作採 optimistic UI：畫面先更新，再寫入 outbox 並背景 upsert。失敗的 outbox 不會清除，瀏覽器重新連線時重試。刪除以 `active = false` 的墓碑同步，避免其他裝置從舊資料復活標記。

本機快取分為 `guest` 與各 Supabase user ID 的獨立槽。登入時切到該帳號，登出時立即恢復訪客槽；不同 GitHub 帳號不會沿用彼此留在同一瀏覽器的畫面狀態。

## 運維

- schema 或 RLS 一律透過 `supabase/migrations/` 修改，不在 production Dashboard 留下無版本變更。
- Free 方案至少每月執行一次 `supabase db dump`，將加密備份放在 Canvas repo 之外。
- 每次調整權限後測試匿名、帳號 A、帳號 B 三種身分。
- Supabase 故障不得阻斷公共內容；個人操作留在本機 outbox。
- 換後端時匯出標準 PostgreSQL，前端只需替換 `src/personal-state/` adapter。
