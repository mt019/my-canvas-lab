import { Link } from 'react-router-dom';
import LangSwitch from './LangSwitch';
import FontSizeControl from './FontSizeControl';
import AppearanceMenu from './AppearanceMenu';

const WIDTHS = {
  article: 'max-w-[86rem]', // matches ArticleLayout's three-column grid
  prose: 'max-w-[52rem]',   // a single reading column
};

/*
 * The bar every page inside a topic site wears: the way back, the language, the
 * size of the type, the look of the paper. Three pages had hand-copied it before
 * this existed, and the copies had already drifted — one of them pointed home to
 * the canvas root.
 *
 * `back` is required, and it takes the topic site's own home, never the canvas
 * root. A reader deep in a term page wants the site they are reading, not the
 * shelf the site sits on; the canvas root is one more click from there. Making
 * the prop required is the enforcement — a page cannot forget to answer it.
 *
 * It sticks. Language and type size are settings a reader reaches for in the
 * middle of a paragraph, which is exactly where they used to be unreachable: the
 * controls scrolled off with the header and you had to go back to the top of the
 * page to change how the page reads. The bar stays thin, sits on paper with a
 * hairline under it, and carries no fill of its own — chrome that hovers over an
 * essay has to be almost nothing.
 */
export default function SiteHeader({ back, width = 'article', lang, onLangChange, scale, onScaleChange }) {
  if (!back?.href || !back?.label) {
    throw new Error('SiteHeader: `back` needs { href, label } — a page inside a topic site must say where "back" is');
  }

  return (
    <div className="sticky top-0 z-40 mb-6 border-b border-line-soft bg-paper/95 backdrop-blur-sm">
      <div className={`mx-auto flex items-center justify-between gap-4 px-4 py-2 sm:px-6 ${WIDTHS[width] ?? WIDTHS.article}`}>
        <Link
          to={back.href}
          className="text-token-sm text-ink-faint transition-colors duration-fast hover:text-accent"
        >
          ← {back.label}
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitch lang={lang} onChange={onLangChange} />
          <FontSizeControl scale={scale} onChange={onScaleChange} />
          <AppearanceMenu lang={lang} />
        </div>
      </div>
    </div>
  );
}
