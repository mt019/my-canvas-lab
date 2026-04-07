import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Rocket, ChevronRight, Github, ExternalLink } from 'lucide-react';

// 自動掃描 pages
const pages = import.meta.glob('./pages/*.{jsx,tsx}');

const routes = Object.keys(pages).map((path) => {
  const name = path.split('/').pop().replace(/\.(jsx|tsx)$/, '');
  // 隨機分配一個 Emoji 增加美感
  const icons = ['📊', '🛠️', '🎨', '🧠', '🎮', '📱', '🔋', '🔮'];
  const randomIcon = icons[Math.abs(name.length) % icons.length];
  
  return {
    name,
    icon: randomIcon,
    path: `/${name.toLowerCase()}`,
    component: lazy(pages[path]),
  };
});

function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* 背景裝飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                <Rocket className="text-white" size={24} />
              </div>
              <span className="text-blue-400 font-bold tracking-widest uppercase text-sm">AI Canvas Lab</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              我的 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">數位實驗室</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              這裡存放著所有由 Gemini 協作生成的互動式網頁與實驗專案。
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
             <a href="https://github.com" target="_blank" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
               <Github size={20} />
             </a>
          </div>
        </header>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.length > 0 ? (
            routes.map((route) => (
              <Link 
                key={route.path} 
                to={route.path}
                className="group relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all duration-300 backdrop-blur-sm overflow-hidden"
              >
                {/* 裝飾線條 */}
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                
                <div className="flex justify-between items-start mb-4">
                  <span className="text-4xl">{route.icon}</span>
                  <ChevronRight className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" size={20} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {route.name}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  點擊以查看此 Canvas 專案的完整互動效果與數據拆解。
                </p>
                
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Deployment
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <LayoutGrid size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500">等待作品搬遷中，請在 src/pages 建立 .jsx 檔案</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          Built with React & Tailwind • Powered by Gemini AI
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<route.component />} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
}
