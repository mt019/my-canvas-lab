import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// 1. 在這裡引入你的新作品
import Project1 from './pages/Project1'; 

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🚀 我的 Canvas 作品集</h1>
      <ul>
        {/* 2. 在這裡新增作品連結 */}
        <li><Link to="/p1">第一個互動網頁</Link></li>
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* 3. 在這裡定義網址路徑 */}
        <Route path="/p1" element={<Project1 />} />
      </Routes>
    </Router>
  );
}
