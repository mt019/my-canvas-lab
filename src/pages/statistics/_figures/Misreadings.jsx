import Accordion, { useExpandedSet } from '../../../components/lab/Accordion';
import Badge from '../../../components/lab/Badge';

/*
 * The standard misreadings: what the sentence claims, and what p actually says.
 * A list, not a chart — nobody has counted how often each one occurs, and a bar
 * chart of invented frequencies would be worse than saying nothing.
 */
export default function Misreadings({ items = [], lang = 'zh' }) {
  const { isOpen, toggle } = useExpandedSet(items.map((it) => it.id));
  const pick = (it) => (lang === 'en' && it.en ? it.en : it);

  return (
    <div className="my-8 rounded-token-md border border-line-soft px-5 py-2">
      <Accordion
        isOpen={isOpen}
        onToggle={toggle}
        items={items.map((it) => {
          const c = pick(it);
          return {
            id: it.id,
            title: <span className="text-ink">{c.claim}</span>,
            meta: <Badge tone="danger">{lang === 'en' ? 'misreading' : '誤讀'}</Badge>,
            render: () => (
              <div className="text-token-sm leading-relaxed">
                <p className="text-ink">{c.why}</p>
                {c.instead ? (
                  <p className="mt-2 border-l-2 border-line pl-3 text-ink-muted">{c.instead}</p>
                ) : null}
              </div>
            ),
          };
        })}
      />
    </div>
  );
}
