import { useState } from 'react';
import { Check, X } from 'lucide-react';

/*
 * An inline self-test. Each item is a statement the reader judges true or false;
 * choosing an option locks that item and reveals whether it was right, plus the
 * explanation. This is the one place a card's content stays hidden until the
 * reader acts — the whole point of a quiz is to answer before seeing the key, so
 * it is a deliberate exception to "everything starts open", the same spirit as
 * Derivation.jsx.
 *
 * Injected into the MDXProvider by the article shell, which passes the quiz data
 * from the data repo, so an .mdx file writes <Quiz /> with no props. Each item
 * carries an `en` block; the correct index is shared across languages.
 */
const COPY = {
  zh: {
    reveal: (n, total) => `已作答 ${n} / ${total}`,
    score: (right, total) => `答對 ${right} / ${total}`,
    correct: '答對了',
    wrong: '答錯了',
    yourPick: '你選了',
  },
  en: {
    reveal: (n, total) => `answered ${n} / ${total}`,
    score: (right, total) => `${right} / ${total} correct`,
    correct: 'Correct',
    wrong: 'Not quite',
    yourPick: 'you picked',
  },
};

function QuizItem({ item, index, lang, answer, onAnswer }) {
  const loc = lang === 'en' ? item.en ?? item : item;
  const options = loc.options ?? item.options;
  const answered = answer != null;
  const isCorrect = answered && answer === item.correctIndex;

  return (
    <li className="border-b border-line-soft py-5 last:border-b-0">
      <div className="flex gap-3">
        <span className="shrink-0 font-accent text-token-sm tabular-nums text-ink-faint">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="text-scaled-base leading-[1.8] text-ink">{loc.prompt}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((opt, i) => {
              const picked = answer === i;
              const showKey = answered && i === item.correctIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !answered && onAnswer(i)}
                  disabled={answered}
                  aria-pressed={picked}
                  className={[
                    'min-w-[72px] rounded-token-sm border px-4 py-1.5 text-token-sm transition-colors duration-fast',
                    answered
                      ? showKey
                        ? 'border-accent text-accent'
                        : picked
                          ? 'border-line text-ink-faint line-through'
                          : 'border-line-soft text-ink-faint'
                      : 'border-line text-ink hover:border-accent hover:text-accent',
                  ].join(' ')}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {answered ? (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-token-sm font-accent">
                {isCorrect ? (
                  <><Check size={14} className="text-accent" /><span className="text-accent">{COPY[lang].correct}</span></>
                ) : (
                  <><X size={14} className="text-ink-muted" /><span className="text-ink-muted">{COPY[lang].wrong}</span></>
                )}
              </p>
              <p className="mt-1.5 text-token-sm leading-[1.75] text-ink-muted">{loc.explain}</p>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function Quiz({ items = [], lang = 'zh' }) {
  const c = COPY[lang] ?? COPY.zh;
  const [answers, setAnswers] = useState({});
  const answeredCount = Object.keys(answers).length;
  const allDone = answeredCount === items.length && items.length > 0;
  const rightCount = items.filter((it) => answers[it.id] === it.correctIndex).length;

  return (
    <div className="my-8 rounded-token-md border border-line-soft p-5">
      <div className="flex items-baseline justify-between gap-3 border-b border-line-soft pb-3">
        <span className="font-accent text-token-xs uppercase tracking-wide text-ink-faint">
          {c.reveal(answeredCount, items.length)}
        </span>
        {allDone ? (
          <span className="font-accent text-token-sm tabular-nums text-ink">{c.score(rightCount, items.length)}</span>
        ) : null}
      </div>
      <ol>
        {items.map((item, i) => (
          <QuizItem
            key={item.id}
            item={item}
            index={i}
            lang={lang}
            answer={answers[item.id]}
            onAnswer={(choice) => setAnswers((prev) => ({ ...prev, [item.id]: choice }))}
          />
        ))}
      </ol>
    </div>
  );
}
