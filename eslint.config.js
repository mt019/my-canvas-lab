import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// 這個 repo 是 React + JS：70 個 .jsx、21,000 行，.tsx 有 0 個。
// 2026-07-17 之前整份設定只寫 files: ['**/*.{ts,tsx}']（Vite react-ts 樣板的預設值），
// 於是 npm run lint 對這個專案是零規則、零 UI 檔——永遠會過，因為它什麼都沒檢查。
// 改成涵蓋 js/jsx 後第一次跑，就抓到 9 件 exhaustive-deps。
//
// 尚未掛進 npm run build：先讓它在這個 repo 穩定為綠，再考慮當閘門。
// 掛得太早的話，一堆 warning 擋著 build，最後會被關掉——那比現在更糟，
// 因為會以為它在把關。
export default tseslint.config(
  { ignores: ['dist', 'api/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      // 底線開頭＝作者明講「知道它沒用到」（UkuleleTuner 的 catch (_error) 有 7 處）。
      // 尊重這個慣例，其餘沒用到的照咬。
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      // 用在 JSX 裡的變數也算用過。少了這條，每個元件 import 都會被誤報成沒用到
      // （實測會多出 396 個假陽性，把真正的 9 件淹掉）。
      ...react.configs.flat.recommended.rules,
      'react/prop-types': 'off',            // 這個專案不用 propTypes
      'react/react-in-jsx-scope': 'off',    // React 17+ 的新轉換不需要 import React
      ...reactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error', // 違反必爛，沒有例外
      'react-hooks/exhaustive-deps': 'warn', // 有真的該忽略的情況，逐件判斷
      // 正文與註解裡的全形空格是本站的排版方式，不是錯字。
      'no-irregular-whitespace': ['error', { skipStrings: true, skipComments: true, skipTemplates: true, skipJSXText: true }],
      // 三個調音器／電鋼琴頁的 Web Audio 收音全是 catch {}：對已停止的 oscillator 再 stop
      // 本來就會丟例外，這裡忽略是對的。13 處都屬此類，故放行空 catch（其他空區塊仍咬）。
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // 放最後：flat config 後面的區塊會蓋前面的，擺在 ts/tsx 區塊之前會被它的 recommended 蓋回去。
    // vite.config.ts 的 dev-only PDF proxy 用 any 標註 server/req/res。要給真型別得裝 @types/node，
    // 這個專案沒裝（裝了也還有 api/_pdfProxy.mjs 無宣告檔的問題），而 build 本來就不跑 tsc。
    // 與其填一個解析不到的型別假裝有檢查，不如在這一檔明講放行。
    files: ['vite.config.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
)
