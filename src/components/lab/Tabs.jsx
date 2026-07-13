import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/*
 * Tab state that lives in the URL, so every tabbed view on the site is
 * deep-linkable and back-button-correct. Before this existed, only
 * ConstitutionalCourt bothered; GovernmentDebt and ECFA used bare useState,
 * which silently broke sharing a link to a specific view.
 *
 * The default value is kept OUT of the query string (a bare /page and
 * /page?tab=<default> must be the same URL), and switching tabs scrolls to
 * top — a long tab body otherwise leaves the reader mid-page in a view they
 * have not read yet.
 */
export function useTabParam(key = 'tab', fallback = 'index') {
  const [values, setValues] = useTabParams({ [key]: fallback });
  const setValue = useCallback((next) => setValues({ [key]: next }), [key, setValues]);
  return [values[key], setValue];
}

/*
 * Two tab dimensions at once — a main tab and a sub-tab, where picking a main tab
 * also resets the sub-tab. Two separate useTabParam calls cannot do this: each
 * setter closes over the query string as it was at render time, so calling both
 * in one click handler makes the second write overwrite the first, and one of the
 * two values silently disappears from the URL. One hook, one write.
 *
 *   const [{ tab, sub }, setTabs] = useTabParams({ tab: 'overview', sub: 'rank' });
 *   setTabs({ tab: 'china', sub: DEFAULT_SUB.china });   // one atomic update
 */
export function useTabParams(defaults) {
  const [params, setParams] = useSearchParams();

  const values = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, params.get(key) ?? fallback]),
  );

  const setValues = useCallback((patch) => {
    setParams((prev) => {
      const out = new URLSearchParams(prev);
      for (const [key, next] of Object.entries(patch)) {
        if (next === defaults[key]) out.delete(key); // default stays out of the URL
        else out.set(key, next);
      }
      return out;
    });
    window.scrollTo({ top: 0 });
    // defaults is a literal at the call site; compare by content, not identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParams, JSON.stringify(defaults)]);

  return [values, setValues];
}

const VARIANTS = {
  // Underline: the page's primary sections. Reads as a table of contents.
  underline: {
    list: 'flex gap-5 overflow-x-auto border-b border-line',
    item: 'shrink-0 -mb-px border-b-2 pb-2 pt-1 text-token-sm transition-colors duration-fast',
    on: 'border-accent text-ink',
    off: 'border-transparent text-ink-faint hover:text-ink-muted',
  },
  // Quiet: sub-sections inside a section, and switches inside a figure.
  quiet: {
    list: 'flex gap-1 overflow-x-auto pb-1',
    item: 'shrink-0 rounded-md px-2.5 py-1 text-token-xs transition-colors duration-fast',
    on: 'bg-accent-soft text-accent',
    off: 'text-ink-faint hover:bg-surface hover:text-ink-muted',
  },
  // Bar: a dark navigation strip under a dark page header. Pages with their own
  // chrome (a colored masthead) need the tab strip to belong to that masthead;
  // the underline variant assumes a paper background and goes invisible there.
  bar: {
    list: 'flex gap-5 overflow-x-auto bg-accent px-4',
    item: 'shrink-0 border-b-2 py-3 text-token-sm transition-colors duration-fast',
    on: 'border-paper text-paper',
    off: 'border-transparent text-paper/60 hover:text-paper',
  },
  // Pill: sub-tabs that need to read as buttons rather than as links.
  pill: {
    list: 'flex gap-1.5 overflow-x-auto pb-1',
    item: 'shrink-0 rounded-token-md border px-3 py-1.5 text-token-xs transition-colors duration-fast',
    on: 'border-accent bg-accent text-paper',
    off: 'border-line bg-surface-raised text-ink-muted hover:border-accent hover:text-accent',
  },
};

export default function Tabs({ items, value, onChange, variant = 'underline', className = '', style, label }) {
  const v = VARIANTS[variant] ?? VARIANTS.underline;
  // style is for a page that owns its own chrome color (a colored masthead the
  // strip has to match); the variants cover everything else.
  return (
    <div role="tablist" aria-label={label} className={`${v.list} ${className}`} style={style}>
      {items.map(({ id, label: text, count }) => {
        const active = id === value;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`${v.item} ${active ? v.on : v.off}`}
          >
            {text}
            {count != null ? <span className="ml-1.5 text-ink-faint">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
