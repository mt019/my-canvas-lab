import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 自動掃描 pages 資料夾下的所有 .jsx 或 .tsx 檔案
const pages = import.meta.glob('./pages/*.{jsx,tsx}');

const routes = Object.keys(pages).map((path) => {
  const match = path.match(/\.\/pages\/(.*)\.(jsx|tsx)$/);
  const name = match ? match[1] : 'Unknown';
  return {
    name,
    path: `/${name.toLowerCase()}`,
    component: lazy(pages[path]),
  };
});

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#2563eb' }}>🚀 Canvas 實驗室</h1>
      <hr />
      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        {routes.length > 0 ? routes.map((route) => (
          <Link 
            key={route.path} 
            to={route.path}
            style={{ 
              padding: '15px', 
              background: '#f3f4f6', 
              borderRadius: '12px', 
              textDecoration: 'none', 
              color: '#1f2937',
              fontWeight: 'bold',
              border: '1px solid #e5e7eb'
            }}
          >
            📂 點擊開啟：{route.name}
          </Link>
        )) : <p>目前 pages 資料夾內沒有檔案，請新增一個 .jsx 檔案進去！</p>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: '20px' }}>載入中...</div>}>
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
