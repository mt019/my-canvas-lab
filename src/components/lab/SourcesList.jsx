import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import MathText from './MathText';

/*
 * 章末的資料來源清單，由正文裡實際出現的引用生成。
 *
 * frontmatter 的 sources 是候選名單，不是使用紀錄：一條來源列了卻沒有任何句子
 * 引用它，清單就不該有它。所以這裡不讀 frontmatter，掛載後直接掃正文裡的
 * span[data-cite]（HoverCite 對每個引用都放一個），按首次出現的順序編號。
 *
 * 掃描的同時把錨點放上去：第 k 個引用同一條來源的句子拿 id="cite-<來源>-<k>"，
 * 清單每條拿 id="source-<來源>"。編號是返回鍵，點了回到正文第一處；同一條來源
 * 被引用多次時，條目尾端排 ↑1 ↑2 ↑3 逐處返回。浮卡關掉時（styles/hoverCards.js）
 * 正文的引用點擊也捲到這裡。
 *
 * id 是掛載後由 effect 寫上去的，React 不管理它們；語言切換會整篇抽換重掃，
 * 舊錨點隨舊節點一起消失，不會殘留。
 */
export default function SourcesList({ sources, lang = 'zh' }) {
  const en = lang === 'en';
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const marks = [...document.querySelectorAll('span[data-cite]')];
    const bySource = new Map();
    for (const el of marks) {
      const id = el.getAttribute('data-cite');
      if (!id || !sources?.[id]) continue;
      const list = bySource.get(id) ?? [];
      list.push(el);
      bySource.set(id, list);
    }
    setEntries([...bySource.entries()].map(([id, els]) => {
      els.forEach((el, i) => { el.id = `cite-${id}-${i + 1}`; });
      return { id, count: els.length };
    }));
  }, [sources, lang]);

  if (!entries.length) return null;

  return (
    <section>
      <h2 id="sources" className="mt-12 mb-4 scroll-mt-8 font-display text-token-xl leading-snug text-ink">
        {en ? 'Sources' : '資料來源'}
      </h2>
      <ol className="list-none space-y-2.5">
        {entries.map(({ id, count }, index) => {
          const source = sources[id];
          const { author, title, year, container, url } = source;
          const locator = (en ? source.en?.locator : source.locator) ?? source.locator;
          return (
            <li key={id} id={`source-${id}`} className="flex gap-2.5 text-token-sm leading-[1.75] text-ink-muted">
              <a
                href={`#cite-${id}-1`}
                title={en ? 'Back to the text' : '返回正文'}
                className="shrink-0 tabular-nums text-accent hover:underline"
              >
                {index + 1}.
              </a>
              <span>
                <span className="text-ink">
                  {author}{en ? ` (${year}). ` : `（${year}）。`}{title}
                </span>
                {container ? <>{en ? ' ' : '，'}{container}</> : null}
                {locator ? <span className="text-ink-faint">{en ? '. ' : '。'}<MathText>{locator}</MathText></span> : null}
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1.5 inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    {en ? 'Read it' : '原文'} <ExternalLink size={11} />
                  </a>
                ) : null}
                {count > 1 ? (
                  <span className="ml-1.5 inline-flex gap-1">
                    {Array.from({ length: count }, (_, i) => (
                      <a
                        key={i}
                        href={`#cite-${id}-${i + 1}`}
                        title={en ? `Citation ${i + 1}` : `第 ${i + 1} 處引用`}
                        className="text-accent hover:underline"
                      >
                        ↑{i + 1}
                      </a>
                    ))}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
