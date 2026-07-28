import readingView from '../data/chenYinke/liu-rushi-edition/reading-view.json';

export const CHEN_SELECTION_PATH = (id) => `/chenyinke/liu-rushi/${id}`;
export const CHEN_SELECTION_IDS = readingView.selections.map((selection) => selection.id);

const PERSON = (SITE_URL) => ({
  '@type': 'Person',
  '@id': `${SITE_URL}/chenyinke#person`,
  name: '陳寅恪',
  alternateName: ['陳寅恪先生', 'Chen Yinke', 'Chen Yinque'],
});

const PRESS = (SITE_URL) => ({
  '@type': 'Organization',
  '@id': `${SITE_URL}/chenyinke#shanghai-ancient-books-press`,
  name: '上海古籍出版社',
});

const BOOK = (SITE_URL) => ({
  '@type': 'Book',
  '@id': `${SITE_URL}/chenyinke#liu-rushi-biography`,
  name: '柳如是別傳',
  author: { '@id': `${SITE_URL}/chenyinke#person` },
  inLanguage: 'zh-Hant',
});

export const CHEN_BASE_SEO = {
  name: '陳寅恪《柳如是別傳》資料庫',
  title: '陳寅恪《柳如是別傳》原文資料庫｜逐段校訂、引文出處與人物索引',
  description: `依原書次序公開《柳如是別傳》逐字整理原文，目前收錄卷前、第一章、第二章及第三章開篇，共 ${readingView.workProgress.selectedBlocks} 個原書區塊；原文、引文、出版社說明與編者解讀分層標示。`,
  keywords: '陳寅恪,柳如是別傳,柳如是,錢謙益,河東君,原文,全文,明清史,以詩證史,上海古籍出版社',
  type: 'CollectionPage',
  buildSchema: (SITE_URL) => [PERSON(SITE_URL), PRESS(SITE_URL), BOOK(SITE_URL)],
};

function selectionDescription(selection) {
  const responsibility = selection.textAttribution.representation === 'publisher-preface'
    ? `${selection.textAttribution.displayLabel}的出版社說明`
    : `${selection.textAttribution.displayLabel}《柳如是別傳》原文`;
  return `${selection.section}：${responsibility}，依原書逐字整理，共 ${selection.scope.blockCount} 個原書區塊。頁面分別標示正文、書中引文、人物稱謂與本站編者解讀，不把後加說明混入原文。`;
}

export const CHEN_SELECTIONS_SEO = Object.fromEntries(
  readingView.selections.map((selection) => {
    const publisherText = selection.textAttribution.representation === 'publisher-preface';
    return [selection.id, {
      selectionId: selection.id,
      name: selection.section,
      title: `${selection.section}｜《柳如是別傳》逐字原文`,
      description: selectionDescription(selection),
      keywords: `${selection.section.replace(/[\u3000・]/g, ',')},陳寅恪,柳如是別傳,原文,逐字整理`,
      // WebPage avoids claiming that the research site authored the historical text.
      // The CreativeWork node below carries the actual, data-backed responsibility.
      type: 'WebPage',
      buildSchema: (SITE_URL, url) => [
        PERSON(SITE_URL),
        PRESS(SITE_URL),
        BOOK(SITE_URL),
        {
          '@type': 'CreativeWork',
          '@id': `${url}#text`,
          name: selection.section,
          inLanguage: 'zh-Hant',
          isPartOf: { '@id': `${SITE_URL}/chenyinke#liu-rushi-biography` },
          mainEntityOfPage: url,
          pagination: `${selection.scope.contentFromBlock}–${selection.scope.toBlock}`,
          [publisherText ? 'creator' : 'author']: {
            '@id': publisherText
              ? `${SITE_URL}/chenyinke#shanghai-ancient-books-press`
              : `${SITE_URL}/chenyinke#person`,
          },
        },
      ],
    }];
  }),
);
