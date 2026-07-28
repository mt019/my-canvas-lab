// 三支使用者腳本現在有多少人碰過。唯讀，跑多少次都不會改到任何東西：
//
//   node scripts/userscript-reach.mjs
//
// 每個來源量到的是不同的東西，所以這支不加總，只並排列出來：
//
//   release 下載數  只算從 GitHub release 資產抓走的次數。2.1.0 以前的副本沒有宣告
//                   @updateURL，腳本管理器會回頭抓當初安裝的那個網址，所以這個數字
//                   裡混著自己機器每天的更新檢查，不等於「多少人裝了」。
//   jsDelivr        fjud 在 1.1.0 時代的安裝來源，其他兩支沒走過。
//   倉庫流量        GitHub 只留 14 天，且 clone 數含大量自動抓取，看 uniques 比 count
//                   有意義。這個要 gh 登入才拿得到。
//   Greasy Fork     還沒發布，發了之後把腳本 id 填進下面的 GREASYFORK 就會一起列。
//                   那是唯一一個直接量「安裝數」的來源。
//   自有網域        phenomcanvas.com/scripts/ 是靜態檔，站上沒有裝任何分析工具，
//                   目前沒有數字。要有就得有伺服器端的請求記錄。
import { execFileSync } from 'node:child_process';

const REPOS = [
  { slug: 'mt019/law-item-labeler', name: '法規條文項次顯示器' },
  { slug: 'mt019/social-auto-expand-userscript', name: '社群貼文自動展開' },
  { slug: 'mt019/fjud-userscript', name: '裁判書一鍵查詢' },
];

// 發布到 Greasy Fork 之後把 id 填進來，例如 'mt019/law-item-labeler': 123456
const GREASYFORK = {};

const JSDELIVR = { 'mt019/fjud-userscript': 'gh/mt019/fjud-userscript' };

function gh(path) {
  try {
    return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  } catch (err) {
    const msg = String(err.stderr || err.message).split('\n')[0];
    return { __error: msg };
  }
}

async function jsdelivr(pkg) {
  try {
    const res = await fetch(`https://data.jsdelivr.com/v1/stats/packages/${pkg}?period=month`);
    if (!res.ok) return { __error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { __error: err.message };
  }
}

async function greasyfork(id) {
  try {
    const res = await fetch(`https://greasyfork.org/scripts/${id}.json`);
    if (!res.ok) return { __error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { __error: err.message };
  }
}

const pad = (s, n) => String(s).padEnd(n, ' ');

for (const repo of REPOS) {
  console.log(`\n${repo.name}  (${repo.slug})`);

  const releases = gh(`repos/${repo.slug}/releases`);
  if (releases.__error) {
    console.log(`  release        讀不到：${releases.__error}`);
  } else if (!releases.length) {
    console.log('  release        沒有 release，這支的安裝走別的位置，GitHub 不提供計數');
  } else {
    let total = 0;
    for (const r of releases) {
      const n = (r.assets || []).reduce((sum, a) => sum + a.download_count, 0);
      total += n;
      console.log(`  release        ${pad(r.tag_name, 10)} ${String(n).padStart(5)}  (${r.published_at.slice(0, 10)})`);
    }
    console.log(`  release 合計   ${String(total).padStart(16)}`);
  }

  const views = gh(`repos/${repo.slug}/traffic/views`);
  const clones = gh(`repos/${repo.slug}/traffic/clones`);
  if (views.__error) {
    console.log(`  14 天流量      讀不到：${views.__error}`);
  } else {
    console.log(`  14 天流量      瀏覽 ${views.count} 次 / ${views.uniques} 人，clone ${clones.count} 次 / ${clones.uniques} 個來源`);
  }

  const meta = gh(`repos/${repo.slug}`);
  if (!meta.__error) {
    console.log(`  倉庫           star ${meta.stargazers_count}  fork ${meta.forks_count}  topics ${meta.topics.length}`);
  }

  const cdn = JSDELIVR[repo.slug];
  if (cdn) {
    const stats = await jsdelivr(cdn);
    if (stats.__error) console.log(`  jsDelivr       讀不到：${stats.__error}`);
    else console.log(`  jsDelivr       過去 30 天 ${stats.hits?.total ?? 0} 次`);
  }

  const gfId = GREASYFORK[repo.slug];
  if (gfId) {
    const gf = await greasyfork(gfId);
    if (gf.__error) console.log(`  Greasy Fork    讀不到：${gf.__error}`);
    else console.log(`  Greasy Fork    安裝 ${gf.total_installs}（過去 24 小時 ${gf.daily_installs}）`);
  } else {
    console.log('  Greasy Fork    未發布');
  }
}

console.log('\nphenomcanvas.com/scripts/ 的請求數：沒有量，站上沒有分析工具。');
console.log('搜尋端的需求要看 Google Search Console，新網域還沒登記。\n');
