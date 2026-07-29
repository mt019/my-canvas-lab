# 自訂域名遷移

**已完成。** `phenomcanvas.com` 於 2026-07-28 23:35:17 在 Cloudflare Registrar 註冊（買到
2031-07-28，auto-renew 開著），同日接上 Vercel 並完成遷移。本檔留作紀錄與下次換域名的步驟書。

當時一併查過、仍可註冊的備案：`ferneslicht.com`、`yixutang.com`。

## 為什麼要做

現行網址 `my-canvas-lab.vercel.app` 綁在平台上。換平台就等於換網址，所有已流出的連結與引用一起斷。自有域名讓主機可以換、網址不用換。

## 搬家要改的地方（2026-07-28 實查）

| 位置 | 內容 |
| --- | --- |
| `.env.production` | `VITE_SITE_URL=` — canonical、OG、JSON-LD、sitemap 全部從這裡推導 |
| `public/robots.txt`（Sitemap 那一行） | `Sitemap: https://.../sitemap.xml` |
| `scripts/generate-og-image.mjs`（頁腳字樣） | OG 圖片底部印的網址 |

**還有兩處是第一次掃殘留時漏掉的**：`index.html` 的 `og:image` 與 `twitter:image` 寫的是絕對
網址。grep 舊網址的時候要把 `index.html` 一起掃進去，只掃 `src scripts public` 會漏。

其餘一律從 `scripts/site-config.mjs` 這個單一來源取得，不必動。

部署鏈本身不受影響：GitHub Actions 建置（含 Chromium 預先渲染）→ `vercel deploy --prebuilt --prod`。域名設定住在 Vercel dashboard，不在 repo 裡，`deploy.yml` 與三個 VERCEL_* secret 都不用改。

## 步驟

1. 註冊商買下域名，開 auto-renew，點掉 ICANN 的驗證信（15 天內不點會被停止解析）
2. Vercel → Project Settings → Domains → Add，照它當下給的 DNS 記錄設定
   （apex 不能用 CNAME，要用 A 或 ALIAS／ANAME；**設定時現查 Vercel 給的值，不要照抄舊筆記**）
3. 設為 primary，確認舊的 `.vercel.app` 會 301 過來（實際 curl 驗一次，不要假設）
4. 改上表三處，推送，等 Actions 跑完
5. 跑下方的驗收指令，字數對得上才算搬完
6. GSC 與 Bing Webmaster 各加新 property，提交 sitemap
7. 把 IndexNow 接進 `deploy.yml`（網址定了才寫，免得寫兩次）

## 遷移前後的字數對照（2026-07-28 實測，已驗過）

去掉 script/style 與所有標籤之後的可讀文字量：

| 路徑 | 可讀文字 |
| --- | --- |
| `/` | 342 字（刻意的門簾頁，Kraus 題辭＋`herein` 入口） |
| `/all` | 1,550 字（真正的專案索引） |
| `/constitutionalcourt` | 42,959 字 |
| `/chenyinke` | 3,193 字 |

`sitemap.xml` 共 478 條 `<url>`。

搬完實測：`/` 331、`/all` 1527、`/constitutionalcourt` 42966、`/chenyinke` 4011，sitemap 480 條，
`canonical` 全部是 `https://phenomcanvas.com/…`。首頁與 `/all` 少的十幾二十字＝同時被拿掉的舊標題
與舊描述，數字對得上；`/chenyinke` 多的 818 字與 sitemap 多的 2 條來自另一條線的 `436063a`。

下次換域名，對同樣四條路徑重跑一次，字數掉下來就是預先渲染又壞了。這個故障會回傳 HTTP 200，狀態碼看不出來——2026-07-28 之前線上每一份都是空殼，就是這樣過關的（見 `deploy.yml` 的註解與 commit d0bfed5）。

驗收指令：

```bash
for u in / /all /constitutionalcourt /chenyinke; do
  printf "%-24s " "$u"
  curl -sL "https://phenomcanvas.com$u" | python3 -c "
import sys,re
h=sys.stdin.read()
b=re.sub(r'(?is)<script.*?</script>','',h); b=re.sub(r'(?is)<style.*?</style>','',b)
t=re.sub(r'(?s)<[^>]+>',' ',b); print(len(re.sub(r'\s+',' ',t).strip()), '字')
"
done
```

## 三支使用者腳本（2026-07-29 搬完）

安裝檔改到 `https://phenomcanvas.com/scripts/<檔名>.user.js`，落地頁 `/userscripts` 加三個內頁。
腳本原本都沒宣告 `@updateURL`／`@downloadURL`，Tampermonkey 因此拿使用者當初的安裝網址查更新——
那個網址寫在別人的機器裡，改帳號名或 repo 名就靜靜失效。

| 腳本 | 版號 | 舊位置（留跳板版） |
|---|---|---|
| `law-item-labeler.user.js` | 1.10.0 | GitHub Pages 的 `law-item-label.user.js`（少一個 `er`，`build.js` 仍然照樣輸出） |
| `social-auto-expand.user.js` | 2.1.0 | `releases/latest/download/` 的同名資產 |
| `fjud.user.js` | 1.2.0 | jsDelivr `@latest/dist/fjud.user.js` 與 GitHub Raw |

跳板版是必要的：已安裝的副本仍指著舊網址、不會自己改，要先讓它們拿到帶 `@updateURL` 的那一版，
才會轉過來。舊位置之後就停在那一版。

搬運不靠人複製——三個來源倉各有一支 `sync-to-canvas.mjs`（canvas 路徑當參數傳），送檔案並回寫
`src/data/userscripts.json` 的版號、`@match`、`@grant`；canvas 只寫落地頁文案。
`npm run validate:userscripts` 逐欄比對，接在 `verify:policy` 裡。

## GitHub Pages 那 23 個站

`mt019.github.io/<repo>/` 底下有 23 個自己的站（2026-07-28 清點）。它們跟 Vercel 是兩套主機，各綁各的。

GitHub Pages 的規則：一個 repo 只能綁一個域名，一個域名也只能被一個 repo 用；綁定會在 repo 根目錄產生 `CNAME` 檔；每個子域名要一筆 DNS CNAME 指向 `mt019.github.io`；apex 留給 Vercel。另外要在 GitHub 帳號設定做一次 domain verification，防止別人搶用子域名。

**不必全搬。** 個人域名是挑選過的集合。研究成果（憲法法庭、中研院法研所、陳寅恪、朱家驊、JIRS 譯語表、統計、Austrian-UmgrStG-zh、My_Academic）值得收進來；課程筆記、語言班、修課痕跡留在原地，舊連結繼續有效。

## 這次查證的結果

- **Vercel 給的是 CNAME，apex 也是**：`@` 與 `www` 都指向 `e22f8093d6f6ad5e.vercel-dns-017.com`。
  apex 能用 CNAME 是靠 Cloudflare 的 CNAME flattening；DNS 規範本身不准。換 DNS 供應商前要確認
  新的那家也支援，否則 apex 得改回 A 記錄。Vercel 說舊的 `cname.vercel-dns.com` 與 `76.76.21.21`
  仍然有效，但它建議用上面那個專屬名稱。
- **兩筆記錄的 Proxy status 都要設成 DNS only**，Vercel 自己的說明也寫 `Disabled`。
- 價格：Cloudflare 收成本價 10.46 美金（Verisign 批發 10.26 ＋ ICANN 0.20），五年 52.30。
  Verisign 已宣布 2026-11-01 把批發價調到 10.97，依合約每年還可以再漲最多 7%，到 2030。

## 還沒查證的（要用到再查）

- `.vercel.app` 舊網址設 primary 之後的實際轉址行為（沒 curl 驗過就別宣稱它會 301）
- Vercel Hobby 方案的單一專案域名數量上限，以及它禁止商業用途的條款（本站非商業；
  任何要賣東西的站都不能放在這個專案上，得自己另立專案與託管）
- GitHub Pages 綁子域名與 domain verification 的現行操作路徑（那二十三個站要搬時才需要）
