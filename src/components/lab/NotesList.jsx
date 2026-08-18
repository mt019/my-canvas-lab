import { ExternalLink } from 'lucide-react';

/*
 * 編號註釋的章末清單，與正文的浮卡指同一組資料（buildNotes 的 entries）。
 * 浮卡是給滑鼠讀者的順手答案，這份是給列印、鍵盤與「想一次看完所有註」的讀者；
 * 兩邊少了任何一邊，另一邊的讀者就沒有出處可看。
 *
 * 與 SourcesList 的差別：那份掃 DOM 裡的 span[data-cite] 自己編號（MDX 逐句包元件的
 * 站），這份的編號在渲染前就算好了（JSON 字串的站，見 textNotes.js）。
 */
export default function NotesList({ entries, title = '註釋與出處', id = 'notes' }) {
  if (!entries?.length) return null;
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 id={id} data-toc={title} className="font-serif text-token-xl font-bold leading-snug">{title}</h2>
      <ol className="mt-5 max-w-3xl list-none space-y-3">
        {entries.map((note) => (
          <li key={note.id} id={`fn-${note.n}`} className="flex gap-2.5 text-token-sm leading-[1.8] text-ink-muted">
            <a
              href={`#fn-ref-${note.n}`}
              title="返回正文"
              className="shrink-0 tabular-nums text-accent hover:underline"
            >
              {note.n}.
            </a>
            <span>
              {note.label ? <span className="text-ink">{note.label}</span> : null}
              {note.locator ? <span className="text-ink-faint">，{note.locator}</span> : null}
              {note.text ? <span className="block">{note.text}</span> : null}
              {note.quote ? (
                <span className="mt-1 block border-l-2 border-line pl-2 text-ink-faint">{note.quote}</span>
              ) : null}
              {note.href ? (
                <a
                  href={note.href}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1.5 inline-flex items-center gap-1 text-accent hover:underline"
                >
                  原文 <ExternalLink size={11} />
                </a>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
