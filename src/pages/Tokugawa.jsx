import { useEffect, useState } from 'react';
import Eyebrow from '../components/Eyebrow';
import { useFontScale } from '../components/FontSizeControl';
import SiteHeader from '../components/SiteHeader';
import ArticleLayout from '../components/lab/ArticleLayout';
import { useTabParams } from '../components/lab/Tabs';
import { linearScale } from '../components/lab/chart/scale';
import data from '../data/tokugawaBackground.json';

const TABS = [
  { id: 'overview', label: '總覽：分期與對照' },
  { id: 'chronology', label: '年表' },
  { id: 'order', label: '身分秩序與「家」' },
  { id: 'glossary', label: '術語表' },
  { id: 'qa', label: '背景問答' },
];

const NAV_LINK = (active) =>
  `block w-full text-left border-l-2 py-1 pl-3 transition-colors duration-fast ${
    active ? 'border-accent font-bold text-ink' : 'border-transparent text-ink-muted hover:border-line hover:text-ink'
  }`;

/* 區塊抬頭，與朱家驊頁同一個形狀：h2 帶 id 進右欄目次，data-toc 給短標。 */
function SectionHead({ id, toc, kicker, children, className = '' }) {
  return (
    <div className={className}>
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      <h2 id={id} data-toc={toc} className={`font-serif text-token-xl font-bold leading-snug ${kicker ? 'mt-2' : ''}`}>
        {children}
      </h2>
    </div>
  );
}

/* 六軌年代帶：日本／琉球／台灣／中國／朝鮮各一列時代區間，歐洲一列思想史定點。
   看的是「誰與誰同時」——德川一朝橫跨明末到清末；日本統治過的段（沖繩縣、
   台灣日治、朝鮮日治）沿用「明治以後」同一色的淡版，佔領關係由顏色表示。
   帶的畫法照 chart/marks.jsx 的 Bars：自己的墨色低透明度當填色，同色細線收邊。
   hover 一段顯示它的註；註行預留固定高度（DESIGN.md：變動文字不推版）。 */
const CAT = (n) => `var(--cat-${n}-tx)`;

function EraBands() {
  const { range, tracks, eras, ticks, events } = data.periods;
  const [note, setNote] = useState('');
  const M = { left: 92, right: 84, top: 8, bottom: 26 };
  const innerW = 880;
  const rowH = 52;
  const barH = 16;
  const width = M.left + innerW + M.right;
  const height = M.top + tracks.length * rowH + M.bottom;
  const x = linearScale({ domain: range, range: [M.left, M.left + innerW] });
  const rowTop = (trackId) => M.top + tracks.findIndex((t) => t.id === trackId) * rowH;
  const barY = (trackId) => rowTop(trackId) + rowH - barH - 4;

  // 同一軌的事件字牌交錯排兩層，1853 與 1868 這種近鄰才不會疊字。
  const staggered = tracks.flatMap((t) =>
    events.filter((e) => e.track === t.id).map((e, i) => ({ ...e, level: i % 2 })),
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[760px]"
          role="img"
          aria-label="日本、琉球、台灣、中國、朝鮮、歐洲六條並排的時代對照帶，範圍 1350 至 1950 年"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={M.top} y2={height - M.bottom} stroke="var(--c-line-soft)" strokeWidth="1" />
              <text x={x(t)} y={height - 8} textAnchor="middle" className="fill-ink-faint" fontSize="11" style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
            </g>
          ))}
          {tracks.map((t) => (
            <text key={t.id} x={M.left - 12} y={barY(t.id) + barH / 2 + 4} textAnchor="end" className="fill-ink-muted" fontSize="12" fontWeight="700">{t.label}</text>
          ))}
          {eras.map((era) => {
            const x0 = x(era.start);
            const w = x(era.end) - x0;
            const y = barY(era.track);
            return (
              <g
                key={`${era.track}-${era.label}`}
                onMouseEnter={() => setNote(era.note ? `${era.label}（${era.start}–${era.end}）：${era.note}` : `${era.label}：${era.start}–${era.end}`)}
                onMouseLeave={() => setNote('')}
              >
                <rect
                  x={x0} y={y} width={w} height={barH} rx="3"
                  fill={CAT(era.slot)} fillOpacity={era.dim ? 0.1 : 0.22}
                  stroke={CAT(era.slot)} strokeOpacity="0.35" strokeWidth="1"
                />
                {w > 34 ? (
                  <text x={x0 + w / 2} y={y + barH / 2 + 4} textAnchor="middle" className="fill-ink pointer-events-none" fontSize="11">{era.label}</text>
                ) : null}
              </g>
            );
          })}
          {staggered.map((e) => {
            const yBar = barY(e.track);
            const yLabel = yBar - (e.level ? 22 : 8);
            const isDot = e.track === 'eu';
            return (
              <g key={`${e.track}-${e.year}`}>
                {isDot ? (
                  <circle cx={x(e.year)} cy={yBar + barH / 2} r="3.5" fill="var(--c-paper)" stroke="var(--c-accent)" strokeWidth="1.5" />
                ) : (
                  <line x1={x(e.year)} x2={x(e.year)} y1={yLabel + 3} y2={yBar + barH} stroke="var(--c-accent)" strokeWidth="1" />
                )}
                <text x={x(e.year)} y={yLabel} textAnchor="middle" className="fill-ink-muted" fontSize="10.5">
                  <tspan style={{ fontVariantNumeric: 'tabular-nums' }}>{e.year}</tspan>　{e.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-1 min-h-[3.2em] max-w-3xl text-token-xs leading-relaxed text-ink-faint sm:min-h-[1.8em]">
        {note || '游標移到任一時代段上，這裡顯示該段的說明。日本統治過的段（沖繩縣、台灣日治、朝鮮日治）與「明治以後」同色。'}
      </p>
    </div>
  );
}

/* 年表：一年一列。region 欄是資料母本給的分類字（日本／中國／對外／台灣…），照印。 */
function Chronology({ items }) {
  return (
    <ol className="border-t border-line">
      {items.map((item) => (
        <li key={item.year + item.event.slice(0, 8)} className="grid gap-x-4 gap-y-1 border-b border-line-soft py-3.5 sm:grid-cols-[5.5rem_3.5rem_1fr]">
          <span className="text-token-sm font-bold tabular-nums text-ink">{item.year}</span>
          <span className="text-token-sm text-ink-faint">{item.region}</span>
          <p className="text-token-sm leading-[1.85] text-ink-muted">{item.event}</p>
        </li>
      ))}
    </ol>
  );
}

function StatusOrder() {
  const { intro, layers } = data.statusOrder;
  return (
    <div>
      <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">{intro}</p>
      <div className="mt-6 max-w-3xl">
        {layers.map((layer, i) => {
          const ruled = i > 0 && layers[i - 1].side !== layer.side;
          return (
            <div key={layer.id} className={`grid gap-x-4 gap-y-1 py-4 sm:grid-cols-[6.5rem_1fr] ${ruled ? 'border-t border-line' : 'border-t border-line-soft'} ${i === 0 ? '!border-t-0' : ''}`}>
              <span className="text-token-xs font-bold text-ink-faint">{layer.side}</span>
              <div>
                <h3 className="font-serif text-token-body font-bold leading-snug">
                  {layer.name}
                  <span className="ml-2 text-token-xs font-normal text-ink-faint">{layer.where}</span>
                </h3>
                <p className="mt-1 text-token-sm leading-[1.8] text-ink-muted">{layer.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IeVsZongzu() {
  const { intro, rows } = data.ieVsZongzu;
  return (
    <div>
      <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">{intro}</p>
      <div className="mt-6 border-y border-line">
        <div className="grid gap-x-5 border-b border-line pb-2 pt-3 sm:grid-cols-[5.5rem_1fr_1fr]">
          <span />
          <span className="font-serif text-token-sm font-bold">中國宗族</span>
          <span className="font-serif text-token-sm font-bold">日本イエ（家）</span>
        </div>
        {rows.map((row) => (
          <div key={row.aspect} className="grid gap-x-5 gap-y-1 border-b border-line-soft py-4 last:border-b-0 sm:grid-cols-[5.5rem_1fr_1fr]">
            <span className="text-token-sm font-bold text-ink">{row.aspect}</span>
            <p className="text-token-sm leading-[1.8] text-ink-muted">{row.cn}</p>
            <p className="text-token-sm leading-[1.8] text-ink-muted">{row.jp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 讀音是純假名時用 HTML 原生 ruby 直接標在詞頭上（學日語用），羅馬字跟在詞後；
   英文對譯、年代這類「reading」仍走詞下方的副行。ruby 標 lang="ja" 讓假名走日文字形。 */
const KANA_ONLY = /^[぀-ヿ・]+$/;

function TermHead({ term, reading, roman }) {
  const kana = KANA_ONLY.test(reading);
  return (
    <>
      {kana ? (
        <ruby lang="ja" className="[&>rt]:pb-1 [&>rt]:text-[0.52em] [&>rt]:font-normal [&>rt]:tracking-[0.14em] [&>rt]:text-ink-faint">
          {term}<rt>{reading}</rt>
        </ruby>
      ) : term}
      {!kana ? <span className="block text-token-xs font-normal text-ink-faint">{reading}</span> : null}
      {roman ? <span className="block font-accent text-token-xs font-normal leading-snug text-ink-faint">{roman}</span> : null}
    </>
  );
}

function Glossary() {
  return (
    <div className="space-y-10">
      {data.glossary.map((group) => (
        <section key={group.group}>
          <h3 className="font-serif text-token-lg font-bold">{group.group}</h3>
          <dl className="mt-4 divide-y divide-line-soft border-y border-line">
            {group.terms.map((item) => (
              <div key={item.term} className="grid gap-x-5 gap-y-1 py-3.5 sm:grid-cols-[13rem_1fr]">
                <dt className="font-serif text-token-body font-bold leading-[2.2]">
                  <TermHead term={item.term} reading={item.reading} roman={item.roman} />
                </dt>
                <dd className="max-w-3xl text-token-sm leading-[1.85] text-ink-muted">
                  {item.def}
                  {(item.notes ?? []).map((n) => (
                    <span key={n.slice(0, 12)} className="mt-2 block">{n}</span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function Overview() {
  return (
    <div>
      <section>
        <SectionHead id="periods" toc="時代對照">三段分期，與誰同時</SectionHead>
        <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">
          讀日本近世的材料，分期只需要先記三段：戰國（15 世紀後半起約一世紀的內亂）、德川（又稱江戶時代，1600–1867，兩百六十多年大體和平）、明治以後。下圖把六條線擺在同一條年代帶上——德川一朝從明末橫跨到清末；琉球王國同時向北京與薩摩兩邊從屬；台灣在同一段時間裡經過荷治、明鄭、清治；歐洲那一列是「個人」概念史的幾個定點。
        </p>
        <div className="mt-6">
          <EraBands />
        </div>
      </section>
      <section className="mt-12 border-t border-line pt-8">
        <SectionHead id="sources" toc="文獻">主要參考文獻</SectionHead>
        <ul className="mt-5 max-w-3xl space-y-2">
          {data.sources.map((s) => (
            <li key={s.title} className="text-token-sm leading-[1.8] text-ink-muted">
              {s.author}，《{s.title}》，{s.publisher}，{s.year} 年。
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-token-xs leading-[1.8] text-ink-faint">{data.meta.note}更新：{data.meta.updated}。</p>
      </section>
    </div>
  );
}

function ChronologyTab() {
  return (
    <div>
      <section>
        <SectionHead id="chronology" toc="政治與對外">政治與對外年表：從種子島到 1945</SectionHead>
        <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">
          「鎖國」兩百年、黑船一來就開國維新——這個常見的講法把中間的線都剪掉了。實際的線索一條一條看：所謂鎖國留著四個窗口（長崎、對馬、薩摩、松前），荷蘭東印度公司在長崎出島駐了兩百多年，蘭學從那裡進來；琉球同時向北京朝貢、向薩摩繳糧；培里來航之後是條約、維新、修約，再往後是台灣、朝鮮、滿洲，一路走到珍珠港與蘭印油田。
        </p>
        <div className="mt-6">
          <Chronology items={data.chronologyMain} />
        </div>
      </section>
      <section className="mt-12 border-t border-line pt-8">
        <SectionHead id="concept" toc="「個人」概念史">附：「個人」的概念史年表</SectionHead>
        <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">
          individual 這個詞怎麼從歐洲走進日語和中文——幾個定點依年代排開。
        </p>
        <div className="mt-6">
          <Chronology items={data.chronologyConcept} />
        </div>
      </section>
    </div>
  );
}

function OrderTab() {
  return (
    <div>
      <section>
        <SectionHead id="status" toc="誰在統治">誰在統治：武士的身分秩序</SectionHead>
        <StatusOrder />
      </section>
      <section className="mt-12 border-t border-line pt-8">
        <SectionHead id="ie" toc="家與宗族">「家」與宗族：兩種組織</SectionHead>
        <IeVsZongzu />
      </section>
    </div>
  );
}

function QaTab() {
  return (
    <div>
      <SectionHead id="qa" toc="背景問答">背景問答十二題</SectionHead>
      <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">
        讀日本近世史料時常見的背景疑問，逐題整理。內容限於通說層級的公開知識，帶年代的斷言逐條對照過權威辭書與官方站（查核紀錄在資料倉）。
      </p>
      <div className="mt-8 space-y-10">
        {data.qa.map((item, i) => (
          <section key={item.q} className="max-w-3xl border-t border-line-soft pt-6 first:border-t-0 first:pt-0">
            <h3 id={`qa-${i + 1}`} className="font-serif text-token-lg font-bold leading-snug">
              <span className="mr-2 tabular-nums text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
              {item.q}
            </h3>
            {item.a.map((para) => (
              <p key={para.slice(0, 16)} className="mt-4 text-token-body leading-[1.95] text-ink-muted">{para}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export default function Tokugawa() {
  const [scale, setScale] = useFontScale();
  const [{ tab }, setTab] = useTabParams({ tab: 'overview' });
  const active = TABS.some((t) => t.id === tab) ? tab : 'overview';

  // 換分頁回到頂端：左欄導覽沒有吸頂列，停在原捲動位置會像沒反應。
  useEffect(() => { window.scrollTo({ top: 0 }); }, [active]);

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
      <SiteHeader width="article" scale={scale} onScaleChange={setScale} />
      <ArticleLayout
        title={data.meta.title}
        eyebrow="TOKUGAWA JAPAN"
        summary={data.meta.summary}
        tocLabel="本頁區塊"
        tocKey={active}
        nav={
          <nav aria-label="頁內導覽" className="space-y-1 text-token-sm">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab({ tab: t.id })} className={NAV_LINK(active === t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        }
      >
        {active === 'overview' ? <Overview /> : null}
        {active === 'chronology' ? <ChronologyTab /> : null}
        {active === 'order' ? <OrderTab /> : null}
        {active === 'qa' ? <QaTab /> : null}
        {active === 'glossary' ? (
          <section>
            <SectionHead id="glossary" toc="術語表">術語表</SectionHead>
            <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">
              純假名讀音直接標在詞頭上，拉丁字是平文式羅馬字；英文對譯與年代寫在詞下方。
            </p>
            <div className="mt-6">
              <Glossary />
            </div>
          </section>
        ) : null}
      </ArticleLayout>
    </main>
  );
}
