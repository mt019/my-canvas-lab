import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/*
 * 通往同一個站另一區的入口：標題、一個計數、一個箭頭，底下一句話說明那裡有什麼。
 *
 * 手記那一頁自己刻了兩份（短記、舊帖），Userscripts、StatisticsLab、statistics/TagPage
 * 各刻過一份，五份的 class 串幾乎一字不差。抽在這裡之後，「入口長什麼樣」只有一份定義。
 * （目前只換掉手記那兩份；另外三頁換過來時要各自驗一次，見 HANDOFF。）
 *
 * 計數是選配：有數字就印，沒有就只有標題與箭頭。數字用等寬字，因為它會變。
 */
export default function SectionLink({ to, title, count, children, className = '' }) {
  return (
    <Link
      to={to}
      className={`group -mx-3 block rounded-token-md px-3 py-4 transition-colors duration-fast hover:bg-surface ${className}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent">
          {title}
        </span>
        {count == null ? null : (
          <span className="font-accent text-token-xs tabular-nums text-ink-faint">{count}</span>
        )}
        <ArrowRight
          size={16}
          className="shrink-0 self-center text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>
      {children ? <div className="mt-2 text-token-sm leading-relaxed text-ink-muted">{children}</div> : null}
    </Link>
  );
}
