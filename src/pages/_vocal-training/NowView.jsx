import {
  meta, diction, log, byId, positionOf, BilingualText, SourceLine, BookNote, ContextBlocks,
} from './shared';

/*
 * 「現在練這首」。整頁只服務一件事：手上這首要唱什麼、它原本是誰在什麼處境下唱的、
 * 唱的時候要注意什麼。目前這首由資料倉的 meta.currentExercise 指定，前端不寫死。
 */
export default function NowView() {
  const ex = byId[meta.currentExercise];
  const latest = log.find((entry) => entry.exercise === ex.id) ?? log[0];

  return (
    <div className="max-w-3xl">
      <section>
        <h2 id="vt-now-piece" className="text-token-xl">{ex.incipit}</h2>
        <p className="mt-1 text-token-sm text-ink-muted">
          {positionOf(ex)}　{ex.titleIt}
        </p>
        <p className="mt-4 text-token-sm leading-relaxed">{ex.focus}</p>

        <BilingualText it={ex.textIt} zh={ex.textZh} className="mt-6" />
        <SourceLine source={ex.source} className="mt-5" />
      </section>

      {/* 這首前後的原文。Vaccai 多半只取一節，比喻的答案常常在他砍掉的那一節——
          不接回來，唱的人只拿到半首詩。 */}
      {(ex.context ?? []).length > 0 ? (
        <section className="mt-10">
          <h2 id="vt-now-context" className="text-token-lg">Vaccai 沒收進來的那幾行</h2>
          <ContextBlocks blocks={ex.context} className="mt-4" />
        </section>
      ) : null}

      {ex.variant ? (
        <section className="mt-10">
          <h2 id="vt-now-variant" className="text-token-lg">Vaccai 改過的那兩行</h2>
          <p className="mt-3 text-token-sm leading-relaxed">{ex.variant.zh}</p>
          <div className="mt-4 divide-y divide-line-soft border-y border-line-soft">
            <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <p className="text-token-sm text-ink-faint">Metastasio 原文</p>
              <p className="text-token-base leading-relaxed">{ex.variant.originalIt.join('　')}</p>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <p className="text-token-sm text-ink-faint">Vaccai 練習本</p>
              <p className="text-token-base leading-relaxed">{ex.variant.vaccaiIt.join('　')}</p>
            </div>
          </div>
          <p className="mt-3 text-token-xs leading-relaxed text-ink-faint">{ex.variant.why}</p>
        </section>
      ) : null}

      {ex.source.situation ? (
        <section className="mt-10">
          <h2 id="vt-now-scene" className="text-token-lg">原本是誰在唱</h2>
          <p className="mt-3 text-token-sm leading-relaxed">{ex.source.situation}</p>
          {ex.echo ? (
            <p className="mt-3 text-token-sm leading-relaxed text-ink-muted">{ex.echo}</p>
          ) : null}
        </section>
      ) : null}

      {diction.forExercise === ex.id ? (
        <section className="mt-10">
          <h2 id="vt-now-diction" className="text-token-lg">{diction.title}</h2>
          <ul className="mt-4 divide-y divide-line-soft border-y border-line-soft">
            {diction.items.map((item) => (
              <li key={item.point} className="py-3">
                <p className="text-token-base">{item.point}</p>
                <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-token-xs leading-relaxed text-ink-faint">{diction.note}</p>

          {/* 原書講咬字的那兩段就印在這裡。上一版只寫「在第一課與第十四課的教學註裡」——
              那兩段確實收在資料裡，但只印在「二十二首」分頁的手風琴內層，等於叫讀者自己去翻。
              指路不算給東西：真正要看的內容就放在提到它的地方。 */}
          {diction.seeAlsoLabel && (diction.seeAlso ?? []).length > 0 ? (
            <h3 className="mt-8 text-token-base">{diction.seeAlsoLabel}</h3>
          ) : null}
          {(diction.seeAlso ?? []).map((id) => {
            const ref = byId[id];
            if (!ref?.bookNote) return null;
            return (
              <div key={id} className="mt-5">
                <p className="text-token-sm text-ink-muted">
                  {positionOf(ref)}　{ref.incipit}
                </p>
                <BookNote note={ref.bookNote} className="mt-2" />
              </div>
            );
          })}
        </section>
      ) : null}

      <BookNote note={ex.bookNote} className="mt-10" />

      {latest ? (
        <section className="mt-10 border-t border-line-soft pt-6">
          <h2 id="vt-now-log" className="text-token-lg">練習紀錄</h2>
          <p className="mt-3 text-token-sm text-ink-faint tabular-nums">{latest.date}</p>
          <p className="mt-1 text-token-sm leading-relaxed">{latest.what}</p>
          {latest.focus ? (
            <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">{latest.focus}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
