/*
 * SEO / AEO 資料，聲樂訓練・Vaccai 練習本。純資料，App.jsx 接線、SeoHead 輸出。
 *
 * 原則同 SeoHead：只描述頁面真的有的東西——這本 1832 年的教材（Book）、二十二首練習
 * 連同出處考證這批資料（Dataset）、寫詞的 Metastasio 與寫曲的 Vaccai（Person）。
 * 不捏造 FAQ、評分、不存在的作者。
 *
 * 長尾關鍵字放頁面上真的出現的東西：二十二首的義大利文首句、Metastasio 的劇目名、
 * 三套編號的講法。查「Avvezzo a vivere 中文」「Vaccai 第幾課」這種問法才接得住。
 */

// 二十二首的義大利文首句，全部真實出現在頁上。
const INCIPITS = [
  'Manca sollecita', 'Semplicetta tortorella', 'Lascia il lido', 'Avvezzo a vivere',
  "Bella prova è d'alma forte", "Fra l'ombre un lampo solo", "Quell'onda che ruina",
  'Delira dubbiosa', "Nel contrasto amor s'accende", 'Come il candore',
  "Senza l'amabile", 'Benché di senso privo', 'La gioia verace',
  "L'augelletto in lacci stretto", 'Quando accende un nobil petto', 'Più non si trovano',
  'Se povero il ruscello', "Siam navi all'onde algenti", "Vorrei spiegar l'affanno",
  'O placido il mare', 'La Patria è un tutto', "Alla stagion de' fiori",
];

export const VT_KEYWORDS = [
  'Vaccai',
  'Vaccaj',
  'Nicola Vaccai',
  '瓦卡伊',
  'Metodo pratico di canto italiano',
  '義大利歌唱實用法',
  'Vaccai 練習曲',
  'Vaccai 中文翻譯',
  'Vaccai 第幾課',
  '聲樂練習',
  '美聲唱法',
  'bel canto',
  '義大利藝術歌曲',
  '義大利文歌唱咬字',
  'Metastasio',
  '梅塔斯塔齊歐',
  'Demetrio',
  'Olimpiade',
  'Attilio Regolo',
  ...INCIPITS,
].join('、');

export const VT_TITLE =
  'Vaccai《義大利歌唱實用法》二十二首・歌詞中譯與 Metastasio 出處考證｜Phenom Canvas Lab';

export const VT_DESC =
  'Nicola Vaccai 1832 年在倫敦出版的《Metodo pratico di canto italiano per camera》，二十二首帶詞的技術練習全部收錄：義大利文原詞、逐行中文翻譯、每一首在練的技術，以及詞句在 Metastasio 劇本裡的原始場景（第幾幕第幾場、誰對誰唱）——二十二首中十五首已逐一定位到原文，未查到的標為未考證。另附三套編號（原書十五課／二十二首／IMSLP 1a-2b 式）的對照表，以及第四首〈Avvezzo a vivere〉與 Metastasio 原文的異文比對。';

export const vtSchema = (SITE_URL) => {
  const url = `${SITE_URL}/vocaltraining`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Book',
      '@id': `${url}#book`,
      name: 'Metodo pratico di canto italiano per camera',
      alternateName: ['義大利歌唱實用法', 'Practical Method of Italian Singing'],
      description:
        '尼可拉・瓦卡伊 1832 年於倫敦出版的聲樂教材。十五課、二十二首帶詞的短練習，從音階、音程、半音、切分，到倚音、短倚音、漣音、迴音、顫音、快速音群、聲音的攜帶與宣敘調；歌詞全部取自 Metastasio 的劇本詩句，而非唱名或無意義的音節。',
      author: { '@id': `${url}#vaccai` },
      contributor: { '@id': `${url}#metastasio` },
      datePublished: '1832',
      inLanguage: 'it',
      genre: '聲樂教材',
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${url}#vaccai`,
      name: 'Nicola Vaccai',
      alternateName: ['Nicola Vaccaj', '尼可拉・瓦卡伊'],
      birthDate: '1790-03-15',
      deathDate: '1848-08-05',
      birthPlace: { '@type': 'Place', name: 'Tolentino, Italy' },
      deathPlace: { '@type': 'Place', name: 'Pesaro, Italy' },
      jobTitle: ['作曲家', '聲樂教師'],
      sameAs: 'https://en.wikipedia.org/wiki/Nicola_Vaccai',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${url}#metastasio`,
      name: 'Pietro Metastasio',
      alternateName: ['Pietro Antonio Domenico Trapassi', '梅塔斯塔齊歐'],
      birthDate: '1698-01-03',
      deathDate: '1782-04-12',
      jobTitle: '劇作家',
      sameAs: 'https://en.wikipedia.org/wiki/Metastasio',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      '@id': `${url}#dataset`,
      name: 'Vaccai 二十二首練習・歌詞中譯與 Metastasio 出處考證',
      description: VT_DESC,
      keywords: VT_KEYWORDS,
      inLanguage: ['zh-Hant', 'it'],
      isAccessibleForFree: true,
      creator: { '@id': `${SITE_URL}/#org` },
      about: { '@id': `${url}#book` },
      url,
    },
  ];
};
