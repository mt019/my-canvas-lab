import Eyebrow from '../components/Eyebrow';
import { useFontScale } from '../components/FontSizeControl';
import SiteHeader from '../components/SiteHeader';
import ArticleLayout from '../components/lab/ArticleLayout';
import { linearScale } from '../components/lab/chart/scale';
import data from '../data/tokugawaBackground.json';

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

/* 三軌年代帶：日本／中國／朝鮮各一列，時代區間畫成帶，看的是「誰與誰同時」——
   德川一朝橫跨明末到清末，是散文講三遍也留不下印象的那件事。
   帶的畫法照 chart/marks.jsx 的 Bars：自己的墨色低透明度當填色，同色細線收邊。 */
const CAT = (n) => `var(--cat-${n}-tx)`;

function EraBands() {
  const { range, tracks, eras, ticks, keyYears } = data.periods;
  const M = { left: 52, right: 20, top: 40, bottom: 26 };
  const innerW = 880;
  const rowH = 40;
  const barH = 18;
  const width = M.left + innerW + M.right;
  const height = M.top + tracks.length * rowH + M.bottom;
  const x = linearScale({ domain: range, range: [M.left, M.left + innerW] });
  const rowY = (trackId) => M.top + tracks.findIndex((t) => t.id === trackId) * rowH;

  // 關鍵年份的字牌交錯排兩層，免得 1853 與 1868 疊在一起。
  const labeled = keyYears.map((k, i) => ({ ...k, level: i % 2 }));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[720px]"
        role="img"
        aria-label="日本、中國、朝鮮三地時代對照帶，範圍 1350 至 1950 年"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={M.top - 4} y2={height - M.bottom} stroke="var(--c-line-soft)" strokeWidth="1" />
            <text x={x(t)} y={height - 8} textAnchor="middle" className="fill-ink-faint" fontSize="11" style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
          </g>
        ))}
        {tracks.map((t) => (
          <text key={t.id} x={M.left - 10} y={rowY(t.id) + barH / 2 + 4} textAnchor="end" className="fill-ink-muted" fontSize="12" fontWeight="700">{t.label}</text>
        ))}
        {eras.map((era) => {
          const x0 = x(era.start);
          const w = x(era.end) - x0;
          const y = rowY(era.track);
          return (
            <g key={`${era.track}-${era.label}`}>
              <rect
                x={x0} y={y} width={w} height={barH} rx="3"
                fill={CAT(era.slot)} fillOpacity={era.dim ? 0.1 : 0.22}
                stroke={CAT(era.slot)} strokeOpacity="0.35" strokeWidth="1"
              />
              {w > 30 ? (
                <text x={x0 + w / 2} y={y + barH / 2 + 4} textAnchor="middle" className="fill-ink" fontSize="11">{era.label}</text>
              ) : null}
            </g>
          );
        })}
        {labeled.map((k) => {
          const y = rowY(k.track);
          return (
            <g key={k.year}>
              <line x1={x(k.year)} x2={x(k.year)} y1={y - (k.level ? 22 : 10)} y2={y + barH} stroke="var(--c-accent)" strokeWidth="1" />
              <text x={x(k.year)} y={y - (k.level ? 26 : 14)} textAnchor="middle" className="fill-ink-muted" fontSize="11">
                <tspan style={{ fontVariantNumeric: 'tabular-nums' }}>{k.year}</tspan>　{k.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* 年表：一年一列。region 欄是資料母本給的分類字（日本／中國／對外／台灣…），照印。 */
function Chronology({ items }) {
  return (
    <ol className="border-t border-line">
      {items.map((item) => (
        <li key={item.year + item.event.slice(0, 8)} className="grid gap-x-5 gap-y-1 border-b border-line-soft py-4 sm:grid-cols-[7rem_4rem_1fr]">
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
            <div key={layer.id} className={`grid gap-x-5 gap-y-1 py-4 sm:grid-cols-[7.5rem_1fr] ${ruled ? 'border-t border-line' : 'border-t border-line-soft'} ${i === 0 ? '!border-t-0' : ''}`}>
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
        <div className="grid gap-x-6 border-b border-line pb-2 pt-3 sm:grid-cols-[7rem_1fr_1fr]">
          <span />
          <span className="font-serif text-token-sm font-bold">中國宗族</span>
          <span className="font-serif text-token-sm font-bold">日本イエ（家）</span>
        </div>
        {rows.map((row) => (
          <div key={row.aspect} className="grid gap-x-6 gap-y-1 border-b border-line-soft py-4 last:border-b-0 sm:grid-cols-[7rem_1fr_1fr]">
            <span className="text-token-sm font-bold text-ink">{row.aspect}</span>
            <p className="text-token-sm leading-[1.8] text-ink-muted">{row.cn}</p>
            <p className="text-token-sm leading-[1.8] text-ink-muted">{row.jp}</p>
          </div>
        ))}
      </div>
    </div>
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
              <div key={item.term} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[11rem_1fr]">
                <dt className="font-serif text-token-body font-bold leading-snug">
                  {item.term}
                  <span className="block text-token-xs font-normal text-ink-faint">{item.reading}</span>
                </dt>
                <dd className="max-w-3xl text-token-sm leading-[1.85] text-ink-muted">{item.def}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

export default function Tokugawa() {
  const [scale, setScale] = useFontScale();
  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
      <SiteHeader width="article" scale={scale} onScaleChange={setScale} />
      <ArticleLayout
        title={data.meta.title}
        eyebrow="TOKUGAWA JAPAN · A PRIMER"
        summary={data.meta.summary}
        tocLabel="本頁區塊"
      >
        <section>
          <SectionHead id="periods" toc="時代對照">三段分期，與誰同時</SectionHead>
          <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">
            讀日本近世的材料，分期只需要先記三段：戰國（15 世紀後半起約一世紀的內亂）、德川（又稱江戶時代，1600–1867，兩百六十多年大體和平）、明治以後。下圖把三地擺在同一條年代帶上——德川一朝從明末一直橫跨到清末，同一個「近世」，兩邊的統治結構卻長得完全不同。
          </p>
          <div className="mt-6">
            <EraBands />
          </div>
        </section>

        <section className="mt-12 border-t border-line pt-8">
          <SectionHead id="chronology" toc="政治與對外年表">政治與對外年表：從種子島到 1945</SectionHead>
          <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">
            「鎖國」兩百年、黑船一來就開國維新——這個常見的講法把中間的線都剪掉了。實際的線索一條一條看：所謂鎖國留著四個窗口（長崎、對馬、薩摩、松前），荷蘭東印度公司在長崎出島駐了兩百多年，蘭學從那裡進來；琉球同時向北京朝貢、向薩摩繳糧；培里來航之後是條約、維新、修約，再往後是台灣、朝鮮、滿洲，一路走到珍珠港與蘭印油田。
          </p>
          <div className="mt-6">
            <Chronology items={data.chronologyMain} />
          </div>
        </section>

        <section className="mt-12 border-t border-line pt-8">
          <SectionHead id="status" toc="誰在統治">誰在統治：武士的身分秩序</SectionHead>
          <StatusOrder />
        </section>

        <section className="mt-12 border-t border-line pt-8">
          <SectionHead id="ie" toc="家與宗族">「家」與宗族：兩種組織</SectionHead>
          <IeVsZongzu />
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

        <section className="mt-12 border-t border-line pt-8">
          <SectionHead id="glossary" toc="術語表">術語表</SectionHead>
          <div className="mt-6">
            <Glossary />
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
      </ArticleLayout>
    </main>
  );
}
