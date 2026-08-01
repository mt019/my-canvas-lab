import LangSwitch from './LangSwitch';
import FontSizeControl from './FontSizeControl';
import AppearanceMenu from './AppearanceMenu';
import AccountControl from './AccountControl';
import BackLink from './BackLink';
import { SHELL_PAD_X_RAIL, SHELL_PAD_X_TIGHT } from './shellPadding';

const WIDTHS = {
  article: 'max-w-[86rem]', // matches ArticleLayout's three-column grid
  prose: 'max-w-[52rem]',   // a single reading column
};

/*
 * 內距要跟底下那層版型對齊，否則返回鍵與正文會落在兩條左邊界上。`article` 對的是
 * ArticleLayout 的三欄格線（同樣 86rem、同樣 RAIL 值）；`prose` 的 52rem 在寬螢幕上
 * 本來就置中、兩側剩一大片外邊界，不需要再加。
 */
const PAD_X = {
  article: SHELL_PAD_X_RAIL,
  prose: SHELL_PAD_X_TIGHT,
};

/*
 * The bar every page inside a topic site wears: the way back, the language, the
 * size of the type, the look of the paper. Three pages had hand-copied it before
 * this existed, and the copies had already drifted — one of them pointed home to
 * the canvas root.
 *
 * `back` takes the topic site's own home, never the canvas root. A reader deep in
 * a term page wants the site they are reading, not the shelf the site sits on;
 * the root is one more click from there. The prop used to be required, because a
 * page that forgot it shipped a header with no way out. It is optional now for a
 * better reason: `src/backNav.js` already knows every topic site's home, so a page
 * that says nothing still gets the right link, and the global switch can turn the
 * whole site's back links off in one place. Pass it only to override.
 *
 * It sticks. Language and type size are settings a reader reaches for in the
 * middle of a paragraph, which is exactly where they used to be unreachable: the
 * controls scrolled off with the header and you had to go back to the top of the
 * page to change how the page reads. The bar stays thin, sits on paper with a
 * hairline under it, and carries no fill of its own — chrome that hovers over an
 * essay has to be almost nothing.
 */
export default function SiteHeader({ back, width = 'article', lang, onLangChange, scale, onScaleChange }) {
  return (
    <div className="sticky top-0 z-40 mb-6 border-b border-line-soft bg-paper/95 backdrop-blur-sm">
      <div className={`mx-auto flex items-center justify-between gap-4 py-2 ${PAD_X[width] ?? PAD_X.article} ${WIDTHS[width] ?? WIDTHS.article}`}>
        <BackLink back={back} />
        <span className="flex-1" />
        <div className="flex items-center gap-2">
          {/* 沒有英文版就不掛語言鍵。這條是被 /brief/events 撞出來的：它沒傳 onLangChange，
              於是「中文｜EN」照樣畫在工具列上，而 onChange 是 undefined——點下去直接丟例外。
              一個按不動的按鈕比沒有按鈕糟：它宣稱這頁有英文版，而那是假的。 */}
          {onLangChange ? <LangSwitch lang={lang} onChange={onLangChange} /> : null}
          <FontSizeControl scale={scale} onChange={onScaleChange} />
          <AppearanceMenu lang={lang} />
          <AccountControl />
        </div>
      </div>
    </div>
  );
}
