import { useEffect, useState } from 'react';

/*
 * 左欄的來源篩選：/brief 的兩個內頁（讀的東西、活動曆）各自手刻過一份，抽到這裡共用。
 *
 * 受控元件——它不記得選了誰，選擇由上層放進網址（?sources=all|none|逗號串）。這裡只負責
 * 把「按了哪顆」翻成一組 id 丟回 onChange，網址對應與排序留給上層（篩選要能貼網址分享）。
 *
 * 兩頁的來源清單長得不一樣：讀的東西按 kind 分組（整類一起切），活動曆是一條平的清單。
 * 給了 sections 就分組、給 sources 就平鋪，同一顆元件兩種樣子。
 *
 * 四顆控制：全選／全不選／反選／單選(radio)。
 *   反選＝選的與沒選的對調（單選模式下沒有意義，收起來）。
 *   單選(radio)＝按一個只留一個、按別的就換過去，隨手只看某一家時很快。
 * 空集合（全不選）是合法狀態：內容區有它自己的空狀態，這裡不擋。
 */

/*
 * 一個開關的偏好存這台瀏覽器（比照 canvaslab:fontScale）。單選模式、只看有摘要這種
 * UI 偏好，重開頁面不該被重置。選擇本身不走這裡——那在網址，才貼得出去。
 */
export function usePersistedFlag(key, initial = false) {
  const [on, setOn] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v == null ? initial : v === '1';
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, on ? '1' : '0');
    } catch {
      /* 無痕模式或 localStorage 滿了。偏好丟了不該讓頁面壞掉。 */
    }
  }, [key, on]);
  return [on, setOn];
}

const actionBtn = 'transition-colors duration-fast hover:text-accent';

export default function SourceFilter({
  label = '來源',
  sources,
  sections,
  selectedIds,
  onChange,
  radio = false,
  onRadioChange,
  countOf,
  extras,
}) {
  const selected = new Set(selectedIds);
  const allIds = sources.map((s) => s.id);

  const toggleSource = (id) => {
    if (radio) return onChange([id]); // 單選：只留這一個
    onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  /* 整類一起切。分組時一類十來個來源要一個一個關掉才能只看某一類，那不是篩選是勞動。 */
  const toggleKind = (sec) => {
    const ids = sec.sources.map((s) => s.id);
    if (radio) return onChange(ids); // 單選：只留這一類
    const allOn = ids.every((id) => selected.has(id));
    onChange(allOn ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  };

  const invert = () => onChange(allIds.filter((id) => !selected.has(id)));

  const SourceButton = ({ s }) => {
    const on = selected.has(s.id);
    return (
      <button
        type="button"
        data-source-id={s.id}
        onClick={() => toggleSource(s.id)}
        aria-pressed={on}
        className={`w-full text-left transition-colors duration-fast hover:text-accent ${on ? 'text-ink' : 'text-ink-faint'}`}
      >
        <span className="mr-1.5 tabular-nums">{radio ? (on ? '◉' : '○') : on ? '■' : '□'}</span>
        {s.label}
        {countOf ? <span className="ml-1.5 tabular-nums text-ink-faint">{countOf(s.id)}</span> : null}
      </button>
    );
  };

  return (
    <div>
      <p className="mb-1.5 font-accent uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <div className="mb-3 flex items-center gap-x-3 text-token-xs text-ink-faint">
        <button type="button" onClick={() => onChange(allIds)} className={actionBtn}>
          全選
        </button>
        <button type="button" onClick={() => onChange([])} className={actionBtn}>
          全不選
        </button>
        {/* 反選＝選的與沒選的對調。單選模式下沒有意義（永遠只有一個選著），收起來。 */}
        {radio ? null : (
          <button type="button" onClick={invert} className={actionBtn}>
            反選
          </button>
        )}
        {onRadioChange ? (
          <button
            type="button"
            onClick={() => onRadioChange(!radio)}
            aria-pressed={radio}
            className={`ml-auto transition-colors duration-fast hover:text-accent ${radio ? 'text-ink' : 'text-ink-faint'}`}
          >
            <span className="mr-1 tabular-nums">{radio ? '◉' : '○'}</span>
            單選
          </button>
        ) : null}
      </div>

      {extras ? <div className="mb-3">{extras}</div> : null}

      {sections ? (
        sections.map((sec) => {
          const ids = sec.sources.map((s) => s.id);
          const allOn = ids.every((id) => selected.has(id));
          return (
            <div key={sec.kind} className="mb-3">
              <button
                type="button"
                onClick={() => toggleKind(sec)}
                aria-pressed={allOn}
                className={`mb-0.5 text-left transition-colors duration-fast hover:text-accent ${allOn ? 'text-ink-muted' : 'text-ink-faint'}`}
              >
                {sec.kind}
              </button>
              <div className="flex flex-col items-start gap-0.5">
                {sec.sources.map((s) => (
                  <SourceButton key={s.id} s={s} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="mb-1 flex flex-col items-start gap-0.5">
          {sources.map((s) => (
            <SourceButton key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
