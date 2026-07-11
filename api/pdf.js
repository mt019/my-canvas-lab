// 同源 PDF 代理（Vercel serverless）：伺服器端抓官方判決／意見書／立場表／提名文件 PDF，
// 以 Content-Disposition: inline 同源回傳，讓「預覽」模式在新分頁用瀏覽器原生 PDF viewer
// 開啟而非強制下載（官方來源帶 attachment 且無 CORS header，純前端抓不到）。
// 核心與白名單見 api/_pdfProxy.mjs（dev middleware 共用）。用法：/api/pdf?url=… 或 ?id=…
import { resolveTarget, fetchUpstream, streamPdf } from './_pdfProxy.mjs';

// 上游邊收邊轉（不整份 buffer）：TTFB 從「上游全檔下載完」降到「上游首個 chunk」。
export const config = { supportsResponseStreaming: true };

// 官方 PDF 內容不變動：瀏覽器快取 1 天、Vercel edge 快取 7 天＋過期後先回舊檔背景更新，
// 重複開啟直接命中 edge，不再繞函式。注意每次「部署」會清空 edge 快取，部署後首開必冷。
// 函式本體固定在 hnd1（東京，見 vercel.json regions）——預設 iad1（美東）時每次開檔都是
// 台灣→美東→台灣 兩趟跨洋，是最初「預覽很慢」的主因。
const CACHE = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800';

export default async function handler(req, res) {
  const u = resolveTarget(req.query.url, req.query.id);
  if (!u) { res.status(403).send('forbidden target'); return; }
  try {
    const upstream = await fetchUpstream(u);
    if (!upstream.ok || !upstream.body) { res.status(502).send(`upstream ${upstream.status}`); return; }
    await streamPdf(upstream, res, CACHE);
  } catch {
    if (!res.headersSent) res.status(502).send('fetch failed');
    else res.end();
  }
}
