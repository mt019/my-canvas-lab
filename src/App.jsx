import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ArrowRight, Droplets, Mic, Music, Music2 } from 'lucide-react';

const pages = import.meta.glob('./pages/*.{jsx,tsx}');

const PAGE_META = {
  AutoTuner: {
    name: '自動調音器',
    desc: '吉他、烏克麗麗、吉他麗麗全支援，含 Open G、DADGAD 等特殊定弦',
    Icon: Music2,
    accent: '#e8d3d1',
    accentText: '#8a7a78',
  },
  UkuleleTuner: {
    name: '烏克麗麗調音器',
    desc: '視覺化品格指引，適合初學者快速對準四弦音高',
    Icon: Music,
    accent: '#d8e2dc',
    accentText: '#6d8b74',
  },
  VocalTuner: {
    name: '聲音調音器',
    desc: '即時音高偵測，以鋼琴捲軸呈現聲線的走向與起伏',
    Icon: Mic,
    accent: '#dde0f0',
    accentText: '#7a7ea8',
  },
  FuelTaxBreakdown: {
    name: '台灣油稅分析',
    desc: '逐層拆解加油站售價中的各項稅費與成本結構',
    Icon: Droplets,
    accent: '#f0e8d8',
    accentText: '#9a7e5a',
  },
};

export default function App() {
  const routes = useMemo(() => {
    return Object.keys(pages).map((path) => {
      const name = path.split('/').pop().replace(/\.(jsx|tsx)$/, '');
      return {
        name,
        path: `/${name.toLowerCase()}`,
        component: lazy(pages[path]),
        meta: PAGE_META[name] ?? null,
      };
    });
  }, []);

  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen bg-[#f5eceb] flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-[#e8d3d1] border-t-[#b09e9c] rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage routes={routes} />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<route.component />} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
}

function HomePage({ routes }) {
  const known = routes.filter((r) => r.meta);
  const unknown = routes.filter((r) => !r.meta);

  return (
    <div
      className="min-h-screen bg-[#f5eceb] font-sans flex flex-col items-center px-4 sm:px-6"
      style={{ paddingTop: 48, paddingBottom: 48 }}
    >
      <div className="w-full max-w-2xl">

        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b09e9c] mb-4">
            Phenom&nbsp;&nbsp;·&nbsp;&nbsp;Canvas Lab
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-[#6b5b58] tracking-tight mb-3">
            數位實驗室
          </h1>
          <p className="text-sm text-[#b09e9c] font-medium leading-relaxed">
            互動式工具與實驗專案的集合地。
          </p>
        </header>

        {/* Known pages */}
        <div className="flex flex-col gap-3 mb-6">
          {known.map((route) => {
            const { name, desc, Icon, accent, accentText } = route.meta;
            return (
              <Link
                key={route.path}
                to={route.path}
                className="group flex items-center gap-5 rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-6 py-5 shadow-sm shadow-rose-100/60 transition-all duration-200 hover:shadow-md hover:shadow-rose-100/80 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <div
                  className="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl"
                  style={{ backgroundColor: accent }}
                >
                  <Icon size={22} style={{ color: accentText }} strokeWidth={2.2} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-[#6b5b58] mb-0.5">{name}</div>
                  <div className="text-xs text-[#b09e9c] font-medium leading-relaxed truncate">{desc}</div>
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-[#d4bcb9] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#8a7a78]"
                />
              </Link>
            );
          })}
        </div>

        {/* Unknown / unlabelled pages */}
        {unknown.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#c5b4b2] px-1 mb-1">
              其他
            </p>
            {unknown.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                className="group flex items-center gap-4 rounded-2xl border border-[#ede0de] bg-white/50 px-5 py-4 transition-all duration-200 hover:bg-white/70 hover:border-[#e8d3d1] active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#8a7a78]">{route.name}</div>
                </div>
                <ArrowRight size={14} className="shrink-0 text-[#d4bcb9] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="mt-14 text-center text-[9px] font-black uppercase tracking-[0.4em] text-[#c5b4b2]">
          Phenom&nbsp;&nbsp;·&nbsp;&nbsp;Professional Acoustic Solution
        </p>
      </div>
    </div>
  );
}
