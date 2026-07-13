import Accordion, { useExpandedSet } from '../../../components/lab/Accordion';

/*
 * The sequence of events, told as events. A time axis would suggest the spacing
 * between the years carries information; it does not.
 */
export default function Timeline({ items = [] }) {
  const { isOpen, toggle } = useExpandedSet(items.map((it) => it.year));

  return (
    <div className="my-8 rounded-token-md border border-line-soft px-5 py-2">
      <Accordion
        isOpen={isOpen}
        onToggle={toggle}
        items={items.map((it) => ({
          id: it.year,
          title: (
            <span className="flex items-baseline gap-3">
              <span className="w-12 shrink-0 font-accent text-token-sm text-ink-faint">{it.year}</span>
              <span className="text-ink">{it.title}</span>
            </span>
          ),
          render: () => (
            <p className="text-token-sm leading-relaxed text-ink-muted">{it.body}</p>
          ),
        }))}
      />
    </div>
  );
}
