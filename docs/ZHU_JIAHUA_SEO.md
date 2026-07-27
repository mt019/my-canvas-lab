# 朱家驊研究室：SEO／AEO 工程留痕

更新：2026-07-27

## 搜尋入口

- `/zhujiahua`：研究室總覽。
- `/zhujiahua/legal-education`：法律教育六篇、年代、場合與直接問答。
- 六篇校訂全文各一個網址：
  - `/zhujiahua/original-text`：〈中國之法律教育問題〉，1945。
  - `/zhujiahua/text-a-view-of-legal-education`：〈法律教育的一種看法〉，1947。
  - `/zhujiahua/text-committee-5th`：法律教育委員會第五次會議致詞，1948-02（龐德出席）。
  - `/zhujiahua/text-committee-6th`：法律教育委員會第六次會議致詞，1948-07。
  - `/zhujiahua/text-committee-7th`：法律教育委員會第七次會議致詞，1948-12。
  - `/zhujiahua/text-rule-of-law-administration`：〈法治行政〉，1950 年在臺灣。

舊的 `?tab=` 入口仍可使用；搜尋入口改用上述 clean URL。八個網址全部納入 prerender 與 sitemap，讓不執行前端互動的搜尋／答案引擎也能讀到可見正文。每篇全文頁底有前後篇連結，篇群索引的每個篇名也直接連到該篇全文。

## Metadata 與結構化資料

`src/pages/_zhu-jiahua/seo.js` 是本專題的 SEO 單一設定來源：

- 研究室總覽使用 `CollectionPage`。
- 法律教育篇群使用 `CollectionPage` 與六篇 `ItemList`。
- 六篇校訂全文各用一個 `Article`，標示作者、日期、原書頁碼、所屬言論集與該篇 about 主題；設定由 `TEXT_PAGES` 一份清單展開，避免六份手寫 metadata 漂移。
- `Person` 與 `Book` 節點使用固定 `@id`，供各頁共同引用。

結構化資料只能描述頁面實際可見且由資料倉核定的內容。不得從未校 OCR 補寫文章摘要、日期或場合。

## AEO 原則

- 直接以可見標題與短答處理讀者真正會問的問題。
- 不建立只為搜尋變體而存在的大量薄頁。
- 不使用與可見內容不一致的 FAQ、評分或作者標記。
- 全文與專題頁以正常 `<a href>` 互連，不依賴按鈕事件供爬蟲發現。

## 驗證

每次修改後至少執行：

```sh
npx eslint src/App.jsx src/pages/ZhuJiahua.jsx src/pages/_zhu-jiahua/seo.js scripts/routes.mjs scripts/generate-sitemap.mjs
npm run build
```

並檢查 `dist/zhujiahua/` 八個入口的 title、description、canonical、JSON-LD、可見 H1/H2、內部連結及 sitemap 收錄。

本機閘門用 `npm run verify:gates`（不碰共用 `dist/`）；完整 prerender 交給部署流程。
