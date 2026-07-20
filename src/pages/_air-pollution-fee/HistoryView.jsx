import { SectionHead, Note } from './shared';
import { HISTORY_TIMELINE } from './data';

/*
 * 時間軸。原版每個年份配一個不同色相的圓點——九個年份九個色，那是裝飾不是資訊
 * （年份本來就有序，顏色沒有多說任何事）。改成同一個 accent 標記，序列靠位置與
 * 年份數字本身表達。
 */
export default function HistoryView() {
  return (
    <>
      <section className="mb-10">
        <SectionHead id="history">制度流變</SectionHead>
        <p className="mt-3 max-w-3xl text-token-base leading-relaxed text-ink-muted">
          台灣的空污費從 1975 年純行政管制出發，1992 年授權立法、1995 年首次開徵，
          到 2010 年引入累進費率與雙重係數誘因機制——一條從命令管制走向經濟誘因並行的路。
        </p>
      </section>

      <section className="mb-10">
        <ol className="relative border-l border-line pl-6">
          {HISTORY_TIMELINE.map((item) => (
            <li key={item.year} className="relative mb-8 last:mb-0">
              <span className="absolute -left-[1.6875rem] top-[0.45em] size-2 rounded-full border border-accent bg-accent-soft" />
              <div className="flex items-baseline gap-3">
                <span className="font-accent text-token-sm text-ink-muted">{item.year}</span>
                <h3 id={`y-${item.year}`} className="text-token-base font-semibold text-ink">{item.label}</h3>
              </div>
              <p className="mt-1.5 text-token-sm leading-relaxed text-ink-muted">{item.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <Note>
          2018 年那次修正把空污費條文從舊法第 10 條移到現行第 16 條。查舊文獻與舊判決時要注意條次，
          兩者指的是同一件事。
        </Note>
      </section>
    </>
  );
}
