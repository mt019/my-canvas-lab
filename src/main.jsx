import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import '@phenomcanvas/ui/tokens.css'
import './index.css'
import { bootSitePalette } from '@phenomcanvas/ui/palettes'

bootSitePalette()

// Vercel Web Analytics. Renders nothing; on mount it appends
// <script src="/_vercel/insights/script.js"> to <head>, which only the Vercel
// edge serves — locally and during prerender that path falls through to the SPA
// fallback and does nothing. Cookieless, so no consent banner. prerender.mjs
// strips the injected tag before saving each page; see the note there.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
)
