import Accordion, { useExpandedSet } from '../../components/lab/Accordion';
import Badge from '../../components/lab/Badge';
import { SectionHead, Note, Provision } from './shared';
import { EVASION_DATA } from './data';

export default function EvasionView() {
  const { isOpen, toggle } = useExpandedSet(EVASION_DATA.map((e) => e.id));

  return (
    <>
      <section className="mb-10">
        <SectionHead id="evasion">逃漏的特殊性</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          空污費的逃漏跟一般稅捐逃漏不同：課徵基礎是排放量，而排放量本身難以直接觀察。
          業者握有資訊優勢，主管機關高度依賴申報誠信與稽查能量，資訊不對稱是最大的執行難題。
        </p>
        <div className="mt-5">
          <Note>
            §75 的加倍補徵性質上是公法上不當得利的返還加計，不是行政罰——所以它不受一事不二罰拘束，
            即使業者已被刑事追訴，主管機關仍得補徵。這是這一節最容易被誤讀的一點。
          </Note>
        </div>
      </section>

      <section className="mb-10">
        <Accordion
          items={EVASION_DATA.map((ev) => ({
            id: ev.id,
            title: ev.title,
            meta: <Badge tone={ev.tone}>{ev.badge}</Badge>,
            render: () => (
              <div className="space-y-4">
                {ev.items.map((item) => (
                  <Provision key={item.label} label={item.label}>{item.desc}</Provision>
                ))}
              </div>
            ),
          }))}
          isOpen={isOpen}
          onToggle={toggle}
        />
      </section>
    </>
  );
}
