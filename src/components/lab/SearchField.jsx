import { Search, X } from 'lucide-react';

/*
 * 頁內搜尋框。原本被八個頁面各自手刻，其中譯語表與 JIRS 兩頁的 className 一字不差——
 * 已遠超過抽取門檻（DESIGN.md：同一個東西被兩個以上真實頁面手刻過就抽）。
 * 樣式沿用那兩頁既有的值，遷移過來不會改變任何一頁的外觀。
 *
 * 受控元件：value / onChange(下一個字串)。搜尋字串留在呼叫端的 state 或網址由呼叫端決定——
 * 逐字進網址會塞爆上一頁，所以這裡不碰網址。
 */
export default function SearchField({
  value,
  onChange,
  placeholder = '搜尋…',
  className = 'max-w-md',
  'aria-label': ariaLabel,
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-token-md border border-line bg-surface-raised py-2 pl-9 pr-9 text-token-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="清除搜尋"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
