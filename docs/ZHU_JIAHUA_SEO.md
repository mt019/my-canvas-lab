# 朱家驊研究室：SEO／AEO 工程留痕

更新：2026-07-27

## 搜尋入口

- `/zhujiahua`：研究室總覽。
- `/zhujiahua/legal-education`：法律教育六篇、年代、場合與直接問答。
- `/zhujiahua/original-text`：〈中國之法律教育問題〉校訂全文。

舊的 `?tab=` 入口仍可使用；搜尋入口改用上述 clean URL。兩個專題網址納入 prerender 與 sitemap，讓不執行前端互動的搜尋／答案引擎也能讀到可見正文。

## Metadata 與結構化資料

`src/pages/_zhu-jiahua/seo.js` 是本專題的 SEO 單一設定來源：

- 研究室總覽使用 `CollectionPage`。
- 法律教育篇群使用 `CollectionPage` 與六篇 `ItemList`。
- 校訂全文使用 `Article`，標示作者、日期、原書頁碼與所屬言論集。
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

並檢查 `dist/zhujiahua/` 三個入口的 title、description、canonical、JSON-LD、可見 H1/H2、內部連結及 sitemap 收錄。
