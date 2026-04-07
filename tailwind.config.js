/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 這一行最關鍵，它告訴 Tailwind 去掃描 src 下所有的檔案
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
