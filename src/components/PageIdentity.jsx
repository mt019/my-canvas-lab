import { Link, useLocation } from 'react-router-dom';
import Eyebrow from './Eyebrow';
import { identityHomeFor } from '../backNav';

/*
 * 一頁的識別：眉標＋大標題。**在主題站的內頁，這一整塊是回站首頁的連結**
 * （2026-07-28 使用者裁定：「應該要這一塊能點擊回簡報首頁。底層模板層級」）。
 *
 * 為什麼是這一塊、而不是只有眉標那一行：報紙的報頭就是回首頁的入口，讀者會去點的是
 * 「BRIEF 簡報」那一團，不是上面那五個小字。連結範圍跟著讀者的手走，不跟著我們的
 * DOM 結構走。
 *
 * 站的兩條回頭路仍然分開（見 backNav.js）：左上角的箭頭離開這個站、回 canvas 首頁；
 * 報頭回這個站的原點——深一層的頁回站首頁，**已經在站首頁但切過分頁的，回到沒有參數的
 * 那一頁**（分頁與篩選都在網址裡，清掉它們是一個真的動作）。兩者都不成立時
 * （乾淨的站首頁）這一塊就是純文字，不連到自己。
 *
 * 三個殼（DashboardLayout／PageShell／ArticleLayout）都畫這一個，不各寫一份。
 */
export default function PageIdentity({ eyebrow, title, titleClassName = 'font-display', summary, children }) {
  const { pathname, search } = useLocation();
  const home = identityHomeFor(pathname, search);

  const identity = (
    <>
      {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
      {title ? (
        <h1 className={`${titleClassName} text-token-2xl leading-tight sm:text-token-3xl`}>{title}</h1>
      ) : null}
    </>
  );

  return (
    <>
      {home ? (
        <Link
          to={home.href}
          aria-label={`回${home.label || '這一頁的原點'}`}
          className="block transition-colors duration-fast hover:text-accent"
        >
          {identity}
        </Link>
      ) : (
        identity
      )}
      {summary ? <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{summary}</p> : null}
      {children}
    </>
  );
}
