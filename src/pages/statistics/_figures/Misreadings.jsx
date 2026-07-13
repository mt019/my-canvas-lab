import Accordion, { useExpandedSet } from '../../../components/lab/Accordion';
import Badge from '../../../components/lab/Badge';

/*
 * The standard misreadings, each with what the sentence actually claims and what
 * p actually says. A list, not a chart: nobody has counted how often each one
 * occurs, and inventing a bar chart of made-up frequencies would be worse than
 * saying nothing.
 */
export default function Misreadings({ items = [] }) {
  const { isOpen, toggle } = useExpandedSet(items.map((it) => it.id));

  return (
    <div className="my-8 rounded-token-md border border-line-soft px-5 py-2">
      <Accordion
        isOpen={isOpen}
        onToggle={toggle}
        items={items.map((it) => ({
          id: it.id,
          title: <span className="text-ink">{it.claim}</span>,
          meta: <Badge tone="danger">誤讀</Badge>,
          render: () => (
            <div className="text-token-sm leading-relaxed">
              <p className="text-ink">{it.why}</p>
              {it.instead ? (
                <p className="mt-2 border-l-2 border-line pl-3 text-ink-muted">{it.instead}</p>
              ) : null}
            </div>
          ),
        }))}
      />
    </div>
  );
}
