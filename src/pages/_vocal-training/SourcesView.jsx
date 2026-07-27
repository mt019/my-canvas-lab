import { useMemo } from 'react';
import { method, exercises } from './shared';

/*
 * 二十二首的詞全部來自 Metastasio，但不是同一部戲。這一頁按作品把它們收回去，
 * 順便把「查證到什麼程度」攤在同一張表上——查到場景與只查到劇目是兩件事，
 * 用字區分，不用顏色區分（DESIGN.md：徽章只給可以動手的狀態）。
 */
export default function SourcesView() {
  const works = useMemo(() => {
    const map = new Map();
    for (const ex of exercises) {
      const key = ex.source.work ?? '__unknown__';
      if (!map.has(key)) {
        map.set(key, { work: ex.source.work, workZh: ex.source.workZh, year: ex.source.year, items: [] });
      }
      const entry = map.get(key);
      if (entry.year == null && ex.source.year != null) entry.year = ex.source.year;
      entry.items.push(ex);
    }
    return [...map.values()].sort((a, b) => {
      if (a.work == null) return 1;
      if (b.work == null) return -1;
      if (b.items.length !== a.items.length) return b.items.length - a.items.length;
      return a.items[0].no - b.items[0].no;
    });
  }, []);

  const verified = exercises.filter((ex) => ex.source.verified);
  const unverified = exercises.filter((ex) => !ex.source.verified);
  const namedWorks = works.filter((w) => w.work != null).length;

  return (
    <div className="max-w-3xl">
      <section>
        <h2 id="vt-src-intro" className="text-token-lg">詞從哪裡來</h2>
        <p className="mt-3 text-token-sm leading-relaxed">
          二十二首的詞全部出自 Metastasio，散落在 {namedWorks} 部作品裡；只有《德梅特里歐》出了三首，
          《埃齊歐》與《奧林匹亞競技》各兩首，其餘每部各一首。還有一首連出處作品都未定。
          Vaccai 挑的多半不是整首詠嘆調，而是其中一節——原詩的另一節常常把比喻講完，
          所以讀原文會發現這些句子在戲裡的意思，跟單獨拿出來唱不太一樣。
        </p>
        <p className="mt-3 text-token-sm leading-relaxed text-ink-muted">
          原始場景（第幾幕第幾場、誰對誰唱）目前查證了 {verified.length} 首，
          另外 {unverified.length} 首查不到——義大利文 Wikisource 沒收那幾部劇本。
          查不到的就標為未考證，不從詩句內容回推。
        </p>
      </section>

      <section className="mt-10">
        <h2 id="vt-src-works" className="text-token-lg">按作品</h2>
        <ul className="mt-4 divide-y divide-line-soft border-y border-line-soft">
          {works.map((w) => (
            <li key={w.work ?? 'unknown'} className="py-4">
              <p className="text-token-base">
                {w.workZh ?? '出處作品未定'}
                {w.work ? <span className="ml-2 text-token-sm text-ink-muted">{w.work}</span> : null}
                {w.year ? <span className="ml-2 text-token-sm text-ink-faint tabular-nums">{w.year}</span> : null}
              </p>
              <ul className="mt-2 space-y-1.5">
                {w.items.map((ex) => (
                  <li key={ex.id} className="text-token-sm leading-relaxed">
                    <span className="tabular-nums text-ink-faint">{String(ex.no).padStart(2, '0')}</span>
                    <span className="ml-3">{ex.incipit}</span>
                    <span className="ml-3 text-ink-muted">
                      {ex.source.verified
                        ? `${ex.source.place}${ex.source.speaker ? `　${ex.source.speaker} 唱` : ''}`
                        : '原始場景待查'}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 id="vt-src-refs" className="text-token-lg">查證用的來源</h2>
        <ul className="mt-4 space-y-2">
          {method.sources.map((s) => (
            <li key={s.url} className="text-token-sm leading-relaxed">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline decoration-line-soft underline-offset-2 hover:decoration-accent"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-token-xs leading-relaxed text-ink-muted">
          歌詞以 LiederNet 的 Vaccai 歌詞頁為準，與樂譜電子版的歌詞欄互相核對；掃描本 OCR 出來的
          歌詞有錯字，不當權威。中譯自譯。Metastasio 與 Vaccai 的文字與音樂都是公版。
        </p>
      </section>
    </div>
  );
}
