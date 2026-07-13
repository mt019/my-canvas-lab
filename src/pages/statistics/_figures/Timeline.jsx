import Accordion, { useExpandedSet } from '../../../components/lab/Accordion';

/*
 * The sequence of events, told as events. A drawn time axis would imply that the
 * gaps between the years carry information. They do not.
 */
export default function Timeline({ items = [], lang = 'zh' }) {
  const { isOpen, toggle } = useExpandedSet(items.map((it) => it.year));
  const pick = (it) => (lang === 'en' && it.en ? it.en : it);

  return (
    <div className="my-8 rounded-token-md border border-line-soft px-5 py-2">
      <Accordion
        isOpen={isOpen}
        onToggle={toggle}
        items={items.map((it) => {
          const c = pick(it);
          return {
            id: it.year,
            title: (
              <span className="flex items-baseline gap-3">
                <span className="w-16 shrink-0 font-accent text-token-sm text-ink-faint">{it.year}</span>
                <span className="text-ink">{c.title}</span>
              </span>
            ),
            render: () => <p className="text-token-sm leading-relaxed text-ink-muted">{c.body}</p>,
          };
        })}
      />
    </div>
  );
}
