import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
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
        const u = resolveTarget(q.get('url') || undefined)
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
      // remarkGfm 為了手記裡的舊文而加（2026-07-29）：Matters 的 <s> 標籤轉成 markdown 是
      // ~~刪除線~~，而 CommonMark 沒有刪除線，少了它會原樣顯示成波浪號。加它之前先量過：
      // 站上當時 51 篇 .mdx 加與不加的編譯輸出完全相同（0 位元組差），77 篇舊文草稿也只有
      // 帶 <s> 的那 4 篇有變化；作者打字拖長音的 `拜托~~~`、`笑~~~` 不是合法的刪除線標記，
      // gfm 不會動它們。順帶啟用表格、裸網址自動連結、註腳。
      remarkPlugins: [remarkMath, remarkGfm],
      rehypePlugins: [rehypeSlug, rehypeKatex],
    }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    pdfProxyDev(),
  ],
  // 大型 JSON 快照（憲法法庭 7MB）輸出成 JSON.parse("字串") 而非 JS 物件字面量：
  // V8 解析字串裡的 JSON 比解析同等大小的物件字面量快得多，預先渲染每頁都要付一次
  // 這筆解析成本。代價是 JSON 不能用 named import——全站都是 default import，安全。
  json: { stringify: true },
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
