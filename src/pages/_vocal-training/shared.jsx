import data from '../../data/vocalTraining.json';

export const { meta, method, families, lessons, exercises, diction, log } = data;

export const byId = Object.fromEntries(exercises.map((ex) => [ex.id, ex]));
export const familyLabel = Object.fromEntries(families.map((f) => [f.id, f.label]));
export const lessonOf = Object.fromEntries(
  lessons.flatMap((l) => l.exercises.map((id) => [id, l])),
);

/*
 * 「第 2 課 · 第 4 首 · 五度音程」這串在三個分頁都要，統一在這裡拼。
 * 課號用阿拉伯數字：原書印的是羅馬數字，但 II 這種字在中文字體裡會被排成全形寬度，
 * 夾在「第」「課」之間讀起來是歪的。羅馬數字留給「這本教材」那頁的對照表。
 */
export function positionOf(ex) {
  const lesson = lessonOf[ex.id];
  return `第 ${lesson.no} 課 · 第 ${ex.no} 首 · ${ex.titleZh}`;
}

/*
 * 原文與中譯逐行對照。兩欄同一列＝同一行詩，寬螢幕並排、窄螢幕上下堆。
 * 義大利文走預設正文字體：拉丁 accent 字體的子集缺空格，多字詞會變豆腐（見 DESIGN.md 字型節）。
 */
export function BilingualText({ it, zh, className = '' }) {
  return (
    <div className={`grid gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,20rem)_1fr] ${className}`}>
      {it.map((line, i) => (
        <div key={`${line}-${i}`} className="contents">
          <p className="text-token-base leading-relaxed">{line}</p>
          <p className="mb-2 text-token-sm leading-relaxed text-ink-muted sm:mb-0">{zh[i]}</p>
        </div>
      ))}
    </div>
  );
}

/* 出處那一行：查證過的印場景，沒查證的印它缺什麼——兩者用字不同，不用顏色區分。 */
export function SourceLine({ source, className = '' }) {
  const work = source.workZh
    ? `${source.workZh}（${source.work}${source.year ? `，${source.year}` : ''}）`
    : '出處劇目未定';
  return (
    <p className={`text-token-sm leading-relaxed text-ink-muted ${className}`}>
      <span className="text-ink">{work}</span>
      {source.place ? `　${source.place}` : ''}
      {source.speaker ? `　${source.speaker} 唱${source.addressee ? `，對象：${source.addressee}` : ''}` : ''}
      {source.excerpt ? <span className="text-ink-faint">　{source.excerpt}</span> : null}
      {source.url ? (
        <>
          {'　'}
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline decoration-line-soft underline-offset-2 hover:decoration-accent"
          >
            原文
          </a>
        </>
      ) : null}
    </p>
  );
}

/*
 * 這首前後的原文：唱這首之前的宣敘調、或同一首詠嘆調 Vaccai 沒收的那一節。
 *
 * 排版與正詞同一套逐行對照，但整塊往內縮並掛一條細線——**讀者必須一眼分得出哪些字他會唱到、
 * 哪些不會**。標籤直接寫出這段是哪裡來的，不用色彩或圖示暗示。
 */
export function ContextBlocks({ blocks, className = '' }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className={className}>
      {blocks.map((block) => (
        <div key={block.label} className="mt-4 border-l border-line pl-4 first:mt-0">
          <p className="text-token-xs text-ink-faint">{block.label}</p>
          <BilingualText it={block.it} zh={block.zh} className="mt-2" />
        </div>
      ))}
    </div>
  );
}

/* 原書教學註。引文照錄，中譯在下；不做色塊、不做卡片。 */
export function BookNote({ note, className = '' }) {
  if (!note) return null;
  return (
    <div className={`border-l-2 border-line pl-4 ${className}`}>
      <p className="text-token-xs uppercase tracking-wide text-ink-faint">原書教學註</p>
      <p className="mt-1.5 text-token-sm leading-relaxed">{note.zh}</p>
      <p className="mt-2 text-token-xs leading-relaxed text-ink-faint">{note.en}</p>
    </div>
  );
}
