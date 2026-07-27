/*
 * Kicker line above a page or section title. This is the only place the
 * accent (typewriter) font is allowed by default — large, sparse, decorative.
 *
 * 這個元件包了三件事，三件都是踩過才知道的，別拆開來各頁自己寫：
 *
 * 1. **字重要 700，油墨網點才在。** Erikas Farbband 的 400 是一支乾淨的細打字機體；
 *    真正那個色帶油墨的網點字面在 **700** 這一支（`ErikasFarbband-Bold-subset.woff2`）。
 *    首頁那條「PHENOM · CANVAS LAB」一直是 `font-bold`，眉標元件卻不是，於是同一個站上
 *    有兩種眉標。2026-07-28 使用者連問兩次「油墨點點的字體呢」，就是這個差別——
 *    先誤判成字級太小，放大後仍然沒有紋理，因為紋理從頭到尾是字重帶來的。
 *
 * 2. **空格要自己補。** Erikas 的子集沒有空格字符（實測 advance width＝0），詞距只剩
 *    letter-spacing 那一格，「VACCAI 1832 · METASTASIO」的字詞邊界會糊成一排等距字母。
 *    這裡把字串按空白切開、一個詞一個 span，用 flex `gap` 撐出真正的詞距；單獨成詞的
 *    間隔號改畫成 CSS 圓點（同首頁的做法），不靠字型裡那個容易走樣的 `·`。
 *
 * 3. **`font-synthesis: none`。** 中文眉標（如「空污法 §16 · 特別公課」）走 Huiwen fallback，
 *    而 Huiwen 沒有 700 的字面；不關掉合成字重，瀏覽器會替中文畫一層假粗體，在 12px 上糊成
 *    一團。關掉之後：拉丁走 Erikas 真正的 700，中文維持原本的字重。
 *
 * 非字串的 children（JSX）原樣傳過去，不切也不換。
 */
const DOTS = new Set(['·', '•', '・']);

export default function Eyebrow({ children, className = '' }) {
  const tokens = typeof children === 'string' ? children.trim().split(/\s+/) : null;

  return (
    <div
      style={{ fontSynthesis: 'none' }}
      className={`flex flex-wrap items-center gap-x-[0.85em] gap-y-1 font-accent text-token-xs font-bold uppercase tracking-[0.26em] text-ink-muted ${className}`.trim()}
    >
      {tokens
        ? tokens.map((token, i) => (DOTS.has(token)
          ? <span key={`dot-${i}`} className="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" />
          : <span key={`${token}-${i}`}>{token}</span>))
        : children}
    </div>
  );
}
