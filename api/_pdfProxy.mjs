// 官方 PDF 代理的共用核心：Vercel function（api/pdf.js）與 vite dev middleware 共用，避免兩份邏輯漂移。
// 白名單防開放式代理/SSRF，僅允許：
// 1. cons.judicial.gov.tw 的 /download/download.aspx（判決／意見書／立場表）
// 2. www.president.gov.tw 的 /File/Doc/<GUID>（大法官被提名人自傳／簡歷，108年批仍在線）
// 3. web.archive.org 的 /web/<ts>id_/https://www.president.gov.tw/File/Doc/<GUID>
//    （112年批官網已撤檔，走網際網路檔案館原始回放；id_ 帶原站 attachment header，仍需本代理改 inline）
// 4. publication.iias.sinica.edu.tw 的任何 .pdf 路徑（中研院法研所出版品：根層與 /journal/、/books/ 子路徑）
export const ALLOW_HOST = 'cons.judicial.gov.tw';
const GUID = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}';
const ALLOW = [
  { host: ALLOW_HOST, path: /\/download\/download\.aspx$/i },
  { host: 'www.president.gov.tw', path: new RegExp(`^/File/Doc/${GUID}$`, 'i') },
  { host: 'web.archive.org', path: new RegExp(`^/web/\\d{14}id_/https://www\\.president\\.gov\\.tw/File/Doc/${GUID}$`, 'i') },
  { host: 'publication.iias.sinica.edu.tw', path: /\.pdf$/i },
];

// 回傳合法的官方 PDF URL 物件；非法則 null。
export function resolveTarget(url, id) {
  const raw = url || (id ? `https://${ALLOW_HOST}/download/download.aspx?id=${id}` : '');
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
