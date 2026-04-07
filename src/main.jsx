import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 注意：Vite 引用組件通常不需要寫 .jsx 後綴
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
