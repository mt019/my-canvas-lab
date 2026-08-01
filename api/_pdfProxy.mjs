// 官方 PDF 代理的共用核心：Vercel function（api/pdf.js）與 vite dev middleware 共用，避免兩份邏輯漂移。
// 白名單防開放式代理/SSRF，僅允許：
// 1. publication.iias.sinica.edu.tw 的任何 .pdf 路徑（中研院法研所出版品：官網原生期刊 PDF）
// 2. github.com 的 my-canvas-lab Release 下載路徑（中研院出版品自有典藏：flipbook 轉存 PDF＋期刊備份，
//    消滅官網線上閱覽依賴。github.com 回 302 轉 objects.githubusercontent.com，fetch 自動跟隨、無須另列）
//
// 2026-08-02 移除三條憲法法庭專用規則（cons.judicial.gov.tw 的 /download/download.aspx、
// www.president.gov.tw 的 /File/Doc/<GUID>、web.archive.org 對後者的回放）與 `?id=` 簡寫。
// 那些網址只有已移出本倉的憲法法庭頁在送，現役副本在 phenom-court，它有自己的取用方式。
// 白名單是防開放式代理的東西，沒有頁面在用的規則就是白留一個對外開口。要接回去的話，
// 連同 scripts/validate-pdf-proxy.mjs 的對應檢查一起加。
const ALLOW = [
  { host: 'publication.iias.sinica.edu.tw', path: /\.pdf$/i },
  { host: 'github.com', path: /^\/mt019\/my-canvas-lab\/releases\/download\/[^/]+\/[^/]+\.pdf$/i },
];

// 回傳合法的官方 PDF URL 物件；非法則 null。
export function resolveTarget(url) {
  const raw = url || '';
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  return ALLOW.some((r) => u.host === r.host && r.path.test(u.pathname)) ? u : null;
}

// 伺服器端開上游連線，回 fetch Response；呼叫端自行檢查 ok 並串流 body。
// 不整份 buffer：上游（憲法法庭）TTFB 常達 2-3 秒、檔案數 MB，buffer 會讓瀏覽器
// 空等全檔下載完才收到第一個 byte；串流讓 PDF 檢視器邊收邊渲染首頁。
export async function fetchUpstream(u) {
  return fetch(u.href, { headers: { 'User-Agent': 'Mozilla/5.0 (canvas-lab pdf proxy)' } });
}

// 共用：把上游 Response 以 inline PDF 串流進 node res（Vercel function 與 vite dev middleware 同用）。
export async function streamPdf(upstream, res, cacheControl) {
  const { Readable } = await import('node:stream');
  const { pipeline } = await import('node:stream/promises');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  if (cacheControl) res.setHeader('Cache-Control', cacheControl);
  const len = upstream.headers.get('content-length');
  if (len) res.setHeader('Content-Length', len);
  await pipeline(Readable.fromWeb(upstream.body), res);
}
