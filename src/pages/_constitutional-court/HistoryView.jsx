import { useState } from 'react';
import { useExpandedSet } from '../../components/lab/Accordion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import data from '../../data/constitutionalCourt.json';
import { formatDateRange } from '../../utils/date';
import { ERA_TONE } from './shared';

// ── 沿革（制度沿革）：司法解釋四階段機關軸＋憲政時期軸 ──────────────
// 文字經使用者核可定稿（2026-07-07），逐字見資料 repo docs/沿革摘要草稿.md；
// 年份/外鏈查證見 docs/沿革素材查證.md。憲判件數讀 data.統計（勿寫死）。
const catPair = (n) => ({ fill: `var(--cat-${n}-bg)`, ink: `var(--cat-${n}-tx)` });
const provYear = (s) => {
  if (!s) return null;
  const [y, m = '1', d = '1'] = s.split('-');
  return Number(y) + (Number(m) - 1) / 12 + (Number(d) - 1) / 365;
};

const PROV_SEGMENTS = [ // token-exempt: 沿革機關時間軸分類色（資料，非樣式）
  // 大條一律淡底（-bg）＋同色 ink 細框：色相辨識交給邊框與圖例，深色不塗大面積。
  // 色位取自 ERA_TONE：shizi(大法官・釋字) 與案件圖「解釋」同 rose、xianpan(憲法法庭) 與「判決」同 blue，
  // 兩圖對得起來；1949 前三段（red/slate/amber）案件圖不含。由 validate:colors 鎖住色帶。
  { key: 'dali', 機關: '大理院・統字', 起: '1913-01-15', 迄: '1927-10-22', 號數: '統字 1–2012', color: catPair(ERA_TONE.dali), card: 'dali', 定性: '統一解釋法令，約法解釋不在其權限，惟屢援約法補法令之缺' },
  { key: 'zuigao', 機關: '最高法院・解字', 起: '1927-12-25', 迄: '1928-11-20', 號數: '解字 1–245', color: catPair(ERA_TONE.zuigao), card: 'zuigao', 定性: '不滿一年的過渡期，體例承襲大理院，統一解釋權旋移司法院' },
  { key: 'sifayuan', 機關: '司法院・院字／院解字', 起: '1929-02-16', 迄: '1948-06-23', 號數: '院字 1–2875；院解字 2876–4097', color: catPair(ERA_TONE.sifayuan), card: 'sifayuan', 定性: '訓政時期最高司法機關統一解釋；行憲後空窗期直接解釋新憲法' },
  { key: 'shizi', 機關: '大法官・釋字', 起: '1949-01-06', 迄: '2021-12-24', 號數: '釋字 1–813', color: catPair(ERA_TONE.shizi), card: 'daifaguan', 定性: '依憲法作成、具憲法位階的憲法解釋與統一解釋' },
  { key: 'xianpan', 機關: '憲法法庭・憲判', 起: '2022-01-04', 迄: null, 號數: `憲判 ${data.統計.判決}＋實體裁定 ${data.統計.實體裁定}（迄今）`, color: catPair(ERA_TONE.xianpan), card: 'daifaguan', 定性: '大法官改組為憲法法庭，以判決運作，納入裁判憲法審查' },
];

const PROV_STAGES = [
  {
    key: 'dali', 機關: '大理院解釋（統字）', 期間: '1913–1927', 號數: '統字 1–2012 號',
    text: '清末官制改革將大理寺改為大理院，專掌審判（1906）；《法院編制法》（1909）第 35 條授大理院卿「統一解釋法令必應處置之權」，但不得干預個案審判。民國成立後明令沿用此法，僅改「卿」為「院長」。自 1913 年 1 月 15 日起，大理院以「統字」編號作成統一解釋，至 1927 年 10 月 22 日共 2,012 號。其權限止於統一解釋法令，約法解釋不在其內；但大理院屢屢援引約法意旨補充法令缺漏（如統字第 779 號涉信教自由與夫權），並在判例中直接對約法表示見解，是中國最高司法機關解釋憲制性法律的最早嘗試。',
  },
  {
    key: 'zuigao', 機關: '最高法院解釋（解字）', 期間: '1927–1928', 號數: '解字 1–245 號',
    text: '國民政府定都南京後改大理院為最高法院，《最高法院組織暫行條例》（1927 年 10 月公布）第 3 條授院長「統一解釋法令及必要處置之權」，體例承襲大理院。自 1927 年 12 月 25 日至 1928 年 11 月 20 日，以「解字」編號作成 245 號解釋，前後不滿一年，是四階段中最短的過渡期；其中亦有多號觸及約法問題。1928 年 10 月五院制實施，《司法院組織法》將統一解釋權移歸司法院，最高法院解字系列旋即終止（末號 1928 年 11 月 20 日）。',
  },
  {
    key: 'sifayuan', 機關: '司法院解釋（院字／院解字）', 期間: '1929–1948', 號數: '合計 4,097 件（院字 993 未公布）',
    text: '1928 年 10 月《司法院組織法》第 3 條規定，司法院院長經最高法院院長及各庭庭長會議議決後，行使統一解釋法令及變更判例之權；翌年再訂統一解釋規則，程序法制化。1929 年 2 月 16 日院字第 1 號起，至 1945 年 4 月 30 日院字第 2,875 號；同年 5 月 4 日起改冠「院解字」，編號連續，至 1948 年 6 月 23 日院解字第 4,097 號止，合計 4,097 件（院字第 993 號未公布）。訓政時期約法第 85 條將約法解釋權保留給中國國民黨中央執行委員會，司法機關在成文法上無權解釋憲制性法律；院字、院解字仍多次處理憲制問題，如男女平等（院字第 13 號）、宗教自由與法定義務的衝突（院字第 1878 號），行憲之後、大法官就任之前的空窗期，院解字更直接解釋新憲法，包括法院得否逕行拒絕適用牴觸憲法之命令（院解字第 4012 號，1948 年 6 月）。2018 年釋字第 771 號回頭定性：院（解）字依當時法律屬法令統一解釋，今日法官得引用，但不受其拘束。',
  },
  {
    key: 'daifaguan', 機關: '大法官解釋（釋字）與憲法法庭裁判（憲判）', 期間: '1948–迄今', 號數: `釋字 1–813 號 · 憲判 ${data.統計.判決} 件（迄今）`,
    text: '1946 年政協憲草首次寫入「大法官」：「司法院即為國家最高法院……由大法官若干人組織之」，設計仿美國聯邦最高法院。1947 年施行的《中華民國憲法》第 78 條明定司法院解釋憲法並統一解釋法律命令，第 79 條設大法官。第一屆大法官 1948 年就任，1949 年 1 月 6 日公布釋字第 1 號；至 2021 年 12 月 24 日釋字第 813 號止，共 813 號。其間 1992 年修憲增訂政黨違憲解散案件、2005 年增訂正副總統彈劾案件。2019 年公布《憲法訴訟法》，2022 年 1 月 4 日施行，大法官改組成憲法法庭，以裁判（憲判字）形式運作，並納入裁判憲法審查。',
  },
];

const PROV_LINKS = [
  { label: '維基文庫 Portal：中國大理院解釋', href: 'https://zh.wikisource.org/wiki/Portal:中國大理院解釋' },
  { label: '維基文庫 Portal：中華民國司法院解釋（院字／院解字）', href: 'https://zh.wikisource.org/wiki/Portal:中華民國司法院解釋' },
  { label: '維基文庫 Portal：中華民國司法院大法官解釋', href: 'https://zh.wikisource.org/zh-hant/Portal:中華民國司法院大法官解釋' },
  { label: '王兆珅《憲法解釋機制在中國的建立與展開（1906—1949）》臺大碩論 PDF', href: 'https://tdr.lib.ntu.edu.tw/bitstream/123456789/7783/1/ntu-106-1.pdf' },
  { label: '憲法法庭・釋憲制度之沿革（僅溯及行憲後）', href: 'https://cons.judicial.gov.tw/docdata.aspx?fid=7' },
  { label: '憲法法庭・大事紀要', href: 'https://cons.judicial.gov.tw/history.aspx?fid=12' },
];

// 憲政時期色帶＋時期卡：年份經 sonnet 查證（資料 repo docs/沿革素材查證.md E 節，2026-07-07）。
// 色帶為北京政府→訓政→行憲三段循序（marker 項不畫色帶）；制憲會期僅 40 天且嵌於訓政期間，
// 依查證檔 E.4 備註 2 以時間軸標記呈現，不佔色帶排他區間。
const PROV_ERAS = [
  {
    key: 'beijing', 時期: '北京政府時期', 帶標籤: '北京政府', 起: '1913-10-10', 迄: '1928-12-29',
    基本法: '中華民國臨時約法（1912）／中華民國約法（1914）等歷次約法',
    解釋權歸屬: '大理院（統字）——統一解釋法令，非憲法解釋',
  },
  {
    key: 'guomin', 時期: '國民政府（訓政）時期', 帶標籤: '國民政府（訓政）', 起: '1928-10-03', 迄: '1947-12-24',
    基本法: '中華民國訓政時期約法（1931-06-01 公布）；第 85 條將約法解釋權保留給國民黨中央執行委員會',
    解釋權歸屬: '最高法院（解字）→ 司法院（院字／院解字）——統一解釋法令，非憲法解釋',
    註: '色帶起點取 1928-10-03《訓政綱領》通過（訓政法制化）；「國民政府」作為機關實體則早自 1925-07-01 廣州成立。',
  },
  {
    key: 'zhixian', 時期: '制憲（制憲國民大會）', 起: '1946-11-15', 迄: '1946-12-25',
    基本法: '制定《中華民國憲法》（政協憲草 1946-01 → 國大三讀通過）',
    解釋權歸屬: '司法院（院解字）——訓政體制照常運作，未因制憲中斷',
    註: '會期約 40 天，嵌於訓政期間之內，非依序排列於訓政與行憲之間；時間軸上以標記呈現。', marker: true,
  },
  {
    key: 'xianxing', 時期: '行憲時期', 帶標籤: '行憲', 起: '1947-12-25', 迄: null,
    基本法: '中華民國憲法（1947-01-01 公布、同年 12-25 施行）',
    解釋權歸屬: '大法官（釋字）→ 憲法法庭（憲判，2022-01-04 起）',
  },
];

const PROV_MARKERS = [
  { yr: provYear('1946-11-15'), label: '制憲', color: 'var(--cc-accent)' },
  { yr: 2022, label: '憲訴法', color: 'var(--cc-type-judgment)' },
];

// 沿革敘事卡 → 案件索引深連：階段 key 對映到「機關」facet 值（daifaguan 段含大法官＋憲法法庭＝行憲後）。
const STAGE_機關 = { dali: '大理院', zuigao: '最高法院', sifayuan: '司法院', daifaguan: '行憲後' };

export default function HistoryView({ onOpenIndex }) {
  const { isOpen, toggle, open } = useExpandedSet([
    ...PROV_STAGES.map((s) => s.key),
    ...PROV_ERAS.map((e) => `era-${e.key}`),
  ]);
  const [hover, setHover] = useState(null);
  const hoverSeg = PROV_SEGMENTS.find((s) => s.key === hover);

  const focusCard = (cardKey) => {
    open(cardKey);
    document.getElementById(`prov-card-${cardKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const NOW = new Date().getFullYear();
  const PY0 = 1913, PY1 = NOW + 1;
  const LABEL = 122, CHART = 748, PAD = 10;
  const TOP = PROV_ERAS.length ? 44 : 22;
  const ROW = 34;
  const H = PROV_SEGMENTS.length * ROW;
  const W = LABEL + CHART + PAD;
  const x = (yr) => LABEL + ((yr - PY0) / (PY1 - PY0)) * CHART;
  const decades = [];
  for (let y = 1920; y <= PY1; y += 10) decades.push(y);

  return (
    <div className="max-w-4xl">
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">制度沿革</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">中華民國司法解釋的四個階段</h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          本庫收錄始於 1949 年第一屆大法官。在此之前，統一解釋法令之權歷經大理院（統字）、最高法院（解字）、
          司法院（院字／院解字）三個機關，行憲前已作成逾 6,000 號解釋，其中不少實質觸及約法與憲法問題。
          下方時間軸依實際年距等比排列四階段解釋機關；各階段說明與外部原始出處見其後。
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <div className="rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg)] px-3 py-1.5 text-[12.5px]" style={{ minHeight: '2.4em' }}>
          {hoverSeg ? (
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[var(--cc-ink-strong)]">
              <strong>{hoverSeg.機關}</strong>
              <span>{formatDateRange(hoverSeg.起, hoverSeg.迄, { openLabel: '迄今' })}</span>
              <span className="text-[var(--cc-ink-soft)]">{hoverSeg.號數}</span>
              <span className="text-[var(--cc-ink-soft)]">{hoverSeg.定性}</span>
            </span>
          ) : (
            <span className="text-[var(--cc-ink-soft)]">游標移到橫條看該機關的起訖、號數與解釋權性質；點橫條跳至下方說明。</span>
          )}
        </div>
        <div className="mt-1 overflow-x-auto">
          <svg width={W} height={TOP + H + 24} role="img" aria-label="司法解釋四階段機關時間軸" style={{ minWidth: W }}>
            {PROV_ERAS.filter((e) => !e.marker).map((e, i) => {
              const a = Math.max(provYear(e.起), PY0);
              const b = Math.min(e.迄 ? provYear(e.迄) : PY1, PY1);
              if (b <= PY0 || a >= PY1) return null;
              const w = x(b) - x(a);
              return (
                <g key={e.key}>
                  {i % 2 ? <rect x={x(a)} y={TOP} width={w} height={H} fill="var(--cc-hover-bg)" opacity={0.5} /> : null}
                  {w >= 30 ? <text x={x(a) + w / 2} y={13} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--cc-eyebrow)">{e.帶標籤}</text> : null}
                </g>
              );
            })}
            {decades.map((yr) => (
              <g key={yr}>
                <line x1={x(yr)} y1={TOP} x2={x(yr)} y2={TOP + H} stroke="var(--cc-line)" strokeWidth={1} />
                <text x={x(yr)} y={TOP - 6} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{yr}</text>
                <text x={x(yr)} y={TOP + H + 15} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{yr}</text>
              </g>
            ))}
            {PROV_MARKERS.map((m) => (
              <g key={m.label}>
                <line x1={x(m.yr)} y1={TOP} x2={x(m.yr)} y2={TOP + H} stroke={m.color} strokeDasharray="3 3" strokeWidth={1} opacity={0.7} />
                <text x={x(m.yr) + 3} y={TOP + 9} fontSize={8.5} fill={m.color}>{m.label}</text>
              </g>
            ))}
            {PROV_SEGMENTS.map((s, i) => {
              const y = TOP + i * ROW;
              const a = provYear(s.起);
              const b = s.迄 ? provYear(s.迄) : PY1 - 0.3;
              const w = Math.max(x(b) - x(a), 3);
              const dim = hover && hover !== s.key;
              return (
                <g key={s.key}
                  onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}
                  onClick={() => focusCard(s.card)} className="cursor-pointer">
                  <rect x={0} y={y} width={W} height={ROW} fill={hover === s.key ? 'var(--cc-hover-bg)' : 'transparent'} />
                  <text x={LABEL - 8} y={y + ROW / 2 - 1} textAnchor="end" fontSize={11} fontWeight={700}
                    fill={dim ? 'var(--cc-dim-text)' : 'var(--cc-ink-strong)'}>{s.機關}</text>
                  <text x={LABEL - 8} y={y + ROW / 2 + 11} textAnchor="end" fontSize={8.5} fill="var(--cc-axis-text)">
                    {s.起.slice(0, 4)}–{s.迄 ? s.迄.slice(0, 4) : '迄今'}
                  </text>
                  <rect x={x(a)} y={y + 8} width={w} height={ROW - 16} rx={2.5}
                    fill={s.color.fill} stroke={s.color.ink} strokeWidth={1}
                    strokeDasharray={s.迄 ? undefined : '3 2'} opacity={dim ? 0.3 : 1} />
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-1 text-[12px] text-[var(--cc-ink-soft)]">
          橫條長度＝該機關行使統一解釋權的實際期間（等比）；點任一階段跳至其說明。憲判件數取自本頁快照，隨資料更新自動變動。
        </p>
      </section>

      {PROV_STAGES.map((s) => {
        const cardOpen = isOpen(s.key);
        return (
          <section key={s.key} id={`prov-card-${s.key}`} className="scroll-mt-16 border-t border-[var(--cc-line)] py-4">
            <button onClick={() => toggle(s.key)} className="flex w-full items-baseline justify-between gap-3 text-left">
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">{s.機關}</span>
                <span className="text-[12px] font-bold text-[var(--cc-eyebrow)]">{s.期間}</span>
                <span className="text-[12px] text-[var(--cc-ink-soft)]">{s.號數}</span>
              </span>
              <ChevronDown size={16} className="shrink-0 text-[var(--cc-icon)] transition-transform" style={{ transform: cardOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {cardOpen ? (
              <>
                <p className="mt-2 max-w-3xl text-[14px] leading-[1.9] text-[var(--cc-ink-mid)]">{s.text}</p>
                {onOpenIndex && STAGE_機關[s.key] ? (
                  <button
                    onClick={() => onOpenIndex(STAGE_機關[s.key])}
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"
                  >
                    檢視這 {STAGE_機關[s.key] === '行憲後' ? data.統計.行憲後 : (data.統計.機關?.[STAGE_機關[s.key]] ?? 0)} 件案件 →
                  </button>
                ) : null}
              </>
            ) : null}
          </section>
        );
      })}

      {PROV_ERAS.length ? (
        <section className="border-t border-[var(--cc-line)] py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">憲政時期</p>
          <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">同一段歷史的另一條軸：憲政基本法與解釋權歸屬</h2>
          <div className="mt-3 space-y-2">
            {PROV_ERAS.map((e) => {
              const key = `era-${e.key}`;
              const cardOpen = isOpen(key);
              return (
                <div key={e.key} className="rounded-lg border border-[var(--cc-border)]">
                  <button onClick={() => toggle(key)} className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-[14px] font-bold text-[var(--cc-ink-strong)]">{e.時期}</span>
                      <span className="text-[12px] text-[var(--cc-ink-soft)]">{formatDateRange(e.起, e.迄, { openLabel: '迄今' })}</span>
                    </span>
                    <ChevronDown size={15} className="shrink-0 text-[var(--cc-icon)]" style={{ transform: cardOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {cardOpen ? (
                    <div className="space-y-1 px-3 pb-3 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
                      <p><span className="text-[var(--cc-ink-soft)]">基本法</span>：{e.基本法}</p>
                      <p><span className="text-[var(--cc-ink-soft)]">解釋權歸屬</span>：{e.解釋權歸屬}</p>
                      {e.註 ? <p className="text-[12.5px] text-[var(--cc-ink-soft)]">{e.註}</p> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">原始出處</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">各階段解釋的公開原文與研究文獻</h2>
        <div className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed">
          {PROV_LINKS.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
              {l.label} <ExternalLink size={11} className="shrink-0" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
