import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@phenomcanvas/ui/tokens.css'
import './index.css'
import { bootSitePalette } from '@phenomcanvas/ui/palettes'

bootSitePalette()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
