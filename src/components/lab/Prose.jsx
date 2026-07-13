import { MDXProvider } from '@mdx-js/react';
import 'katex/dist/katex.min.css';
import '../../styles/katex.css';

/*
 * The typography layer for MDX articles.
 *
 * An .mdx file is plain markdown — no classes, no styling, no imports. Every
 * heading, paragraph and quote it produces is mapped here, once, to the site's
 * type scale and ink tokens. That is what keeps markdown authoring from
 * drifting away from the design system: the author picks structure, this file
 * picks the look.
 *
 * `components` also carries the interactive figures, so an article can write
 * <LadyTastingTea /> without importing anything — the page that renders the
 * article decides which figures exist.
 *
 * KaTeX's stylesheet is imported here rather than in Math.jsx, because prose gets
 * its formulas from remark-math at build time and never touches that component.
 * Without the stylesheet, KaTeX's MathML copy of every formula stops being hidden
 * and each one renders twice ("1/701/70").
 */

const BASE = {
  h2: (props) => (
    <h2
      className="mt-12 mb-4 scroll-mt-8 font-display text-token-xl leading-snug text-ink"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mt-8 mb-3 font-display text-token-lg leading-snug text-ink" {...props} />
  ),
  p: (props) => (
    <p className="my-4 text-scaled-base leading-[1.85] text-ink" {...props} />
  ),
  a: (props) => (
    <a
      className="text-accent underline decoration-line underline-offset-2 transition-colors duration-fast hover:decoration-accent"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noreferrer' : undefined}
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-6 border-l-2 border-line pl-4 text-scaled-base leading-[1.8] text-ink-muted"
      {...props}
    />
  ),
  ul: (props) => <ul className="my-4 list-disc space-y-1.5 pl-5 text-scaled-base leading-[1.8]" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-1.5 pl-5 text-scaled-base leading-[1.8]" {...props} />,
  li: (props) => <li className="pl-1 text-ink" {...props} />,
  hr: () => <hr className="my-10 border-line-soft" />,
  strong: (props) => <strong className="font-normal text-ink [text-emphasis:filled_dot] [text-emphasis-position:under]" {...props} />,
  em: (props) => <em className="not-italic text-ink-muted" {...props} />,
  code: (props) => (
    <code className="rounded-token-sm bg-surface px-1 py-0.5 font-accent text-scaled-sm text-ink" {...props} />
  ),
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-token-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border-b border-line px-3 py-2 text-left align-bottom text-token-xs text-ink-faint" {...props} />
  ),
  td: (props) => <td className="border-b border-line-soft px-3 py-2 align-top text-ink" {...props} />,
};

export default function Prose({ components, children }) {
  return (
    <MDXProvider components={{ ...BASE, ...components }}>
      <div className="prose-scaled">{children}</div>
    </MDXProvider>
  );
}
