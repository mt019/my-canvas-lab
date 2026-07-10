// 同源 PDF 代理（Vercel serverless）：伺服器端抓官方判決／意見書／立場表 PDF，
// 以 Content-Disposition: inline 同源回傳，讓「預覽」模式在新分頁用瀏覽器原生 PDF viewer
// 開啟而非強制下載（官方 download.aspx 帶 attachment 且無 CORS header，純前端抓不到）。
// 核心與白名單見 api/_pdfProxy.mjs（dev middleware 共用）。用法：/api/pdf?url=… 或 ?id=…
import { resolveTarget, fetchPdf } from './_pdfProxy.mjs';

export default async function handler(req, res) {
  const u = resolveTarget(req.query.url, req.query.id);
  if (!u) { res.status(403).send('forbidden target'); return; }
  try {
    const out = await fetchPdf(u);
    if (!out.ok) { res.status(out.status).send(`upstream ${out.status}`); return; }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    // 官方 PDF 內容不變動：瀏覽器快取 1 天、Vercel edge 快取 7 天＋過期後先回舊檔背景更新，
    // 重複開啟直接命中 edge，不再繞函式。函式本體已固定在 hnd1（東京，見 vercel.json regions）
    // ——預設 iad1（美東）時每次開檔都是 台灣→美東→台灣 兩趟跨洋，是「預覽很慢」的主因。
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
    res.status(200).send(out.buf);
  } catch {
    res.status(502).send('fetch failed');
  }
}
