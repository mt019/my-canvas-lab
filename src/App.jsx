import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 掃描 pages 目錄
const pages = import.meta.glob('./pages/*.{jsx,tsx}');

const routes = Object.keys(pages).map((path) => {
  const name = path.split('/').pop().replace(/\.(jsx|tsx)$/, '');
  return {
    name,
    path: `/${name.toLowerCase()}`,
    component: lazy(pages[path]),
  };
});

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>🚀 我的 Canvas 實驗室</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
        {routes.length > 0 ? routes.map((route) => (
          <Link 
            key={route.path} 
            to={route.path}
            style={{ 
              padding: '16px', 
              background: '#f9f9f9', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: '#2563eb',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #eee'
            }}
          >
            📄 開啟：{route.name}
          </Link>
        )) : (
          <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            目前 pages 資料夾是空的。<br/>
            請在 GitHub 的 src/pages/ 建立一個 .jsx 檔案。
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: '20px' }}>正在載入作品...</div>}>
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
