# 自訂域名遷移

目標域名：`phenomcanvas.com`（2026-07-28 查為可註冊，尚未購買）。
候選備案：`ferneslicht.com`、`yixutang.com`（同日查為可註冊）。

## 為什麼要做

現行網址 `my-canvas-lab.vercel.app` 綁在平台上。換平台就等於換網址，所有已流出的連結與引用一起斷。自有域名讓主機可以換、網址不用換。

## 搬家要改的地方（2026-07-28 實查，只有這三處寫死了舊網址）

| 位置 | 內容 |
| --- | --- |
| `.env.production` | `VITE_SITE_URL=` — canonical、OG、JSON-LD、sitemap 全部從這裡推導 |
| `public/robots.txt`（Sitemap 那一行） | `Sitemap: https://.../sitemap.xml` |
| `scripts/generate-og-image.mjs`（頁腳字樣） | OG 圖片底部印的網址 |

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

## 遷移前的基準值（2026-07-28 實測，搬完後用來比對）

去掉 script/style 與所有標籤之後的可讀文字量：

| 路徑 | 可讀文字 |
| --- | --- |
| `/` | 342 字（刻意的門簾頁，Kraus 題辭＋`herein` 入口） |
| `/all` | 1,550 字（真正的專案索引） |
| `/constitutionalcourt` | 42,959 字 |
| `/chenyinke` | 3,193 字 |

`sitemap.xml` 共 478 條 `<url>`。

搬完後對同樣四條路徑重跑一次，字數掉下來就是預先渲染又壞了。這個故障會回傳 HTTP 200，狀態碼看不出來——2026-07-28 之前線上每一份都是空殼，就是這樣過關的（見 `deploy.yml` 的註解與 commit d0bfed5）。

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

## GitHub Pages 那 23 個站

`mt019.github.io/<repo>/` 底下有 23 個自己的站（2026-07-28 清點）。它們跟 Vercel 是兩套主機，各綁各的。

GitHub Pages 的規則：一個 repo 只能綁一個域名，一個域名也只能被一個 repo 用；綁定會在 repo 根目錄產生 `CNAME` 檔；每個子域名要一筆 DNS CNAME 指向 `mt019.github.io`；apex 留給 Vercel。另外要在 GitHub 帳號設定做一次 domain verification，防止別人搶用子域名。

**不必全搬。** 個人域名是挑選過的集合。研究成果（憲法法庭、中研院法研所、陳寅恪、朱家驊、JIRS 譯語表、統計、Austrian-UmgrStG-zh、My_Academic）值得收進來；課程筆記、語言班、修課痕跡留在原地，舊連結繼續有效。

## 尚未查證的事（動手時現查，不要從這份文件照抄）

- Vercel apex 現在給的是哪一筆 A 記錄，以及註冊商支不支援 ALIAS／ANAME
- `.vercel.app` 舊網址設 primary 後的實際轉址行為（要 curl 驗）
- Vercel Hobby 方案的單一專案域名數量上限，以及它禁止商業用途的條款（本站非商業，但紫砂品牌若復活要另外處理）
- GitHub Pages domain verification 的現行操作路徑
