import phenomPreset from '@phenomcanvas/ui/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  // 字體、色票、字級、圓角、陰影、動畫時長全部來自共用 preset（@phenomcanvas/ui 的
  // tailwind-preset.js），值一律指向 CSS 變數，母本是該套件的 tokens.css；canvas 的
  // src/styles/tokens.css 是同一份再加四個 --mark-* 槽。這裡先前抄了一份一模一樣的
  // theme.extend，v0.1.31 接包時退掉。要改 token 就去改那兩處，不要在這裡加值。
  presets: [phenomPreset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@phenomcanvas/ui/src/**/*.{js,jsx}',
  ],
  plugins: [],
}
