import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
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
  plugins: [
    // MDX must run before the React plugin (enforce: 'pre'): it turns .mdx into
    // JSX, which the React plugin then compiles. Math in prose is written as
    // $…$ / $$…$$ and compiled to KaTeX HTML at build time, so no Unicode math
    // character ever enters the source (see scripts/validate-math-notation.mjs).
    // mdExtensions: [] — MDX must claim .mdx only. By default it also compiles
    // .md, which would turn `import report from './x.md?raw'` (a plain string
    // the page renders itself) into a component, and the page breaks.
    { enforce: 'pre', ...mdx({
      providerImportSource: '@mdx-js/react',
      mdExtensions: [],
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeSlug, rehypeKatex],
    }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    pdfProxyDev(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Pull the libraries every route loads (React, the router, the icon set)
        // into one stable chunk. It's hashed only when those deps change, so a
        // normal redeploy re-downloads just the small app code, not the runtime.
        // Per-page libraries (KaTeX, the graph lib) are left untouched so Vite
        // keeps them in their own lazy page chunks rather than loading them here.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|lucide-react)[\\/]/.test(id)) {
            return 'react-vendor';
          }
        },
      },
    },
  },
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
