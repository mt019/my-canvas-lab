import Accordion, { useExpandedSet } from '../../components/lab/Accordion';
import { SectionHead, Note, Bullets } from './shared';
import { EFFECTS_DATA } from './data';

export default function EffectsView() {
  const { isOpen, toggle } = useExpandedSet(EFFECTS_DATA.map((e) => e.id));

  return (
    <>
      <section className="mb-10">
        <SectionHead id="effects">對義務人的法律效果</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          這一節只看個別規制關係這一條線：費額核課、繳費義務成立、履行而消滅，或者不履行而觸發延滯金與強制執行。
        </p>
        <div className="mt-5">
          <Note>
            核課處分送達即生拘束力。義務人不服要走行政救濟，不能以不服為由拒繳——爭訟中原則上仍須先繳，
            要停下來得另外聲請停止執行。
          </Note>
        </div>
      </section>

      <section className="mb-10">
        <Accordion
          items={EFFECTS_DATA.map((ef) => ({
            id: ef.id,
            title: ef.title,
            render: () => <Bullets items={ef.content} />,
          }))}
          isOpen={isOpen}
          onToggle={toggle}
        />
      </section>
    </>
  );
}
