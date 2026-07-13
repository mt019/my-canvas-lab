import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/*
 * A click on a link is a move to a new page, and a new page starts at its
 * beginning. The router does not do this on its own: it swaps the component and
 * leaves the scroll position where it was, so following a term from halfway down
 * an index lands the reader halfway down the term's page — usually in the middle
 * of a sentence they never asked to read.
 *
 * Anchored navigation (/page#section) is left alone: there the reader named the
 * place they wanted to land.
 *
 * Back and forward are also left alone. The browser restores the position it
 * remembers, and that is the whole point of going back.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    const nav = window.performance?.getEntriesByType?.('navigation')?.[0];
    if (nav?.type === 'back_forward') return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
