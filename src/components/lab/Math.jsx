import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../../styles/katex.css';

/*
 * Formula rendering, for JSX. Prose in .mdx uses $…$ / $$…$$ instead, which
 * remark-math + rehype-katex compile at build time; this component is the same
 * pipeline for figures and UI labels written in JSX.
 *
 * Math-bearing pages never type Unicode math (alpha, H-nought, sigma) into
 * source: LaTeX is the only way a mathematical symbol may enter, so one symbol
 * always renders in one face. scripts/validate-math-notation.mjs fails the
 * build on a stray Unicode math character. See docs/DESIGN.md, KaTeX exception.
 */
export default function Math({ tex, display = false, className = '' }) {
  const html = useMemo(
    () => katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      output: 'htmlAndMathml',
      trust: false,
      strict: 'ignore',
    }),
    [tex, display],
  );

  const Tag = display ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
