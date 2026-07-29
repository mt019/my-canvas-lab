/*
 * 手記的 SEO/AEO 資料層。純資料與純函式，沒有 JSX——首頁那條路由（PAGE_META）與單篇
 * 文章那條路由都吃它，將來若有 node 腳本要用也進得來。
 *
 * 每篇的 keywords、摘要、日期都住在資料倉（notes-data），這裡只負責把它們接成 SeoHead
 * 認得的形狀。文章一多也不必回來改這個檔。
 */
import notes from '../../data/notes.json';

/* 左欄：按年份分組的文章清單。舊帖與短記那兩頁的左欄是同一份東西（讀完一則不必回清單
   才能讀下一篇），所以只寫一次。年份就是它的 topic。 */
export function postsNav() {
  const years = [...new Set(notes.posts.map((p) => p.publishedAt.slice(0, 4)))];
  return {
    topics: years.map((year) => ({ id: year, label: `${year} 年` })),
    articles: notes.posts.map((p) => ({ ...p, topic: p.publishedAt.slice(0, 4) })),
  };
}

export const NOTES_TITLE = '手記｜聽講、讀書與整理資料時寫下的短文｜Phenom Canvas Lab';

export const NOTES_DESC =
  '個人短文集：學術演講的現場筆記、讀完一批出版品之後的讀後記，以及整理資料途中想到的問題。題材集中在法律制度、法實證研究與學術社群，依發表日期由新到舊排列，每篇標明發表日與閱讀時間。';

export const NOTES_KEYWORDS = [
  '手記',
  '演講筆記',
  '讀後記',
  '法律制度觀察',
  '法實證研究',
  '學術演講紀錄',
  '個人隨筆',
].join('、');

/* 首頁：一個 Blog 節點，作為每篇文章的容器。這裡刻意不列出每一篇——文章的
   BlogPosting 節點長在它自己那一頁上（見下方 postSeo），sitemap 也會把網址交出去，
   在這裡再抄一份只會讓 App.jsx 為了產 schema 而把整份文章清單拉進主 bundle。 */
export function notesSchema(SITE_URL) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${SITE_URL}/notes#blog`,
      url: `${SITE_URL}/notes`,
      name: '手記',
      description: NOTES_DESC,
      inLanguage: 'zh-Hant-TW',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#org` },
    },
  ];
}

/* 舊帖存檔頁：58 則 2021–2023 年的短記收在一頁。**它們刻意不各自產網址**——最短的一則只有
   六個字，一則一頁就是五十幾條點進去只有一行字的網址，全部進 sitemap。所以搜尋引擎這邊
   只認得這一條 `/notes/archive`：它自己進 sitemap，收錄的每一則不進。

   篇數、年份、日期範圍都從資料倉的 notes-archive.json 來，這裡不寫死數字——新抓到的舊文
   會自動進這一頁，寫死的「58 則」隔天就是錯的。 */
export function archiveSeo(meta) {
  const from = meta.dateRange?.from ?? '';
  const to = meta.dateRange?.to ?? '';
  const span = `${from.slice(0, 4)}–${to.slice(0, 4)}`;
  return {
    name: '舊帖',
    title: '舊帖｜手記｜Phenom Canvas Lab',
    description:
      `${span} 年寫在 Matters 與一個已經關掉的個人站上的 ${meta.count} 則短記，`
      + '每則短到只有一兩行，最短的六個字。按年份排，由最早的一則讀下來，正文與當年一字不改。',
    keywords: ['舊帖', '短記', 'Matters', '舊站存檔', '學生時期筆記', '手記'].join('、'),
    type: 'CollectionPage',
    parent: { name: '手記', path: '/notes' },
    buildSchema: (SITE_URL, url) => [
      {
        '@context': 'https://schema.org',
        '@id': `${url}#webpage`,
        temporalCoverage: from && to ? `${from}/${to}` : undefined,
        isPartOf: { '@id': `${SITE_URL}/notes#blog` },
        about: { '@type': 'Thing', name: '2021–2023 年的短記存檔' },
      },
    ],
  };
}

/* 短記流：一句話一則，帶著說出來的那一刻。跟舊帖同一個判斷——**每一則刻意不各自產網址**，
   所以搜尋引擎只認得這一條 `/notes/stream`。

   則數與日期範圍從資料倉的 notes-stream.json 來，不寫死：這一頁每天都在長，寫死的數字
   隔天就是錯的。 */
export function streamSeo(meta) {
  const from = (meta.dateRange?.from ?? '').slice(0, 10);
  const to = (meta.dateRange?.to ?? '').slice(0, 10);
  return {
    name: '短記',
    title: '短記｜手記｜Phenom Canvas Lab',
    description:
      `${meta.count} 則一句話長度的隨手紀錄，每則標明說出來的時刻，由新到舊按月份與日期排列。`
      + '題材是日常見聞與讀書、聽講途中的即時想法，不成篇也不修飾。',
    keywords: ['短記', '微網誌', '隨手筆記', '日常紀錄', '時間戳', '手記'].join('、'),
    type: 'CollectionPage',
    parent: { name: '手記', path: '/notes' },
    buildSchema: (SITE_URL, url) => [
      {
        '@context': 'https://schema.org',
        '@id': `${url}#webpage`,
        temporalCoverage: from && to ? `${from}/${to}` : undefined,
        isPartOf: { '@id': `${SITE_URL}/notes#blog` },
        about: { '@type': 'Thing', name: '一句話長度的日常紀錄' },
      },
    ],
  };
}

/* 單篇：SeoHead 收到 type: 'Article' 之後會自己產 headline／author／publisher 那些欄位，
   這裡補的是它不知道的東西——發表日、改版日、閱讀時間、標籤，以及這篇屬於哪個文集。
   節點的 @id 與 SeoHead 主節點相同，JSON-LD 消費端會把兩者併成同一個實體。 */
export function postSeo(post) {
  return {
    name: post.title,
    title: `${post.title}｜手記｜Phenom Canvas Lab`,
    description: post.summary,
    keywords: (post.keywords ?? []).join('、'),
    type: 'Article',
    parent: { name: '手記', path: '/notes' },
    buildSchema: (SITE_URL, url) => [
      {
        '@context': 'https://schema.org',
        '@id': `${url}#webpage`,
        alternativeHeadline: post.subtitle,
        datePublished: post.publishedAt,
        ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
        timeRequired: `PT${post.readingMinutes}M`,
        keywords: (post.keywords ?? []).join('、'),
        isPartOf: { '@id': `${SITE_URL}/notes#blog` },
        about: (post.tags ?? []).map((tag) => ({ '@type': 'Thing', name: tag })),
      },
    ],
  };
}
