// 官方 PDF 代理的共用核心：Vercel function（api/pdf.js）與 vite dev middleware 共用，避免兩份邏輯漂移。
// 只允許 cons.judicial.gov.tw 的 /download/download.aspx，防開放式代理/SSRF。
export const ALLOW_HOST = 'cons.judicial.gov.tw';

// 回傳合法的官方 PDF URL 物件；非法則 null。
export function resolveTarget(url, id) {
  const raw = url || (id ? `https://${ALLOW_HOST}/download/download.aspx?id=${id}` : '');
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' || u.host !== ALLOW_HOST || !/\/download\/download\.aspx$/i.test(u.pathname)) return null;
  return u;
}

// 伺服器端抓 PDF，回 { ok, status, buf }。
export async function fetchPdf(u) {
  const upstream = await fetch(u.href, { headers: { 'User-Agent': 'Mozilla/5.0 (canvas-lab pdf proxy)' } });
  if (!upstream.ok) return { ok: false, status: 502 };
  return { ok: true, status: 200, buf: Buffer.from(await upstream.arrayBuffer()) };
}
