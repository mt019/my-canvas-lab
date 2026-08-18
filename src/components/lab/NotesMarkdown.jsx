/*
 * 極簡 markdown 渲染，給「一頁裡嵌一份筆記／短文」的場合：兩層標題（##、###）、
 * 素清單、表格列、**粗體**。完整長文仍走 MDX，這裡只管不值得建置管線的小份文字。
 *
 * 正文字級與別處的正文一樣是 18px（--text-body）：這個元件畫的是一份筆記的內文，不是附註，
 * 先前寫 text-token-sm，於是同一個站裡從別的分頁切過來會矮一級。
 *
 * 標題一律帶 id（nh-<區塊序>）——右欄目次（useHeadings）只列有 id 的標題，
 * 頁面自己手刻標題就會漏掉這件事，於是目次整條收起來、讀者不知道少了什麼。
 * 用這個元件渲染的筆記，目次自動出現，不必每頁重接一次。
 */
export function mdInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((piece, i) =>
    piece.startsWith('**') && piece.endsWith('**')
      ? <strong key={i} className="font-bold text-ink">{piece.slice(2, -2)}</strong>
      : piece,
  );
}

export default function NotesMarkdown({ raw }) {
  const blocks = [];
  let buf = [];
  const flush = (kind) => {
    if (!buf.length) return;
    blocks.push({ kind, lines: buf });
    buf = [];
  };
  let mode = 'p';
  for (const line of raw.split('\n')) {
    const t = line.trimEnd();
    if (!t.trim()) { flush(mode); mode = 'p'; continue; }
    if (/^# /.test(t)) { flush(mode); continue; }
    if (/^### /.test(t)) { flush(mode); blocks.push({ kind: 'h4', lines: [t.slice(4)] }); continue; }
    if (/^## /.test(t)) { flush(mode); blocks.push({ kind: 'h3', lines: [t.slice(3)] }); continue; }
    if (t.startsWith('- ')) { if (mode !== 'ul') flush(mode); mode = 'ul'; buf.push(t.slice(2)); continue; }
    if (t.startsWith('|')) { if (mode !== 'table') flush(mode); mode = 'table'; buf.push(t); continue; }
    if (mode !== 'p') { flush(mode); mode = 'p'; }
    buf.push(t);
  }
  flush(mode);
  return (
    <div className="max-w-3xl">
      {blocks.map((b, i) => {
        if (b.kind === 'h3') return <h3 key={i} id={`nh-${i}`} className="mt-10 font-display text-token-lg leading-snug">{b.lines[0]}</h3>;
        if (b.kind === 'h4') return <h4 key={i} id={`nh-${i}`} className="mt-8 font-serif text-token-body font-bold leading-snug">{b.lines[0]}</h4>;
        if (b.kind === 'ul') return (
          <ul key={i} className="mt-4 list-disc space-y-2 pl-5">
            {b.lines.map((li) => <li key={li.slice(0, 16)} className="text-token-body leading-[1.8] text-ink-muted">{mdInline(li)}</li>)}
          </ul>
        );
        if (b.kind === 'table') return (
          <div key={i} className="mt-4 overflow-x-auto">
            <table className="border-collapse text-token-sm text-ink-muted">
              <tbody>
                {b.lines.filter((r) => !/^[|\s:-]+$/.test(r)).map((row) => (
                  <tr key={row.slice(0, 24)} className="border-b border-line-soft">
                    {row.split('|').slice(1, -1).map((cell, ci) => (
                      <td key={ci} className="py-2 pr-5 align-top leading-[1.8]">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        return <p key={i} className="mt-4 text-token-body leading-[1.85] text-ink-muted">{mdInline(b.lines.join(''))}</p>;
      })}
    </div>
  );
}
