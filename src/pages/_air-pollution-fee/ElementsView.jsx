import Accordion, { useExpandedSet } from '../../components/lab/Accordion';
import { SectionHead, SubHead, Note, Bullets } from './shared';
import { ELEMENTS_DATA } from './data';

export default function ElementsView() {
  const { isOpen, toggle } = useExpandedSet(ELEMENTS_DATA.map((e) => e.id));

  return (
    <>
      <section className="mb-10">
        <SectionHead id="basis-in-law">授權法源</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          空污法第 16 條第 1 項：「各級主管機關應依污染源排放空氣污染物之種類及排放量，徵收空氣污染防制費。」
          費率由中央主管機關（環境部）公告。
        </p>
        <div className="mt-5">
          <Note>
            它的性質是<span className="font-semibold text-ink">特別公課</span>（司法院釋字第 426 號），不是稅捐。
            差別落在兩處：費款專入空污基金、不與國庫統收統支；繳多少直接綁排放量，減量誘因寫在計費公式裡。
          </Note>
        </div>
      </section>

      <section className="mb-10">
        <SubHead id="elements">三個構成要件</SubHead>
        <Accordion
          items={ELEMENTS_DATA.map((el) => ({
            id: el.id,
            title: (
              <span className="flex items-baseline gap-2">
                <span className="font-accent text-token-xs text-ink-faint">{el.no}</span>
                <span>{el.title}</span>
              </span>
            ),
            meta: el.badge,
            render: () => <Bullets items={el.content} />,
          }))}
          isOpen={isOpen}
          onToggle={toggle}
        />
      </section>
    </>
  );
}
