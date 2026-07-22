// SEO/AEO metadata for the Constitutional Court archive. Pure data + plain
// functions, no React/JSX imports, so the node build scripts (routes.mjs,
// prerender, sitemap) can import it too. It gives every tab its own clean,
// separately-indexable URL and search-targeted title/description/keywords, and
// describes the whole archive as a schema.org Dataset (eligible for Google
// Dataset Search). Descriptions state only what the page actually shows.

import { CC_INDEXED_釋字 } from './case-index.js';

// Base route: /constitutionalcourt (the 案件索引 default tab).
export const CC_BASE_SEO = {
  name: '憲法法庭案例庫',
  keywords: '憲法法庭, 大法官釋字, 司法院大法官, 憲法判決, 釋憲, 違憲審查, 意見書, 協同意見書, 不同意見書, 大法官解釋, 憲法訴訟, 統一解釋',
  type: 'CollectionPage',
};

// One Dataset node for the archive, referenced from the base page. Absolute URLs
// are filled in at render time from the site origin.
export function ccDataset(SITE_URL) {
  const url = `${SITE_URL}/constitutionalcourt`;
  return {
    '@type': 'Dataset',
    '@id': `${url}#dataset`,
    name: '憲法法庭案例庫（釋字・憲判・暫時處分）',
    description: '中華民國司法解釋的可檢索研究資料集：行憲後大法官釋字與憲法法庭裁判、行憲前大理院／最高法院／司法院統一解釋。含主題與年代篩選、意見書作者與立場、共同具名網絡、引用統計，以及可匯出的引註與 BibTeX。',
    url,
    keywords: ['憲法法庭', '大法官釋字', '憲法判決', '意見書', '違憲審查', '司法院大法官'],
    inLanguage: 'zh-Hant-TW',
    isAccessibleForFree: true,
    creator: { '@id': `${SITE_URL}/#org` },
    publisher: { '@id': `${SITE_URL}/#org` },
    license: 'https://creativecommons.org/licenses/by/4.0/',
  };
}

// Per-tab clean routes: /constitutionalcourt/<slug>. slug === the tab id used by
// ConstitutionalCourt.jsx, so no mapping table is needed there. 'index' stays on
// the base route and is intentionally absent here.
export const CC_TABS_SEO = [
  {
    slug: 'timeline', tab: 'timeline', name: '案件時間軸', type: 'CollectionPage',
    title: '憲法法庭案件時間軸｜釋字與憲判編年',
    description: '大法官釋字與憲法法庭裁判依年代排列的時間軸，看司法解釋的數量與主題如何隨時代變化。',
    keywords: '憲法法庭 時間軸, 大法官釋字 年表, 釋憲 歷年, 憲法判決 編年',
  },
  {
    slug: 'justices', tab: 'justices', name: '歷任大法官', type: 'CollectionPage',
    title: '歷任大法官與意見書｜憲法法庭案例庫',
    description: '歷任司法院大法官名錄與各自的意見書：主筆、協同、不同意見書統計，可逐位查其參與的釋字與憲判。',
    keywords: '司法院大法官, 歷任大法官, 大法官 意見書, 大法官 名單, 大法官 協同意見書',
  },
  {
    slug: 'tenure', tab: 'tenure', name: '大法官任期時間軸', type: 'CollectionPage',
    title: '大法官任期時間軸｜歷屆提名與在任',
    description: '歷屆大法官的任期與提名總統對照時間軸，看各屆組成與任命政治的結構。',
    keywords: '大法官 任期, 大法官 屆次, 大法官 提名, 大法官 任命',
  },
  {
    slug: 'graph', tab: 'graph', name: '意見書共同具名圖譜', type: 'CreativeWork',
    title: '大法官意見書共同具名網絡圖譜｜憲法法庭案例庫',
    description: '大法官在協同與不同意見書上的共同具名網絡：誰常與誰一起署名，跨屆的協作結構與世代分群。',
    keywords: '意見書 網絡, 大法官 共同具名, 協同意見書 網絡, 大法官 協作, 釋憲 網絡分析',
  },
  {
    slug: 'research', tab: 'research', name: '問題意識：意見書的分殊化', type: 'Article',
    title: '大法官意見書分殊化的實證研究｜審議專業化或任命政治化',
    description: '用憲法法庭資料檢驗意見書分殊化：協作層沿提名總統、投票層無顯著差異；含共同具名的階層 dyadic 模型與穩健性檢查。',
    keywords: '意見書 分殊化, 審議專業化, 任命政治化, 大法官 意見書 實證, 憲法法庭 計量, 立場表',
  },
  {
    slug: 'case1', tab: 'case1', name: '114 年憲判字第 1 號', type: 'Article',
    title: '114 年憲判字第 1 號分析｜憲法法庭案例庫',
    description: '114 年憲法法庭判決第 1 號的結構化分析：爭點、主文、意見書組成與其在案例庫中的定位。',
    keywords: '114 憲判 1, 憲法判決 分析, 憲法法庭 判決, 憲判字第一號',
  },
  {
    slug: 'history', tab: 'history', name: '中華民國司法解釋沿革', type: 'Article',
    title: '中華民國司法解釋沿革｜大理院到憲法法庭',
    description: '從行憲前大理院、最高法院、司法院統一解釋，到大法官釋字與 2022 年憲法訴訟新制的沿革，含意見書制度的開放歷程。',
    keywords: '司法解釋 沿革, 大法官 制度 歷史, 憲法訴訟法, 大理院 解釋, 統一解釋, 意見書 制度',
  },
  {
    slug: 'about', tab: 'about', name: '資料說明與方法', type: 'WebPage',
    title: '資料說明與方法｜憲法法庭案例庫',
    description: '案例庫的資料來源、涵蓋範圍、意見書編碼方式與已知限制，以及引註與 BibTeX 匯出的使用說明。',
    keywords: '憲法法庭 資料, 釋字 資料來源, 大法官 意見書 編碼, 引註 匯出',
  },
  {
    slug: 'collation', tab: 'collation', name: '大理院原典校勘', type: 'WebPage',
    title: '大理院原典校勘｜憲法法庭案例庫',
    description: '國家圖書館《大理院解釋例全文》紙本掃描、電腦辨識稿與維基文庫轉錄的逐頁校勘。',
    keywords: '大理院, 統字, OCR, 竪排, 維基文庫, 原典校勘',
    indexable: false,
  },
];

export const CC_TAB_SLUGS = CC_TABS_SEO.map((t) => t.slug);

// --- Per-justice pages: /constitutionalcourt/justices/<姓名> ---------------
// Each justice with real activity gets a clean, separately-indexable URL and a
// schema.org Person node, so "某某大法官意見書" style queries land on a page
// about that justice rather than the tab default. The path carries the Chinese
// name undecoded; React Router, the sitemap and the prerender server each apply
// URL-encoding at their own HTTP boundary, so every layer agrees on the URL.
export const ccJusticePath = (name) => `/constitutionalcourt/justices/${name}`;

// Who gets a page: anyone who authored, joined, or sat on any decision. The few
// justices with no recorded activity have nothing to show, so they stay out of
// the index (their URL still resolves, marked noindex).
export const justiceHasContent = (j) =>
  (j.提出意見書 ?? 0) > 0 || (j.加入意見書 ?? 0) > 0 ||
  (j.參與判決 ?? 0) > 0 || (j.參與解釋 ?? 0) > 0;

function tenureText(j) {
  return (j.任期 ?? [])
    .map((t) => {
      const a = t.起?.slice(0, 4);
      const b = t.訖?.slice(0, 4);
      return a && b ? `${a}–${b}` : a ? `${a}–` : '';
    })
    .filter(Boolean)
    .join('、');
}

// SEO page descriptor for one justice record. Pure data (no React), so the node
// build scripts can reuse it. Numbers and tenure come straight from the record
// the page renders, so the metadata never drifts from what a reader sees.
export function justiceSeo(j) {
  const name = j.姓名;
  const tt = tenureText(j);
  const 提名 = j.各段提名總統?.length
    ? [...new Set(j.各段提名總統)].join('、')
    : j.提名總統;
  const bits = [];
  if (j.提出意見書) bits.push(`提出意見書 ${j.提出意見書} 份`);
  if (j.加入意見書) bits.push(`加入 ${j.加入意見書} 份`);
  if (j.參與解釋) bits.push(`參與釋字 ${j.參與解釋} 件`);
  if (j.參與判決) bits.push(`參與憲法法庭裁判 ${j.參與判決} 件`);
  const description =
    `司法院大法官${name}${tt ? `（任期 ${tt}）` : ''}${提名 ? `，${提名}提名` : ''}的意見書與釋憲參與：` +
    `${bits.join('、')}。附可匯出的引註與 BibTeX。`;
  return {
    name: `${name}大法官`,
    title: `${name}大法官的意見書與釋憲參與｜憲法法庭案例庫`,
    description,
    keywords: `${name}, ${name} 大法官, ${name} 意見書, ${name} 協同意見書, ${name} 不同意見書, 司法院大法官`,
    type: 'ProfilePage',
    indexable: true,
    parent: { name: '歷任大法官', path: '/constitutionalcourt/justices' },
    // SeoHead calls this with (SITE_URL, pageUrl); pageUrl already carries the
    // encoded name, so the Person @id and the page @id line up.
    buildSchema: (SITE_URL, url) => [{
      '@type': 'Person',
      '@id': `${url}#person`,
      name,
      jobTitle: '大法官',
      worksFor: { '@type': 'GovernmentOrganization', name: '司法院憲法法庭', url: 'https://cons.judicial.gov.tw/' },
      ...(j.簡歷頁 ? { sameAs: [j.簡歷頁] } : {}),
      mainEntityOfPage: url,
    }],
  };
}

// --- Per-case pages: /constitutionalcourt/case/<字號> -----------------------
// A curated long tail of individually-indexable cases — landmark and frequently
// cited interpretations plus the憲法法庭 judgments — rather than all 813, which
// would balloon the per-deploy prerender. The selected 釋字 are the frozen list
// in case-index.js; every 憲判 is always in. A case not in the set still
// resolves (marked noindex).
const CC_INDEXED_釋字_SET = new Set(CC_INDEXED_釋字);
export const ccCasePath = (字號) => `/constitutionalcourt/case/${字號}`;
export const caseIsIndexable = (字號) => /憲判/.test(字號) || CC_INDEXED_釋字_SET.has(字號);

// SEO page descriptor for one case record (from data.文件). Pure data. Title
// leads with the case number so a "釋字748" search lands here; the schema models
// the decision itself as a schema.org Legislation (the closest standard type for
// a binding legal instrument), describing only fields the page shows.
export function caseSeo(doc) {
  const no = doc.字號;
  const 憲判 = /憲判/.test(no);
  const kind = 憲判 ? '憲法法庭判決' : '司法院大法官解釋';
  const 爭點 = (doc.爭點 || '').trim();
  const short = 爭點.length > 26 ? `${爭點.slice(0, 26)}…` : 爭點;
  const opinions = (doc.意見書 || []).filter((o) => o.作者類別 === '大法官').length;
  const parts = [`${no}（${doc.機關 ?? ''}${doc.日期 ? `，${doc.日期}` : ''}）`];
  if (爭點) parts.push(`爭點：${爭點}`);
  if (doc.結論類型) parts.push(`審查結論：${doc.結論類型}`);
  if (opinions) parts.push(`大法官意見書 ${opinions} 份`);
  return {
    name: no,
    title: `${no}${short ? `：${short}` : ''}｜憲法法庭案例庫`,
    description: parts.join('。').slice(0, 155),
    keywords: `${no}, ${no.replace(/第|號/g, '')}, ${kind}, 憲法法庭, 大法官解釋, 違憲審查${doc.主題 ? `, ${doc.主題}` : ''}`,
    type: 'Article',
    indexable: caseIsIndexable(no),
    parent: { name: '憲法法庭案例庫', path: '/constitutionalcourt' },
    buildSchema: (SITE_URL, url) => [{
      '@type': 'Legislation',
      '@id': `${url}#decision`,
      name: `${no}${doc.主題 ? `・${doc.主題}` : ''}`,
      legislationType: kind,
      legislationIdentifier: no,
      ...(doc.日期 ? { legislationDate: doc.日期 } : {}),
      legislationJurisdiction: '中華民國',
      inLanguage: 'zh-Hant-TW',
      ...(爭點 ? { about: 爭點 } : {}),
      creator: { '@type': 'GovernmentOrganization', name: 憲判 ? '憲法法庭' : '司法院大法官', url: 'https://cons.judicial.gov.tw/' },
      ...(doc.官方頁 ? { isBasedOn: doc.官方頁 } : {}),
      url,
    }],
  };
}
