export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const target = new URL('https://search.opentix.life/search');
  target.search = incoming.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cookie');
  const init = { method: request.method, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;
  try {
    const response = await fetch(target, init);
    const outgoing = new Headers(response.headers);
    outgoing.delete('set-cookie');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outgoing });
  } catch {
    return new Response('upstream unavailable', { status: 502 });
  }
}
