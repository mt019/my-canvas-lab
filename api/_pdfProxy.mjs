// 官方 PDF 代理的共用核心：Vercel function（api/pdf.js）與 vite dev middleware 共用，避免兩份邏輯漂移。
// 白名單防開放式代理/SSRF，僅允許：
// 1. cons.judicial.gov.tw 的 /download/download.aspx（判決／意見書／立場表）
// 2. www.president.gov.tw 的 /File/Doc/<GUID>（大法官被提名人自傳／簡歷，108年批仍在線）
// 3. web.archive.org 的 /web/<ts>id_/https://www.president.gov.tw/File/Doc/<GUID>
//    （112年批官網已撤檔，走網際網路檔案館原始回放；id_ 帶原站 attachment header，仍需本代理改 inline）
export const ALLOW_HOST = 'cons.judicial.gov.tw';
const GUID = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}';
const ALLOW = [
  { host: ALLOW_HOST, path: /\/download\/download\.aspx$/i },
  { host: 'www.president.gov.tw', path: new RegExp(`^/File/Doc/${GUID}$`, 'i') },
  { host: 'web.archive.org', path: new RegExp(`^/web/\\d{14}id_/https://www\\.president\\.gov\\.tw/File/Doc/${GUID}$`, 'i') },
];

// 回傳合法的官方 PDF URL 物件；非法則 null。
export function resolveTarget(url, id) {
  const raw = url || (id ? `https://${ALLOW_HOST}/download/download.aspx?id=${id}` : '');
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  return ALLOW.some((r) => u.host === r.host && r.path.test(u.pathname)) ? u : null;
}

// 伺服器端抓 PDF，回 { ok, status, buf }。
export async function fetchPdf(u) {
  const upstream = await fetch(u.href, { headers: { 'User-Agent': 'Mozilla/5.0 (canvas-lab pdf proxy)' } });
  if (!upstream.ok) return { ok: false, status: 502 };
  return { ok: true, status: 200, buf: Buffer.from(await upstream.arrayBuffer()) };
}
