import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 1. 自動化核心：掃描 ./pages 目錄下所有的 .jsx 檔案
const pages = import.meta.glob('./pages/*.jsx');

// 2. 處理檔案路徑，生成組件列表
const routes = Object.keys(pages).map((path) => {
  const name = path.match(/\.\/pages\/(.*)\.jsx$/)[1];
  return {
    name,
    path: `/${name.toLowerCase()}`,
    component: lazy(pages[path]),
  };
});

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🚀 我的 Canvas 自動化實驗室</h1>
      <div style={{ display: 'grid', gap: '10px' }}>
        {routes.map((route) => (
          <Link 
            key={route.path} 
            to={route.path}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: '#333' }}
          >
            📂 專案：{route.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
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
