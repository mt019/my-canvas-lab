import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveTarget, fetchUpstream, streamPdf } from './api/_pdfProxy.mjs'

// Dev-only：複刻 Vercel 的 /api/pdf serverless function（vite dev 不跑 Vercel functions），
// 讓本機 npm run dev 的 PDF「預覽」模式也能同源 inline＋串流。prod 走 api/pdf.js。
function pdfProxyDev() {
  return {
    name: 'pdf-proxy-dev',
    configureServer(server: any) {
      server.middlewares.use('/api/pdf', async (req: any, res: any) => {
        const q = new URL(req.url, 'http://localhost').searchParams
        const u = resolveTarget(q.get('url') || undefined, q.get('id') || undefined)
        if (!u) { res.statusCode = 403; res.end('forbidden target'); return }
        try {
          const upstream = await fetchUpstream(u)
          if (!upstream.ok || !upstream.body) { res.statusCode = 502; res.end(`upstream ${upstream.status}`); return }
          await streamPdf(upstream, res)
        } catch {
          if (!res.headersSent) { res.statusCode = 502; res.end('fetch failed') } else { res.end() }
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pdfProxyDev()],
  server: {
    proxy: {
      '/api/opentix/search': {
        target: 'https://search.opentix.life',
        changeOrigin: true,
        rewrite: () => '/search',
      },
      '/api/opentix-csm': {
        target: 'https://csm.api.opentix.life',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opentix-csm/, ''),
      },
    },
  },
})
