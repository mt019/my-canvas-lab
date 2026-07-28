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
 *
 * **`back`：把整條眉標變成回這個站首頁的按鈕**（`{ href, label }`，2026-07-29 使用者指定的
 * 位置：「至少那個大標題上面那個手記兩個字，可以做成按鈕，可以回手記的主頁吧」）。站名本來
 * 就寫在那裡、又緊貼著大標題，是內頁最自然的回頭路；最上面那支箭頭只負責離開這個站，
 * 不再重複寫一次站名。
 *
 * 它必須看得出來能按，但**不畫箭頭**（使用者：「箭頭太醜」）：改成點線底線，跟站上其他
 * 連結同一種語言（`Prose` 的內文連結也是 underline＋decoration token）。底線畫在每個詞的
 * span 上、不畫在外層——外層是 flex 容器，text-decoration 不會傳進 flex item，畫上去看不見。
 */
import { Link } from 'react-router-dom';

const DOTS = new Set(['·', '•', '・']);
const LINKED_TOKEN = 'underline decoration-line decoration-dotted decoration-1 underline-offset-[5px] '
  + 'transition-colors duration-fast group-hover/eyebrow:decoration-accent';

export default function Eyebrow({ children, className = '', back }) {
  const tokens = typeof children === 'string' ? children.trim().split(/\s+/) : null;
  const body = tokens
    ? tokens.map((token, i) => (DOTS.has(token)
      ? <span key={`dot-${i}`} className="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" />
      : <span key={`${token}-${i}`} className={back ? LINKED_TOKEN : undefined}>{token}</span>))
    : children;

  const shared = 'flex flex-wrap items-center gap-x-[0.85em] gap-y-1 font-accent text-token-xs '
    + 'font-bold uppercase tracking-[0.26em] text-ink-muted';

  if (back) {
    return (
      <Link
        to={back.href}
        aria-label={`回${back.label}`}
        style={{ fontSynthesis: 'none' }}
        className={`${shared} group/eyebrow w-fit transition-colors duration-fast hover:text-accent ${className}`.trim()}
      >
        {body}
      </Link>
    );
  }

  return (
    <div style={{ fontSynthesis: 'none' }} className={`${shared} ${className}`.trim()}>
      {body}
    </div>
  );
}
