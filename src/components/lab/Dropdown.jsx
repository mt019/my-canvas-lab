import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

/*
 * 單選下拉，取代原生 <select>（底層禁用原生 UI 元件，各作業系統樣式不一且與版面脫節）。
 *
 * 選項多時（預設 >12）內建搜尋框——譯者篩選有近 180 名，原生下拉只能捲，這裡可打字縮。
 * 互動比照 AppearanceMenu：外點與 Esc 收合、方向鍵移動、Enter 選取，listbox/option ARIA。
 *
 * options: [{ value, label, hint? }]；value/onChange 受控。hint 靠右（如譯者出現次數）。
 */
export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = '請選擇',
  searchable,
  align = 'left',
  className = '',
  buttonClassName = '',
  panelWidth = 'w-56',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const ref = useRef(null);
  const searchRef = useRef(null);

  const canSearch = searchable ?? options.length > 12;
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open && canSearch) searchRef.current?.focus();
    if (!open) { setQuery(''); setActive(-1); }
  }, [open, canSearch]);

  const pick = (v) => { onChange(v); setOpen(false); };

  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0 && filtered[active]) { e.preventDefault(); pick(filtered[active].value); }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded-token-md border border-line px-2 py-0.5 text-token-xs text-ink-muted transition-colors duration-fast hover:border-ink-faint ${buttonClassName}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={12} className="shrink-0 text-ink-faint" />
      </button>

      {open ? (
        <div
          role="listbox"
          onKeyDown={onKey}
          className={`absolute z-50 mt-1 overflow-hidden rounded-token-md border border-line-soft bg-paper shadow-token-sm ${panelWidth} ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {canSearch ? (
            <div className="relative border-b border-line-soft">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(-1); }}
                onKeyDown={onKey}
                placeholder="搜尋…"
                className="w-full bg-transparent py-2 pl-8 pr-2 text-token-xs text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          ) : null}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-token-xs text-ink-faint">無相符</li>
            ) : filtered.map((o, i) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-token-xs transition-colors duration-fast ${i === active ? 'bg-surface-raised' : ''} ${o.value === value ? 'text-accent' : 'text-ink-muted'}`}
                >
                  <Check size={12} className={`shrink-0 ${o.value === value ? 'opacity-100' : 'opacity-0'}`} />
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint ? <span className="shrink-0 tabular-nums text-ink-faint">{o.hint}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
