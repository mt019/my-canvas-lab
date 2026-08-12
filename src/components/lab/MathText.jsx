import { Fragment, useMemo } from 'react';
import Math from './Math';

/*
 * Prose that arrives as a plain string from a data repository and may contain
 * inline LaTeX between single dollar signs. .mdx files get remark-math at build
 * time and JSX uses <Math tex="…" />; a JSON field has neither, so quiz options,
 * statement lists and captions used to print the source verbatim ($2^k$).
 *
 * Splitting here keeps the rule that a mathematical symbol may only enter
 * through LaTeX (docs/DESIGN.md, KaTeX exception) — the data layer writes the
 * same $…$ it would write in prose, and one symbol still renders in one face.
 *
 * Anything that is not a string (a React node a caller built itself) passes
 * through untouched, so components can hand their content over unconditionally.
 */
const SEGMENT = /\$([^$\n]+)\$/g;

export default function MathText({ children }) {
  const parts = useMemo(() => {
    if (typeof children !== 'string' || !children.includes('$')) return null;
    const out = [];
    let last = 0;
    for (const m of children.matchAll(SEGMENT)) {
      if (m.index > last) out.push(children.slice(last, m.index));
      out.push({ tex: m[1] });
      last = m.index + m[0].length;
    }
    if (last < children.length) out.push(children.slice(last));
    return out;
  }, [children]);

  if (parts === null) return children ?? null;

  return parts.map((part, i) =>
    typeof part === 'string'
      ? <Fragment key={i}>{part}</Fragment>
      : <Math key={i} tex={part.tex} />,
  );
}
