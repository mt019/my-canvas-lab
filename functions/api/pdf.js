const ALLOW = [
  { host: 'publication.iias.sinica.edu.tw', path: /\.pdf$/i },
  { host: 'github.com', path: /^\/mt019\/my-canvas-lab\/releases\/download\/[^/]+\/[^/]+\.pdf$/i },
];

function resolveTarget(raw) {
  let url;
  try { url = new URL(raw || ''); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  return ALLOW.some((rule) => url.host === rule.host && rule.path.test(url.pathname)) ? url : null;
}

export async function onRequest({ request }) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const target = resolveTarget(new URL(request.url).searchParams.get('url'));
  if (!target) return new Response('forbidden target', { status: 403 });
  try {
    const upstream = await fetch(target.href, { method: request.method, headers: { 'User-Agent': 'Mozilla/5.0 (canvas-lab pdf proxy)' }, redirect: 'follow' });
    if (!upstream.ok || (request.method !== 'HEAD' && !upstream.body)) return new Response(`upstream ${upstream.status}`, { status: 502 });
    const headers = new Headers(upstream.headers);
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
    headers.delete('Set-Cookie');
    return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers });
  } catch {
    return new Response('fetch failed', { status: 502 });
  }
}
