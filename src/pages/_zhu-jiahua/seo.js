export const ZJH_TAB_SLUGS = ['legal-education', 'original-text'];

const PERSON = (SITE_URL) => ({
  '@type': 'Person',
  '@id': `${SITE_URL}/zhujiahua#person`,
  name: '朱家驊',
  alternateName: ['朱騮先', 'Chu Chia-hua'],
});

const BOOK = (SITE_URL) => ({
  '@type': 'Book',
  '@id': `${SITE_URL}/zhujiahua#speeches`,
  name: '朱家驊先生言論集',
  author: { '@id': `${SITE_URL}/zhujiahua#person` },
  editor: [
    { '@type': 'Person', name: '王聿均' },
    { '@type': 'Person', name: '孫斌合' },
  ],
  inLanguage: 'zh-Hant',
});

const legalItems = [
  ['中國之法律教育問題', '1945-04-18', '303–308'],
  ['法律教育的一種看法', '1947-06-27', '308–312'],
  ['法律教育委員會第五次會議致詞', '1948-02-04', '312–316'],
  ['法律教育委員會第六次會議致詞', '1948-07-01', '316–319'],
  ['法律教育委員會第七次會議致詞', '1948-12-02', '319–325'],
  ['法治行政', '1950-09-12', '325–330'],
];

export const ZJH_BASE_SEO = {
  name: '朱家驊研究室',
  title: '朱家驊研究室：言論集、法律教育與法治思想｜Phenom Canvas Lab',
  description: '整理《朱家驊先生言論集》的篇章、年代與場合，優先公開法律教育六篇索引及〈中國之法律教育問題〉校訂全文。',
  keywords: '朱家驊,朱家驊先生言論集,朱騮先,Chu Chia-hua,法律教育,法治行政,教育史,中國近代史',
  type: 'CollectionPage',
  buildSchema: (SITE_URL) => [PERSON(SITE_URL), BOOK(SITE_URL)],
};

export const ZJH_TABS_SEO = {
  'legal-education': {
    tab: 'legal',
    name: '朱家驊的法律教育論',
    title: '朱家驊的法律教育論：六篇言論、年代與制度脈絡',
    description: '1945 至 1950 年六篇法律教育言論完整索引：篇名、日期、場合、原書頁碼，以及民主法治、法學人才與制度建設的閱讀導引。',
    keywords: '朱家驊 法律教育,中國之法律教育問題,法律教育委員會,法治行政,法學教育史,民主法治',
    type: 'CollectionPage',
    buildSchema: (SITE_URL, url) => [
      PERSON(SITE_URL),
      BOOK(SITE_URL),
      {
        '@type': 'ItemList',
        '@id': `${url}#speeches`,
        name: '朱家驊法律教育言論六篇',
        numberOfItems: legalItems.length,
        itemListElement: legalItems.map(([name, datePublished, pagination], index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name,
            datePublished,
            pagination,
            author: { '@id': `${SITE_URL}/zhujiahua#person` },
            isPartOf: { '@id': `${SITE_URL}/zhujiahua#speeches` },
          },
        })),
      },
    ],
  },
  'original-text': {
    tab: 'text',
    name: '中國之法律教育問題全文',
    title: '〈中國之法律教育問題〉全文｜朱家驊，1945',
    description: '朱家驊〈中國之法律教育問題〉人工逐頁校訂全文。1945 年 4 月 18 日在教育部法律教育委員會致詞，原書第 303–308 頁。',
    keywords: '中國之法律教育問題 全文,朱家驊 全文,法律教育委員會,法學人才,民主政治,法治',
    type: 'Article',
    buildSchema: (SITE_URL, url) => [
      PERSON(SITE_URL),
      BOOK(SITE_URL),
      {
        '@type': 'Article',
        '@id': `${url}#speech`,
        headline: '中國之法律教育問題',
        alternativeHeadline: '在教育部法律教育委員會致詞',
        datePublished: '1945-04-18',
        dateModified: '2026-07-27',
        inLanguage: 'zh-Hant',
        pagination: '303–308',
        author: { '@id': `${SITE_URL}/zhujiahua#person` },
        isPartOf: { '@id': `${SITE_URL}/zhujiahua#speeches` },
        mainEntityOfPage: url,
        about: [
          { '@type': 'Thing', name: '法律教育' },
          { '@type': 'Thing', name: '民主政治' },
          { '@type': 'Thing', name: '法治' },
          { '@type': 'Thing', name: '法學人才' },
        ],
      },
    ],
  },
};
