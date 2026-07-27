import { useMemo } from 'react';
import Tabs from '../../components/lab/Tabs';
import Accordion, { useExpandedSet } from '../../components/lab/Accordion';
import {
  method, families, lessons, exercises, byId, familyLabel,
  BilingualText, SourceLine, BookNote, ContextBlocks,
} from './shared';

/*
 * 二十二首全部攤開，照書裡的順序，不排序——這本教材的難度是往後累加的，順序本身就是內容
 * （DESIGN.md「順序本身是內容」）。分組用 Vaccai 自己的十五課，因為紙本目錄與課堂上講的都是課號。
 *
 * 技術分類的篩選是次分頁；選了之後仍照課號順序印，只是少幾列，讀者不會失去位置感。
 */
export default function PiecesView({ family, onFamilyChange }) {
  const visible = useMemo(
    () => (family === 'all' ? exercises : exercises.filter((ex) => ex.family === family)),
    [family],
  );
  const visibleIds = useMemo(() => visible.map((ex) => ex.id), [visible]);
  const { isOpen, toggle, expandAll, collapseAll } = useExpandedSet(exercises.map((ex) => ex.id));

  const filterItems = [
    { id: 'all', label: '全部', count: exercises.length },
    ...families.map((f) => ({
      id: f.id,
      label: f.label,
      count: exercises.filter((ex) => ex.family === f.id).length,
    })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={filterItems}
          value={family}
          onChange={onFamilyChange}
          variant="pill"
          label="技術分類"
        />
        {/* 展開／收合那一列照 JirsForeignLaw 既有寫法，兩頁維持同一個樣子 */}
        <div className="flex items-center gap-3 text-token-xs text-ink-muted">
          <button type="button" onClick={expandAll} className="transition-colors duration-fast hover:text-accent">全部展開</button>
          <span className="text-line">·</span>
          <button type="button" onClick={collapseAll} className="transition-colors duration-fast hover:text-accent">全部收合</button>
        </div>
      </div>

      {family !== 'all' ? (
        <p className="mt-3 text-token-sm text-ink-muted">
          {families.find((f) => f.id === family)?.desc}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-8 text-token-sm text-ink-muted">這個分類底下沒有曲目。</p>
      ) : null}

      {lessons.map((lesson) => {
        const items = lesson.exercises
          .filter((id) => visibleIds.includes(id))
          .map((id) => byId[id]);
        if (items.length === 0) return null;
        return (
          <section key={lesson.no} className="mt-8">
            {/* data-toc：側欄只有 13rem 寬，放不下「倚音（上方與下方）、短倚音」這種完整課名，
                所以側欄吃資料層的短標（lesson.topic），內容欄照樣印完整的。 */}
            <h2
              id={`vt-lesson-${lesson.no}`}
              data-toc={`第 ${lesson.no} 課　${lesson.topic}`}
              className="text-token-base text-ink-muted"
            >
              第 {lesson.no} 課{'　'}
              <span className="text-token-sm text-ink-faint">
                {items.map((ex) => ex.titleZh).join('、')}
              </span>
            </h2>
            <Accordion
              className="mt-1"
              isOpen={isOpen}
              onToggle={toggle}
              items={items.map((ex) => ({
                id: ex.id,
                title: (
                  <span>
                    <span className="tabular-nums text-ink-faint">{String(ex.no).padStart(2, '0')}</span>
                    <span className="ml-3">{ex.incipit}</span>
                  </span>
                ),
                meta: `${ex.titleIt}　${familyLabel[ex.family]}`,
                render: (
                  <div className="max-w-3xl">
                    <p className="text-token-sm leading-relaxed">{ex.focus}</p>
                    <BilingualText it={ex.textIt} zh={ex.textZh} className="mt-4" />
                    <ContextBlocks blocks={ex.context} className="mt-4" />
                    {ex.note ? (
                      <p className="mt-3 text-token-xs leading-relaxed text-ink-faint">{ex.note}</p>
                    ) : null}
                    <SourceLine source={ex.source} className="mt-4" />
                    {ex.source.situation ? (
                      <p className="mt-2 text-token-sm leading-relaxed text-ink-muted">
                        {ex.source.situation}
                      </p>
                    ) : null}
                    {ex.variant ? (
                      <p className="mt-2 text-token-sm leading-relaxed text-ink-muted">
                        {ex.variant.zh}
                      </p>
                    ) : null}
                    {ex.echo ? (
                      <p className="mt-2 text-token-sm leading-relaxed text-ink-muted">{ex.echo}</p>
                    ) : null}
                    <BookNote note={ex.bookNote} className="mt-4" />
                  </div>
                ),
              }))}
            />
          </section>
        );
      })}

      <p className="mt-10 border-t border-line-soft pt-5 text-token-xs leading-relaxed text-ink-muted">
        {method.numbering.problem}　這裡用的是 Vaccai 原書的課號加上二十二首制的曲號；
        {method.numbering.alsoSeen}
      </p>
    </div>
  );
}
