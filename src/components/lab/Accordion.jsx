import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/*
 * Expandable sections, multi-select, and everything starts open.
 *
 * "Everything starts open" is a standing rule for this site: a collapsed card
 * hides content the reader came for, and a page of collapsed cards is a page
 * of nothing. The rule is enforced here rather than documented: there is no
 * way to ask for an initially-collapsed set. Passing the ids is the only
 * option, and the initial state is all of them.
 */
export function useExpandedSet(ids) {
  const [openIds, setOpenIds] = useState(() => new Set(ids));

  const toggle = useCallback((id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setOpenIds(new Set(ids)), [ids]);
  const collapseAll = useCallback(() => setOpenIds(new Set()), []);
  const isOpen = useCallback((id) => openIds.has(id), [openIds]);

  return { openIds, toggle, expandAll, collapseAll, isOpen };
}

export function AccordionItem({ id, title, meta, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-line-soft last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors duration-fast hover:text-accent"
      >
        <ChevronDown
          size={15}
          className={`shrink-0 text-ink-faint transition-transform duration-fast ${isOpen ? '' : '-rotate-90'}`}
        />
        <span className="flex-1 text-token-base">{title}</span>
        {meta ? <span className="shrink-0 text-token-xs text-ink-faint">{meta}</span> : null}
      </button>
      {isOpen ? <div className="pb-4 pl-[27px] pr-1">{children}</div> : null}
    </div>
  );
}

export default function Accordion({ items, isOpen, onToggle, className = '' }) {
  return (
    <div className={className}>
      {items.map(({ id, title, meta, render }) => (
        <AccordionItem key={id} id={id} title={title} meta={meta} isOpen={isOpen(id)} onToggle={onToggle}>
          {typeof render === 'function' ? render() : render}
        </AccordionItem>
      ))}
    </div>
  );
}
