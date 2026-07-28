import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SearchField from './SearchField';

/*
 * 一整本書的目次，裝進 `ArticleLayout` 的左欄（`nav` slot）。
 *
 * 為什麼是元件而不是頁內手刻：整本書（幾百篇、兩層結構）的導覽跟 `ArticleNav` 的
 * 「同一個主題站還有哪幾篇」不是同一件事——篇數多到需要搜尋與收合，而且每一片葉子要
 * 帶原書頁碼。朱家驊言論集（198 篇／14 部次）先用，柳如是別傳那類重排本是同一個形狀。
 *
 * 契約：呼叫端把自己的資料攤平成下面這個形狀，元件不認識任何一本書的欄位名。
 *   items: [{ id, title, href, group, subgroup?, lead?, badge?, hint? }]
 *   group 是最上層分組（部次），連續同名的併成一段；subgroup 同理（分節）。
 *   lead 是每一列左側的定值（原書頁碼），badge 是少數狀態的標記（如「全文」）。
 * items 必須已經照書的順序排好——分組靠相鄰同名，不重排。
 */

function buildTree(items) {
  const groups = [];
  for (const item of items) {
    let group = groups[groups.length - 1];
    if (!group || group.name !== item.group) {
      group = { name: item.group, blocks: [], count: 0 };
      groups.push(group);
    }
    group.count += 1;
    let block = group.blocks[group.blocks.length - 1];
    if (!block || block.label !== (item.subgroup ?? null)) {
      block = { label: item.subgroup ?? null, items: [] };
      group.blocks.push(block);
    }
    block.items.push(item);
  }
  return groups;
}

const LEAF = 'block border-l-2 py-1 pl-3 pr-2 text-token-xs leading-snug transition-colors duration-fast';

function Leaf({ item, active, onSelect }) {
  const tone = active
    ? 'border-accent bg-accent-soft font-bold text-accent'
    : 'border-transparent text-ink-muted hover:border-line hover:text-accent';
  return (
    <li>
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          aria-current={active ? 'page' : undefined}
          data-leaf-active={active ? '' : undefined}
          className={`${LEAF} ${tone} w-full text-left`}
        >
          <span className="flex items-baseline gap-2">
            {item.lead != null ? <span className="w-7 shrink-0 tabular-nums text-ink-faint">{item.lead}</span> : null}
            <span className="min-w-0 flex-1">{item.title}</span>
            {item.badge ? <span className="shrink-0 text-accent">{item.badge}</span> : null}
          </span>
        </button>
      ) : (
        <Link
          to={item.href}
        data-leaf-active={active ? '' : undefined}
        title={item.hint || undefined}
        className={`${LEAF} ${tone}`}
        >
        <span className="flex items-baseline gap-2">
          {item.lead != null ? <span className="w-7 shrink-0 tabular-nums text-ink-faint">{item.lead}</span> : null}
          <span className="min-w-0 flex-1">{item.title}</span>
          {item.badge ? <span className="shrink-0 text-accent">{item.badge}</span> : null}
        </span>
        </Link>
      )}
    </li>
  );
}

export default function BookTree({
  items,
  activeId,
  label = '全書目次',
  searchPlaceholder = '搜尋篇名…',
  header,
  onSelect,
}) {
  const [query, setQuery] = useState('');
  const tree = useMemo(() => buildTree(items), [items]);
  // 預設全開（底層規則：可展開的東西一律預設展開）。整棵樹很長，這一欄自己捲。
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggle = (name) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    return next;
  });

  const q = query.trim();
  const hits = useMemo(() => (q ? items.filter((it) => it.title.includes(q)) : null), [q, items]);

  // 讀第 143 篇時，目次若停在最上面等於沒有標示位置。只捲 ArticleLayout 給的那個
  // overflow 容器（往上找最近的可捲祖先並設 scrollTop）——不用 scrollIntoView，
  // 後者會連整個視窗一起捲，把讀者從正文拔走。
  const rootRef = useRef(null);
  useLayoutEffect(() => {
    const target = rootRef.current?.querySelector('[data-leaf-active]');
    if (!target) return;
    let box = rootRef.current.parentElement;
    while (box && box.scrollHeight <= box.clientHeight) box = box.parentElement;
    if (!box || box === document.body || box === document.documentElement) return;
    const wanted = Math.max(0, target.offsetTop - box.clientHeight / 2);
    if (Math.abs(box.scrollTop - wanted) > 8) box.scrollTop = wanted;
  }, [activeId]);

  return (
    <div ref={rootRef}>
      {header}

      <SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} className="w-full" />

      <nav aria-label={label} className="mt-3">
        {hits ? (
          <>
            <p className="px-2 pb-2 text-token-xs tabular-nums text-ink-faint">{hits.length} 篇符合</p>
            <ul>{hits.map((it) => <Leaf key={it.id} item={it} active={it.id === activeId} onSelect={onSelect} />)}</ul>
          </>
        ) : tree.map((group) => {
          const shut = collapsed.has(group.name);
          return (
            <section key={group.name} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(group.name)}
                aria-expanded={!shut}
                className="flex w-full items-center gap-1.5 px-1 py-1.5 text-left text-token-sm font-bold text-ink transition-colors duration-fast hover:text-accent"
              >
                <ChevronRight size={13} className={`shrink-0 text-ink-faint transition-transform duration-fast ${shut ? '' : 'rotate-90'}`} />
                <span className="min-w-0 flex-1">{group.name}</span>
                <span className="shrink-0 text-token-xs font-normal tabular-nums text-ink-faint">{group.count}</span>
              </button>
              {shut ? null : group.blocks.map((block, bi) => (
                <div key={block.label ?? `b${bi}`} className="mb-1">
                  {block.label ? (
                    <p className="px-1 pb-0.5 pl-5 pt-1 text-token-xs text-ink-faint">{block.label}</p>
                  ) : null}
                  <ul className="pl-3">
                    {block.items.map((it) => <Leaf key={it.id} item={it} active={it.id === activeId} onSelect={onSelect} />)}
                  </ul>
                </div>
              ))}
            </section>
          );
        })}
      </nav>
    </div>
  );
}
