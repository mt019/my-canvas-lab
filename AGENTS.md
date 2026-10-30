# my-canvas-lab

## Vue 遷移前的開發規則（2026-10-30 起）

本站在 phenom-ops 清冊 `infra/vue-migration.json` 列為 queued，尚未遷到 Vue。遷移完成之前：

- 新功能的邏輯（資料處理、狀態計算、網址參數解析、搜尋與篩選）寫成框架無關的 `.js` 模組，
  模組內不 import react；React 元件只負責渲染與接事件。遷移時這些模組原樣搬到 Vue 版。
- React 版 `@phenomcanvas/ui` 自 2026-10-30 起只修錯，不再加元件與功能；新的共用元件只進
  `@phenomcanvas/ui-vue`。
- 本站開了 `vue-migration-*` 分支施工期間，main 不加功能。

計畫正本：phenom-ops `docs/vue-fleet-plan-20261030.md`。
