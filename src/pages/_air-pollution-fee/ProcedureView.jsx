import Accordion, { useExpandedSet } from '../../components/lab/Accordion';
import { SectionHead, SubHead, Note, Bullets } from './shared';
import { PROCEDURE_FLOW, PROCEDURE_STEPS } from './data';

export default function ProcedureView() {
  const { isOpen, toggle } = useExpandedSet(PROCEDURE_STEPS.map((s) => s.step));

  return (
    <>
      <section className="mb-10">
        <SectionHead id="procedure">稽徵架構</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          固定污染源走的是「自行申報、按季繳納、事後稽查」，與稅法的核定課徵不同：業者負主動申報義務，
          主管機關事後才稽核。申報、繳納、稽查、救濟四段接起來，就是一條完整的行政程序鏈。
        </p>
        <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-token-sm text-ink-muted">
          {PROCEDURE_FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="whitespace-nowrap rounded-token-md border border-line px-2.5 py-1">{step}</span>
              {i < PROCEDURE_FLOW.length - 1 ? <span className="text-ink-faint">→</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <SubHead id="steps">六個階段</SubHead>
        <Accordion
          items={PROCEDURE_STEPS.map((proc) => ({
            id: proc.step,
            title: (
              <span className="flex items-baseline gap-2">
                <span className="font-accent text-token-xs text-ink-faint">{proc.step}</span>
                <span>{proc.title}</span>
              </span>
            ),
            render: () => <Bullets items={proc.items} />,
          }))}
          isOpen={isOpen}
          onToggle={toggle}
        />
      </section>

      <section className="mb-10">
        <SubHead id="deadlines">申報截止日</SubHead>
        <Note>
          每季結束後的次月底是死線：Q1 到 4 月 30 日、Q2 到 7 月 31 日、Q3 到 10 月 31 日、
          Q4 到次年 1 月 31 日。逾期不能以「尚未計算完畢」為由延後，主管機關得逕依查核方式核算費額補繳。
        </Note>
      </section>
    </>
  );
}
