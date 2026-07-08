import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  History,
  Info,
  Network,
  Search,
  Users,
  CalendarClock,
  ChevronDown,
  Landmark,
} from 'lucide-react';
import data from '../data/constitutionalCourt.json';
import { formatDate, formatDateRange } from '../utils/date';

const CC_VARS = { // token-exempt
  '--cc-accent': '#8f6071',
  '--cc-line': '#eadde2',
  '--cc-eyebrow': '#a77b89',
  '--cc-ink-soft': '#74636a',
  '--cc-ink-strong': '#4b3b43',
  '--cc-title-ink': '#45343c',
  '--cc-highlight': '#a84f6e',
  '--cc-ink-mid': '#5b4e55',
  '--cc-border': '#e3d5da',
  '--cc-link-hover': '#5f3f4b',
  '--cc-link-underline': '#d8b7c2',
  '--cc-hover-bg': '#f7edf0',
  '--cc-track': '#f0e2e7',
  '--cc-blue-ink': '#615982',
  '--cc-type-judgment': '#5a5fb0',
  '--cc-ink': '#3f3339',
  '--cc-bg': '#fbf8f9',
  '--cc-axis-text': '#8d7e85',
  '--cc-table-head-ink': '#7f5b69',
  '--cc-body-text': '#6f6369',
  '--cc-ink-heavy': '#44343d',
  '--cc-blue-ink-hover': '#3f3a5e',
  '--cc-node-fill': '#fff',
  '--cc-heat-text-light': '#fdf7f9',
  '--cc-opinion-bg': '#f9f2f4',
  '--cc-heat-zero': '#f7f3f4',
  '--cc-tab-active-bg': '#f1e3e8',
  '--cc-row-border': '#f0e3e8',
  '--cc-table-border': '#e6ded2',
  '--cc-node-related-fill': '#e3b6c4',
  '--cc-edge-line': '#c9b3bc',
  '--cc-dim-text': '#c4b4ba',
  '--cc-placeholder': '#b09aa2',
  // 退場中性色：非分類色的「其他／待確認／國內／任期尚短」用，刻意不佔 --cat-* 身分位。
  // ink 為已審過的暖灰，bg 為近白（淡底屬 DESIGN.md 准許新增的低風險轉換）。走 -tx/-bg 慣例讓 inkToFill 自動導出淡底。
  '--cc-retire-tx': '#b3a8ad',
  '--cc-retire-bg': '#ece9ea',
  '--cc-icon': '#9b6b7b',
  '--cc-eyebrow-header': '#987483',
  '--cc-tab-inactive-text': '#806b74',
  '--cc-figure-note': '#7d7076',
  '--cc-tab-active-text': '#704c5a',
  '--cc-heat-text-dark': '#6d5a62',
  '--cc-heading': '#2f2a2d',
  // 搜尋命中高亮：淡琥珀近白底＋墨字，刻意不佔 --cat-* 分類身分位（見 hl()）。
  '--cc-mark-bg': '#f6e6c2',
  '--cc-mark-tx': '#6d4c1e',
};

const docs = data.文件;
const justices = data.大法官;
const coSign = data.共同具名;
const citeEdges = data.引用網絡;
const presidents = data.總統任期 ?? [];

// 字號 → 案件文件的全域查找表，供 <CaseRef> 由任一處字號回連官方頁並取一句話爭點預覽。
const docByNo = new Map(docs.map((d) => [d.字號, d]));

// 只要顯示字號的地方都用它：連回官方頁，hover（title）顯示一句話爭點預覽。查無 doc／官方頁時退化為純文字。
function CaseRef({ 字號, className = '' }) {
  const d = docByNo.get(字號);
  if (!d?.官方頁) return <span className={className}>{字號}</span>;
  return (
    <a
      href={d.官方頁}
      target="_blank"
      rel="noreferrer"
      title={d.爭點 || undefined}
      className={`underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)] ${className}`}
    >
      {字號}
    </a>
  );
}

// 釋憲文件類型 ↔ 制度沿革機關階段 的單一對應表：同一機關作成的文件與其沿革階段共用 --cat-* 分類色位，
// 讓「案件時間軸」的色條與「制度沿革」四段對得起來。解釋(釋字)＝大法官階段(shizi)、判決/裁定(憲判)＝
// 憲法法庭階段(xianpan)、最高法院解字＝zuigao、司法院院字/院解字＝sifayuan；四段在同一條合併時間軸相接。
const ERA_TONE = { dali: 6, zuigao: 8, sifayuan: 4, shizi: 7, xianpan: 2 };
const catPair = (n) => ({ fill: `var(--cat-${n}-bg)`, ink: `var(--cat-${n}-tx)` });
// 年度密度堆疊條＝淡底＋ink 細線：解釋吃 shizi 色位（rose，維持頁面 rose 識別）、判決吃 xianpan 色位（blue），
// 兩者與沿革同機關階段同色；實體裁定同屬憲法法庭時期、另給 green 以在堆疊中可辨。大面積吃淡底 -bg、境界與圖例用 ink -tx。
const TYPE_TONE = { 解釋: ERA_TONE.shizi, 判決: ERA_TONE.xianpan, 實體裁定: 3 };
const typeFill = (k) => `var(--cat-${TYPE_TONE[k]}-bg)`;
const typeInk = (k) => `var(--cat-${TYPE_TONE[k]}-tx)`;

// 合併案件時間軸的四條「解釋機制」色帶（沿革同色，時間上前後相接、幾乎不重疊）：
// 最高法院解字→司法院院字/院解字（統一解釋）→大法官釋字→憲法法庭憲判/裁定。大理院統字無日期，不入此軸。
const BANDS = [
  { key: '最高法院解字', tone: ERA_TONE.zuigao, label: '最高法院　解字' },
  { key: '司法院統一解釋', tone: ERA_TONE.sifayuan, label: '司法院　院字・院解字' },
  { key: '大法官釋字', tone: ERA_TONE.shizi, label: '大法官　釋字' },
  { key: '憲法法庭', tone: ERA_TONE.xianpan, label: '憲法法庭　判決・裁定' },
];
const BAND_TONE = Object.fromEntries(BANDS.map((b) => [b.key, b.tone]));
const bandOf = (d) => {
  if (d.系列 === '統字') return null; // 大理院，無作成日期
  if (d.系列 === '解字') return '最高法院解字';
  if (d.系列 === '院字' || d.系列 === '院解字') return '司法院統一解釋';
  if (!d.系列) return d.類型 === '解釋' ? '大法官釋字' : '憲法法庭';
  return null;
};

const OUTCOME_TONE = {
  違憲: 'red',
  違憲即失效: 'red',
  違憲定期失效: 'gold',
  合憲: 'green',
  法令解釋: 'teal',
  補充前解釋: 'teal',
  變更前解釋: 'teal',
  '其他/待人工': 'slate',
  未分類: 'slate',
};

const STANDARD_TONE = { 嚴格: 'red', 中度: 'gold', 寬鬆: 'green', '多重（待人工）': 'slate' };

// 為什麼被高頻引用：只收錄有把握、教科書等級公認的論述定位，逐筆上網對照官方解釋與
// 學說整理查證（2026-07-07）。已覆蓋前端顯示的前 15 名（cited.slice(0,15)）；名次更深者
// 暫缺不猜。補述沿革見 HANDOFF.md「被引用最多的解釋」條目。
const WHY_CITED = {
  釋字第443號: '確立「層級化法律保留」：依限制人民權利之密度區分憲法保留、絕對法律保留、相對法律保留與非法律保留事項，此後歷來解釋大量援引其保留密度分類。',
  釋字第371號: '確立法官聲請釋憲（具體規範審查）制度：各級法院法官於審理案件時，對應適用之法律合理確信有牴觸憲法之疑義者，得裁定停止訴訟聲請解釋，是最常被聲請案援引的程序性先例。',
  釋字第682號: '國家考試及格標準（單科零分、專業科目平均、特定科目最低分數不予及格）的合憲性指標案：應考試權具程序性基本權性質，考試方法與及格標準涉考選專業判斷，對其判斷餘地採低密度審查，並要求分類標準與考試目的具合理關聯以符平等原則。',
  釋字第572號: '補充釋字第371號，界定法官聲請釋憲的「先決問題」（系爭法律違憲須顯然影響原因案件裁判結果）與「客觀上形成確信違憲之具體理由」之意涵，與釋字第371、590號同為具體規範審查程序的常引先例。',
  釋字第185號: '確立司法院解釋有拘束全國各機關及人民之效力、違背解釋之判例當然失其效力，並確立受不利確定終局裁判者得據解釋聲請再審或非常上訴。是解釋效力與釋憲救濟途徑的根本先例。',
  釋字第400號: '揭示財產權保障旨在確保個人對財產「存續狀態」的自由使用收益處分，並確立既成道路成立公用地役關係屬特別犧牲、國家應予徵收補償。其財產權定義與特別犧牲補償法理為後案反覆援引。',
  釋字第590號: '補充釋字第371號，界定「法官於審理案件時」與「裁定停止訴訟程序」兼及民事、刑事、行政訴訟與非訟事件，與釋字第371、572號共構法官聲請釋憲的程序框架。',
  釋字第432號: '確立法律明確性原則的審查公式：構成要件雖用不確定概念或概括條款，仍須使受規範者可理解、可預見並得由司法審查確認，方為合憲。是明確性原則的奠基解釋，後為釋字第521、594號等沿用。',
  釋字第585號: '確立立法院本於憲法職權享有輔助性的調查權（含文件調閱與有限強制手段），並依權力分立與制衡界定其對象與界限。是立法院調查權的指標解釋。',
  釋字第177號: '確立確定判決「消極不適用法規」顯然影響裁判者屬「適用法規顯有錯誤」得提再審，並宣示本院依人民聲請所為之解釋，對聲請人據以聲請之原因案件亦有效力——後者為釋憲聲請人個案救濟的關鍵先例。',
  釋字第620號: '重申租稅法律主義，闡明夫妻剩餘財產差額分配請求權屬債權、非遺產稅課徵範圍，並就新法溯及課予立法者訂定過渡條款的信賴保護義務。',
  釋字第709號: '司法院自陳為首見強化「正當行政程序」概念的解釋：都市更新事業概要與計畫之審核須設適當審議組織、確保利害關係人知悉資訊並適時陳述意見（計畫核定並應舉行聽證）。後案正當行政程序審查的指標先例。',
  釋字第594號: '延續法律明確性審查於刑罰構成要件：商標刑罰所禁行為（附加相同或近似商標致相關消費者依通常注意力有混淆誤認之虞）範圍可得確定，不違法律明確性原則。',
  釋字第622號: '重申憲法第19條租稅法律主義，並據以否定對繼承人就被繼承人死亡前三年贈與另課贈與稅。是租稅法律主義的常引適用案例。',
  釋字第521號: '沿續釋字第432號，重申法律明確性容許立法者運用概括條款，惟其文義須非受規範者所不能理解且可經司法審查確認。與釋字第432號同為明確性原則的常引先例。',
};

const tabs = [
  { id: 'index', label: '案件索引', icon: Search },
  { id: 'timeline', label: '案件時間軸', icon: CalendarClock },
  { id: 'justices', label: '大法官', icon: Users },
  { id: 'tenure', label: '任期時間軸', icon: History },
  { id: 'graph', label: '意見書圖譜', icon: Network },
  { id: 'research', label: '問題意識', icon: FileText },
  { id: 'case1', label: '114 憲判 1 號', icon: Gavel },
  { id: 'history', label: '沿革', icon: Landmark },
  { id: 'about', label: '資料說明', icon: Info },
];

function Badge({ children, tone = 'slate' }) {
  const colors = {
    // 全站語意色 token（tokens.css Layer 0 tone pairs）；tone 名對映到校準過的色調
    slate: ['var(--tone-slate-bg)', 'var(--tone-slate-tx)'],
    gold: ['var(--tone-amber-bg)', 'var(--tone-amber-tx)'],
    green: ['var(--tone-green-bg)', 'var(--tone-green-tx)'],
    red: ['var(--tone-red-bg)', 'var(--tone-red-tx)'],
    blue: ['var(--tone-blue-bg)', 'var(--tone-blue-tx)'],
    plum: ['var(--tone-plum-bg)', 'var(--tone-plum-tx)'],
    teal: ['var(--tone-teal-bg)', 'var(--tone-teal-tx)'],
  };
  const [bg, color] = colors[tone] || colors.slate;
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function citeString(d) {
  const dt = d.日期 ? `（${formatDate(d.日期)}）` : '';
  if (d.類型 === '解釋') return `司法院${d.字號}解釋${dt}`;
  return `憲法法庭${d.字號}${d.類型 === '實體裁定' ? '裁定' : '判決'}${dt}`;
}

function bibKey(d) {
  const m1 = d.字號.match(/^釋字第(\d+)號$/);
  if (m1) return `jy_interp_${m1[1]}`;
  const m2 = d.字號.match(/^(\d+)年憲(暫?)裁?判?字第(\d+)號$/);
  if (m2) return `tcc_${m2[1]}_${m2[2] ? 'inj_' : ''}${m2[3]}`;
  return d.字號.replace(/[^\w]/g, '');
}

function toBibtex(list) {
  return list
    .map((d) => {
      const year = d.日期 ? d.日期.slice(0, 4) : '';
      return `@misc{${bibKey(d)},\n  title = {${citeString(d).replace(/（.*?）/, '')}},\n  year = {${year}},\n  note = {${d.日期 ?? ''}${d.爭點 ? '，' + d.爭點.slice(0, 60) : ''}},\n  howpublished = {\\url{${d.官方頁}}}\n}`;
    })
    .join('\n\n');
}

function toCsv(list) {
  const esc = (s) => `"${String(s ?? '').replaceAll('"', '""')}"`;
  const head = ['字號', '類型', '日期', '主題', '原理原則', '審查結論', '意見書數', '官方頁'];
  const rows = list.map((d) =>
    [d.字號, d.類型, d.日期, d.主題.join('；'), d.原理原則.join('；'), d.審查結論?.結論, d.意見書.length, d.官方頁].map(esc).join(','),
  );
  return '﻿' + [head.join(','), ...rows].join('\n');
}

function toManifest(list) {
  return JSON.stringify(
    {
      說明: '此清單供本機批次下載使用：到資料庫 repo 執行 npm run fetch-batch -- --manifest <本檔>',
      產生時間: new Date().toISOString(),
      文件: list.map((d) => ({
        字號: d.字號,
        官方頁: d.官方頁,
        意見書: d.意見書.map((o) => ({ 文件名: o.文件名, 下載網址: o.下載網址 })),
        ...(d.立場表下載 ? { 立場表: d.立場表下載 } : {}),
      })),
    },
    null,
    1,
  );
}

function OpinionLine({ op, officialUrl }) {
  const who =
    op.作者類別 === '大法官'
      ? `${(op.提出 ?? []).join('、')}${op.加入?.length ? `（${op.加入.join('、')}加入）` : ''}`
      : (op.文件名 ?? '').replace(/\.(pdf|doc|docx)$/i, '');
  // 內嵌記錄（早期釋字，意見書全文嵌在官方頁正文）沒有 PDF，連官方頁
  const href = op.下載網址 ?? (op.內嵌 ? officialUrl : undefined);
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Badge tone={op.類型.includes('不同') ? 'red' : op.類型.includes('協同') ? 'blue' : 'slate'}>{op.類型}</Badge>
      {op.作者類別 !== '大法官' ? <Badge tone="slate">{op.作者類別}</Badge> : null}
      <span className="text-[13px] font-bold text-[var(--cc-ink-strong)]">{who}</span>
      {op.加入註記?.length ? (
        <span className="text-[11.5px] text-[var(--cc-figure-note)]">（{op.加入註記.join('；')}）</span>
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-link-hover)]"
        >
          {op.下載網址 ? '官方 PDF' : '官方頁正文'} <ExternalLink size={11} />
        </a>
      ) : null}
    </div>
  );
}

// 資料層（constitutional-court-research-data engineering/scripts/lib.mjs
// stripParagraphAware）已把官方頁「解釋文/主文」逐段的 <li> 結構轉存成真分段
// （連續換行），這裡依此分段成獨立 <p>；找不到分段（單段案件）就整段原樣輸出。
function splitClauses(text) {
  if (!text) return [];
  const parts = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

// 行憲前全文懶載：快照只有 60 字預覽，展開卡片時才動態 import 全文檔（Vite 分塊，只抓一次快取）。
let pre1947Cache = null;
let pre1947Promise = null;
function loadPre1947() {
  if (pre1947Cache) return Promise.resolve(pre1947Cache);
  if (!pre1947Promise) {
    pre1947Promise = import('../data/constitutionalCourt-pre1947-fulltext.json')
      .then((m) => { pre1947Cache = m.default; return pre1947Cache; })
      .catch(() => ({}));
  }
  return pre1947Promise;
}

// 搜尋命中高亮：把 text 中出現 kw 的片段包成 <mark>（淡琥珀底＋墨字）。kw 空白則原樣返回字串。
function hl(text, kw) {
  const s = String(text ?? '');
  const q = (kw ?? '').trim();
  if (!q) return s;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = s.split(new RegExp(`(${esc})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="rounded-[2px] bg-[var(--cc-mark-bg)] px-0.5 text-[var(--cc-mark-tx)]">{p}</mark>
      : p,
  );
}

function CaseCard({ d, q }) {
  const [full, setFull] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const showFull = async () => {
    if (full || loadingFull) return;
    setLoadingFull(true);
    const m = await loadPre1947();
    setFull(m[d.字號] ?? { 主文: d.主文 });
    setLoadingFull(false);
  };
  // 行憲前卡片預設就展開全文（懶載檔仍只抓一次、全卡共享快取）；預覽被截斷者才需抓。
  useEffect(() => {
    if (d.系列 && d.主文.endsWith('…')) showFull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.字號]);
  return (
    <article className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href={d.官方頁}
          target="_blank"
          rel="noreferrer"
          className="text-[17px] font-bold text-[var(--cc-ink)] underline decoration-[var(--cc-link-underline)] underline-offset-4 hover:text-[var(--cc-accent)]"
        >
          {hl(d.字號, q)}
        </a>
        <span className="text-[13px] text-[var(--cc-figure-note)]">{formatDate(d.日期)}</span>
        <span className="inline-flex h-2.5 w-2.5 rounded-sm" style={{ background: typeInk(d.類型) }} aria-hidden />
        <Badge tone="plum">{d.類型}{d.子類 ? `・${d.子類}` : ''}</Badge>
        {d.審查結論?.結論 && d.審查結論.結論 !== '未分類' ? (
          <Badge tone={OUTCOME_TONE[d.審查結論.結論] ?? 'slate'}>
            {d.審查結論.結論 === '其他/待人工' ? '結論待人工判讀' : d.審查結論.結論}
          </Badge>
        ) : null}
        {d.審查基準 && d.審查基準.基準 !== '未明示' ? (
          <Badge tone={STANDARD_TONE[d.審查基準.基準] ?? 'slate'}>
            {d.審查基準.基準 === '多重（待人工）' ? '審查基準待人工' : `${d.審查基準.基準}審查`}
          </Badge>
        ) : null}
        {d.主題.map((t) => (
          <Badge key={t} tone="blue">{t}</Badge>
        ))}
        {(d.子主題 ?? []).filter((t) => t !== '稅法：未細分').map((t) => (
          <Badge key={t} tone="plum">{t}</Badge>
        ))}
      </div>

      {d.爭點 ? (
        <p className="mt-2 max-w-4xl text-[14px] font-bold leading-relaxed text-[var(--cc-ink-heavy)]">{hl(d.爭點, q)}</p>
      ) : null}
      {d.系列 ? (
        <>
          {splitClauses(full ? full.主文 : d.主文).map((clause, i) => (
            <p key={i} className="mt-2 max-w-4xl whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">{hl(clause, q)}</p>
          ))}
          {full?.全文內容 ? (
            <div className="mt-2 border-l-2 border-[var(--cc-line)] pl-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">全文（訓令／原函）</p>
              {splitClauses(full.全文內容).map((clause, i) => (
                <p key={i} className="mt-1 max-w-4xl whitespace-pre-line text-[13px] leading-relaxed text-[var(--cc-ink-soft)]">{clause}</p>
              ))}
            </div>
          ) : null}
          {!full && d.主文.endsWith('…') ? (
            <button onClick={showFull} className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
              {loadingFull ? '載入全文中…' : '展開全文'}
              {loadingFull ? null : <ChevronDown size={12} />}
            </button>
          ) : null}
        </>
      ) : (
        d.主文 ? splitClauses(d.主文).map((clause, i) => (
          <p key={i} className="mt-2 max-w-4xl whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">{hl(clause, q)}</p>
        )) : null
      )}

      {(d.憲法依據?.length || d.系爭法令?.length) ? (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
          {d.憲法依據?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">憲法依據</strong>　{d.憲法依據.join('、')}
            </span>
          ) : null}
          {d.系爭法令?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">系爭法令</strong>　{hl(d.系爭法令.slice(0, 6).join('、'), q)}
              {d.系爭法令.length > 6 ? `　等 ${d.系爭法令.length} 項` : ''}
            </span>
          ) : null}
        </div>
      ) : null}

      {(d.主筆 || d.參與大法官?.length) ? (
        <div className="mt-2 text-[12px] text-[var(--cc-ink-soft)]">
          {d.主筆 ? (
            <span className="mr-4">
              <strong className="text-[var(--cc-accent)]">主筆</strong>　{d.主筆}
            </span>
          ) : null}
          {d.參與大法官?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">參與大法官</strong>　{d.參與大法官.join('、')}
            </span>
          ) : null}
        </div>
      ) : null}

      {d.意見書.length ? (
        <div className="mt-3 rounded-lg bg-[var(--cc-opinion-bg)] px-3 py-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">意見書 {d.意見書.length} 份</p>
          {d.意見書.map((op, i) => (
            <OpinionLine key={i} op={op} officialUrl={d.官方頁} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px]">
        <a href={d.官方頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
          {d.系列 ? '維基文庫原文（彙編校勘本）' : '官方頁面（全文、理由書與下載）'} <ExternalLink size={11} />
        </a>
        {d.立場表下載 ? (
          <a href={d.立場表下載} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]">
            主文立場表 PDF <ExternalLink size={11} />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--cc-ink-soft)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--cc-border)] bg-white px-2 py-1.5 text-[13px] font-bold text-[var(--cc-ink-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-link-underline)]"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

// 機關維度（行憲前後切分）：預設只顯示行憲後（大法官＋憲法法庭），行憲前 6,354 件 opt-in，
// 避免舊號淹沒 874 新號。順序＝解釋權沿革時序。
const 機關_序 = ['大理院', '最高法院', '司法院', '大法官', '憲法法庭'];
const 機關_ERA = { 行憲後: ['大法官', '憲法法庭'], 行憲前: ['大理院', '最高法院', '司法院'] };
function inScope(d, sel) {
  if (sel === '全部') return true;
  if (機關_ERA[sel]) return 機關_ERA[sel].includes(d.機關);
  return d.機關 === sel;
}
// 沿革分頁的機關段可深連到 ?tab=index&機關=大理院，開啟即預篩該機關。
function readInitial機關() {
  if (typeof window === 'undefined') return '行憲後';
  const v = new URLSearchParams(window.location.search).get('機關');
  return v === '全部' || v === '行憲前' || 機關_序.includes(v) ? v : '行憲後';
}

// 排序主鍵：行憲前（有系列）按 系列＋號次 排在前段（號次即時序，統字多無日期，不靠日期）；
// 行憲後按日期排在後段。全部檢視下自然呈行憲前→行憲後的時序。
const SERIES_RANK = { 統字: 0, 解字: 1, 院字: 2, 院解字: 3 };
function sortKey(d) {
  if (d.系列) return `A${SERIES_RANK[d.系列] ?? 9}${String(d.號次 ?? 0).padStart(5, '0')}`;
  return `B${d.日期 ?? ''}`;
}

// 頂部行憲前後大分段鈕（醒目切換，非埋在下拉裡）。
function SegControl({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--cc-border)] bg-white p-0.5">
      {options.map(([v, label, sub]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="rounded-md px-3 py-1.5 text-[13.5px] font-bold transition"
          style={{
            background: value === v ? 'var(--cc-tab-active-bg)' : 'transparent',
            color: value === v ? 'var(--cc-tab-active-text)' : 'var(--cc-tab-inactive-text)',
          }}
        >
          {label}{sub != null ? <span className="ml-1 font-normal opacity-70">{sub}</span> : null}
        </button>
      ))}
    </div>
  );
}

function IndexView() {
  const [機關, set機關] = useState(readInitial機關);
  const [type, setType] = useState('全部');
  const [topic, setTopic] = useState('全部');
  const [subtopic, setSubtopic] = useState('全部');
  const [outcome, setOutcome] = useState('全部');
  const [standard, setStandard] = useState('全部');
  const [decade, setDecade] = useState('全部');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(30);
  const [sortDir, setSortDir] = useState('desc');

  // 機關維度切分（預設行憲後）；其餘所有面向的件數都以選定機關為母體重算。
  const 機關Counts = useMemo(() => {
    const m = new Map();
    for (const d of docs) m.set(d.機關, (m.get(d.機關) ?? 0) + 1);
    const 行憲後 = 機關_ERA.行憲後.reduce((s, k) => s + (m.get(k) ?? 0), 0);
    const 行憲前 = 機關_ERA.行憲前.reduce((s, k) => s + (m.get(k) ?? 0), 0);
    return { m, 行憲後, 行憲前 };
  }, []);
  const scoped = useMemo(() => docs.filter((d) => inScope(d, 機關)), [機關]);

  // 主題一級選單只列大類＋件數；子主題另開一顆獨立選單，只在選到的大類確實有子主題時才出現
  // （目前只有稅法有子主題，但用「跟選定大類同時出現在同一文件」動態算，未來任何大類展開子主題都自動適用）
  const { typeCounts, topicOptions, subtopicsByTopic } = useMemo(() => {
    const tc = new Map();
    const c = new Map();
    for (const d of scoped) {
      tc.set(d.類型, (tc.get(d.類型) ?? 0) + 1);
      for (const t of d.主題) c.set(t, (c.get(t) ?? 0) + 1);
    }
    const topicOptions = [...c.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => [t, `${t}（${n}）`]);
    const subtopicsByTopic = new Map();
    for (const [t] of c) {
      const sub = new Map();
      for (const d of scoped) {
        if (!d.主題.includes(t)) continue;
        for (const s of d.子主題 ?? []) sub.set(s, (sub.get(s) ?? 0) + 1);
      }
      if (sub.size) subtopicsByTopic.set(t, [...sub.entries()].sort((a, b) => b[1] - a[1]));
    }
    return { typeCounts: tc, topicOptions, subtopicsByTopic };
  }, [scoped]);

  const subtopicOptions = subtopicsByTopic.get(topic);

  const { outcomeCounts, standardCounts } = useMemo(() => {
    const oc = { '違憲（含定期失效）': 0, 合憲: 0, 法令解釋: 0, 補充前解釋: 0, 變更前解釋: 0, '其他/待人工': 0 };
    const sc = new Map();
    for (const d of scoped) {
      const o = d.審查結論?.結論 ?? '未分類';
      if (o.startsWith('違憲')) oc['違憲（含定期失效）'] += 1;
      else if (o === '合憲') oc.合憲 += 1;
      else if (o === '法令解釋') oc.法令解釋 += 1;
      else if (o === '補充前解釋') oc.補充前解釋 += 1;
      else if (o === '變更前解釋') oc.變更前解釋 += 1;
      else oc['其他/待人工'] += 1;
      const s = d.審查基準?.基準;
      if (s) sc.set(s, (sc.get(s) ?? 0) + 1);
    }
    return { outcomeCounts: oc, standardCounts: sc };
  }, [scoped]);

  const decades = useMemo(() => {
    const s = new Set(scoped.map((d) => d.日期?.slice(0, 3)).filter(Boolean));
    return [...s].sort().map((p) => `${p}0`);
  }, [scoped]);

  const filtered = useMemo(() => {
    const kw = q.trim();
    return scoped.filter((d) => {
      if (type !== '全部' && d.類型 !== type) return false;
      if (topic !== '全部' && !d.主題.includes(topic)) return false;
      if (subtopic !== '全部' && !d.子主題?.includes(subtopic)) return false;
      if (outcome !== '全部') {
        const c = d.審查結論?.結論 ?? '未分類';
        if (outcome === '違憲（含定期失效）' ? !c.startsWith('違憲') : c !== outcome) return false;
      }
      if (standard !== '全部' && (d.審查基準?.基準 ?? '') !== standard) return false;
      if (decade !== '全部' && d.日期?.slice(0, 3) !== decade.slice(0, 3)) return false;
      if (kw && !(d.字號.includes(kw) || d.爭點.includes(kw) || d.主文.includes(kw) || d.系爭法令?.some((x) => x.includes(kw)) || d.原理原則.some((x) => x.includes(kw)))) return false;
      return true;
    });
  }, [scoped, type, topic, subtopic, outcome, standard, decade, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => (sortDir === 'desc' ? sortKey(b).localeCompare(sortKey(a)) : sortKey(a).localeCompare(sortKey(b))));
    return arr;
  }, [filtered, sortDir]);

  const shown = sorted.slice(0, limit);
  const stamp = new Date().toISOString().slice(0, 10);
  // 是否只看行憲前：決定隱藏大法官時代才有的篩選（類型/主題/審查基準對統一解釋無意義）。
  const isPre = 機關 === '行憲前' || 機關_ERA.行憲前.includes(機關);
  const seg = 機關 === '行憲後' ? '行憲後' : 機關 === '全部' ? '全部' : '行憲前';

  return (
    <div>
      <div className="sticky top-[49px] z-10 -mx-4 border-b border-[var(--cc-line)] bg-[var(--cc-bg)]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {/* 頂部大分段鈕：行憲前後明確切開（預設行憲後）。行憲前另給機關子篩選。 */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <SegControl
            value={seg}
            onChange={(v) => { set機關(v); setType('全部'); setTopic('全部'); setSubtopic('全部'); setOutcome('全部'); setStandard('全部'); setDecade('全部'); setLimit(30); }}
            options={[
              ['行憲後', '行憲後　釋字・憲判', 機關Counts.行憲後],
              ['行憲前', '行憲前　統一解釋', 機關Counts.行憲前],
              ['全部', '全部', docs.length],
            ]}
          />
          {seg === '行憲前' ? (
            <Select label="機關" value={機關 === '行憲前' ? '行憲前' : 機關} onChange={(v) => { set機關(v); setLimit(30); }} options={[['行憲前', `全部機關（${機關Counts.行憲前}）`], ...機關_ERA.行憲前.map((k) => [k, `${k}（${機關Counts.m.get(k) ?? 0}）`])]} />
          ) : null}
          {seg === '行憲前' ? (
            <span className="text-[12px] text-[var(--cc-ink-soft)]">大理院／最高法院／司法院的統一解釋，非大法官憲法解釋；主題與審查基準為大法官時代機標，此處不適用。</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex w-full items-center gap-2 rounded-md border border-[var(--cc-border)] bg-white px-2.5 py-1.5">
            <Search size={13} className="text-[var(--cc-eyebrow)]" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(30); }}
              placeholder="搜尋字號、爭點、主文、系爭法令、原理原則"
              className="w-full bg-transparent text-[13px] text-[var(--cc-ink-strong)] placeholder-[var(--cc-placeholder)] focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!isPre ? (
            <Select label="類型" value={type} onChange={(v) => { setType(v); setLimit(30); }} options={[['全部', '全部'], ['解釋', `解釋（${typeCounts.get('解釋') ?? 0}）`], ['判決', `憲法法庭判決（${typeCounts.get('判決') ?? 0}）`], ['實體裁定', `實體裁定（${typeCounts.get('實體裁定') ?? 0}）`]]} />
          ) : null}
          {!isPre ? (
            <Select label="主題" value={topic} onChange={(v) => { setTopic(v); setSubtopic('全部'); setLimit(30); }} options={[['全部', '全部'], ...topicOptions]} />
          ) : null}
          {subtopicOptions && !isPre ? (
            <Select label="細分" value={subtopic} onChange={(v) => { setSubtopic(v); setLimit(30); }} options={[['全部', '全部'], ...subtopicOptions.map(([s, n]) => [s, `${s}（${n}）`])]} />
          ) : null}
          <Select label="結論" value={outcome} onChange={(v) => { setOutcome(v); setLimit(30); }} options={[['全部', '全部'], ['違憲（含定期失效）', `違憲（含定期失效）（${outcomeCounts['違憲（含定期失效）']}）`], ['合憲', `合憲（${outcomeCounts.合憲}）`], ['法令解釋', `法令解釋（${outcomeCounts.法令解釋}）`], ['補充前解釋', `補充前解釋（${outcomeCounts.補充前解釋}）`], ['變更前解釋', `變更前解釋（${outcomeCounts.變更前解釋}）`], ['其他/待人工', `待人工判讀（${outcomeCounts['其他/待人工']}）`]]} />
          {!isPre ? (
            <Select label="審查基準" value={standard} onChange={(v) => { setStandard(v); setLimit(30); }} options={[['全部', '全部'], ['嚴格', `嚴格（${standardCounts.get('嚴格') ?? 0}）`], ['中度', `中度（${standardCounts.get('中度') ?? 0}）`], ['寬鬆', `寬鬆（${standardCounts.get('寬鬆') ?? 0}）`], ['多重（待人工）', `多重（待人工）（${standardCounts.get('多重（待人工）') ?? 0}）`], ['未明示', `未明示（${standardCounts.get('未明示') ?? 0}）`]]} />
          ) : null}
          <Select label="年代" value={decade} onChange={(v) => { setDecade(v); setLimit(30); }} options={[['全部', '全部'], ...decades.map((d) => [d, `${d} 年代`])]} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
          <span className="font-bold text-[var(--cc-ink-strong)]">符合 {filtered.length} 件</span>
          <button
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"
          >
            <ArrowUpDown size={11} />{sortDir === 'desc' ? '新→舊' : '舊→新'}
          </button>
          <span className="text-[var(--cc-eyebrow)]">匯出目前篩選集：</span>
          <button onClick={() => downloadFile(toCsv(filtered), `憲法案件_${stamp}.csv`, 'text/csv')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />CSV</button>
          <button onClick={() => downloadFile(JSON.stringify(filtered, null, 1), `憲法案件_${stamp}.json`, 'application/json')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />JSON</button>
          <button onClick={() => downloadFile(toBibtex(filtered), `憲法案件_${stamp}.bib`, 'text/plain')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />BibTeX</button>
          <button onClick={() => downloadFile(filtered.map(citeString).join('\n'), `引註清單_${stamp}.txt`, 'text/plain')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />引註清單</button>
          <button onClick={() => downloadFile(toManifest(filtered), `下載清單_${stamp}.json`, 'application/json')} className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]"><Download size={11} />批次下載清單</button>
        </div>
      </div>

      {shown.map((d) => (
        <CaseCard key={d.字號} d={d} q={q} />
      ))}
      {filtered.length > limit ? (
        <div className="py-6 text-center">
          <button
            onClick={() => setLimit(limit + 50)}
            className="rounded-lg border border-[var(--cc-border)] bg-white px-5 py-2 text-[13px] font-bold text-[var(--cc-accent)] hover:bg-[var(--cc-hover-bg)]"
          >
            顯示更多（尚有 {filtered.length - limit} 件）
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TimelineView() {
  const [hover, setHover] = useState(null);
  // 合併時間軸：四種解釋機制沿革相接（最高法院解字→司法院院字/院解字→大法官釋字→憲法法庭憲判/裁定）。
  // 各年幾乎只落在單一機制，故一年一柱、依色帶著色；年別件數跨兩量級，y 軸取對數。大理院統字無日期，不入軸。
  const { byYear, span, y0, y1, maxTotal } = useMemo(() => {
    const m = new Map();
    for (const d of docs) {
      if (!d.日期) continue;
      const band = bandOf(d);
      if (!band) continue;
      const y = Number(d.日期.slice(0, 4));
      if (!Number.isFinite(y)) continue;
      if (!m.has(y)) m.set(y, { band, total: 0, detail: {} });
      const rec = m.get(y);
      rec.total++;
      const sub = d.系列 || (d.類型 === '解釋' ? '釋字' : d.類型);
      rec.detail[sub] = (rec.detail[sub] ?? 0) + 1;
    }
    const ys = [...m.keys()].sort((a, b) => a - b);
    const y0 = ys[0];
    const y1 = ys[ys.length - 1];
    const span = [];
    for (let y = y0; y <= y1; y++) span.push(y);
    const maxTotal = Math.max(...[...m.values()].map((v) => v.total));
    return { byYear: m, span, y0, y1, maxTotal };
  }, []);

  const W = 9;
  const H = 200;
  const PAD_L = 30;
  const PAD_T = 6;
  const PAD_B = 22;
  const chartW = span.length * W;
  // 對數 y 軸：count=1 落在略高於軸底處仍可見；每格 ×10。
  const LMIN = Math.log10(0.72);
  const LMAX = Math.log10(maxTotal) + 0.04;
  const yAt = (v) => PAD_T + H - ((Math.log10(v) - LMIN) / (LMAX - LMIN)) * H;
  const idxOf = (yr) => span.indexOf(yr);

  const cited = useMemo(() => {
    const c = new Map();
    for (const e of citeEdges) c.set(e.引, (c.get(e.引) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, []);
  const docByNo = useMemo(() => new Map(docs.map((d) => [d.字號, d])), []);

  const svgW = PAD_L + chartW + 12;
  const svgH = PAD_T + H + PAD_B;
  return (
    <div>
      <section className="border-t border-[var(--cc-line)] pt-5 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">年度密度</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">每年作成件數（{y0}–{y1}，對數刻度）</h2>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
          {BANDS.map((b) => (
            <span key={b.key} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: `var(--cat-${b.tone}-bg)`, borderColor: `var(--cat-${b.tone}-tx)` }} />
              {b.label}
            </span>
          ))}
        </div>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMinYMin meet" role="img" aria-label="每年作成件數對數長條圖" style={{ width: '100%', height: 'auto', maxWidth: svgW }}>
            {[1, 10, 100].filter((g) => g <= maxTotal).map((g) => (
              <g key={g}>
                <line x1={PAD_L} y1={yAt(g)} x2={PAD_L + chartW} y2={yAt(g)} stroke="var(--cc-line)" strokeWidth={1} />
                <text x={PAD_L - 5} y={yAt(g) + 3} textAnchor="end" fontSize={9} fill="var(--cc-axis-text)">{g}</text>
              </g>
            ))}
            {span.map((y, i) => {
              const v = byYear.get(y);
              if (!v) return null;
              const tone = BAND_TONE[v.band];
              const top = yAt(v.total);
              return (
                <g key={y} transform={`translate(${PAD_L + i * W}, 0)`}
                  onMouseEnter={() => setHover({ y, ...v })}
                  onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={PAD_T} width={W} height={H} fill="transparent" />
                  <rect x={0.75} y={top} width={W - 1.5} height={PAD_T + H - top} rx={1} fill={`var(--cat-${tone}-bg)`} stroke={`var(--cat-${tone}-tx)`} strokeWidth={0.6} opacity={hover && hover.y !== y ? 0.4 : 1} />
                  {y % 10 === 0 ? (
                    <text x={W / 2} y={PAD_T + H + 14} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{y}</text>
                  ) : null}
                </g>
              );
            })}
            {[[1949, '行憲 1947.12'], [2022, '憲訴法']].map(([yr, label]) => {
              const i = idxOf(yr);
              if (i < 0) return null;
              const x = PAD_L + i * W;
              return (
                <g key={yr}>
                  <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + H} stroke="var(--cc-type-judgment)" strokeDasharray="3 3" strokeWidth={1} />
                  <text x={x + 3} y={PAD_T + 9} fontSize={9} fill="var(--cc-type-judgment)">{label}</text>
                </g>
              );
            })}
          </svg>
          {hover ? (
            <div className="pointer-events-none absolute left-8 top-1 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{hover.y} 年</strong>　共 {hover.total} 件
              {Object.entries(hover.detail).map(([k, n]) => `　${k} ${n}`).join('')}
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          縱軸為對數刻度（每格 ×10）：統一解釋期每年上百件、釋字期每年個位到十餘件，跨兩個量級，對數軸方能同框並列。1948 年院解字止、1949 年釋字起，中間無縫接續——司法院的統一解釋轉為大法官解釋，同一釋憲脈絡的延續。大理院統字 2,011 件未載作成日期，號次雖為大致時序卻無公曆年，不入此軸（見下）。2022 年憲法訴訟法施行後，改由憲法法庭以判決、裁定行使職權；2024 年底起大法官人數不足，作成件數明顯下降。
        </p>
      </section>

      <Pre1947Supplement />

      <TopicHeatmaps />

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">引用網絡</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">被後案引用最多的解釋（官方「相關法令」欄互引統計）</h2>
        <div className="mt-3 max-w-3xl divide-y divide-[var(--cc-line)]">
          {cited.map(([no, n]) => {
            const d = docByNo.get(no);
            const why = WHY_CITED[no];
            return (
              <div key={no} className="grid items-baseline gap-2 py-2 sm:grid-cols-[130px_56px_1fr]">
                {d ? (
                  <a href={d.官方頁} target="_blank" rel="noreferrer" className="text-[13.5px] font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">{no}</a>
                ) : (
                  <span className="text-[13.5px] font-bold text-[var(--cc-ink-strong)]">{no}</span>
                )}
                <span className="text-[13px] font-bold text-[var(--cc-ink-strong)]">{n} 次</span>
                <span className="text-[12.5px] leading-relaxed text-[var(--cc-ink-soft)]">
                  {d?.爭點?.slice(0, 56) ?? ''}
                  {why ? <span className="mt-0.5 block text-[var(--cc-ink-mid)]"><strong className="text-[var(--cc-accent)]">為何常被引用</strong>　{why}</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// 行憲前補充：大理院統字無作成日期、不入上方合併時間軸，此處說明其整全性（號次連續無斷）與極簡性；
// 另以系列／時期做類型化辨識（行憲前「類型」欄一律為「解釋」，無語意主題標籤）。
function Pre1947Supplement() {
  const { seriesRows, eraRows, total } = useMemo(() => {
    const pre = docs.filter((d) => d.系列);
    // 系列（統字/院字/院解字/解字）＝行憲前的自然「類型」；時期＝北京政府/訓政/行憲。
    const tally = (key) => {
      const c = new Map();
      for (const d of pre) { const k = d[key] ?? '未標'; c.set(k, (c.get(k) ?? 0) + 1); }
      return [...c.entries()].sort((a, b) => b[1] - a[1]);
    };
    return { seriesRows: tally('系列'), eraRows: tally('時期'), total: pre.length };
  }, []);

  // 號次是等差序列，依號次分桶的密度圖必然近均勻、不含資訊，故不作圖；
  // 只報可驗證的整全性（號次連續無斷）與極簡性（主文長度中位），數字全由快照即時算出。
  const undatedStat = useMemo(() => {
    const tong = docs.filter((d) => d.系列 === '統字');
    const nums = tong.map((d) => Number(d.號次)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const lo = nums[0] ?? 0;
    const hi = nums[nums.length - 1] ?? 0;
    const present = new Set(nums);
    let missing = 0;
    for (let x = lo; x <= hi; x++) if (!present.has(x)) missing++;
    const undatedTong = tong.filter((d) => !d.日期).length;
    const lens = tong.map((d) => (d.主文 || '').length).filter((l) => l > 0).sort((a, b) => a - b);
    const median = lens.length ? lens[Math.floor(lens.length / 2)] : 0;
    return { total: tong.length, lo, hi, missing, undated: undatedTong, median };
  }, []);

  const barRow = (rows, palette) => {
    const rmax = Math.max(1, ...rows.map(([, n]) => n));
    return (
      <div className="mt-2 space-y-1.5">
        {rows.map(([label, n], i) => {
          const tone = palette(label, i);
          return (
            <div key={label} className="grid grid-cols-[84px_1fr_52px] items-center gap-2 text-[12px]">
              <span className="truncate font-bold text-[var(--cc-ink-strong)]">{label}</span>
              <span className="h-3 rounded-sm" style={{ width: `${(n / rmax) * 100}%`, minWidth: 2, background: `var(--cat-${tone}-bg)`, borderRight: `2px solid var(--cat-${tone}-tx)` }} />
              <span className="text-right text-[var(--cc-ink-soft)]">{n}</span>
            </div>
          );
        })}
      </div>
    );
  };
  const 系列TONE = { 統字: ERA_TONE.dali, 解字: ERA_TONE.zuigao, 院字: ERA_TONE.sifayuan, 院解字: 3 };

  return (
    <>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">行憲前補充 · 大理院統字（無日期，未入上軸）</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">
          統字第 <span className="text-[var(--cc-highlight)]">{undatedStat.lo}</span>–<span className="text-[var(--cc-highlight)]">{undatedStat.hi}</span> 號完整收錄，{undatedStat.missing === 0 ? '號次連續無缺' : `範圍內缺 ${undatedStat.missing} 號`}
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--cc-ink-soft)]">
          上方合併時間軸未納入大理院統字：其 <strong className="text-[var(--cc-ink-strong)]">{undatedStat.undated.toLocaleString()}</strong> 件未載作成日期，號次雖為大致時序卻無法對應公曆年，故不虛構年份上軸。就整全性而言，統字共 <strong className="text-[var(--cc-ink-strong)]">{undatedStat.total.toLocaleString()}</strong> 件、第 {undatedStat.lo}–{undatedStat.hi} 號連續無斷，等於完整收錄；這批解釋多為一句古文了結，主文長度中位約 <strong className="text-[var(--cc-ink-strong)]">{undatedStat.median}</strong> 字。號次是等差序列，依號次分桶的密度圖必然接近均勻、不含資訊，故不作圖。
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">類型化 · 依既有結構欄位</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">系列與時期分佈（共 {total.toLocaleString()} 件）</h2>
        <div className="mt-3 grid max-w-4xl gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[12px] font-bold text-[var(--cc-title-ink)]">系列（＝行憲前的解釋類型）</p>
            {barRow(seriesRows, (label) => 系列TONE[label] ?? 8)}
          </div>
          <div>
            <p className="text-[12px] font-bold text-[var(--cc-title-ink)]">時期</p>
            {barRow(eraRows, (_label, i) => [2, 5, 4, 8][i % 4])}
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          行憲前「類型」欄一律為「解釋」，此處改以系列（統字／院字／院解字／解字）與時期做類型化辨識；語意主題分類需回研究資料庫貼標後另補。
        </p>
      </section>
    </>
  );
}

// 熱圖單一色相深淺（量的編碼）：頁面主色 plum，sqrt 比例讓低值仍可辨
const heatFill = (v, max) => (v ? `hsl(338 34% ${94 - 58 * Math.sqrt(v / max)}%)` : 'var(--cc-heat-zero)');

function TopicHeatmaps() {
  const [cell, setCell] = useState(null);

  const { topics, bins, grid, maxCell } = useMemo(() => {
    const counts = new Map();
    for (const d of docs) for (const t of d.主題) counts.set(t, (counts.get(t) ?? 0) + 1);
    const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
    const years = docs.filter((d) => !d.系列).map((d) => d.日期 && Number(d.日期.slice(0, 4))).filter(Boolean);
    const b0 = Math.floor(Math.min(...years) / 5) * 5;
    const b1 = Math.floor(Math.max(...years) / 5) * 5;
    const bins = [];
    for (let b = b0; b <= b1; b += 5) bins.push(b);
    const grid = new Map();
    for (const d of docs) {
      if (!d.日期) continue;
      const b = Math.floor(Number(d.日期.slice(0, 4)) / 5) * 5;
      for (const t of d.主題) {
        const k = `${t}|${b}`;
        grid.set(k, (grid.get(k) ?? 0) + 1);
      }
    }
    return { topics, bins, grid, maxCell: Math.max(...grid.values()) };
  }, []);

  const outcomes = ['違憲', '違憲定期失效', '合憲', '非合憲性審查', '其他/待人工'];
  const { oGrid, oMax } = useMemo(() => {
    const g = new Map();
    for (const d of docs) {
      let c = d.審查結論?.結論 ?? '未分類';
      if (c === '違憲即失效') c = '違憲';
      if (c === '未分類') c = '其他/待人工';
      if (c === '法令解釋' || c === '補充前解釋' || c === '變更前解釋') c = '非合憲性審查';
      for (const t of d.主題) g.set(`${t}|${c}`, (g.get(`${t}|${c}`) ?? 0) + 1);
    }
    return { oGrid: g, oMax: Math.max(...g.values()) };
  }, []);

  const LABEL_W = 130;
  const CW = 17;
  const RH = 17;
  const H = topics.length * RH;

  return (
    <>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×年代</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">哪個年代在吵哪些問題（每 5 年一格，色深＝件數）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={LABEL_W + bins.length * CW + 12} height={H + 26} role="img" aria-label="主題與年代分布熱圖">
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + 3.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {bins.map((b, c) => (b % 10 === 0 ? (
              <text key={b} x={LABEL_W + c * CW + CW / 2} y={H + 16} textAnchor="middle" fontSize={9.5} fill="var(--cc-axis-text)">{b}</text>
            ) : null))}
            {topics.map((t, r) => bins.map((b, c) => {
              const v = grid.get(`${t}|${b}`) ?? 0;
              return (
                <rect
                  key={`${t}${b}`}
                  x={LABEL_W + c * CW} y={r * RH}
                  width={CW - 2} height={RH - 2} rx={3}
                  fill={heatFill(v, maxCell)}
                  stroke={cell?.t === t && cell?.b === b ? 'var(--cc-highlight)' : 'none'}
                  strokeWidth={1.5}
                  onMouseEnter={() => setCell({ t, b, v, kind: 'year' })}
                  onMouseLeave={() => setCell(null)}
                />
              );
            }))}
          </svg>
          {cell?.kind === 'year' ? (
            <div className="pointer-events-none absolute left-4 top-0 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{cell.t}</strong>　{cell.b}–{cell.b + 4} 年　<strong className="text-[var(--cc-accent)]">{cell.v} 件</strong>
            </div>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[var(--cc-ink-soft)]">
          少
          {[0.08, 0.25, 0.5, 0.75, 1].map((f) => (
            <span key={f} className="inline-block h-3 w-3 rounded-[3px]" style={{ background: heatFill(f * maxCell, maxCell) }} />
          ))}
          多（單格最高 {maxCell} 件）
        </div>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">主題×審查結論</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">哪些領域最常被宣告違憲（機標結論，待人工欄為尚未覆核件）</h2>
        <div className="relative mt-3 overflow-x-auto pb-2">
          <svg width={LABEL_W + outcomes.length * 74 + 12} height={H + 30} role="img" aria-label="主題與審查結論矩陣">
            {outcomes.map((o, c) => (
              <text key={o} x={LABEL_W + c * 74 + 34} y={12} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--cc-table-head-ink)">{o === '其他/待人工' ? '待人工' : o}</text>
            ))}
            {topics.map((t, r) => (
              <text key={t} x={LABEL_W - 8} y={r * RH + RH / 2 + 21.5} textAnchor="end" fontSize={10.5} fill="var(--cc-ink-mid)">{t}</text>
            ))}
            {topics.map((t, r) => outcomes.map((o, c) => {
              const v = oGrid.get(`${t}|${o}`) ?? 0;
              const dark = Math.sqrt(v / oMax) > 0.55;
              return (
                <g key={`${t}${o}`}>
                  <rect
                    x={LABEL_W + c * 74} y={r * RH + 18}
                    width={68} height={RH - 2} rx={3}
                    fill={heatFill(v, oMax)}
                    onMouseEnter={() => setCell({ t, o, v, kind: 'outcome' })}
                    onMouseLeave={() => setCell(null)}
                  />
                  {v ? (
                    <text x={LABEL_W + c * 74 + 34} y={r * RH + 18 + RH / 2 + 3} textAnchor="middle" fontSize={9.5} fill={dark ? 'var(--cc-heat-text-light)' : 'var(--cc-heat-text-dark)'} pointerEvents="none">{v}</text>
                  ) : null}
                </g>
              );
            }))}
          </svg>
          {cell?.kind === 'outcome' ? (
            <div className="pointer-events-none absolute left-4 top-0 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">
              <strong className="text-[var(--cc-ink-strong)]">{cell.t}</strong>　{cell.o}　<strong className="text-[var(--cc-accent)]">{cell.v} 件</strong>
            </div>
          ) : null}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          審查結論為文字規則機標（違憲即失效併入違憲欄；法令解釋／補充前解釋／變更前解釋併入非合憲性審查欄），僅供分布觀察；個案請以卡片上的官方連結查證原文。
        </p>
      </section>
    </>
  );
}

function JusticesView({ onOpen }) {
  const [sortKey, setSortKey] = useState('提出意見書');
  const list = useMemo(
    () => [...justices].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0)),
    [sortKey],
  );
  const max = Math.max(...justices.map((j) => j.提出意見書));

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">逐人統計</p>
          <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">大法官意見書行為（{justices.length} 位，來源：官方意見書檔名與判決欄位）</h2>
        </div>
        <Select label="排序" value={sortKey} onChange={setSortKey} options={[['提出意見書', '提出意見書數'], ['加入意見書', '加入意見書數'], ['主筆判決', '主筆判決數'], ['參與解釋', '參與解釋數'], ['參與判決', '參與裁判數']]} />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--cc-table-border)]">
        <table className="w-full min-w-[760px] border-collapse bg-white text-left text-[12.5px]">
          <thead className="bg-[var(--cc-hover-bg)] text-[var(--cc-table-head-ink)]">
            <tr>
              <th className="px-3 py-2">大法官</th>
              <th className="px-3 py-2">提出意見書</th>
              <th className="px-3 py-2 w-[180px]"></th>
              <th className="px-3 py-2">加入意見書</th>
              <th className="px-3 py-2">主筆判決</th>
              <th className="px-3 py-2">參與解釋</th>
              <th className="px-3 py-2">參與裁判</th>
              <th className="px-3 py-2">意見書類型</th>
            </tr>
          </thead>
          <tbody>
            {list.map((j) => (
              <tr key={j.姓名} className="border-t border-[var(--cc-row-border)]">
                <td className="px-3 py-2">
                  <button onClick={() => onOpen?.(j.姓名)} className="font-bold text-[var(--cc-ink-heavy)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{j.姓名}</button>
                </td>
                <td className="px-3 py-2 font-bold text-[var(--cc-accent)]">{j.提出意見書}</td>
                <td className="px-3 py-2">
                  <div className="h-1.5 rounded-full bg-[var(--cc-track)]">
                    <div className="h-1.5 rounded-full" style={{ width: `${(j.提出意見書 / max) * 100}%`, background: 'var(--cc-highlight)' }} />
                  </div>
                </td>
                <td className="px-3 py-2 text-[var(--cc-ink-mid)]">{j.加入意見書}</td>
                <td className="px-3 py-2 text-[var(--cc-ink-mid)]">{j.主筆判決 || '—'}</td>
                <td className="px-3 py-2 text-[var(--cc-ink-mid)]">{j.參與解釋 || '—'}</td>
                <td className="px-3 py-2 text-[var(--cc-ink-mid)]">{j.參與判決 || '—'}</td>
                <td className="px-3 py-2 text-[var(--cc-ink-soft)]">
                  {Object.entries(j.意見書類型 ?? {}).map(([k, v]) => `${k.replace('意見書', '')} ${v}`).join('・') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        統計基礎：{data.統計.總數} 件案件中具名的大法官意見書。參與解釋計自官方頁末尾的大法官署名列（813 件全覆蓋；
        迴避或未參與評議者不在署名列，故非任期推定）；參與裁判計自憲法法庭判決/裁定的官方合議庭名單。點姓名開個人頁。
      </p>
    </section>
  );
}

// 大法官個人頁（?tab=justices&j=姓名）：基本資料、意見書清單、參與判決、共同具名、打包匯出
function JusticeDetail({ name, onBack, onOpen }) {
  const j = justices.find((x) => x.姓名 === name);

  const opinions = useMemo(() => {
    const ops = [];
    for (const d of docs) {
      for (const op of d.意見書) {
        if (op.作者類別 !== '大法官') continue;
        const role = op.提出?.includes(name) ? '提出' : op.加入?.includes(name) ? '加入' : null;
        if (role) ops.push({ d, op, role });
      }
    }
    return ops.sort((a, b) => (b.d.日期 ?? '').localeCompare(a.d.日期 ?? ''));
  }, [name]);

  const participated = useMemo(
    () => docs.filter((d) => d.參與大法官?.includes(name)).sort((a, b) => (b.日期 ?? '').localeCompare(a.日期 ?? '')),
    [name],
  );

  const partners = useMemo(() => coSign
    .filter((e) => e.甲 === name || e.乙 === name)
    .map((e) => ({ 對象: e.甲 === name ? e.乙 : e.甲, 次數: e.次數 }))
    .sort((a, b) => b.次數 - a.次數), [name]);

  const involvedCases = useMemo(() => {
    const m = new Map();
    for (const { d } of opinions) m.set(d.字號, d);
    for (const d of participated) m.set(d.字號, d);
    return [...m.values()].sort((a, b) => (b.日期 ?? '').localeCompare(a.日期 ?? ''));
  }, [opinions, participated]);

  // 僅參與（署名列/合議庭名單有名，但無個人意見書）——以緊湊字號 chips 呈現
  const participationOnly = useMemo(() => {
    const withOpinion = new Set(opinions.map(({ d }) => d.字號));
    return participated.filter((d) => !withOpinion.has(d.字號));
  }, [opinions, participated]);

  if (!j) {
    return (
      <div className="py-8">
        <button onClick={onBack} className="text-[13px] font-bold text-[var(--cc-accent)] hover:underline">← 回大法官總覽</button>
        <p className="mt-4 text-[14px] text-[var(--cc-ink-mid)]">名冊裡查無「{name}」。</p>
      </div>
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const opinionCite = ({ d, op }) =>
    `${citeString(d).replace(/（.*?）$/, '')}${(op.提出 ?? []).join('、')}大法官${op.類型}${d.日期 ? `（${formatDate(d.日期)}）` : ''}`;
  const exportCites = () => downloadFile(
    [...opinions.map(opinionCite), ...participated.map(citeString)].join('\n'),
    `${name}_引註清單_${stamp}.txt`, 'text/plain',
  );
  const exportBib = () => downloadFile(toBibtex(involvedCases), `${name}_案件_${stamp}.bib`, 'text/plain');
  const exportManifest = () => downloadFile(JSON.stringify({
    說明: '此清單供本機批次下載使用：到資料庫 repo 執行 npm run fetch-batch -- --manifest <本檔>',
    大法官: name,
    產生時間: new Date().toISOString(),
    文件: involvedCases.map((d) => ({
      字號: d.字號,
      官方頁: d.官方頁,
      意見書: d.意見書
        .filter((op) => (op.提出?.includes(name) || op.加入?.includes(name)) && op.下載網址)
        .map((op) => ({ 文件名: op.文件名, 下載網址: op.下載網址 })),
      ...(d.立場表下載 && d.參與大法官?.includes(name) ? { 立場表: d.立場表下載 } : {}),
    })).filter((e) => e.意見書.length || e.立場表), // 僅參與而無可下載文件的案件不進下載清單
  }, null, 1), `${name}_下載清單_${stamp}.json`, 'application/json');

  const tenureText = (j.任期 ?? []).map(formatTenureRange).join('；');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cc-line)] py-4">
        <button onClick={onBack} className="text-[13px] font-bold text-[var(--cc-accent)] hover:underline">← 回大法官總覽</button>
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <span className="text-[var(--cc-eyebrow)]">打包這位大法官的全部資料：</span>
          <button onClick={exportCites} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />引註清單</button>
          <button onClick={exportBib} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />BibTeX</button>
          <button onClick={exportManifest} className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]"><Download size={11} />批次下載清單</button>
        </div>
      </div>

      <section className="py-5">
        <h2 className="text-2xl font-bold text-[var(--cc-heading)]">{j.姓名}</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-[var(--cc-ink-mid)]">
          {/* 屆次推定的任期純由屆次標籤推出，兩欄重複，只留屆次一行；
              簡歷頁/人工核定者任期有獨立資訊（多段、辭職、卒於任內、現任起日）才另列 */}
          {j.屆次?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">屆次</strong>　{j.屆次.join('、')}
              {j.任期來源 === '屆次推定' ? <span className="text-[11.5px] text-[var(--cc-figure-note)]">（任期依屆次推定）</span> : null}
            </span>
          ) : null}
          {tenureText && j.任期來源 !== '屆次推定' ? (
            <span><strong className="text-[var(--cc-accent)]">任期</strong>　{tenureText}{j.任期來源 === '人工核定' ? '（人工核定）' : ''}</span>
          ) : null}
          {j.提名總統 ? <span><strong className="text-[var(--cc-accent)]">提名</strong>　{j.提名總統}{j.提名總統標註 === '依就任日推定' ? '（推定）' : ''}</span> : null}
          {j.出身 && j.出身 !== '待確認' ? <span><strong className="text-[var(--cc-accent)]">出身</strong>　{j.出身}</span> : null}
          {j.留學國 ? <span><strong className="text-[var(--cc-accent)]">留學</strong>　{j.留學國}</span> : null}
          {j.性別 === '女' ? <span><strong className="text-[var(--cc-accent)]">性別</strong>　女</span> : null}
          {j.簡歷頁 ? (
            <a href={j.簡歷頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
              官方簡歷 <ExternalLink size={11} />
            </a>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
          {[['提出意見書', j.提出意見書], ['加入意見書', j.加入意見書], ['主筆判決', j.主筆判決], ['參與解釋', j.參與解釋 ?? 0], ['參與裁判', j.參與判決]].map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-[12px] font-bold text-[var(--cc-icon)]">{label}</span>
              <span className="font-display text-lg sm:text-xl font-bold text-[var(--cc-ink)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {involvedCases.length ? (
        <section className="border-t border-[var(--cc-line)] py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">案件參與 {involvedCases.length} 件</p>
          {opinions.length ? (
            <>
              <h3 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">
                意見書 {opinions.length} 份：{Object.entries(j.意見書類型 ?? {}).map(([k, v]) => `${k.replace('意見書', '')} ${v}`).join('・') || ''}
              </h3>
              <div className="mt-2 divide-y divide-[var(--cc-row-border)]">
                {opinions.map(({ d, op, role }, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 text-[13px]">
                    <span className="w-[104px] whitespace-nowrap text-[12px] text-[var(--cc-figure-note)]">{formatDate(d.日期)}</span>
                    <a href={d.官方頁} target="_blank" rel="noreferrer" className="w-[130px] font-bold text-[var(--cc-ink-strong)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{d.字號}</a>
                    <Badge tone={op.類型.includes('不同') ? 'red' : op.類型.includes('協同') ? 'blue' : 'slate'}>{op.類型}</Badge>
                    {role === '加入' ? <Badge tone="slate">加入</Badge> : null}
                    {d.主筆 === name ? <Badge tone="plum">主筆</Badge> : null}
                    {d.主席 === name ? <Badge tone="plum">主席</Badge> : null}
                    {op.收於抄本 ? <Badge tone="gold">收於抄本</Badge> : null}
                    {op.加入註記?.some((s) => s.startsWith(name)) ? (
                      <span className="text-[11.5px] text-[var(--cc-figure-note)]">（{op.加入註記.filter((s) => s.startsWith(name)).join('；')}）</span>
                    ) : null}
                    <span className="max-w-[400px] truncate text-[12px] text-[var(--cc-ink-soft)]">{d.爭點?.slice(0, 40)}</span>
                    {op.下載網址 ?? (op.內嵌 ? d.官方頁 : null) ? (
                      <a href={op.下載網址 ?? d.官方頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">{op.下載網址 ? 'PDF' : '官方頁'} <ExternalLink size={10} /></a>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {participationOnly.length ? (
            <div className="mt-4">
              <p className="text-[12px] font-bold text-[var(--cc-ink-soft)]">
                僅參與、無個人意見書（{participationOnly.length} 件；解釋為署名列、裁判為官方合議庭名單）
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
                {participationOnly.map((d) => (
                  <a key={d.字號} href={d.官方頁} target="_blank" rel="noreferrer" title={`${formatDate(d.日期)}　${d.爭點?.slice(0, 60) ?? ''}`}
                    className="text-[12px] text-[var(--cc-ink-mid)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">
                    {d.字號.startsWith('釋字第') ? `釋${d.字號.slice(3, -1)}` : d.字號}
                    {d.主筆 === name ? '＊' : ''}{d.主席 === name ? '†' : ''}
                  </a>
                ))}
              </div>
              {participationOnly.some((d) => d.主筆 === name || d.主席 === name) ? (
                <p className="mt-1 text-[11.5px] text-[var(--cc-figure-note)]">＊＝主筆　†＝會議主席</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {partners.length ? (
        <section className="border-t border-[var(--cc-line)] py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">共同具名對象</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {partners.map((p) => (
              <button key={p.對象} onClick={() => onOpen(p.對象)}
                className="rounded-md border border-[var(--cc-border)] bg-white px-2.5 py-1 text-[12.5px] font-bold text-[var(--cc-accent)] hover:bg-[var(--cc-hover-bg)]">
                {p.對象} × {p.次數}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <p className="border-t border-[var(--cc-line)] py-4 text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        意見書清單解析自官方附件檔名與內嵌正文；「收於抄本」表示該意見書僅收於全案合訂 PDF。參與名單皆為官方實據：
        解釋來自官方頁末尾的大法官署名列（813 件全覆蓋，迴避或未參與評議者不在列），裁判來自官方合議庭名單；
        「加入◯◯部分」等範圍限定照檔名原文附註。批次下載清單需回研究資料庫執行
        <code className="mx-1 rounded bg-[var(--cc-hover-bg)] px-1">npm run fetch-batch -- --manifest</code>下載官方 PDF。
      </p>
    </div>
  );
}

// 任期時間軸（生涯甘特圖）。124 人官方名冊＋簡歷/屆次/人工核定三層任期。
// 著色改吃全站語意色 token 的分類色 --cat-N-tx（2026-07-08，tokens.css Layer 1b）：
// 學者=cat-1 紫、法官=cat-2 藍、律師=cat-3 綠、檢察官=cat-4 金——這組 cat 色的值就是
// 站內 Badge 校準色調，明度齊一（L≈0.5）、彩度中低、色相各異（Notion tag 的和諧原理），
// 由 validate:colors 在 build 時鎖住明度帶，改色相不超出帶才過得了 build。其他／待確認
// 保持淺灰退場（不在分類色內，是「無類別」的中性退場色，故留字面值）。
const TENURE_BG_COLOR = { // token-exempt: 分類色引用 --cat-* token；退場中性用 --cc-retire-*
  學者: 'var(--cat-1-tx)', 法官: 'var(--cat-2-tx)', 律師: 'var(--cat-3-tx)', 檢察官: 'var(--cat-4-tx)', 其他: 'var(--cc-retire-tx)', 待確認: 'var(--cc-retire-tx)',
};
// 留學地分群：null 再分「國內」（逐人查核確認無外國學位）與「待確認」（查不到可靠線索）
const ABROAD_GROUP = (j) => {
  const c = j.留學國;
  if (c === '德國' || c === '奧地利' || c === '瑞士') return '德語圈';
  if (c === '美國' || c === '英國') return '英美';
  if (c === '日本') return '日本';
  if (c) return '其他';
  return (j.留學國來源 ?? '').includes('查核') ? '國內' : '待確認';
};
// 與 TENURE_BG_COLOR 共用同一組分類色（--cat-1..4），維持兩種著色模式視覺一致
const TENURE_ABROAD_COLOR = { // token-exempt: 分類色引用 --cat-* token；退場中性用 --cc-retire-*
  德語圈: 'var(--cat-1-tx)', 英美: 'var(--cat-2-tx)', 日本: 'var(--cat-3-tx)', 其他: 'var(--cat-4-tx)', 國內: 'var(--cc-retire-tx)', 待確認: 'var(--cc-retire-tx)',
};
// 提名總統著色。2026-07-08 改吃全站語意色 token 的分類色 --cat-1..8：原本這 8 色
// 是另外硬配的一組，彩度普遍偏高（李登輝鮮綠 C0.13、馬英九鮮藍、
// 蔣中正/蔣經國/蔡英文皆 C>0.14），跟站內莫蘭迪低彩度基調格格不入——這就是使用者看到
// 的「按提名總統」那組刺眼配色。改用校準過的 --cat-* 分類色後，與出身/留學著色同一套
// 和諧色系，且由 validate:colors 鎖住明度/彩度帶。8 位主要總統配 cat-1..8（其中 cat-8
// 為 slate，給任內提名最少的李宗仁代總統），賴清德任期尚短、沿用淺灰退場不特別配色。
const PRES_COLOR = { // token-exempt: 分類色引用 --cat-* token；退場中性用 --cc-retire-*
  蔣中正: 'var(--cat-1-tx)', '李宗仁（代）': 'var(--cat-8-tx)', 嚴家淦: 'var(--cat-4-tx)', 蔣經國: 'var(--cat-6-tx)',
  李登輝: 'var(--cat-3-tx)', 陳水扁: 'var(--cat-2-tx)', 馬英九: 'var(--cat-7-tx)', 蔡英文: 'var(--cat-5-tx)', 賴清德: 'var(--cc-retire-tx)',
};
// 大條橫條一律「淡底＋ink 細框」：深墨 ink 只留給邊框與圖例點，大面積填近白淡底。
// 由任一 ink token（--cat-N-tx／--cc-retire-tx）機械導出同色相的近白底（把 -tx 換成 -bg），大條吃淡底。
const inkToFill = (v) => (v && v.includes('-tx)') ? v.replace('-tx)', '-bg)') : 'var(--cc-track)');
// 各總統提名大法官人數（鍵與 presidents[].總統／PRES_COLOR 同一套字串，含「（代）」）
const PRES_NOM_COUNT = justices.reduce((m, j) => {
  if (j.提名總統) m.set(j.提名總統, (m.get(j.提名總統) ?? 0) + 1);
  return m;
}, new Map());

function tenureYear(s, isEnd) {
  if (!s) return null;
  const str = String(s);
  const y = Number(str.slice(0, 4));
  const m = str.length >= 7 ? Number(str.slice(5, 7)) : (isEnd ? 12 : 1);
  return y + (m - 0.5) / 12;
}

// 合併同一人相接／重疊的任期段。連任（第 N 屆→第 N+1 屆）在「只到年」的精度下，會因 tenureYear
// 把起點寄到 1 月、訖點寄到 12 月，於交界年重疊約 0.9 年——這是解析造成的假重疊，非真的同時任兩職。
// 相隔在容差內就併成一條連續橫條；真正離任多年後再回任（間隔逾容差）才保留為分段。openEnd＝現任的畫圖終點。
function tenureSpans(tenures, openEnd) {
  const segs = (tenures ?? [])
    .map((t) => ({ a: tenureYear(t.起, false), b: t.訖 ? tenureYear(t.訖, true) : openEnd, open: !t.訖 }))
    .filter((s) => s.a != null)
    .sort((p, q) => p.a - q.a);
  const out = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && s.a <= last.b + 0.3) { // 0.3 年容差：吸收年精度交界重疊與數月行政空檔，不併真正的多年中斷
      if (s.b > last.b) { last.b = s.b; last.open = s.open; }
    } else out.push({ ...s });
  }
  return out;
}

// 起訖範圍的 en dash 兩側加空格，跟日期本身的 "-" 分隔開，避免視覺上分不清哪個是範圍分隔符
function formatTenureRange(t) {
  const role = t.職 !== '大法官' ? `${t.職} ` : '';
  return `${role}${formatDateRange(t.起, t.訖)}`;
}

function TenureView({ onOpen }) {
  const [colorBy, setColorBy] = useState('出身');
  const [onlyAuthors, setOnlyAuthors] = useState(false);
  const [hover, setHover] = useState(null);
  const [asc, setAsc] = useState(true); // true＝最早在上（由上而下遞增），false＝最新在上

  const rows = useMemo(() => {
    const dir = asc ? 1 : -1;
    const list = justices
      .filter((j) => j.任期?.length)
      .map((j) => ({ ...j, start: tenureYear(j.任期[0].起, false) }))
      .sort((a, b) => dir * (a.start - b.start) || dir * a.姓名.localeCompare(b.姓名));
    return onlyAuthors ? list.filter((j) => j.提出意見書 + j.加入意見書 > 0) : list;
  }, [onlyAuthors, asc]);

  const Y0 = 1948, Y1 = 2027;
  const ROW = 14, LABEL = 62, CHART = 830, COUNT = 52;
  const H = rows.length * ROW;
  const x = (yr) => LABEL + ((yr - Y0) / (Y1 - Y0)) * CHART;
  const maxOps = Math.max(...justices.map((j) => j.提出意見書 + j.加入意見書), 1);
  const colorOf = (j) => (colorBy === '出身'
    ? TENURE_BG_COLOR[j.出身] ?? TENURE_BG_COLOR.待確認
    : colorBy === '提名總統'
      ? PRES_COLOR[j.提名總統] ?? TENURE_BG_COLOR.待確認
      : TENURE_ABROAD_COLOR[ABROAD_GROUP(j)]);
  const fillOf = (j) => inkToFill(colorOf(j)); // 大條吃淡底，色相辨識交給 colorOf 的 ink 細框與圖例
  // 「待確認」畫空心條（描邊無填滿）：留學地模式與「國內」灰實心區分，出身模式與「其他」（查核後四類皆非）區分
  const isHollow = (j) => (colorBy === '留學國' && ABROAD_GROUP(j) === '待確認')
    || (colorBy === '出身' && j.出身 === '待確認');
  const legend = colorBy === '出身' ? TENURE_BG_COLOR : colorBy === '提名總統' ? PRES_COLOR : TENURE_ABROAD_COLOR;

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">制度 77 年</p>
          <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">歷任大法官任期時間軸（{rows.length} 人）</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select label="著色" value={colorBy} onChange={setColorBy} options={[['出身', '按出身'], ['留學國', '按留學地'], ['提名總統', '按提名總統']]} />
          <button
            onClick={() => setAsc((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--cc-border)] px-2 py-1 text-[12px] font-bold text-[var(--cc-ink-soft)] hover:text-[var(--cc-accent)]"
          >
            <ArrowUpDown size={11} />{asc ? '最早在上' : '最新在上'}
          </button>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--cc-ink-soft)]">
            <input type="checkbox" checked={onlyAuthors} onChange={(e) => setOnlyAuthors(e.target.checked)} />
            僅顯示有具名意見書者
          </label>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
        {Object.entries(legend).map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            {k === '待確認' && colorBy !== '提名總統'
              ? <span className="h-2.5 w-2.5 rounded-sm border border-dashed" style={{ borderColor: c }} />
              : <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: inkToFill(c), borderColor: c }} />}
            {k}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <svg width={11} height={11} aria-hidden>
            <rect width={11} height={11} rx={2} fill="var(--cc-dim-text)" />
            <path d="M-2 5 l8 -8 M0 13 l13 -13 M6 13 l8 -8" stroke="var(--cc-bg)" strokeWidth={1.6} />
          </svg>
          斜紋＝女性大法官
        </span>
        <span className="ml-2">右欄細條＝具名意見書數；底色帶＝總統任期</span>
      </div>

      {/* 圖已攤開全高，資訊列 sticky 貼在頁面導覽下緣，滾到圖底仍看得到 */}
      <div className="sticky top-[49px] z-10 mt-2 rounded-md border border-[var(--cc-border)] bg-[var(--cc-bg)]/95 px-3 py-1.5 text-[12.5px] backdrop-blur">
        {hover ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-[var(--cc-ink-strong)]">
            <strong>{hover.姓名}</strong>
            <span>{hover.任期.map(formatTenureRange).join('；')}</span>
            <span><span className="text-[var(--cc-ink-soft)]">出身</span> {hover.出身}</span>
            <span><span className="text-[var(--cc-ink-soft)]">留學</span> {hover.留學國 ?? ((hover.留學國來源 ?? '').includes('查核') ? '無（國內）' : '待確認')}</span>
            {hover.提名總統 ? <span><span className="text-[var(--cc-ink-soft)]">提名</span> {hover.提名總統}</span> : null}
            {hover.性別 === '女' ? <span><span className="text-[var(--cc-ink-soft)]">性別</span> 女</span> : null}
            {hover.提出意見書 + hover.加入意見書 > 0
              ? <span><span className="text-[var(--cc-ink-soft)]">意見書</span> 提出 {hover.提出意見書}／加入 {hover.加入意見書}</span>
              : null}
            {hover.任期來源 !== '簡歷頁' ? <span className="text-[var(--cc-ink-soft)]">（任期{hover.任期來源}）</span> : null}
          </div>
        ) : (
          <span className="text-[var(--cc-ink-soft)]">游標移到列上看任期細節；點姓名開個人頁（意見書清單、參與裁判與打包下載）。</span>
        )}
      </div>

      <div className="mt-1 overflow-x-auto">
        <div style={{ width: LABEL + CHART + COUNT + 10 }}>
          <svg width={LABEL + CHART + COUNT + 10} height={H + 50} role="img" aria-label="歷任大法官任期甘特圖">
            <defs>
              {/* 女性大法官的 45° 斜紋覆層：紙色細線疊在任何 bar 色上都可辨（非僅顏色編碼） */}
              <pattern id="tenure-hatch-f" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1={0} y1={0} x2={0} y2={4} stroke="var(--cc-bg)" strokeWidth={1.6} />
              </pattern>
            </defs>
            {/* 總統任期背景直帶（交錯淡染＋帶頂總統名） */}
            {presidents.map((p, i) => {
              const a = Math.max(tenureYear(p.起, false), Y0);
              const b = Math.min(p.訖 === '9999-12-31' ? Y1 : tenureYear(p.訖, true), Y1);
              if (b <= Y0 || a >= Y1) return null;
              const w = x(b) - x(a);
              return (
                <g key={`${p.總統}${p.起}`}>
                  {i % 2 ? <rect x={x(a)} y={18} width={w} height={H + 2} fill="var(--cc-hover-bg)" opacity={0.55} /> : null}
                  {w >= 26 ? (
                    <text x={x(a) + w / 2} y={H + 46} textAnchor="middle" fontSize={8.5} fill="var(--cc-eyebrow)">
                      {p.總統.replace('（代）', '')}
                      {w >= 60 && PRES_NOM_COUNT.get(p.總統) ? `（提名 ${PRES_NOM_COUNT.get(p.總統)} 位）` : ''}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {/* 十年格線 */}
            {Array.from({ length: 8 }, (_, i) => 1950 + i * 10).map((yr) => (
              <g key={yr}>
                <line x1={x(yr)} y1={18} x2={x(yr)} y2={H + 20} stroke="var(--cc-line)" strokeWidth={1} />
                <text x={x(yr)} y={12} textAnchor="middle" fontSize={10} fill="var(--cc-axis-text)">{yr}</text>
                {/* 全圖攤開後頂軸會滾出視野，底部重標一次年份 */}
                <text x={x(yr)} y={H + 33} textAnchor="middle" fontSize={10} fill="var(--cc-axis-text)">{yr}</text>
              </g>
            ))}
            {/* 憲訴法施行 */}
            <line x1={x(2022)} y1={18} x2={x(2022)} y2={H + 20} stroke="var(--cc-type-judgment)" strokeDasharray="3 3" strokeWidth={1} />
            <text x={x(2022) + 3} y={12} fontSize={9} fill="var(--cc-type-judgment)">憲訴法</text>

            {rows.map((j, i) => {
              const y = 20 + i * ROW;
              const dim = hover && hover.姓名 !== j.姓名;
              const ops = j.提出意見書 + j.加入意見書;
              return (
                <g key={j.姓名}
                  onMouseEnter={() => setHover(j)} onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={y} width={LABEL + CHART + COUNT} height={ROW} fill={hover?.姓名 === j.姓名 ? 'var(--cc-hover-bg)' : 'transparent'} />
                  <text x={LABEL - 6} y={y + ROW / 2 + 3.5} textAnchor="end" fontSize={10.5}
                    fontWeight={hover?.姓名 === j.姓名 ? 700 : 500}
                    fill={dim ? 'var(--cc-dim-text)' : 'var(--cc-ink-strong)'} className="cursor-pointer"
                    onClick={() => onOpen?.(j.姓名)}>
                    {j.姓名}
                  </text>
                  {tenureSpans(j.任期, Y1 - 0.4).map((s, k) => {
                    const w = Math.max(x(s.b) - x(s.a), 2.5);
                    return (
                      <g key={k}>
                        <rect x={x(s.a)} y={y + 3} width={w} height={ROW - 6} rx={2}
                          fill={isHollow(j) ? 'var(--cc-bg)' : fillOf(j)}
                          stroke={colorOf(j)} strokeWidth={1}
                          strokeDasharray={isHollow(j) || s.open ? '3 2' : undefined}
                          opacity={dim ? 0.3 : 1} />
                        {j.性別 === '女' && !isHollow(j) ? (
                          <rect x={x(s.a)} y={y + 3} width={w} height={ROW - 6} rx={2}
                            fill="url(#tenure-hatch-f)" opacity={dim ? 0.3 : 1} />
                        ) : null}
                      </g>
                    );
                  })}
                  {ops > 0 ? (
                    <rect x={LABEL + CHART + 6} y={y + 4.5}
                      width={Math.max((ops / maxOps) * (COUNT - 8), 1.5)} height={ROW - 9} rx={1.5}
                      fill="var(--cc-highlight)" opacity={dim ? 0.25 : 0.85} />
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="mt-2 max-w-4xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        任期資料三層來源：官方個人簡歷（48 人，精確到月日，含早逝、辭職與連任）、官方屆次區間（其餘多數）、
        逐人查核後的人工核定（現任八人與翁岳生、城仲模等特殊任期）。橫條一律淡底＋同色細邊框；虛線邊框＝現任（任期未封口）。
        出身與留學地由官方經歷、官職資料庫與維基百科條目逐人查核標註；「國內」「其他」（灰底實線框）＝查核後確認
        （無外國學位／非學者法官律師檢察官四類的行政文官），「待確認」（無色底虛線框）＝尚查不到可靠線索。
        提名總統依各段任期起始日反查總統任期推定（人工核定者除外）；性別由維基條目語彙機標（女 14 人），
        無條目的 20 人（多為第一、二屆與部分現任）尚待人工補注，圖上暫不標。
      </p>
    </section>
  );
}

// ── 意見書圖譜：分期共同具名矩陣 ───────────────────────────────────────────
// 全部現算自 docs[].意見書，對缺漏免疫（意見書資料仍在增補）。色彩全走 token：量值以
// color-mix 在校準過的 --tone-*-bg（近白淡底）↔ --tone-*-tx（墨色）之間插值，不寫死任何 hex；
// 量值靠色深、身分/狀態靠形狀與細框（見 docs/DESIGN.md 色彩哲學 2026-07-08 裁定）。
const GRAPH_ERAS = [
  { key: 'xianfa', label: '2022– 憲法法庭', short: '憲法法庭', test: (y) => y >= 2022 },
  { key: 'late', label: '2015–2021 釋字晚期', short: '釋字晚期', test: (y) => y >= 2015 && y < 2022 },
  { key: 'reform', label: '2003–2014 改制後', short: '改制後', test: (y) => y >= 2003 && y < 2015 },
  { key: 'early', label: '2003 前 釋字早中', short: '早中期', test: (y) => y < 2003 },
];
const GRAPH_MODES = [
  ['合計', '合計共同具名'],
  ['協同', '協同聯盟'],
  ['不同', '不同聯盟'],
  ['有向', '主筆→加入（有向）'],
];
// 四模式各給一個清楚可辨的校準色調（tokens.css Layer 0），並對齊 Badge 語意：
// 合計＝slate 中性、協同＝blue、不同＝red（與 Badge 同）、有向＝teal（與前三者拉開色相）。
const MODE_TONE = { 合計: 'slate', 協同: 'blue', 不同: 'red', 有向: 'teal' };
const SEP = ' ';
const pairKey = (a, b) => (a < b ? `${a}${SEP}${b}` : `${b}${SEP}${a}`);

// 量值→填色：同色相 --tone-*-bg ↔ -tx 之間 color-mix，全 token、零硬寫色；v=0 用中性極淡底。
const rampFill = (v, max, tone) =>
  v > 0 && max > 0
    ? `color-mix(in oklab, var(--tone-${tone}-tx) ${Math.round(Math.sqrt(v / max) * 100)}%, var(--tone-${tone}-bg))`
    : 'var(--cc-heat-zero)';

// spectral seriation：以扣掉常數分量的 power iteration 逼近 Fiedler 向量，讓高權重對相鄰、聯盟沿對角線成塊。
function seriateOrder(n, weight) {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (n < 3) return idx;
  const w = idx.map((i) => idx.map((j) => (i === j ? 0 : weight(i, j))));
  const deg = w.map((row) => row.reduce((a, b) => a + b, 0));
  const maxDeg = Math.max(1, ...deg);
  const mean = (x) => x.reduce((a, b) => a + b, 0) / x.length;
  const unit = (x) => { const m = Math.sqrt(x.reduce((a, b) => a + b * b, 0)) || 1; return x.map((e) => e / m); };
  let v = idx.map((i) => { const s = Math.sin((i + 1) * 12.9898) * 43758.5453; return s - Math.floor(s); });
  v = unit(v.map((x) => x - mean(v)));
  for (let it = 0; it < 120; it++) {
    const nv = idx.map((i) => {
      let s = (maxDeg - deg[i]) * v[i];            // B = maxDeg·I − Laplacian
      for (let j = 0; j < n; j++) if (j !== i) s += w[i][j] * v[j];
      return s;
    });
    v = unit(nv.map((x) => x - mean(nv)));         // 扣掉常數分量 → 收斂到第二特徵向量
  }
  return idx.sort((a, b) => v[a] - v[b]);
}

// 右欄：預設 top 組合排行
function TopPairs({ list, mode, onPick }) {
  const label = mode === '有向' ? '最多加入的組合（加入者→提出者）' : `最常一起${mode === '合計' ? '共同具名' : mode}的組合`;
  const max = list[0]?.v ?? 1;
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">{label}</h3>
      <div className="mt-2 divide-y divide-[var(--cc-line)]">
        {list.map((e) => (
          <button key={`${e.a}-${e.b}`} onClick={() => onPick(e.a, e.b)}
            className="grid w-full grid-cols-[1fr_44px_84px] items-center gap-2 py-1.5 text-left text-[13px] hover:bg-[var(--cc-hover-bg)]">
            <span className="font-bold text-[var(--cc-ink-strong)]">{mode === '有向' ? `${e.b}→${e.a}` : `${e.a}・${e.b}`}</span>
            <span className="font-bold text-[var(--cc-accent)]">{e.v} 次</span>
            <span className="block h-1.5 rounded-full bg-[var(--cc-track)]">
              <span className="block h-1.5 rounded-full" style={{ width: `${(e.v / max) * 100}%`, background: 'var(--cc-highlight)' }} />
            </span>
          </button>
        ))}
        {!list.length ? <p className="py-2 text-[13px] text-[var(--cc-ink-soft)]">本期無資料。</p> : null}
      </div>
    </div>
  );
}

// 右欄：選定大法官 → 夥伴協同/不同雙色拆分
function NameDetail({ name, partners, onName }) {
  const max = Math.max(1, ...partners.map((p) => p.合計));
  return (
    <div>
      <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">{name}　本期共同具名對象</h3>
      <div className="mt-2 divide-y divide-[var(--cc-line)]">
        {partners.map((p) => (
          <button key={p.對象} onClick={() => onName(p.對象)}
            className="grid w-full grid-cols-[68px_1fr] items-center gap-2 py-1.5 text-left text-[13px] hover:bg-[var(--cc-hover-bg)]">
            <span className="font-bold text-[var(--cc-accent)]">{p.對象}</span>
            <span className="flex items-center gap-2">
              <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-[var(--cc-track)]">
                <span className="h-2" style={{ width: `${(p.協同 / max) * 100}%`, background: 'var(--tone-blue-tx)' }} />
                <span className="h-2" style={{ width: `${(p.不同 / max) * 100}%`, background: 'var(--tone-red-tx)' }} />
              </span>
              <span className="shrink-0 text-[11.5px] text-[var(--cc-ink-soft)]">協{p.協同}・不{p.不同}</span>
            </span>
          </button>
        ))}
        {!partners.length ? <p className="py-2 text-[13px] text-[var(--cc-ink-soft)]">本期無共同具名。</p> : null}
      </div>
    </div>
  );
}

// 右欄：點格子 → 該對實際共同署名的意見書（含類型 Badge 與 PDF）
function PairDetail({ pair, list, onClose }) {
  const toneOf = (t) => (t.includes('不同') ? 'red' : t.includes('協同') ? 'blue' : 'slate');
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-[var(--cc-title-ink)]">{pair.a}・{pair.b}　共同署名 {list.length} 份</h3>
        <button onClick={onClose} className="shrink-0 text-[12px] font-bold text-[var(--cc-accent)] hover:underline">清除</button>
      </div>
      <div className="mt-2 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
        {list.map((d, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-[13px]">
            <CaseRef 字號={d.字號} className="font-bold text-[var(--cc-ink-strong)]" />
            <Badge tone={toneOf(d.類型 ?? '')}>{(d.類型 ?? '意見書').replace('意見書', '') || '意見書'}</Badge>
            {d.下載網址 ? (
              <a href={d.下載網址} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]">PDF <ExternalLink size={11} /></a>
            ) : <span className="text-[11.5px] text-[var(--cc-figure-note)]">（內嵌官方頁）</span>}
          </div>
        ))}
        {!list.length ? <p className="py-2 text-[13px] text-[var(--cc-ink-soft)]">無可列意見書。</p> : null}
      </div>
    </div>
  );
}

// 可重現的偽亂數（置換檢定用）：同一資料每次載入 p 值穩定，資料變則跟著變。
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 立場表真投票分析（scratchpad 端到端解析 56 判決立場表；暫用預算結果，待寫回資料層底層）。
// 平均同意率＝共投≥8 次的對其同意率平均；同質性附置換檢定；理想點＝古典 MDS on 1−同意率（符號任意）。
const LCT_RESULT = {
  判決數: 56, rollCalls: 182, 爭議: 90, 法官數: 19, 重複旗標: 14, 平均同意率: 0.832,
  同質性: [
    { 維度: '提名總統', 同組: 0.840, 跨組: 0.793, 差: 0.047, p: 0.053 },
    { 維度: '出身', 同組: 0.833, 跨組: 0.818, 差: 0.015, p: 0.227 },
    { 維度: '德語圈留學', 同組: 0.799, 跨組: 0.847, 差: -0.048, p: 0.968 },
  ],
  提名總統均值: { 蔡英文: { mean: -0.069, n: 14 }, 馬英九: { mean: 0.237, n: 4 }, 陳水扁: { mean: 0.013, n: 1 } },
  理想點: [
    { 姓名: '陳忠五', x: -0.234, 提名總統: '蔡英文' }, { 姓名: '朱富美', x: -0.221, 提名總統: '蔡英文' },
    { 姓名: '尤伯祥', x: -0.214, 提名總統: '蔡英文' }, { 姓名: '蔡彩貞', x: -0.200, 提名總統: '蔡英文' },
    { 姓名: '謝銘洋', x: -0.058, 提名總統: '蔡英文' }, { 姓名: '黃昭元', x: -0.048, 提名總統: '蔡英文' },
    { 姓名: '楊惠欽', x: -0.045, 提名總統: '蔡英文' }, { 姓名: '蔡宗珍', x: -0.010, 提名總統: '蔡英文' },
    { 姓名: '呂太郎', x: -0.008, 提名總統: '蔡英文' }, { 姓名: '張瓊文', x: -0.007, 提名總統: '蔡英文' },
    { 姓名: '許志雄', x: 0.000, 提名總統: '蔡英文' }, { 姓名: '蔡烱燉', x: 0.012, 提名總統: '蔡英文' },
    { 姓名: '許宗力', x: 0.013, 提名總統: '陳水扁' }, { 姓名: '詹森林', x: 0.016, 提名總統: '蔡英文' },
    { 姓名: '黃瑞明', x: 0.054, 提名總統: '蔡英文' }, { 姓名: '林俊益', x: 0.210, 提名總統: '馬英九' },
    { 姓名: '吳陳鐶', x: 0.244, 提名總統: '馬英九' }, { 姓名: '蔡明誠', x: 0.248, 提名總統: '馬英九' },
    { 姓名: '黃虹霞', x: 0.248, 提名總統: '馬英九' },
  ],
};

// 意見書覆蓋（逐時期）：哪些時期、哪些號沒有大法官意見書。讀資料層稽核鍵 data.意見書覆蓋
// （audit-opinion-coverage.mjs 產，含官方原始頁漏抓交叉核對）；點時期展開該期無意見書字號。
// 意見書色帶：一直條＝一號，色深＝該號大法官意見書份數（沿用矩陣的 heatFill 熱度標，0＝heat-zero）。
function HeatStrip({ id, rows, maxN, marks, ticks, label, sub, hov, setHov }) {
  const slices = useMemo(
    () => rows.map((d) => <span key={d.字號} className="block h-full flex-1" style={{ background: heatFill(d.c, maxN) }} />),
    [rows, maxN],
  );
  const a = hov?.id === id ? hov : null;
  return (
    <div className="mt-2.5">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{label}</p>
        <p className="text-[11px] text-[var(--cc-ink-soft)]">{sub}</p>
      </div>
      {marks?.length ? (
        <div className="relative mt-1 h-3 max-w-2xl">
          {marks.map((m) => <span key={m.label} className="absolute top-0 -translate-x-1/2 text-[9.5px] text-[var(--cc-ink-soft)]" style={{ left: `${m.frac * 100}%` }}>{m.label}</span>)}
        </div>
      ) : null}
      <div
        className="relative h-7 max-w-2xl cursor-crosshair overflow-hidden rounded-md border border-[var(--cc-line)]"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(rows.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * rows.length))); setHov({ id, left: e.clientX - r.left, ...rows[i] }); }}
        onMouseLeave={() => setHov(null)}
      >
        <div className="flex h-full w-full">{slices}</div>
        {marks?.map((m) => <span key={m.label} className="pointer-events-none absolute inset-y-0 w-px" style={{ left: `${m.frac * 100}%`, background: 'var(--cc-bg)', opacity: 0.65 }} />)}
        {a ? (
          <div className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-[var(--cc-line)] bg-[var(--cc-bg)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--cc-ink-strong)] shadow-sm" style={{ left: `${a.left}px` }}>
            {a.字號}・{a.c ? `${a.c} 份意見書` : '無'}
          </div>
        ) : null}
      </div>
      {ticks?.length ? (
        <div className="relative mt-0.5 h-3 max-w-2xl">
          {ticks.map((t) => <span key={t.label} className="absolute top-0 -translate-x-1/2 text-[9.5px] text-[var(--cc-ink-soft)]" style={{ left: `${t.frac * 100}%` }}>{t.label}</span>)}
        </div>
      ) : null}
    </div>
  );
}

// 意見書覆蓋（逐號熱條）：重點在「哪些號有幾份意見書」，色深即分別意見多寡；空白＝無。
// 現算自 docs（意見書 array 已排除待人工）；核對數字取資料層稽核鍵 data.意見書覆蓋。
function OpinionCoverage() {
  const cov = data.意見書覆蓋;
  const g = useMemo(() => {
    const yr = (s) => (s ? Number(String(s).slice(0, 4)) : null);
    const num = (z) => Number((String(z).match(/第(\d+)號/) ?? [])[1] ?? 0);
    const mk = (機關, 類型) => docs.filter((x) => x.機關 === 機關 && (!類型 || x.類型 === 類型))
      .map((x) => ({ 字號: x.字號, n: num(x.字號), c: (x.意見書 ?? []).length, y: yr(x.日期) }))
      .sort((p, q) => p.n - q.n);
    const s = mk('大法官'); const x = mk('憲法法庭', '判決');
    const maxN = Math.max(1, ...s.map((d) => d.c), ...x.map((d) => d.c));
    const marks = [[1991, '1991'], [2003, '2003'], [2015, '2015']]
      .map(([y, label]) => { const i = s.findIndex((d) => d.y && d.y >= y); return i > 0 ? { frac: i / s.length, label } : null; }).filter(Boolean);
    const ticksS = [1, 200, 400, 600, 800].map((n) => { const i = s.findIndex((d) => d.n >= n); return i < 0 ? null : { frac: (i + 0.5) / s.length, label: n === 1 ? '釋1' : String(n) }; }).filter(Boolean);
    const ticksX = [1, 20, 40].map((n) => { const i = x.findIndex((d) => d.n >= n); return i < 0 ? null : { frac: (i + 0.5) / Math.max(1, x.length), label: n === 1 ? '憲判1' : String(n) }; }).filter(Boolean);
    return { s, x, maxN, marks, ticksS, ticksX, cS: s.filter((d) => d.c > 0).length, cX: x.filter((d) => d.c > 0).length };
  }, []);
  const [hov, setHov] = useState(null);
  if (!g.s.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">證據一補充 · 意見書覆蓋</p>
      <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">每號的意見書數（顏色越深＝分別意見越多）</h3>
      <HeatStrip
        id="shih" rows={g.s} maxN={g.maxN} marks={g.marks} ticks={g.ticksS} hov={hov} setHov={setHov}
        label={`釋字 1–${g.s[g.s.length - 1].n} 號`} sub={`${g.cS}/${g.s.length} 有意見書`}
      />
      <HeatStrip
        id="xian" rows={g.x} maxN={g.maxN} ticks={g.ticksX} hov={hov} setHov={setHov}
        label="憲法法庭 2022–（憲判）" sub={`${g.cX}/${g.x.length} 有意見書`}
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--cc-ink-soft)]">
        <span>意見書數</span>
        <span className="inline-block h-3 w-3 rounded-[3px] border border-[var(--cc-line)]" style={{ background: heatFill(0, g.maxN) }} />
        <span>無</span>
        {[1, 3, 5, g.maxN].map((v) => <span key={v} className="inline-block h-3 w-3 rounded-[3px]" style={{ background: heatFill(v, g.maxN) }} />)}
        <span>{g.maxN}+ 份</span>
      </div>
      <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[var(--cc-figure-note)]">
        每一直條為一號，色深＝該號大法官意見書份數，空白＝無（早期居多）。滑過看號次與份數。覆蓋隨年代上升，晚期與憲法法庭近全覆蓋。空白已對官方原始頁逐件交叉核對（{cov?.核對?.已核對0紀錄件 ?? 345} 件，疑漏抓 {cov?.核對?.疑漏抓 ?? 0}）＝非漏抓；核對限官方數位記錄，紙本未稽核為<strong className="text-[var(--cc-ink-strong)]">下限</strong>。
      </p>
    </div>
  );
}

// 問題意識（仿財政頁 Research Problem＋Model Gate 紀律）：分殊化＝審議專業化 vs 任命政治化。
// 全部統計現算自 docs/justices（運維導向，資料一增補即更新）；共同具名同質性附置換檢定。
function ResearchProblem() {
  const stats = useMemo(() => {
    const post = docs.filter((x) => x.機關 === '大法官' || x.機關 === '憲法法庭');
    const yr = (s) => (s ? Number(String(s).slice(0, 4)) : null);
    const bins = [
      ['1949–1990', (y) => y <= 1990], ['1991–2002', (y) => y >= 1991 && y <= 2002],
      ['2003–2014', (y) => y >= 2003 && y <= 2014], ['2015–2021', (y) => y >= 2015 && y <= 2021],
      ['2022–', (y) => y >= 2022],
    ];
    const trend = bins.map(([lab, t]) => {
      let n = 0, dis = 0, sum = 0;
      for (const x of post) {
        const y = yr(x.日期); if (y == null || !t(y)) continue;
        n++; const ops = x.意見書 ?? [];
        if (ops.some((o) => (o.類型 ?? '').includes('不同'))) dis++;
        sum += ops.length;
      }
      return { lab, n, disPct: n ? dis / n : 0, avg: n ? sum / n : 0 };
    });
    const pk = (a, b) => (a < b ? `${a}${SEP}${b}` : `${b}${SEP}${a}`);
    const pair = new Map();
    for (const x of post) {
      const y = yr(x.日期); if (y == null || y < 2022) continue;
      for (const o of x.意見書 ?? []) {
        const s = [...new Set([...(o.提出 ?? []), ...(o.加入 ?? [])])];
        for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) pair.set(pk(s[i], s[j]), (pair.get(pk(s[i], s[j])) ?? 0) + 1);
      }
    }
    const names = [...new Set([].concat(...[...pair.keys()].map((k) => k.split(SEP))))];
    const jb = new Map(justices.map((j) => [j.姓名, j]));
    const deu = (v) => (v == null ? null : (['德國', '德語圈', '奧地利', '瑞士'].includes(v) ? '德語圈' : '其他/國內'));
    const groupers = [
      ['提名總統', (nm) => jb.get(nm)?.提名總統 ?? null],
      ['出身', (nm) => jb.get(nm)?.出身 ?? null],
      ['德語圈留學', (nm) => deu(jb.get(nm)?.留學國)],
    ];
    const gap = (g) => {
      let ws = 0, wsN = 0, wc = 0, wcN = 0;
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        const va = g(names[i]), vb = g(names[j]); if (va == null || vb == null) continue;
        const w = pair.get(pk(names[i], names[j])) ?? 0;
        if (va === vb) { ws += w; wsN++; } else { wc += w; wcN++; }
      }
      return { same: wsN ? ws / wsN : 0, diff: wcN ? wc / wcN : 0, gap: (wsN ? ws / wsN : 0) - (wcN ? wc / wcN : 0) };
    };
    const rng = mulberry32(20260708);
    const permP = (g, obs, B = 2000) => {
      const vals = names.map(g); let ge = 0;
      for (let b = 0; b < B; b++) {
        const p = vals.slice();
        for (let k = p.length - 1; k > 0; k--) { const r = Math.floor(rng() * (k + 1)); [p[k], p[r]] = [p[r], p[k]]; }
        const m = new Map(names.map((nm, i) => [nm, p[i]]));
        let ws = 0, wsN = 0, wc = 0, wcN = 0;
        for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
          const va = m.get(names[i]), vb = m.get(names[j]); if (va == null || vb == null) continue;
          const w = pair.get(pk(names[i], names[j])) ?? 0;
          if (va === vb) { ws += w; wsN++; } else { wc += w; wcN++; }
        }
        if (((wsN ? ws / wsN : 0) - (wcN ? wc / wcN : 0)) >= obs) ge++;
      }
      return (ge + 1) / (B + 1);
    };
    const assortRows = groupers.map(([lab, g]) => { const a = gap(g); return { lab, ...a, p: permP(g, a.gap) }; });
    const presCount = {};
    for (const nm of names) { const v = jb.get(nm)?.提名總統 ?? '—'; presCount[v] = (presCount[v] ?? 0) + 1; }
    return { trend, assortRows, n: names.length, presCount, postN: trend.reduce((a, b) => a + b.n, 0) };
  }, []);

  const peak = stats.trend.find((r) => r.lab === '2015–2021');
  const maxAvg = Math.max(1, ...stats.trend.map((r) => r.avg));
  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">問題意識 · Research Problem</p>
      <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">分殊化：審議專業化，還是任命政治化？</h2>
      <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
        台灣大法官長期被理解為「合議共識型」法院——判決以機關名義作成、不同意見稀少。資料推翻了這個圖像：每案分別意見數從 1990 年代前的不到一份，升到 2015–2021 年的每案 {peak ? peak.avg.toFixed(1) : '7'} 份。核心問題是這場「意見分殊化」代表什麼？兩種對立的說法：
      </p>
      <div className="mt-3 grid max-w-3xl gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--cc-line)] p-3">
          <div className="flex items-center gap-2"><Badge tone="blue">專業審議說</Badge><span className="text-[12px] text-[var(--cc-ink-soft)]">legalist</span></div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">會議以學者為主體，分別意見是釋義學分工與論理對話的產物；分殊化代表審議透明化。若成立，意見聯盟應沿學術背景／方法傳統組織。</p>
        </div>
        <div className="rounded-lg border border-[var(--cc-line)] p-3">
          <div className="flex items-center gap-2"><Badge tone="red">任命政治說</Badge><span className="text-[12px] text-[var(--cc-ink-soft)]">attitudinal</span></div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">分殊化隨 2003 交錯任期改制、以及蔡英文提名近乎整屆而政治化。若成立，意見聯盟應沿提名總統組織。</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">證據一 · 分殊化趨勢</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">每案分別意見數（行憲後 {stats.postN} 件）</h3>
        <div className="mt-2 max-w-xl space-y-1">
          {stats.trend.map((r) => (
            <div key={r.lab} className="grid grid-cols-[86px_1fr_112px] items-center gap-2 text-[13px]">
              <span className="text-[var(--cc-ink-mid)]">{r.lab}</span>
              <span className="block h-2 rounded-full bg-[var(--cc-track)]"><span className="block h-2 rounded-full" style={{ width: `${(r.avg / maxAvg) * 100}%`, background: 'var(--cc-highlight)' }} /></span>
              <span className="text-right text-[var(--cc-ink-soft)]">{r.avg.toFixed(2)} 份・{Math.round(r.disPct * 100)}% 不同</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[var(--cc-figure-note)]">
          資料完整度：晚近（釋字 701 號後）與憲法法庭意見書覆蓋 100%；早／中期為<strong className="text-[var(--cc-ink-strong)]">下限</strong>——8 件釋字（115/150/153/156/393/503/517/564）的意見書藏在「意見書、抄本等文件」欄未解析（約 13+ 份，含王澤鑑、蘇俊雄、劉鐵錚等），另約 103 件的意見書收於影像抄本／OCR，官方頁不提供機讀文字。故上升「趨勢」穩健，早期「水準」偏低估。
        </p>
        <OpinionCoverage />
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">證據二 · 聯盟沿哪條線組織</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">現任憲法法庭（{stats.n} 位具名法官）：同組 vs 跨組的平均共同具名</h3>
        <div className="mt-2 max-w-xl overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[var(--cc-table-head-ink)]">
                <th className="py-1 pr-3 font-bold">分組維度</th><th className="py-1 pr-3 font-bold">同組</th>
                <th className="py-1 pr-3 font-bold">跨組</th><th className="py-1 pr-3 font-bold">差</th><th className="py-1 font-bold">置換檢定 p</th>
              </tr>
            </thead>
            <tbody>
              {stats.assortRows.map((r) => (
                <tr key={r.lab} className="border-t border-[var(--cc-row-border)]">
                  <td className="py-1 pr-3 font-bold text-[var(--cc-ink-strong)]">{r.lab}</td>
                  <td className="py-1 pr-3">{r.same.toFixed(2)}</td>
                  <td className="py-1 pr-3">{r.diff.toFixed(2)}</td>
                  <td className="py-1 pr-3">{r.gap >= 0 ? '+' : ''}{r.gap.toFixed(2)}</td>
                  <td className="py-1">{r.p < 0.05 ? <strong className="text-[var(--cc-accent)]">{r.p.toFixed(3)} ✓</strong> : r.p.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          只有「提名總統」測得到顯著的同質性（同總統提名者共同具名較多）；出身、留學傳統測不到。初步偏向任命政治說——但共同具名只是代理，證據三用真投票覆核。到「意見書圖譜」勾「依提名總統上色」可肉眼對照分塊。
        </p>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">證據三 · 真實投票（立場表）</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">解析 {LCT_RESULT.判決數} 件憲判立場表 → {LCT_RESULT.rollCalls} 個逐項表決（{LCT_RESULT.爭議} 爭議），大法官 1D 理想點</h3>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          有了逐案「同意／不同意各主文項」的真投票，就能超越共同具名代理。<strong className="text-[var(--cc-ink-strong)]">憲法法庭 2022– 意見書與立場表 100% 覆蓋</strong>，是本頁證據基礎最扎實處。法院<strong className="text-[var(--cc-ink-strong)]">仍高共識</strong>（平均同意率 {Math.round(LCT_RESULT.平均同意率 * 100)}%）；1D 理想點沿提名總統分佈——{LCT_RESULT.提名總統均值.馬英九.n} 位馬英九提名的留任大法官聚於一極（右）。
        </p>
        {(() => {
          const pts = LCT_RESULT.理想點; const xs = pts.map((p) => p.x);
          const lo = Math.min(...xs), hi = Math.max(...xs); const pad = (hi - lo) * 0.08;
          const pos = (x) => ((x - (lo - pad)) / ((hi + pad) - (lo - pad))) * 100;
          const ink = (p) => PRES_COLOR[p.提名總統] ?? 'var(--cc-ink-mid)';
          return (
            <div className="mt-2 max-w-md space-y-0.5">
              {pts.map((p) => (
                <div key={p.姓名} className="grid grid-cols-[58px_1fr_46px] items-center gap-2 text-[12.5px]">
                  <span className="font-bold" style={{ color: ink(p) }}>{p.姓名}</span>
                  <span className="relative block h-3.5">
                    <span className="absolute inset-y-0 w-px bg-[var(--cc-line)]" style={{ left: `${pos(0)}%` }} />
                    <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${pos(p.x)}%`, background: inkToFill(ink(p)), border: `1.5px solid ${ink(p)}` }} />
                  </span>
                  <span className="text-right text-[var(--cc-ink-soft)]">{p.x >= 0 ? '+' : ''}{p.x.toFixed(2)}</span>
                </div>
              ))}
            </div>
          );
        })()}
        <div className="mt-3 max-w-xl overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[var(--cc-table-head-ink)]">
                <th className="py-1 pr-3 font-bold">分組維度（真投票同意率）</th><th className="py-1 pr-3 font-bold">同組</th>
                <th className="py-1 pr-3 font-bold">跨組</th><th className="py-1 font-bold">置換檢定 p</th>
              </tr>
            </thead>
            <tbody>
              {LCT_RESULT.同質性.map((r) => (
                <tr key={r.維度} className="border-t border-[var(--cc-row-border)]">
                  <td className="py-1 pr-3 font-bold text-[var(--cc-ink-strong)]">{r.維度}</td>
                  <td className="py-1 pr-3">{r.同組.toFixed(3)}</td>
                  <td className="py-1 pr-3">{r.跨組.toFixed(3)}</td>
                  <td className="py-1">{r.p < 0.05 ? <strong className="text-[var(--cc-accent)]">{r.p.toFixed(3)} ✓</strong> : `${r.p.toFixed(3)}${r.p < 0.1 ? '（近顯著）' : ''}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
          真投票下任命效果反而更弱、borderline（提名總統 p≈0.05，比共同具名的 0.03 弱）；出身、德語圈仍測不到。且那 {LCT_RESULT.提名總統均值.馬英九.n} 位極端者正是仍在任的舊屆——「同提名總統」在這屆幾乎等於「同一批留任者」，任命效果與世代效果無法分離。
        </p>
      </div>

      <div className="mt-5 max-w-3xl rounded-lg border border-[var(--cc-border)] bg-[var(--cc-hover-bg)] p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">方法閘門 · Model Gate</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">現階段只能主張描述與類型學，不能主張因果或意識形態定位</h3>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          <li>真投票（立場表）只有憲法法庭 2022– 這 {LCT_RESULT.判決數} 件；釋字時期仍只有共同具名代理、無逐案投票。1D 理想點為古典 MDS 的簡單估計，非 W-NOMINATE／IRT。</li>
          <li>「提名總統」與世代無法分離：極端的 {LCT_RESULT.提名總統均值.馬英九.n} 人是仍在任的舊屆留任者，「同總統」幾乎等於「同一批人」。任命效果與 holdover／同期效果分不開。</li>
          <li>只有一屆、樣本小（{stats.n} 人、{LCT_RESULT.爭議} 爭議案）；立場表尚有 {LCT_RESULT.重複旗標} 件同項矛盾旗標＋1 判決＋3 裁定待補。</li>
          <li>資料完整度非全等：強命題（證據三）建立在憲判 2022– 這 100% 覆蓋段；證據一早／中期為下限（8 件釋字意見書藏於「意見書、抄本等文件」欄未解析、約 103 件收於影像抄本，見趨勢下方註）。分殊化「趨勢」穩健、早期「水準」偏低。</li>
        </ul>
      </div>

      <div className="mt-3 max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">資料解鎖 · 下一步</p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          立場表已首度解析（證據三），投票矩陣到手。要把它推到定論還缺三步：把 parser 寫回<strong className="text-[var(--cc-ink-strong)]">資料層底層</strong>（fetch＋schema＋sync，此為暫用預算結果）；改用正式理想點估計（W-NOMINATE／Martin–Quinn 而非 1D MDS）並在控制世代、案類、時間下檢定任命效果；補齊剩餘 1 判決＋3 裁定與 {LCT_RESULT.重複旗標} 件矛盾旗標的人工覆核。跨屆資料累積後，「任命 vs 世代」的共線才可能鬆開。
        </p>
      </div>
    </section>
  );
}

function GraphView() {
  const [eraKey, setEraKey] = useState(GRAPH_ERAS[0].key);
  const [mode, setMode] = useState('合計');
  const [minEdge, setMinEdge] = useState(2);
  const [selName, setSelName] = useState(null);
  const [selPair, setSelPair] = useState(null);
  const [hover, setHover] = useState(null);
  const [colorByPres, setColorByPres] = useState(false); // 預設關：姓名走中性墨，畫面不花

  const presByName = useMemo(() => new Map(justices.map((j) => [j.姓名, j.提名總統 ?? null])), []);

  // 每段現算：pairStats / directed / byPair / degree（缺欄跳過不 throw）
  const eraData = useMemo(() => {
    // pairs/directed/deg 優先讀資料層預算好的 data.共同具名圖譜（單一事實來源，build-justices.mjs 產出）；
    // 缺時（資料層尚未重跑）退回就地現算，圖不斷線。byPair（點格子下探的意見書清單）不在資料層，永遠現算自 docs。
    const graphByKey = new Map((data.共同具名圖譜?.分期 ?? []).map((e) => [e.key, e]));
    const out = {};
    for (const era of GRAPH_ERAS) {
      const pairs = new Map();     // pairKey → {協同,不同,合計}
      const directed = new Map();  // `${提出者}${SEP}${加入者}` → n
      const byPair = new Map();    // pairKey → [{字號,類型,下載網址,日期}]
      const deg = new Map();       // 姓名 → 合計 degree
      for (const d of docs) {
        const y = d.日期 ? Number(String(d.日期).slice(0, 4)) : null;
        if (!y || !era.test(y)) continue;
        for (const op of d.意見書 ?? []) {
          const proposers = op.提出 ?? [];
          const joiners = op.加入 ?? [];
          const signers = [...new Set([...proposers, ...joiners])];
          const t = op.類型 ?? '';
          const isD = t.includes('不同');
          const isC = t.includes('協同');
          for (let i = 0; i < signers.length; i++) for (let j = i + 1; j < signers.length; j++) {
            const k = pairKey(signers[i], signers[j]);
            const o = pairs.get(k) ?? { 協同: 0, 不同: 0, 合計: 0 };
            o.合計 += 1; if (isD) o.不同 += 1; if (isC) o.協同 += 1;
            pairs.set(k, o);
            const arr = byPair.get(k) ?? [];
            arr.push({ 字號: d.字號, 類型: t, 下載網址: op.下載網址 ?? null, 日期: d.日期 ?? null });
            byPair.set(k, arr);
            deg.set(signers[i], (deg.get(signers[i]) ?? 0) + 1);
            deg.set(signers[j], (deg.get(signers[j]) ?? 0) + 1);
          }
          for (const p of proposers) for (const jn of joiners) {
            if (p === jn) continue;
            const dk = `${p}${SEP}${jn}`;
            directed.set(dk, (directed.get(dk) ?? 0) + 1);
          }
        }
      }
      const g = graphByKey.get(era.key);
      if (g) { // 資料層優先：以預算好的計數覆蓋 pairs/directed/deg，byPair 仍用 docs 下探
        const gp = new Map(), gd = new Map(), gdeg = new Map();
        for (const p of g.共同具名 ?? []) {
          gp.set(pairKey(p.甲, p.乙), { 協同: p.協同 ?? 0, 不同: p.不同 ?? 0, 合計: p.合計 ?? 0 });
          gdeg.set(p.甲, (gdeg.get(p.甲) ?? 0) + (p.合計 ?? 0));
          gdeg.set(p.乙, (gdeg.get(p.乙) ?? 0) + (p.合計 ?? 0));
        }
        for (const dd of g.主筆加入 ?? []) gd.set(`${dd.提出}${SEP}${dd.加入}`, dd.次數 ?? 0);
        out[era.key] = { pairs: gp, directed: gd, byPair, deg: gdeg };
      } else {
        out[era.key] = { pairs, directed, byPair, deg };
      }
    }
    return out;
  }, []);

  const ed = eraData[eraKey] ?? { pairs: new Map(), directed: new Map(), byPair: new Map(), deg: new Map() };

  const density = useMemo(() => {
    const m = {};
    for (const era of GRAPH_ERAS) {
      let s = 0;
      for (const o of eraData[era.key]?.pairs.values() ?? []) s += o.合計;
      m[era.key] = s;
    }
    return m;
  }, [eraData]);
  const maxDensity = Math.max(1, ...Object.values(density));

  // 門檻＝只留「至少有一條共同具名 ≥ minEdge 次的關係」的大法官（對強聯盟設門檻，
  // 而非個人總量——後者在密集屆別幾乎人人破 3、按了沒差）。seriation 用合計權重、跨模式穩定。
  const members = useMemo(() => {
    const maxTie = new Map();
    for (const [k, o] of ed.pairs) {
      const [a, b] = k.split(SEP);
      const h = o.合計 ?? 0;
      if (h > (maxTie.get(a) ?? 0)) maxTie.set(a, h);
      if (h > (maxTie.get(b) ?? 0)) maxTie.set(b, h);
    }
    const names = [...maxTie.entries()].filter(([, v]) => v >= minEdge).map(([nm]) => nm);
    const wOf = (i, j) => ed.pairs.get(pairKey(names[i], names[j]))?.合計 ?? 0;
    return seriateOrder(names.length, wOf).map((i) => names[i]);
  }, [ed, minEdge]);

  const cellVal = (a, b) => (mode === '有向'
    ? ed.directed.get(`${a}${SEP}${b}`) ?? 0
    : ed.pairs.get(pairKey(a, b))?.[mode] ?? 0);

  const maxVal = useMemo(() => {
    let mx = 0;
    for (let i = 0; i < members.length; i++) for (let j = 0; j < members.length; j++) {
      if (mode !== '有向' && i === j) continue;
      mx = Math.max(mx, cellVal(members[i], members[j]));
    }
    return mx;
  }, [members, mode, ed]);

  const namePartners = useMemo(() => {
    if (!selName) return [];
    const res = [];
    for (const [k, o] of ed.pairs) {
      const [x, z] = k.split(SEP);
      if (x === selName || z === selName) res.push({ 對象: x === selName ? z : x, ...o });
    }
    const sk = mode === '有向' ? '合計' : mode;
    return res.sort((a, b) => b[sk] - a[sk]);
  }, [ed, selName, mode]);

  const topPairs = useMemo(() => {
    if (mode === '有向') {
      return [...ed.directed.entries()].map(([k, v]) => { const [a, b] = k.split(SEP); return { a, b, v }; })
        .sort((x, y) => y.v - x.v).slice(0, 12);
    }
    return [...ed.pairs.entries()].map(([k, o]) => { const [a, b] = k.split(SEP); return { a, b, v: o[mode] }; })
      .filter((x) => x.v > 0).sort((x, y) => y.v - x.v).slice(0, 12);
  }, [ed, mode]);

  const pairDocs = selPair ? (ed.byPair.get(pairKey(selPair.a, selPair.b)) ?? []) : [];
  const presLegend = useMemo(() => {
    const seen = new Set(members.map((nm) => presByName.get(nm)).filter(Boolean));
    return Object.keys(PRES_COLOR).filter((p) => seen.has(p));
  }, [members, presByName]);

  const tone = MODE_TONE[mode];
  const modeLabel = GRAPH_MODES.find((m) => m[0] === mode)?.[1] ?? mode;
  const eraLabel = GRAPH_ERAS.find((e) => e.key === eraKey)?.label ?? '';
  const presInk = (name) => (colorByPres ? (PRES_COLOR[presByName.get(name)] ?? 'var(--cc-ink-mid)') : 'var(--cc-ink-strong)');

  const n = members.length;
  const CW = Math.max(10, Math.min(20, Math.floor(560 / Math.max(n, 1))));
  const LABEL_W = 68;
  const TOP = 72;
  const nameFont = Math.max(9, Math.min(11, CW - 2));

  const hoverText = (() => {
    if (!hover || !members[hover.r] || !members[hover.c]) return '';
    const a = members[hover.r], b = members[hover.c];
    if (mode === '有向') return `${b} 加入 ${a} 主筆意見書 ${ed.directed.get(`${a}${SEP}${b}`) ?? 0} 次`;
    const o = ed.pairs.get(pairKey(a, b)) ?? { 協同: 0, 不同: 0, 合計: 0 };
    return `${a} × ${b} — 協同 ${o.協同}・不同 ${o.不同}・合計 ${o.合計}`;
  })();

  return (
    <section className="border-t border-[var(--cc-line)] py-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">共同具名矩陣</p>
      <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">誰和誰一起署名意見書（分期・資料驅動分群・{modeLabel}）</h2>
      <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        共同具名只在同時在任時才可能，故按制度斷點分四期各一張矩陣。行列順序由共同具名關係自動分群，聯盟沿對角線成塊。切換「關係」可分看協同聯盟、不同聯盟，或「主筆→加入」的有向影響；點格子看該對實際共同署名的意見書。勾「依提名總統上色」才會為姓名套色（用來檢驗聯盟是否吻合任命世代），預設關閉以免畫面過花。
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Select label="時期" value={eraKey} onChange={setEraKey} options={GRAPH_ERAS.map((e) => [e.key, e.label])} />
        <Select label="關係" value={mode} onChange={setMode} options={GRAPH_MODES} />
        <Select label="門檻" value={String(minEdge)} onChange={(v) => setMinEdge(Number(v))} options={[['1', '≥1 次'], ['2', '≥2 次'], ['3', '≥3 次']]} />
        <label className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--cc-ink-soft)]">
          <input type="checkbox" checked={colorByPres} onChange={(e) => setColorByPres(e.target.checked)} />
          依提名總統為姓名上色
        </label>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--cc-ink-soft)]">
        {GRAPH_ERAS.map((e) => (
          <button key={e.key} onClick={() => setEraKey(e.key)}
            className={`inline-flex items-center gap-1.5 ${e.key === eraKey ? 'font-bold text-[var(--cc-accent)]' : 'hover:text-[var(--cc-accent)]'}`}>
            {e.short}
            <span className="block h-1.5 w-12 rounded-full bg-[var(--cc-track)]">
              <span className="block h-1.5 rounded-full" style={{ width: `${(density[e.key] / maxDensity) * 100}%`, background: 'var(--tone-rose-tx)' }} />
            </span>
            <span className="text-[var(--cc-figure-note)]">{density[e.key]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,600px)_1fr]">
        <div className="relative overflow-x-auto pb-2">
          {n < 2 ? (
            <p className="py-8 text-[13px] text-[var(--cc-ink-soft)]">本期尚無足量具名意見書（門檻 ≥{minEdge} 次）。可調低門檻或切換時期。</p>
          ) : (
            <svg width={LABEL_W + n * CW + 8} height={TOP + n * CW + 8} role="img" aria-label={`${eraLabel} 大法官共同具名矩陣`}>
              {members.map((name, r) => {
                const active = selName === name;
                return (
                  <text key={`r${name}`} x={LABEL_W - 6} y={TOP + r * CW + CW / 2 + 3} textAnchor="end"
                    fontSize={nameFont} fontWeight={active ? 700 : 500}
                    style={{ fill: presInk(name), cursor: 'pointer' }}
                    onClick={() => { setSelName(active ? null : name); setSelPair(null); }}>{name}</text>
                );
              })}
              {members.map((name, c) => {
                const active = selName === name;
                const x = LABEL_W + c * CW + CW / 2;
                return (
                  <text key={`c${name}`} x={x} y={TOP - 6} textAnchor="start"
                    transform={`rotate(-90 ${x} ${TOP - 6})`}
                    fontSize={nameFont} fontWeight={active ? 700 : 500}
                    style={{ fill: presInk(name), cursor: 'pointer' }}
                    onClick={() => { setSelName(active ? null : name); setSelPair(null); }}>{name}</text>
                );
              })}
              {members.map((rowName, r) => members.map((colName, c) => {
                if (mode !== '有向' && r === c) {
                  return <rect key={`${r}-${c}`} x={LABEL_W + c * CW} y={TOP + r * CW} width={CW - 1.6} height={CW - 1.6} rx={2} fill="var(--cc-track)" opacity={0.55} />;
                }
                // 門檻：共同具名不足 minEdge 次的關係留白（跨模式一致地吃「合計」，切模式不會忽有忽無）
                const heji = ed.pairs.get(pairKey(rowName, colName))?.合計 ?? 0;
                if (heji < minEdge) {
                  return <rect key={`${r}-${c}`} x={LABEL_W + c * CW} y={TOP + r * CW} width={CW - 1.6} height={CW - 1.6} rx={2} fill="var(--cc-heat-zero)" />;
                }
                const v = cellVal(rowName, colName);
                const inRowCol = selName && (selName === rowName || selName === colName);
                const isHover = hover && hover.r === r && hover.c === c;
                const isSelPair = selPair && ((selPair.a === rowName && selPair.b === colName) || (selPair.a === colName && selPair.b === rowName));
                return (
                  <rect key={`${r}-${c}`}
                    x={LABEL_W + c * CW} y={TOP + r * CW}
                    width={CW - 1.6} height={CW - 1.6} rx={2}
                    style={{ fill: rampFill(v, maxVal, tone), cursor: v ? 'pointer' : 'default' }}
                    stroke={isSelPair || isHover ? 'var(--cc-highlight)' : 'none'} strokeWidth={1.4}
                    opacity={selName && !inRowCol ? 0.3 : 1}
                    onMouseEnter={() => setHover({ r, c })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => v && setSelPair({ a: rowName, b: colName })}
                  />
                );
              }))}
            </svg>
          )}
          {hoverText ? (
            <div className="pointer-events-none absolute left-2 top-0 z-10 rounded-md border border-[var(--cc-border)] bg-white px-3 py-1.5 text-[12px] shadow-sm">{hoverText}</div>
          ) : null}
        </div>

        <div>
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[11.5px] text-[var(--cc-ink-soft)]">
              少
              {[0.1, 0.3, 0.55, 0.8, 1].map((f) => (
                <span key={f} className="inline-block h-3 w-3 rounded-[2px]" style={{ background: rampFill(f * (maxVal || 1), maxVal || 1, tone) }} />
              ))}
              多{maxVal ? `（單格最高 ${maxVal}）` : ''}
            </div>
            {colorByPres && presLegend.length ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-[var(--cc-ink-soft)]">
                {presLegend.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: inkToFill(PRES_COLOR[p]), borderColor: PRES_COLOR[p] }} />{p}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {selPair ? (
            <PairDetail pair={selPair} list={pairDocs} onClose={() => setSelPair(null)} />
          ) : selName ? (
            <NameDetail name={selName} partners={namePartners} onName={(nm) => { setSelName(nm); setSelPair(null); }} />
          ) : (
            <TopPairs list={topPairs} mode={mode} onPick={(a, b) => setSelPair({ a, b })} />
          )}
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-[11.5px] leading-relaxed text-[var(--cc-figure-note)]">
        資料註：合計每份意見書計一次共同具名；「部分協同部分不同」等混合類型同時計入協同與不同，故各對「協同＋不同」可能大於合計。「主筆→加入」為有向：列＝提出者、欄＝加入者，格值＝該加入者加入該提出者意見書的次數，矩陣不對稱即資訊本身。早期釋字意見書多整卷收於抄本、作者未逐一標，故早中期為下限。意見書資料仍在增補。
      </p>
    </section>
  );
}

// ── 沿革（制度沿革）：司法解釋四階段機關軸＋憲政時期軸 ──────────────
// 文字經使用者核可定稿（2026-07-07），逐字見資料 repo docs/沿革摘要草稿.md；
// 年份/外鏈查證見 docs/沿革素材查證.md。憲判件數讀 data.統計（勿寫死）。
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

function HistoryView({ onOpenIndex }) {
  const [openCards, setOpenCards] = useState(
    () => new Set([...PROV_STAGES.map((s) => s.key), ...PROV_ERAS.map((e) => `era-${e.key}`)]),
  );
  const [hover, setHover] = useState(null);
  const hoverSeg = PROV_SEGMENTS.find((s) => s.key === hover);

  const toggle = (key) => setOpenCards((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const focusCard = (cardKey) => {
    setOpenCards((prev) => new Set(prev).add(cardKey));
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
        const open = openCards.has(s.key);
        return (
          <section key={s.key} id={`prov-card-${s.key}`} className="scroll-mt-16 border-t border-[var(--cc-line)] py-4">
            <button onClick={() => toggle(s.key)} className="flex w-full items-baseline justify-between gap-3 text-left">
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">{s.機關}</span>
                <span className="text-[12px] font-bold text-[var(--cc-eyebrow)]">{s.期間}</span>
                <span className="text-[12px] text-[var(--cc-ink-soft)]">{s.號數}</span>
              </span>
              <ChevronDown size={16} className="shrink-0 text-[var(--cc-icon)] transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
            </button>
            {open ? (
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
              const open = openCards.has(key);
              return (
                <div key={e.key} className="rounded-lg border border-[var(--cc-border)]">
                  <button onClick={() => toggle(key)} className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-[14px] font-bold text-[var(--cc-ink-strong)]">{e.時期}</span>
                      <span className="text-[12px] text-[var(--cc-ink-soft)]">{formatDateRange(e.起, e.迄, { openLabel: '迄今' })}</span>
                    </span>
                    <ChevronDown size={15} className="shrink-0 text-[var(--cc-icon)]" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {open ? (
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

function AboutView() {
  return (
    <div className="max-w-3xl">
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">資料來源</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">行憲後取自憲法法庭官網，行憲前取自維基文庫（公有領域）</h2>
        <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          <p>
            <strong className="text-[var(--cc-accent)]">行憲後</strong>：司法院大法官解釋 {data.統計.機關?.大法官 ?? 0} 件（釋字第 1–813 號，1949–2021）、憲法法庭判決 {data.統計.判決} 件（2022 年憲法訴訟法施行起）、實體裁定 {data.統計.實體裁定} 件（含暫時處分），取自憲法法庭官網。程序性不受理裁定未收錄。
          </p>
          <p>
            <strong className="text-[var(--cc-accent)]">行憲前</strong>：統一解釋 {data.統計.行憲前} 件——大理院統字 {data.統計.機關?.大理院}（1913–1927）、最高法院解字 {data.統計.機關?.最高法院}（1927–1928）、司法院院字／院解字 {data.統計.機關?.司法院}（1929–1948），取自維基文庫（轉錄自司法院法學資料檢索系統與《司法院解釋彙編》，公有領域）。此係統一解釋法令，非大法官憲法解釋，與釋字分計；統字多無逐號日期（源頭即缺），院字／院解字帶完整年月日與彙編冊頁。
          </p>
          <p>
            每件案件的爭點、主文、相關法令、意見書清單與立場表連結均解析自官方頁面；文件下載一律連回官方網站，本站不代管任何檔案副本。
          </p>
          <p>
            主題分類、稅法子主題與審查結論由規則初步標註（卡片上標示「結論待人工判讀」者即尚未人工覆核），意見書作者與共同具名關係解析自官方檔名；早期意見書僅收於抄本合訂檔者，已從抄本檔名拆出（卡片上仍連向抄本 PDF）。中期釋字（約第 100–400 號）的意見書常整卷收於抄本且檔名未列作者，該時期的意見書統計為下限而非全貌。
          </p>
          <p>
            「審查基準」欄依湯德宗三級架構（寬鬆／中度／嚴格）機標：本院自釋字第 578 號起才明確區分寬嚴審查基準，之前案件不標；機標只認理由書明示字樣，多數案件為「未明示」，同案命中多級者標「待人工」。參與大法官名單：釋字取自官方頁解釋文／理由書末尾的大法官署名列（813 件全覆蓋，署名列不含迴避或未參與評議者），憲法法庭判決與裁定取自官方合議庭名單欄。
          </p>
        </div>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">批次下載</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">篩選後想把檔案抓回本機讀？</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          瀏覽器無法代替你向官方網站批次下載。作法：在「案件索引」匯出「批次下載清單」，回到研究資料庫在本機執行批次下載命令，官方 PDF 就會下載到本機資料夾。清單裡每一筆都是官方網址，來源可驗證。
        </p>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">更新</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">資料怎麼保持最新</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          資料庫以官方清單頁差分更新：偵測新公布的判決與裁定、只抓新增案件、重建統計後同步到本頁。本頁資料產生於 {data.產生時間?.slice(0, 10)}。
        </p>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">相關外部連結</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">原始資料的官方出處</h2>
        <div className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed">
          <a href="https://cons.judicial.gov.tw/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
            憲法法庭全球資訊網（大法官解釋、憲法法庭判決與裁定官方查詢系統） <ExternalLink size={11} />
          </a>
        </div>
      </section>
    </div>
  );
}

// 114 憲判 1 號深度解析：純渲染資料層 doc.深度分析（策展層，見 constitutional-court-research-data/
// data/materials/深度分析.json）。內容零寫死；顏色只走 --cc-* token 與校準過的 Badge tone。
// 站位中立並陳多數/不同意見兩造，不裁決「5 人判決是否有效」。
function Case1Analysis() {
  const [tlMode, setTlMode] = useState('議題');
  const doc = docs.find((d) => d.字號 === '114年憲判字第1號');
  const da = doc?.深度分析;
  if (!da) {
    return (
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">找不到「114 年憲判字第 1 號」的深度分析資料（資料層尚未同步）。</p>
      </section>
    );
  }
  const 多數 = da.組成爭議?.多數立場;
  const 不同意見 = da.組成爭議?.不同意見立場;
  // 時間軸雙維度：預設「依議題」（缺額與提名／修法與釋憲，左右分側），有 行為人 欄位時可切「依行為人」。
  // 色位一律走 --cat-* 分類色；議題兩軸吃 cat-1(plum)/cat-2(blue)，行為人吃固定色位（標籤負責辨識）。
  const events = (da.時間軸 ?? []).slice().sort((a, b) => a.日期.localeCompare(b.日期));
  const hasActor = events.some((t) => t.行為人);
  const mode = hasActor ? tlMode : '議題';
  const 軸COLOR = { 缺額與提名: 1, 修法與釋憲: 2 };
  const ACTOR_COLOR = { 立法院: 2, 行政院: 4, 總統: 1, 司法院: 5, 其他: 8 };
  // 主事者（資料欄位名沿用「行為人」，顯示層改稱主事者）：泳道分欄用，固定欄序讓欄位穩定。
  const actorsPresent = ['立法院', '行政院', '總統', '司法院', '其他'].filter((a) => events.some((t) => t.行為人 === a));
  const toneOf = (t) => (軸COLOR[t.軸] ?? 8);
  const sideOf = (t) => (t.軸 === '缺額與提名' ? 'L' : 'R');
  const legend = [['缺額與提名', 軸COLOR.缺額與提名], ['修法與釋憲', 軸COLOR.修法與釋憲]];
  const srcLink = (href) => (
    <a href={href} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center align-baseline text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]" aria-label="來源">
      <ExternalLink size={10} />
    </a>
  );
  return (
    <div>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">深度解析 · Case Study</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]"><CaseRef 字號={doc.字號} />：{da.案名}</h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">{da.一句話}</p>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--cc-ink-soft)]">{da.背景}</p>
        <p className="mt-3 max-w-3xl rounded-lg border border-[var(--cc-line)] p-2.5 text-[12px] leading-relaxed text-[var(--cc-figure-note)]">
          本頁並陳多數與不同意見兩造立場，不對「5 位大法官作成的判決是否有效」下判斷——這個元爭議之上並無更高階的中立仲裁機關。用語採「分立政府／在野聯盟過半」等中性表述。
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">事件時間軸</p>
            <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">
              {mode === '議題' ? '兩條交纏的軸線：缺額凍結與門檻拉高如何同時發生' : '誰在推動：立法院、總統與司法院的動作序列'}
            </h3>
          </div>
          {hasActor ? (
            <SegControl value={tlMode} onChange={setTlMode} options={[['議題', '依議題'], ['行為人', '依主事者']]} />
          ) : null}
        </div>
        {mode === '議題' ? (
          <>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
              {legend.map(([label, n]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border" style={{ background: `var(--cat-${n}-bg)`, borderColor: `var(--cat-${n}-tx)` }} />
                  {label}
                </span>
              ))}
            </div>
            {/* 中央軸時間軸：手機單欄（軸線靠左），sm 以上軸線置中、事件依側別分掛左右。 */}
            <div className="relative mt-4 max-w-4xl">
              <span className="absolute inset-y-0 left-[6px] w-px bg-[var(--cc-line)] sm:left-1/2 sm:-translate-x-1/2" aria-hidden />
              <ol className="space-y-3">
                {events.map((t, i) => {
                  const n = toneOf(t);
                  const side = sideOf(t);
                  return (
                    <li key={i} className="relative sm:grid sm:grid-cols-2 sm:gap-x-8">
                      <span
                        className="absolute left-[6px] top-2.5 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 sm:left-1/2"
                        style={{ background: `var(--cat-${n}-bg)`, borderColor: `var(--cat-${n}-tx)` }}
                        aria-hidden
                      />
                      <div className={`pl-5 sm:pl-0 ${side === 'L' ? 'sm:col-start-1 sm:pr-9 sm:text-right' : 'sm:col-start-2 sm:pl-9'}`}>
                        <div className="rounded-lg border border-[var(--cc-line)] p-2.5">
                          <p className="text-[12.5px] font-bold text-[var(--cc-ink-strong)]">
                            {formatDate(t.日期)}
                            {t.行為人 ? <span className="ml-1.5 font-normal text-[var(--cc-ink-soft)]">· {t.行為人}</span> : null}
                          </p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
                            {t.事件}{t.來源 ? srcLink(t.來源) : null}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        ) : (
          <>
            {/* 依主事者：每方一直欄（泳道），由上而下＝時間先後；同一時點只有發動方有卡片，各方動作在同一時間軸上錯落並讀。 */}
            <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">每一直欄是一個主事者，由上而下即時間先後；同一時點只有發動的一方有卡片，故各方動作在同一條時間軸上錯落並排。</p>
            <div className="mt-3 hidden sm:block">
              <div className="grid gap-x-3" style={{ gridTemplateColumns: `repeat(${actorsPresent.length}, minmax(0, 1fr))` }}>
                {actorsPresent.map((a) => (
                  <div key={a} className="flex items-center gap-1.5 border-b border-[var(--cc-line)] pb-1.5 text-[12px] font-bold" style={{ color: `var(--cat-${ACTOR_COLOR[a]}-tx)` }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--cat-${ACTOR_COLOR[a]}-bg)`, border: `1px solid var(--cat-${ACTOR_COLOR[a]}-tx)` }} />
                    {a}
                  </div>
                ))}
              </div>
              <div className="grid gap-x-3 gap-y-2 pt-2" style={{ gridTemplateColumns: `repeat(${actorsPresent.length}, minmax(0, 1fr))` }}>
                {events.map((t, i) => {
                  const n = ACTOR_COLOR[t.行為人] ?? 8;
                  const col = actorsPresent.indexOf(t.行為人) + 1;
                  return (
                    <div key={i} style={{ gridColumn: col, gridRow: i + 1, background: `var(--cat-${n}-bg)`, borderLeft: `3px solid var(--cat-${n}-tx)` }} className="rounded-md border border-[var(--cc-line)] p-2">
                      <p className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{formatDate(t.日期)}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{t.事件}{t.來源 ? srcLink(t.來源) : null}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 手機：欄位太窄，退回單欄時間序，左邊主事者色標＋標籤 */}
            <ol className="mt-3 space-y-2.5 border-l border-[var(--cc-line)] pl-4 sm:hidden">
              {events.map((t, i) => {
                const n = ACTOR_COLOR[t.行為人] ?? 8;
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-2.5 h-2.5 w-2.5 rounded-full border" style={{ background: `var(--cat-${n}-bg)`, borderColor: `var(--cat-${n}-tx)` }} aria-hidden />
                    <div className="rounded-md border border-[var(--cc-line)] p-2" style={{ borderLeft: `3px solid var(--cat-${n}-tx)` }}>
                      <p className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{formatDate(t.日期)}<span className="ml-1.5 font-normal" style={{ color: `var(--cat-${n}-tx)` }}>· {t.行為人}</span></p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{t.事件}{t.來源 ? srcLink(t.來源) : null}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">判決 · {formatDate('2025-12-19')}</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">主文與論證</h3>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">{da.判決主文}</p>
        <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          {(da.論證主軸 ?? []).map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">核心爭議 · 5 vs 3</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">憲法法庭是否合法組成？署名 5 人與拒審 3 人的對立</h3>
        <div className="mt-3 grid max-w-3xl gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--cc-line)] p-3">
            <div className="flex items-center gap-2"><Badge tone="blue">{多數?.標籤}</Badge></div>
            <p className="mt-1.5 text-[12px] text-[var(--cc-ink-soft)]">{(多數?.大法官 ?? []).join('、')}{多數?.主筆 ? `（主筆 ${多數.主筆}）` : ''}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
              {(多數?.要點 ?? []).map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            {多數?.個別註記 ? <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--cc-figure-note)]">{多數.個別註記}</p> : null}
          </div>
          <div className="rounded-lg border border-[var(--cc-line)] p-3">
            <div className="flex items-center gap-2"><Badge tone="red">{不同意見?.標籤}</Badge></div>
            <p className="mt-1.5 text-[12px] text-[var(--cc-ink-soft)]">{(不同意見?.大法官 ?? []).join('、')}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
              {(不同意見?.要點 ?? []).map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            {不同意見?.文件 ? <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--cc-figure-note)]">{不同意見.文件}</p> : null}
          </div>
        </div>
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">不同意見書要旨</p>
          <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">三位大法官《不同意法律意見書》十點要旨</h3>
          <ol className="mt-2 max-w-3xl list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
            {(da.不同意見書要旨 ?? []).map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">開放問題 · Known Unknowns</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">已知有爭議、尚無定論</h3>
        <ul className="mt-2 max-w-3xl space-y-1.5">
          {(da.known_unknowns ?? []).map((p, i) => (
            <li key={i} className="rounded-lg border border-[var(--cc-line)] p-2.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">{p}</li>
          ))}
        </ul>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">更深層 · Unknown Unknowns</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">結構性、尚未被清楚框定的風險</h3>
        <ul className="mt-2 max-w-3xl space-y-1.5">
          {(da.unknown_unknowns ?? []).map((p, i) => (
            <li key={i} className="rounded-lg border border-[var(--cc-line)] p-2.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function ConstitutionalCourt() {
  // 分頁與大法官個人頁都掛在 URL（?tab=…&j=姓名）：可深連結、可分享、可返回
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') ?? 'index';
  const justiceName = params.get('j');
  const setActive = (id) => setParams(id === 'index' ? {} : { tab: id });
  const openJustice = (name) => setParams({ tab: 'justices', j: name });

  useEffect(() => {
    document.title = justiceName ? `${justiceName}｜憲法法庭案例庫` : '憲法法庭案例庫';
  }, [justiceName]);

  return (
    <div className="min-h-screen paper-texture bg-[var(--cc-bg)] font-sans text-[var(--cc-ink)]" style={{ ...CC_VARS, paddingBottom: 60, overflowX: 'clip' }}>
      <header className="border-b border-[var(--cc-line)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-2 font-accent text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow-header)]">
            <Gavel size={13} />
            Constitutional Court Archive
          </div>
          <h1 className="max-w-3xl leading-tight text-[var(--cc-heading)]">
            <span className="font-sans text-2xl font-semibold sm:text-[2.15rem]">憲法法庭案例庫</span>
            <span className="ml-3 align-baseline text-base sm:text-lg text-[var(--cc-body-text)]">釋字・憲判・暫時處分</span>
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--cc-body-text)]">
            把中華民國司法解釋沿革——行憲後 {data.統計.行憲後} 件（大法官釋字・憲法法庭裁判，取自憲法法庭官網）與
            行憲前 {data.統計.行憲前} 件（大理院／最高法院／司法院統一解釋，取自維基文庫）——做成可檢索的研究工作台：
            主題與年代篩選、意見書作者與立場、共同具名網絡、引用統計，以及可直接進論文的引註與 BibTeX 匯出。
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {[
              ['大法官解釋', data.統計.機關?.大法官 ?? 0],
              ['憲法法庭判決', data.統計.判決],
              ['實體裁定', data.統計.實體裁定],
              ['具名意見書', docs.reduce((s, d) => s + d.意見書.filter((o) => o.作者類別 === '大法官').length, 0)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-[12px] font-bold text-[var(--cc-icon)]">{label}</span>
                <span className="font-display text-lg sm:text-xl font-bold text-[var(--cc-ink)]">{value}</span>
              </div>
            ))}
            {/* 行憲前另列一段、以分隔線區隔——非大法官解釋，不併入上面計數 */}
            <div className="flex items-baseline gap-2 border-l border-[var(--cc-line)] pl-8">
              <span className="text-[12px] font-bold text-[var(--cc-eyebrow)]">行憲前統一解釋</span>
              <span className="font-display text-lg sm:text-xl font-bold text-[var(--cc-ink)]">{data.統計.行憲前}</span>
              <span className="text-[12px] text-[var(--cc-ink-soft)]">
                大理院 {data.統計.機關?.大理院}・最高法院 {data.統計.機關?.最高法院}・司法院 {data.統計.機關?.司法院}
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-[var(--cc-line)] bg-white/94 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold transition hover:bg-[var(--cc-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cc-highlight)]"
              style={{ background: active === id ? 'var(--cc-tab-active-bg)' : undefined, color: active === id ? 'var(--cc-tab-active-text)' : 'var(--cc-tab-inactive-text)' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {active === 'index' ? <IndexView /> : null}
        {active === 'timeline' ? <TimelineView /> : null}
        {active === 'justices' ? (
          justiceName
            ? <JusticeDetail name={justiceName} onBack={() => setParams({ tab: 'justices' })} onOpen={openJustice} />
            : <JusticesView onOpen={openJustice} />
        ) : null}
        {active === 'tenure' ? <TenureView onOpen={openJustice} /> : null}
        {active === 'graph' ? <GraphView /> : null}
        {active === 'research' ? <ResearchProblem /> : null}
        {active === 'case1' ? <Case1Analysis /> : null}
        {active === 'history' ? <HistoryView onOpenIndex={(機關) => setParams(機關 && 機關 !== '行憲後' ? { 機關 } : {})} /> : null}
        {active === 'about' ? <AboutView /> : null}
      </main>
    </div>
  );
}
