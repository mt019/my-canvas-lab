// 分頁按鈕不准指向一個會把人彈回去的網址。
//
// 主題站的吸頂分頁列用 `to={/<站>/<tab id>}` 連過去，而那條路由（App.jsx 的
// `/zhujiahua/:zhuTab`）是拿 tab id 去 SEO 表裡查 slug，
// 查不到就 `<Navigate to=… replace />` 回站首頁。所以 SEO 表漏一條 = 那顆按鈕按下去
// 原地彈回，而畫面上完全看不出壞了——2026-07-28 職權分類分頁就是這樣死了一段時間，
// 是使用者點按鈕才發現的（開發時都用 ?tab= 查詢字串進頁，正好繞過這條路由）。
//
// 這支檢查把兩張表對起來：頁面自己列的分頁 id，每一個都要在 SEO 表裡有 slug。
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

// 兩個站連到子路由的方式不同，所以「這一頁會連去哪些 slug」各給一個抽取函式，
// 而不是硬套同一個形狀。抽不到就報錯（回 null），不要靜靜地檢查零筆——一支永遠
// 通過的檢查比沒有檢查更糟。
const SITES = [
  {
    label: '朱家驊研究室',
    page: 'src/pages/ZhuJiahua.jsx',
    seo: 'src/pages/_zhu-jiahua/seo.js',
    seoVar: 'ZJH_TABS_SEO',
    // 這一頁沒有分頁陣列：全文頁的網址由 `TEXTS` 的 slug 組出來，專題頁是一條寫死的連結。
    linkedSlugs: (src) => {
      const texts = src.match(/const TEXTS\s*=\s*\[([\s\S]*?)\n\];/);
      if (!texts) return null;
      const fromTexts = [...texts[1].matchAll(/\bslug:\s*'([^']+)'/g)].map((m) => m[1]);
      const literal = [...src.matchAll(/["'`]\/zhujiahua\/([\w-]+)["'`]/g)].map((m) => m[1]);
      return [...new Set([...fromTexts, ...literal])];
    },
  },
];

// SEO 表直接 import 進來讀，不用正則掃字面值：朱家驊那張表是 spread 一個 `TEXT_PAGES`
// 陣列展開的（`...Object.fromEntries(TEXT_PAGES.map(…))`），字面值掃不到那六個 slug，
// 掃出來的結果會是六個假陽性。兩支 seo.js 都是純 JS，node 直接 import 得動。
async function seoSlugs(rel, varName) {
  const mod = await import(new URL(`../${rel}`, import.meta.url).href);
  const table = mod[varName];
  if (!table) return null;
  return Array.isArray(table) ? table.map((row) => row.slug) : Object.keys(table);
}

let failed = false;
const fail = (msg) => { console.error(`FAIL: ${msg}`); failed = true; };

for (const site of SITES) {
  let page;
  let slugs;
  try {
    page = read(site.page);
    slugs = await seoSlugs(site.seo, site.seoVar);
  } catch (err) {
    fail(`${site.label}：讀不到 ${site.page} 或 ${site.seo}（${err.message}）`);
    continue;
  }
  const linked = site.linkedSlugs(page);
  if (!linked || !linked.length) { fail(`${site.label}：在 ${site.page} 抽不到任何子路由連結，抽取規則已失效`); continue; }
  if (!slugs || !slugs.length) { fail(`${site.label}：在 ${site.seo} 讀不到 ${site.seoVar}`); continue; }

  const missing = linked.filter((slug) => !slugs.includes(slug));
  if (missing.length) {
    fail(`${site.label}：${missing.join('、')} 在 ${site.seoVar} 沒有對應 slug，連結會彈回站首頁`);
    continue;
  }
  console.log(`tab routes ok: ${site.label} ${linked.length} 個子路由連結都有可停留的網址`);
}

process.exit(failed ? 1 : 0);
