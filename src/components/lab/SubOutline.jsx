import { useEffect, useState } from 'react';

/*
 * 比左欄目次深一層：左欄列的是區（h2），這裡列的是你現在所在那一區底下的細目（h3）。
 * 儀表板版三欄殼的右欄（見 DashboardLayout）——文章版的右欄是整份 TOC，儀表板的內容
 * 是一批一批的區，右欄跟著你捲到哪一區、只攤開那一區的細目。
 *
 * 兩個 scroll-spy：一個追現在在哪一區（h2），一個追區裡的哪一條（h3）。**永遠落在一個區**
 * ——還沒捲動就第一區，捲到哪就哪一區——所以右欄不會在單一來源／收起來的區中途變空白。
 */
export default function SubOutline({ containerRef, refreshKey }) {
  const [groups, setGroups] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [activeChild, setActiveChild] = useState(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const nodes = [...root.querySelectorAll('h2[id], h3[id]')];
    // Labels are textContent: spacing inside a heading must be a real character.
    // A CSS margin between heading parts (e.g. a count span) shows on the page but
    // not here, so the outline would jam them together. Space goes in the text.
    const grps = [];
    for (const n of nodes) {
      if (n.tagName === 'H2') grps.push({ id: n.id, text: n.textContent, children: [] });
      else if (grps.length) grps[grps.length - 1].children.push({ id: n.id, text: n.textContent });
    }
    setGroups(grps);

    const watch = (set) =>
      new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length > 0) set(visible[0].target.id);
        },
        { rootMargin: '0px 0px -66% 0px', threshold: 0 },
      );
    const spySection = watch(setActiveSection);
    const spyChild = watch(setActiveChild);
    nodes.forEach((n) => (n.tagName === 'H2' ? spySection : spyChild).observe(n));
    return () => {
      spySection.disconnect();
      spyChild.disconnect();
    };
  }, [containerRef, refreshKey]);

  if (groups.length === 0) return null;
  // 永遠落在你現在所在那一區（還沒捲動就第一區）。永遠有一區 → 右欄不會中途消失。
  const current = groups.find((g) => g.id === activeSection) ?? groups[0];

  return (
    <nav aria-label="這一節的細目" className="text-token-xs leading-relaxed">
      <a
        href={`#${current.id}`}
        className="mb-2 block leading-snug text-ink-muted transition-colors duration-fast hover:text-ink"
      >
        {current.text}
      </a>
      {current.children.length > 0 ? (
        <ul className="space-y-1.5 border-l border-line-soft">
          {current.children.map((c) => {
            const on = c.id === activeChild;
            return (
              <li key={c.id} style={{ paddingLeft: 12 }}>
                <a
                  href={`#${c.id}`}
                  className="-ml-px block border-l-2 py-0.5 pl-2 transition-colors duration-fast"
                  style={{ borderColor: on ? 'var(--c-accent)' : 'transparent', color: on ? 'var(--c-ink)' : 'var(--c-ink-faint)' }}
                >
                  {c.text}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
