import { useEffect } from 'react';
import PageIdentity from './PageIdentity';
import BackLink from './BackLink';
import { SHELL_PAD_X_RAIL } from './shellPadding';

const WIDTHS = {
  prose: 'max-w-3xl', // ~65ch at body size — Notion/Vercel-style reading measure
  wide: 'max-w-6xl',
};

/*
 * prose 版的欄寬只有 48rem，寬螢幕上兩側本來就剩一大片外邊界，再加內距只會把行長壓短；
 * wide 版可以撐到 72rem，接近視窗寬時就會貼邊，所以只有它需要留白。
 */
const PAD_X = {
  prose: 'px-4 sm:px-6',
  wide: SHELL_PAD_X_RAIL,
};

/*
 * Common page chrome: clean --c-paper backdrop (the only allowed prose
 * background), reading measure, document.title, and a header slot for
 * LangSwitch / FontSizeControl. In prose mode the content wrapper carries
 * --fs so FontSizeControl can scale long-form text via
 * calc(var(--text-body) * var(--fs, 1)).
 */
export default function PageShell({
  title,
  eyebrow,
  width = 'prose',
  controls,
  fontScale,
  manageDocumentTitle = true,
  // 返回鍵。不傳＝照全站配置（`src/backNav.js`）決定回哪裡；傳 `null`＝這頁不畫；
  // 傳 `{ href, label }`＝這頁自己說了算。頁面不必再各寫各的。
  back,
  children,
}) {
  useEffect(() => {
    if (manageDocumentTitle && title) document.title = title;
  }, [manageDocumentTitle, title]);

  // The reader lever rides on a CSS var, and .reader-scale (index.css) turns it
  // into `zoom` on the content wrapper *below* the toolbar — never on the full
  // width <main>. The mx-auto frame stays outside the zoom, so the margins hold
  // still while the type grows. The toolbar row keeps its own fixed size.
  const scaleStyle = fontScale != null ? { '--reader-scale': fontScale } : undefined;

  return (
    <main className="min-h-screen bg-paper paper-texture text-ink" style={scaleStyle}>
      <div className={`mx-auto py-10 ${PAD_X[width] ?? PAD_X.prose} ${WIDTHS[width] ?? WIDTHS.prose}`}>
        <div className="group mb-4 flex items-center justify-between gap-4">
          <BackLink back={back} />
          <span className="flex-1" />
          {controls ? <div className="flex items-center gap-2">{controls}</div> : null}
        </div>
        <div className={`reader-scale ${width === 'prose' ? 'prose-scaled' : ''}`}>
          <header className="mb-8">
            <PageIdentity eyebrow={eyebrow} title={title} />
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
