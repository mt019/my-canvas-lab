import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarClock, ChevronDown, ExternalLink, Search, Shuffle, X } from 'lucide-react';
import data from '../../data/constitutionalCourt.json';
import { lookupCases } from './caseQuery';
import { formatDate, formatDateRange } from '../../utils/date';

// ── 憲法法庭案例庫：跨分頁共用元件與工具 ──────────────────────────────────
// 從 ConstitutionalCourt.jsx 機械拆出（見該檔頂部說明）；純搬家、零行為改變。

export const CC_VARS = { // token-exempt
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
  // 退場中性色：非分類色的「其他／未著錄／國內／任期尚短」用，刻意不佔 --cat-* 身分位。
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
export const docs = data.文件;
export const justices = data.大法官;
export const coSign = data.共同具名;
export const citeEdges = data.引用網絡;
export const presidents = data.總統任期 ?? [];

// 字號 → 案件文件的全域查找表，供 <CaseRef> 由任一處字號回連官方頁並取一句話爭點預覽。
const docByNo = new Map(docs.map((d) => [d.字號, d]));
// 字號精準檢索（#88／113-1／釋88／院解2876…）：寫法認定在 caseQuery.js，這裡只負責對照全庫。
// 刻意不吃機關／類型等篩選——指名一件時，那件不該因為視圖停在別的機關就消失。
export const findCases = (q) => lookupCases(q, docByNo);
// 姓名 → 大法官名冊，供 <JusticeRef> 判斷某名字是否在冊、hover 迷你預覽、點擊連個人頁。
const justiceByName = new Map(justices.map((j) => [j.姓名, j]));
// ── 隨機挑件（純前端 view 選取，非資料處理）────────────────────────────────
// 有日期者才進池：避免抽到無日期的行憲前統字流水號。日期為 ISO YYYY-MM-DD。
const datedDocs = docs.filter((d) => d.日期 && /^\d{4}-\d{2}-\d{2}$/.test(d.日期));
export function pickRandomDoc(exclude) {
  const pool = exclude ? datedDocs.filter((d) => d.字號 !== exclude) : datedDocs;
  const src = pool.length ? pool : datedDocs;
  return src[Math.floor(Math.random() * src.length)]?.字號 ?? null;
}
// 與今天同月日者隨機取一；無則取日曆日環形距離最近者（跨年首尾相接）。
export function pickOnThisDay() {
  const now = new Date();
  const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const same = datedDocs.filter((d) => d.日期.slice(5) === mmdd);
  if (same.length) return same[Math.floor(Math.random() * same.length)].字號;
  const dayOf = (s) => {
    const [, m, day] = s.split('-').map(Number);
    return (m - 1) * 31 + day; // 粗略序位即可，只用來比環形遠近
  };
  const target = dayOf(`0000-${mmdd}`);
  const RING = 12 * 31;
  const dist = (v) => { const d = Math.abs(v - target); return Math.min(d, RING - d); };
  let best = null;
  let bestD = Infinity;
  for (const d of datedDocs) {
    const dd = dist(dayOf(d.日期));
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return best?.字號 ?? null;
}
// 只要顯示字號的地方都用它：連回官方頁，hover（title）顯示一句話爭點預覽。查無 doc／官方頁時退化為純文字。
export function CaseRef({ 字號, className = '' }) {
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
// 大法官姓名 → 個人頁的活連結（案件↔大法官雙向聯動）。在冊者：可點連 ?tab=justices&j=名，
// hover 掀迷你浮窗（屆次/任期・提名總統・意見書數），浮窗本身亦可點進主頁；不在冊者退回純文字。
function JusticeRef({ name, className = '' }) {
  const [, setParams] = useSearchParams();
  const j = justiceByName.get(name);
  if (!j) return <span className={className}>{name}</span>;
  const go = () => setParams({ tab: 'justices', j: name });
  const tenure = j.屆次?.length
    ? j.屆次.join('、')
    : (j.任期?.length ? j.任期.map(formatTenureRange).join('；') : '');
  const ops = (j.提出意見書 ?? 0) + (j.加入意見書 ?? 0);
  return (
    <span className="relative inline-block group/j">
      <button
        onClick={go}
        className={`underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)] ${className}`}
      >
        {name}
      </button>
      <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-max max-w-[260px] group-hover/j:block">
        <button
          onClick={go}
          className="pointer-events-auto block rounded-lg border border-[var(--cc-border)] bg-white px-3 py-2 text-left shadow-lg"
        >
          <span className="block text-[13px] font-bold text-[var(--cc-ink-strong)]">{name}</span>
          {tenure ? <span className="mt-0.5 block text-[11.5px] text-[var(--cc-ink-mid)]">{tenure}</span> : null}
          <span className="mt-0.5 block text-[11.5px] text-[var(--cc-ink-soft)]">
            {j.提名總統 ? `${j.提名總統}提名` : ''}
            {j.提名總統 && ops ? '・' : ''}
            {ops ? `意見書 ${ops}` : ''}
          </span>
          <span className="mt-1 block text-[11px] font-bold text-[var(--cc-accent)]">開啟大法官主頁 →</span>
        </button>
      </span>
    </span>
  );
}
// 釋憲文件類型 ↔ 制度沿革機關階段 的單一對應表：同一機關作成的文件與其沿革階段共用 --cat-* 分類色位，
// 讓「案件時間軸」的色條與「制度沿革」四段對得起來：解釋(釋字)＝大法官階段、判決/裁定＝憲法法庭階段(憲判)、
// 最高法院解字、司法院院字/院解字各自成段；四段在同一條合併時間軸相接。
export const ERA_TONE = { 大理院: 6, 最高法院: 8, 司法院: 4, 釋字: 7, 憲判: 2 };
// 年度密度堆疊條＝淡底＋ink 細線：解釋吃 釋字 色位（rose，維持頁面 rose 識別）、判決吃 憲判 色位（blue），
// 兩者與沿革同機關階段同色；實體裁定同屬憲法法庭時期、另給 green 以在堆疊中可辨。大面積吃淡底 -bg、境界與圖例用 ink -tx。
const TYPE_TONE = { 解釋: ERA_TONE.釋字, 判決: ERA_TONE.憲判, 實體裁定: 3 };
const typeInk = (k) => `var(--cat-${TYPE_TONE[k]}-tx)`;
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
// ── 審查結論類型學（6 軸，draft-3）─────────────────────────────────────────
// 來源：constitutional-court-research-data/data/materials/審查結論類型學.json（編碼本）＋
// data/processed/審查結論類型.json（逐件貼標）。快照每件的 `結論類型` 欄只涵蓋「大法官釋字＋憲法法庭
// 憲判」中粗軸判不出的『待人工』殘餘（196 件，均 agent 逐件雙盲覆核）；其餘已由粗軸分好的行憲後案件
// 沒有細軸值。本頁對後者以粗軸換算 A 軸（resolveA 的 bridge 分支），換算件與 agent 覆核件明確以來源
// 標記區分；C／E／完整 B／D 只有 agent 覆核件才有。
export const TYPO_AXES = [
  { id: 'A', name: '處分模式', multi: false },
  { id: 'B', name: '違憲處分技術', multi: true },
  { id: 'C', name: '標的類型', multi: false },
  { id: 'D', name: '對前解釋關係', multi: true },
  { id: 'E', name: '救濟與後續', multi: true },
  { id: 'F', name: '解釋權能', multi: true },
];
const TYPO_LABEL = {
  'A-P1': '單純合憲', 'A-P2': '合憲性限縮', 'A-P3': '合憲附警告', 'A-P4': '違憲宣告', 'A-P5': '純解釋',
  'A-P6': '權限歸屬宣告', 'A-P7': '程序／暫時處分', 'A-P8': '不受理／程序駁回', 'A-P9': '位階審查（準據法律）',
  'B-B1': '即時失效', 'B-B2': '定期失效', 'B-B3': '未定失效時點', 'B-B4': '排除適用', 'B-B5': '連帶失效', 'B-B6': '部分違憲', 'B-B7': '漏未規定型違憲',
  'C-T1': '法律', 'C-T2': '命令／函釋', 'C-T3': '判例／決議', 'C-T4': '憲法條文／機關權限', 'C-T5': '法律涵義', 'C-T6': '審判權／管轄', 'C-T7': '涵攝／事實定性', 'C-T8': '前解釋（作為客體）',
  'D-D1': '補充前解釋', 'D-D2': '變更前解釋', 'D-D3': '維持／援用', 'D-D4': '訂正／澄清', 'D-D5': '區別／不予適用',
  'E-E1': '課予修法義務', 'E-E2': '過渡／暫時規則', 'E-E3': '個案救濟', 'E-E4': '裁判憲法審查救濟', 'E-E5': '框架性立法指示', 'E-E6': '部分不受理',
  'F-F1': '憲法解釋', 'F-F2': '統一解釋',
};
export const typoLabel = (code) => TYPO_LABEL[code] ?? code;
// A 軸呈現順序（合憲→違憲→位階→解釋→權限→程序）與 badge 色調。
export const A_ORDER = ['A-P1', 'A-P2', 'A-P3', 'A-P4', 'A-P9', 'A-P5', 'A-P6', 'A-P7', 'A-P8'];
const A_TONE = {
  'A-P1': 'green', 'A-P2': 'green', 'A-P3': 'gold', 'A-P4': 'red', 'A-P9': 'plum',
  'A-P5': 'teal', 'A-P6': 'blue', 'A-P7': 'slate', 'A-P8': 'slate',
};
// 一件的細軸值攤平成 [{axis,code}]（僅 agent 覆核件；供篩選與 chip 呈現）。
export function typoValues(d) {
  const ty = d.結論類型;
  if (!ty) return [];
  const out = [];
  for (const { id, multi } of TYPO_AXES) {
    const v = ty[id];
    if (multi) (v ?? []).forEach((c) => out.push({ axis: id, code: c }));
    else if (v) out.push({ axis: id, code: v });
  }
  return out;
}
export function Badge({ children, tone = 'slate' }) {
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

export function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function citeString(d) {
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

export function toBibtex(list) {
  return list
    .map((d) => {
      const year = d.日期 ? d.日期.slice(0, 4) : '';
      return `@misc{${bibKey(d)},\n  title = {${citeString(d).replace(/（.*?）/, '')}},\n  year = {${year}},\n  note = {${d.日期 ?? ''}${d.爭點 ? '，' + d.爭點.slice(0, 60) : ''}},\n  howpublished = {\\url{${d.官方頁}}}\n}`;
    })
    .join('\n\n');
}

export function toCsv(list) {
  const esc = (s) => `"${String(s ?? '').replaceAll('"', '""')}"`;
  const head = ['字號', '類型', '日期', '主題', '原理原則', '審查結論', '意見書數', '官方頁'];
  const rows = list.map((d) =>
    [d.字號, d.類型, d.日期, d.主題.join('；'), d.原理原則.join('；'), d.審查結論?.結論, d.意見書.length, d.官方頁].map(esc).join(','),
  );
  return '﻿' + [head.join(','), ...rows].join('\n');
}

export function toManifest(list) {
  return JSON.stringify(
    {
      說明: '離線批次下載用的案件索引（字號、官方頁、意見書與立場表下載網址）。',
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

function OpinionLine({ op, officialUrl, pdfMode }) {
  const who =
    op.作者類別 === '大法官'
      ? `${(op.提出 ?? []).join('、')}${op.加入?.length ? `（${op.加入.join('、')}加入）` : ''}`
      : (op.文件名 ?? '').replace(/\.(pdf|doc|docx)$/i, '');
  // 內嵌記錄（早期釋字，意見書全文嵌在官方頁正文）沒有 PDF，連官方頁；PDF 依模式走預覽代理。
  const href = op.下載網址 ? pdfHref(op.下載網址, pdfMode) : (op.內嵌 ? officialUrl : undefined);
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Badge tone={op.類型.includes('不同') ? 'red' : op.類型.includes('協同') ? 'blue' : 'slate'}>{op.類型}</Badge>
      {op.作者類別 !== '大法官' ? <Badge tone="slate">{op.作者類別}</Badge> : null}
      {op.作者類別 === '大法官' ? (
        <span className="text-[13px] font-bold text-[var(--cc-ink-strong)]">
          {(op.提出 ?? []).map((nm, i) => (
            <React.Fragment key={nm}>{i > 0 ? '、' : ''}<JusticeRef name={nm} /></React.Fragment>
          ))}
          {op.加入?.length ? (
            <>（{op.加入.map((nm, i) => (
              <React.Fragment key={nm}>{i > 0 ? '、' : ''}<JusticeRef name={nm} /></React.Fragment>
            ))}加入）</>
          ) : null}
        </span>
      ) : (
        <span className="text-[13px] font-bold text-[var(--cc-ink-strong)]">{who}</span>
      )}
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
    pre1947Promise = import('../../data/constitutionalCourt-pre1947-fulltext.json')
      .then((m) => { pre1947Cache = m.default; return pre1947Cache; })
      .catch(() => ({}));
  }
  return pre1947Promise;
}

// 理由書全文懶載：主 JSON 只放主文，展開卡片「理由書」才動態 import 全文檔（只抓一次、全卡共享快取）。
let reasoningCache = null;
let reasoningPromise = null;
function loadReasoning() {
  if (reasoningCache) return Promise.resolve(reasoningCache);
  if (!reasoningPromise) {
    reasoningPromise = import('../../data/constitutionalCourt-reasoning-fulltext.json')
      .then((m) => { reasoningCache = m.default; return reasoningCache; })
      .catch(() => ({}));
  }
  return reasoningPromise;
}
// 全域偏好開關（localStorage 持久、跨 session）：比照 useFontScale 的 canvaslab: 前綴。
// 理由書預設展開（ccReasoningDefault）與 PDF 預覽模式（pdfMode）共用此 hook。
export function usePref(key, fallback) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem('canvaslab:' + key); if (s !== null) return JSON.parse(s); } catch { /* ignore */ }
    return fallback;
  });
  useEffect(() => {
    try { localStorage.setItem('canvaslab:' + key, JSON.stringify(v)); } catch { /* ignore */ }
  }, [key, v]);
  return [v, setV];
}
// PDF 連結：預覽模式把強制 attachment 下載、無 CORS 的官方 PDF 改走同源代理 /api/pdf
// （inline，新分頁瀏覽器原生預覽）；下載模式或非白名單連結一律原樣直連。
// 白名單三形態（與 api/_pdfProxy.mjs 對齊）：憲法法庭 download.aspx、總統府 File/Doc
// （被提名人自傳/簡歷）、web.archive.org 對總統府已撤檔者的原始回放。
const PDF_PROXYABLE = /(^https:\/\/cons\.judicial\.gov\.tw\/download\/download\.aspx)|(^https:\/\/www\.president\.gov\.tw\/File\/Doc\/)|(^https:\/\/web\.archive\.org\/web\/\d{14}id_\/https:\/\/www\.president\.gov\.tw\/File\/Doc\/)/i;
export function pdfHref(url, mode) {
  if (mode !== 'preview' || !url || !PDF_PROXYABLE.test(url)) return url;
  return `/api/pdf?url=${encodeURIComponent(url)}`;
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
export function CaseCard({ d, q, reasoningDefault, pdfMode }) {
  const [full, setFull] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const showFull = async () => {
    if (full || loadingFull) return;
    setLoadingFull(true);
    const m = await loadPre1947();
    setFull(m[d.字號] ?? { 主文: d.主文 });
    setLoadingFull(false);
  };
  // 理由書（行憲後）：初值取全域預設（僅新卡受全域切換影響）；開啟時懶載全文檔。
  const hasReasoning = !d.系列 && !!d.有理由書; // 行憲前走「全文」機制；無理由書全文（如釋字 1–79）不顯示理由書按鈕
  const [showReason, setShowReason] = useState(reasoningDefault && hasReasoning);
  const [reason, setReason] = useState(null); // null=未載；{理由書,來源}｜{none:true}
  const [loadingReason, setLoadingReason] = useState(false);
  useEffect(() => {
    // 注意：deps 不含 loadingReason——否則 setLoadingReason(true) 觸發 re-run，cleanup 會把進行中的
    // promise alive 設 false，setReason 永不執行、卡在載入中。loadReasoning() 本身有快取，重入無害。
    if (!showReason || reason || !hasReasoning) return;
    let alive = true;
    setLoadingReason(true);
    loadReasoning().then((m) => { if (alive) { setReason(m[d.字號] ?? { none: true }); setLoadingReason(false); } });
    return () => { alive = false; };
  }, [showReason, reason, hasReasoning, d.字號]);
  // 全域「理由書預設展開/收合」切換要驅動所有已掛載卡片（原本只影響之後新出現的卡）：
  // reasoningDefault 一變就同步 showReason。之後仍可逐卡自行開合，直到下次全域切換。
  useEffect(() => { if (hasReasoning) setShowReason(reasoningDefault); }, [reasoningDefault, hasReasoning]);
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
        {d.結論類型?.A ? (
          <Badge tone={A_TONE[d.結論類型.A] ?? 'slate'}>{typoLabel(d.結論類型.A)}</Badge>
        ) : d.審查結論?.結論 && d.審查結論.結論 !== '未分類' ? (
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

      {/* 案名：憲判官方字號後的【…】案名（如「刑事訴訟上訴不可分原則適用範圍案」）。釋字無此欄。
          自成一行的短標題，不擠進上方已滿的字號＋徽章列。 */}
      {d.案名 ? (
        <p className="mt-1 text-[14px] font-bold leading-snug text-[var(--cc-ink-strong)]">{hl(d.案名, q)}</p>
      ) : null}

      {d.結論類型 && typoValues(d).some((v) => v.axis !== 'A') ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5" title={d.結論類型.依據 || undefined}>
          {typoValues(d).filter((v) => v.axis !== 'A').map((v) => (
            <span key={v.axis + v.code} className="inline-flex items-center gap-1 rounded border border-[var(--cc-border)] bg-[var(--cc-hover-bg)] px-1.5 py-0.5 text-[10.5px] text-[var(--cc-ink-mid)]">
              <span className="font-bold text-[var(--cc-eyebrow)]">{v.axis}</span>{typoLabel(v.code)}
            </span>
          ))}
          {d.結論類型.標註方式 ? (
            <span className="text-[10px] text-[var(--cc-ink-soft)]">類型學・{d.結論類型.標註方式}{d.結論類型.信心 ? `／${d.結論類型.信心}` : ''}</span>
          ) : null}
        </div>
      ) : null}

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
              <strong className="text-[var(--cc-accent)]">主筆</strong>　<JusticeRef name={d.主筆} />
            </span>
          ) : null}
          {/* 審判長（憲判）＝主持評議者，依法為司法院院長，程序性、資訊量低，故僅以弱化樣式呈現、
              且只在憲判顯示（釋字的「主席」同為院長、813 件全有，掛上去只是雜訊，不顯示）；
              主筆才是實質作者。名字仍可點連個人頁。 */}
          {d.審判長 ? (
            <span className="mr-4">
              <strong className="text-[var(--cc-eyebrow)]">審判長</strong>　<JusticeRef name={d.審判長} />
            </span>
          ) : null}
          {d.參與大法官?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">參與大法官</strong>{'　'}
              {d.參與大法官.map((nm, i) => (
                <React.Fragment key={nm}>{i > 0 ? '、' : ''}<JusticeRef name={nm} /></React.Fragment>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}

      {d.意見書.length ? (
        <div className="mt-3 rounded-lg bg-[var(--cc-opinion-bg)] px-3 py-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">意見書 {d.意見書.length} 份</p>
          {d.意見書.map((op, i) => (
            <OpinionLine key={i} op={op} officialUrl={d.官方頁} pdfMode={pdfMode} />
          ))}
        </div>
      ) : null}

      {hasReasoning ? (
        <div className="mt-3">
          <button
            onClick={() => setShowReason((v) => !v)}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"
          >
            <BookOpen size={12} />
            {showReason ? '收合理由書' : (d.類型 === '判決' ? '展開理由' : '展開解釋理由書')}
            <ChevronDown size={12} className={showReason ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
          {showReason ? (
            loadingReason ? (
              <p className="mt-2 text-[13px] text-[var(--cc-ink-soft)]">載入理由書中…</p>
            ) : reason?.none ? (
              <p className="mt-2 text-[13px] text-[var(--cc-ink-soft)]">此件無獨立理由書（早期釋字理由多併於解釋文）。</p>
            ) : reason ? (
              <div className="mt-2 rounded-lg bg-[var(--cc-opinion-bg)] px-3.5 py-2.5" onDoubleClick={() => setShowReason(false)} title="雙擊此區即可收合理由書">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">{d.類型 === '判決' ? '理由' : '解釋理由書'}</p>
                {splitClauses(reason.理由書).map((para, i) => (
                  <p key={i} className="mt-1.5 max-w-4xl whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">{hl(para, q)}</p>
                ))}
              </div>
            ) : null
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px]">
        <a href={d.官方頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
          {d.系列 ? '維基文庫原文（彙編校勘本）' : '官方頁面（全文、理由書與下載）'} <ExternalLink size={11} />
        </a>
        {d.立場表下載 ? (
          <a href={pdfHref(d.立場表下載, pdfMode)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]">
            主文立場表 PDF <ExternalLink size={11} />
          </a>
        ) : null}
      </div>
    </article>
  );
}
// 案件浮層（?doc=字號）：隨機挑件與意見書預覽共用。主體重用 CaseCard，故列出該案全部意見書。
export function DocSpotlight({ 字號, onClose, onPick, onViewIndex }) {
  const [pdfMode] = usePref('pdfMode', 'preview');
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden'; // 浮層開啟時鎖背景捲動
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const d = docByNo.get(字號);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-[6vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={CC_VARS}
    >
      <div
        className="relative w-full max-w-4xl rounded-xl border border-[var(--cc-line)] bg-[var(--cc-bg)] px-5 pb-5 pt-2 shadow-2xl sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 不另設頂欄橫條（尖角與圓角浮窗不搭、且與卡片割裂）：關閉鈕做成浮窗右上角的一體式圖示，
            捲動時隨浮窗內容一起走；底欄另備關閉，ESC／點背板亦可關。 */}
        <button onClick={onClose} aria-label="關閉"
          className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-lg bg-[var(--cc-bg)]/85 px-2 py-1 text-[12px] font-bold text-[var(--cc-accent)] backdrop-blur hover:bg-[var(--cc-hover-bg)]">
          <X size={14} />關閉
        </button>

        {d ? (
          <CaseCard d={d} q="" reasoningDefault={false} pdfMode={pdfMode} />
        ) : (
          <p className="py-8 text-[14px] text-[var(--cc-ink-mid)]">查無「{字號}」這一件。</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--cc-line)] pt-3 text-[12px]">
          <button onClick={() => onPick(pickRandomDoc(字號))} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
            <Shuffle size={12} />再抽一則
          </button>
          <button onClick={() => onPick(pickOnThisDay())} title="與今天同日期的解釋／判決" aria-label="與今天同日期的解釋／判決" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
            <CalendarClock size={13} />
          </button>
          {d ? (
            <button onClick={() => onViewIndex(字號)} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
              <Search size={12} />在索引中檢視
            </button>
          ) : null}
          {d ? (
            <a href={d.官方頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
              官方頁 <ExternalLink size={11} />
            </a>
          ) : null}
          <button onClick={onClose} aria-label="關閉" className="ml-auto inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
            <X size={12} />關閉
          </button>
        </div>
      </div>
    </div>
  );
}
export function Select({ label, value, onChange, options }) {
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
// 頂部行憲前後大分段鈕（醒目切換，非埋在下拉裡）。
export function SegControl({ value, onChange, options }) {
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
// 提名總統著色。2026-07-08 改吃全站語意色 token 的分類色 --cat-1..8：原本這 8 色
// 是另外硬配的一組，彩度普遍偏高（李登輝鮮綠 C0.13、馬英九鮮藍、
// 蔣中正/蔣經國/蔡英文皆 C>0.14），跟站內莫蘭迪低彩度基調格格不入——這就是使用者看到
// 的「按提名總統」那組刺眼配色。改用校準過的 --cat-* 分類色後，與出身/留學著色同一套
// 和諧色系，且由 validate:colors 鎖住明度/彩度帶。8 位主要總統配 cat-1..8（其中 cat-8
// 為 slate，給任內提名最少的李宗仁代總統），賴清德任期尚短、沿用淺灰退場不特別配色。
export const PRES_COLOR = { // token-exempt: 分類色引用 --cat-* token；退場中性用 --cc-retire-*
  蔣中正: 'var(--cat-1-tx)', '李宗仁（代）': 'var(--cat-8-tx)', 嚴家淦: 'var(--cat-4-tx)', 蔣經國: 'var(--cat-6-tx)',
  李登輝: 'var(--cat-3-tx)', 陳水扁: 'var(--cat-2-tx)', 馬英九: 'var(--cat-7-tx)', 蔡英文: 'var(--cat-5-tx)', 賴清德: 'var(--cc-retire-tx)',
};
// 大條橫條一律「淡底＋ink 細框」：深墨 ink 只留給邊框與圖例點，大面積填近白淡底。
// 由任一 ink token（--cat-N-tx／--cc-retire-tx）機械導出同色相的近白底（把 -tx 換成 -bg），大條吃淡底。
export const inkToFill = (v) => (v && v.includes('-tx)') ? v.replace('-tx)', '-bg)') : 'var(--cc-track)');
// 起訖範圍的 en dash 兩側加空格，跟日期本身的 "-" 分隔開，避免視覺上分不清哪個是範圍分隔符
export function formatTenureRange(t) {
  const role = t.職 !== '大法官' ? `${t.職} ` : '';
  return `${role}${formatDateRange(t.起, t.訖)}`;
}
// 熱圖單一色相深淺（量的編碼）：頁面主色 plum，sqrt 比例讓低值仍可辨。TopicHeatmaps 與
// ResearchProblem（HeatStrip/OpinionCoverage）共用同一套色階，故置於共用層。
export const heatFill = (v, max) => (v ? `hsl(338 34% ${94 - 58 * Math.sqrt(v / max)}%)` : 'var(--cc-heat-zero)');
