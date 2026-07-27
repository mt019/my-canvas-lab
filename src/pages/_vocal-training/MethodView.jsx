import { method, lessons, byId } from './shared';

/*
 * 這本教材本身：誰寫的、什麼時候、為什麼長這樣、三套編號怎麼對照。
 * 編號對照表是這一頁最實用的東西——查資料對錯首多半就是在這裡出的錯。
 */
export default function MethodView() {
  const { composer, book, prefaceQuote, numbering, placement } = method;

  return (
    <div className="max-w-3xl">
      <section>
        <h2 id="vt-method-composer" className="text-token-lg">寫這本書的人</h2>
        <p className="mt-1 text-token-sm text-ink-faint tabular-nums">
          {composer.name}（{composer.nameZh}）　{composer.born.slice(0, 4)}–{composer.died.slice(0, 4)}
          生於 {composer.bornPlace}，卒於 {composer.diedPlace}
        </p>
        <p className="mt-3 text-token-sm leading-relaxed">{composer.life}</p>
        <p className="mt-3 text-token-sm leading-relaxed text-ink-muted">{composer.irony}</p>
      </section>

      <section className="mt-10">
        <h2 id="vt-method-book" className="text-token-lg">這本書</h2>
        <p className="mt-1 text-token-sm text-ink-faint">
          {book.titleIt}　{book.titleZh}　{book.published}
        </p>
        <p className="mt-3 text-token-sm leading-relaxed">{book.context}</p>
        <p className="mt-3 text-token-sm leading-relaxed">{book.reception}</p>
        <p className="mt-3 text-token-sm leading-relaxed">{book.design}</p>

        <blockquote className="mt-6 border-l-2 border-line pl-4">
          <p className="text-token-sm leading-relaxed">{prefaceQuote.zh}</p>
          <p className="mt-2 text-token-xs leading-relaxed text-ink-faint">{prefaceQuote.en}</p>
          <p className="mt-2 text-token-xs text-ink-faint">—— {prefaceQuote.from}</p>
        </blockquote>
      </section>

      <section className="mt-10">
        <h2 id="vt-method-placement" className="text-token-lg">它在聲樂教材裡的位置</h2>
        <ul className="mt-3 space-y-2">
          {placement.map((line) => (
            <li key={line} className="text-token-sm leading-relaxed">{line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 id="vt-method-numbering" className="text-token-lg">三套編號</h2>
        <p className="mt-3 text-token-sm leading-relaxed">{numbering.problem}</p>
        <ul className="mt-4 divide-y divide-line-soft border-y border-line-soft">
          {numbering.systems.map((sys) => (
            <li key={sys.name} className="grid gap-1 py-3 sm:grid-cols-[6rem_1fr] sm:gap-4">
              <p className="text-token-sm text-ink">{sys.name}</p>
              <p className="text-token-sm leading-relaxed text-ink-muted">{sys.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-token-xs leading-relaxed text-ink-faint">{numbering.alsoSeen}</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-token-sm">
            <thead>
              <tr className="border-b border-line text-left text-token-xs text-ink-faint">
                <th className="py-2 pr-4 font-normal">Vaccai 課號</th>
                <th className="py-2 pr-4 font-normal">曲號</th>
                <th className="py-2 pr-4 font-normal">課名</th>
                <th className="py-2 font-normal">首句</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                lesson.exercises.map((id, i) => {
                  const ex = byId[id];
                  return (
                    <tr key={id} className="border-b border-line-soft align-top">
                      <td className="py-2 pr-4 tabular-nums text-ink-faint">
                        {i === 0 ? `第 ${lesson.roman} 課` : ''}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{String(ex.no).padStart(2, '0')}</td>
                      <td className="py-2 pr-4">{ex.titleZh}</td>
                      <td className="py-2 text-ink-muted">{ex.incipit}</td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
