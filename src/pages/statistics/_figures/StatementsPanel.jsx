import Accordion, { useExpandedSet } from '../../../components/lab/Accordion';
import Badge from '../../../components/lab/Badge';

/*
 * "This way of saying it is right / this way is wrong." Two curated lists, not a
 * chart: the right half is a short set of careful sentences worth keeping; the
 * wrong half reuses the misreadings shape, where every error carries the fix
 * that replaces it. Nobody has counted how often each occurs, so there is no
 * distribution to plot — a list is the honest form.
 */
export default function StatementsPanel({ statements = {}, lang = 'zh' }) {
  const right = statements.right ?? [];
  const wrong = statements.wrong ?? [];
  const allIds = right.map((it) => it.id).concat(wrong.map((it) => it.id));
  const { isOpen, toggle } = useExpandedSet(allIds);
  const pick = (it) => (lang === 'en' && it.en ? { ...it, ...it.en } : it);

  const heading = (zh, en) => (lang === 'en' ? en : zh);

  return (
    <div className="my-8 grid gap-6 md:grid-cols-2">
      <section className="rounded-token-md border border-line-soft px-5 py-2">
        <h3 className="mb-1 mt-3 text-token-sm font-semibold text-ink">
          {heading('這樣說是對的', 'Said this way, it is right')}
        </h3>
        <Accordion
          isOpen={isOpen}
          onToggle={toggle}
          items={right.map((it) => {
            const c = pick(it);
            return {
              id: it.id,
              title: <span className="text-ink">{c.statement}</span>,
              meta: <Badge tone="success">{heading('精確', 'precise')}</Badge>,
              render: () => (
                <div className="text-token-sm leading-relaxed">
                  <p className="text-ink">{c.why}</p>
                </div>
              ),
            };
          })}
        />
      </section>

      <section className="rounded-token-md border border-line-soft px-5 py-2">
        <h3 className="mb-1 mt-3 text-token-sm font-semibold text-ink">
          {heading('這樣說是錯的', 'Said this way, it is wrong')}
        </h3>
        <Accordion
          isOpen={isOpen}
          onToggle={toggle}
          items={wrong.map((it) => {
            const c = pick(it);
            return {
              id: it.id,
              title: <span className="text-ink">{c.claim}</span>,
              meta: <Badge tone="danger">{heading('誤讀', 'misreading')}</Badge>,
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
      </section>
    </div>
  );
}
