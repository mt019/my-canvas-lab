/*
 * 純文字正文的編號註標——給資料層是 JSON 字串（不是 markdown）的頁面用。
 *
 * 站上已經有兩套註解：MDX 逐句包 <HoverCite> 的無編號引用（統計站），與 markdown 轉出
 * HTML 之後掛 <AnnotatedHtml> 的編號註標（wealth）。資料是 JSON 字串的頁面（德川頁的
 * 術語定義、年表事件、問答段落）兩套都接不上：沒有 MDX 可以包元件，也沒有 markdown
 * 渲染器可以在轉檔時編號。這裡補上第三條路——母本字串裡寫 [^註標 id]，渲染前換成
 * AnnotatedHtml 認得的 <sup class="fn-ref">，浮卡與章末清單都沿用既有那一套。
 *
 * 編號不寫在母本裡（與 wealth 同一條紀律）：插一條註不必回頭改後面每一個號碼。編號依
 * 「這一頁的正文出現順序」給，所以呼叫端要按渲染順序把字串交進來（見 buildNotes）。
 *
 * 找不到對應條目時原樣留著 [^id] 不吞掉：安靜消失的錯誤沒有人會發現。
 */
const MARKER = /\[\^([A-Za-z0-9_-]+)\]/g;

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ESCAPE[c]);

/**
 * 按出現順序給編號，並把讀者看得到的欄位攤平成 AnnotatedHtml 的 notes 陣列。
 *
 * @param texts 這一頁（或這一個分頁）的正文字串，順序＝渲染順序
 * @param notes 母本的註釋條目 id → { kind, ref, locator, quote, text, href }
 * @param refs  母本的出處登錄 id → { label, container, href }
 * @returns { numberOf: Map(id → 編號), entries: AnnotatedHtml 的 notes }
 */
export function buildNotes(texts, notes = {}, refs = {}) {
  const numberOf = new Map();
  const entries = [];
  for (const text of texts) {
    if (!text) continue;
    for (const [, id] of String(text).matchAll(MARKER)) {
      if (numberOf.has(id)) continue;
      const note = notes[id];
      if (!note) continue;
      const ref = note.ref ? refs[note.ref] : null;
      const n = entries.length + 1;
      numberOf.set(id, n);
      entries.push({
        n,
        id,
        label: [ref?.label, ref?.container].filter(Boolean).join('，') || note.label,
        locator: note.locator,
        quote: note.quote,
        text: note.text,
        href: note.href ?? ref?.href,
      });
    }
  }
  return { numberOf, entries };
}

/**
 * 一段母本字串換成帶註標的 HTML。字串本身當純文字逃逸——母本不寫 HTML。
 * 註標貼在標點之後由母本負責；.fn-ref 的 nowrap 讓它不會被斷到下一行單獨站著。
 */
export function noteHtml(text, numberOf) {
  return escapeHtml(text ?? '').replace(MARKER, (whole, id) => {
    const n = numberOf.get(id);
    if (!n) return whole;
    return `<sup class="fn-ref" data-note="${n}" id="fn-ref-${n}" role="button" tabindex="0">${n}</sup>`;
  });
}

/** 沒有註標的純文字（給 aria-label、目次短標這類不能帶標記的地方）。 */
export function stripNotes(text) {
  return String(text ?? '').replace(MARKER, '');
}
