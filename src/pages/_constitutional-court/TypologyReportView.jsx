import { useSearchParams } from 'react-router-dom';
import typologyReport from '../../data/typologyReport.md?raw';

// ── 類型學研究報告：最小 markdown 渲染器（無第三方依賴）──────────────────
// 報告只用 #/## 標題、GFM pipe 表格、-/1. 清單、--- 水平線、行內 **粗體** 與 `code`。
export function renderInline(text) {
  const nodes = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let key = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(<strong key={key++} className="font-bold text-[var(--cc-ink-strong)]">{m[1]}</strong>);
    } else {
      nodes.push(<code key={key++} className="rounded bg-[var(--cc-hover-bg)] px-1 text-[0.92em]">{m[2]}</code>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderTypologyMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  const isTableSep = (s) => s.includes('|') && s.includes('-') && /^\|?\s*:?-{2,}/.test(s);
  const isBlockStart = (t) =>
    t === '' || /^#{1,2} /.test(t) || /^-{3,}$/.test(t) || t.startsWith('|') || /^[-*] /.test(t) || /^\d+\. /.test(t);
  const parseRow = (s) => s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { i += 1; continue; }
    if (/^-{3,}$/.test(t)) {
      blocks.push(<hr key={`hr-${i}`} className="my-7 border-t border-[var(--cc-line)]" />);
      i += 1;
      continue;
    }
    if (t.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${i}`} className="mt-9 mb-2 text-lg font-bold text-[var(--cc-title-ink)]">{renderInline(t.slice(3))}</h2>);
      i += 1;
      continue;
    }
    if (t.startsWith('# ')) {
      blocks.push(<h1 key={`h1-${i}`} className="mb-4 text-2xl font-bold leading-snug text-[var(--cc-title-ink)]">{renderInline(t.slice(2))}</h1>);
      i += 1;
      continue;
    }
    if (t.startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1].trim())) {
      const header = parseRow(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={`tbl-${i}`} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--cc-table-border)] text-left text-[var(--cc-table-head-ink)]">
                {header.map((c, k) => <th key={k} className="py-1.5 pr-4 align-bottom font-bold">{renderInline(c)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, rk) => (
                <tr key={rk} className="border-b border-[var(--cc-row-border)] align-top">
                  {r.map((c, ck) => <td key={ck} className="py-1.5 pr-4 text-[var(--cc-ink-mid)]">{renderInline(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^[-*] /.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*] /, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="my-3 ml-5 list-disc space-y-1 text-[14px] leading-relaxed text-[var(--cc-ink-mid)]">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ul>,
      );
      continue;
    }
    if (/^\d+\. /.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="my-3 ml-5 list-decimal space-y-1 text-[14px] leading-relaxed text-[var(--cc-ink-mid)]">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ol>,
      );
      continue;
    }
    const para = [];
    while (i < lines.length && !isBlockStart(lines[i].trim())) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push(<p key={`p-${i}`} className="my-3 text-[14px] leading-relaxed text-[var(--cc-ink-mid)]">{renderInline(para.join(' '))}</p>);
  }
  return blocks;
}

// 隱蔽頁：不進 tab bar，僅由 TopicHeatmaps eyebrow 連點手勢或 ?tab=typology-report 直達。
export default function TypologyReportView() {
  const [, setParams] = useSearchParams();
  return (
    <div className="py-6">
      <button
        type="button"
        onClick={() => setParams({})}
        className="mb-5 text-[12px] font-bold text-[var(--cc-ink-soft)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]"
      >
        ← 返回索引
      </button>
      <article className="max-w-3xl">{renderTypologyMarkdown(typologyReport)}</article>
    </div>
  );
}
