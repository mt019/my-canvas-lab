import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import AppearanceMenu from '../components/AppearanceMenu';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import {
  blindSpots,
  closingIn,
  dateText,
  dayDiff,
  defaultEventSources,
  asideEventSources,
  entryOf,
  entryText,
  eventFacts,
  events,
  followed,
  inDays,
  inDefaultView,
  isAside,
  isOngoing,
  items,
  itemSources,
  md,
  monthKey,
  monthLabel,
  sourceLabel,
  todayInTaipei,
  URGENT_WINDOW,
} from './brief/data';

/*
 * 打開就看到的那一頁。它是儀表板，不是連結列表——一份「活動曆 →」的索引，讀者還是得
 * 點進去才知道有沒有事，那等於什麼都沒回答。這頁直接回答：有什麼快關門了、接下來有什麼、
 * 什麼正在進行、有什麼可以讀、看不到什麼。
 *
 * 活動只是其中一類。上一版整頁只講活動，因為資料端當時只有中研院；論文與央行講辭進來
 * 之後，「每一筆東西都有日期、地點、報名」這個假設整個塌掉——論文兩個都沒有。
 *
 * 由上而下的順序是照「錯過的代價」排的，不是照量排的：快關門的在最上面（錯過就真的沒了），
 * 售票節目在最下面而且收起來（444 檔，他大部分沒興趣）。**這是全頁唯一一次替他排序**；
 * 各區內部一律照時間，不按「重要性」重排——替他決定什麼重要，正是這個東西要殺的病。
 *
 * 每個數字都從它旁邊那個名字所指的同一個集合算出來。這條規矩是上一輪自己犯錯換來的：
 * 挑「預設視圖的來源」當名字、卻拿「全部場次」當數字，寫出「中研院、NCTS，共 528 場」，
 * 而那 528 裡有 444 場是售票節目。名字兩個、數字三個。
 */

/* 這一批東西各來自哪個來源、各幾件——名字與數字從同一個陣列數出來，不是從別處搬來的。 */
function asideBreakdown(rows) {
  const n = new Map();
  for (const { e } of rows) n.set(e.source, (n.get(e.source) ?? 0) + 1);
  return [...n.entries()].map(([id, count]) => ({ label: sourceLabel(id), n: count }));
}

const SHOW_TICKETED_CLOSING = 5;
const ITEMS_PER_SOURCE = 8;
const TICKETED_PREVIEW = 12;

function EventRow({ event, today, showSource }) {
  const entry = entryText(event, today);
  const facts = eventFacts(event);
  return (
    <div className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)_10rem]">
      <div className="text-token-xs leading-relaxed tabular-nums text-ink-muted">
        {dateText(event)}
        {/* 已經開始、還沒結束的東西不能標「18 天前」——那讀起來像過期的，而它今天還開著。 */}
        <span className="ml-1 text-ink-faint">
          {isOngoing(event, today) ? '進行中' : inDays(dayDiff(today, event.date))}
        </span>
      </div>
      <div className="min-w-0">
        <a
          href={event.detailUrl ?? event.eventUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="text-token-sm leading-snug text-ink transition-colors duration-fast hover:text-accent"
        >
          {event.title}
        </a>
        {event.status === '暫訂' ? <span className="ml-1.5 text-token-xs text-ink-faint">（暫訂）</span> : null}
        <div className="text-token-xs leading-relaxed text-ink-faint">
          {showSource ? <span className="text-ink-muted">{sourceLabel(event.source)}</span> : null}
          {showSource && facts.length ? ' · ' : ''}
          {facts.join(' · ')}
        </div>
      </div>
      <div className={`text-token-xs leading-relaxed tabular-nums sm:text-right ${entry.loud ? 'text-ink' : 'text-ink-faint'}`}>
        {entry.text}
        {event.registerUrl ? (
          <a href={event.registerUrl} target="_blank" rel="noreferrer" className="ml-1.5 text-accent underline underline-offset-2">
            報名
          </a>
        ) : null}
      </div>
    </div>
  );
}

/*
 * 第一區：門這幾天就要關的。
 *
 * 這是整個站上唯一「錯過就真的沒了」的東西，所以它在最上面，而且不分來源——中研院是
 * 報名截止、OPENTIX 是售票結束，對讀者的意義相同：過了就進不去。
 *
 * 但售票的那些另置一塊，不跟報名的混在同一條清單裡。今天的實況：這 7 天要關門的 36 件
 * 裡，34 件是售票結束，2 件是報名截止——混著按急迫度排，那 2 件會沉在 34 檔戲中間，
 * 而其中一件正是渡邊浩那場（8/14 開、7/20 截止）。把量大的來源跟量小的混排，就是把
 * 使用者真正在追的東西沖掉，那正是這頁存在要消滅的失敗模式。
 */
function ClosingSoon({ today }) {
  const { core, aside, untilFull } = useMemo(() => {
    const soon = (e) => {
      const left = closingIn(e, today);
      return left != null && left >= 0 && left <= URGENT_WINDOW;
    };
    const rows = events.filter(soon).map((e) => ({ e, left: closingIn(e, today) }));
    return {
      // 額滿為止：要報名、有報名表、卻一個日期都沒公告。沒有任何一天可以倒數，所以它
      // 排在有截止日的前面——它比有截止日的更急，不是更鬆。
      untilFull: events.filter((e) => entryOf(e) === 'untilFull' && inDefaultView(e)),
      core: rows.filter(({ e }) => inDefaultView(e)).sort((a, b) => a.left - b.left),
      // 另置一塊的不是「售票的」，是「預設視圖以外的」——今天它剛好全是售票節目，但要是
      // 哪天某個沒追蹤的所有一場報名要截止，它得出現在這裡，不能被歸成戲票、也不能消失。
      aside: rows.filter(({ e }) => !inDefaultView(e)).sort((a, b) => a.left - b.left),
    };
  }, [today]);

  const rows = [...untilFull.map((e) => ({ e, left: null })), ...core];

  return (
    <section>
      <h2 id="closing" className="font-display text-token-lg text-ink">
        這 {URGENT_WINDOW} 天關門的
      </h2>
      <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">
        活動日還很遠，門這幾天就關。讓人錯過的從來不是活動日，是報名截止日。
      </p>

      {rows.length === 0 ? (
        <p className="text-token-sm leading-relaxed text-ink-muted">
          查得到的場次裡，這 {URGENT_WINDOW} 天沒有要關的門。這只涵蓋進場方式查清楚的那些，
          不是全部——見下面「這裡看不到什麼」。
        </p>
      ) : (
        rows.map(({ e, left }) => (
          <div key={e.id} className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
            <div className="text-token-sm leading-snug tabular-nums text-ink">
              {left == null ? '額滿為止' : left === 0 ? '今天最後一天' : `剩 ${left} 天`}
              <div className="text-token-xs leading-relaxed text-ink-faint">
                {left == null
                  ? '無公告截止日，額滿就關'
                  : `${md(e.closesAt)} ${e.closesAtKind}${e.mayCloseWhenFull ? '，可能更早' : ''}`}
              </div>
            </div>
            <div className="min-w-0">
              <a
                href={e.detailUrl ?? e.eventUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="text-token-sm leading-snug text-ink transition-colors duration-fast hover:text-accent"
              >
                {e.title}
              </a>
              <div className="text-token-xs leading-relaxed text-ink-faint">
                {[sourceLabel(e.source), ...eventFacts(e).slice(0, 2)].join(' · ')}
              </div>
              <div className="text-token-xs leading-relaxed text-ink-faint">
                {dateText(e)} 開 · {inDays(dayDiff(today, e.date))}
                {e.registerUrl ? (
                  <a href={e.registerUrl} target="_blank" rel="noreferrer" className="ml-2 text-accent underline underline-offset-2">
                    去報名
                  </a>
                ) : null}
                {e.registerSourceUrl ? (
                  <a href={e.registerSourceUrl} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">
                    期限出處
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))
      )}

      {aside.length > 0 ? (
        <div className="mt-5">
          <p className="text-token-xs leading-relaxed text-ink-faint">
            另有 {aside.length} 件不在預設視圖裡的門這 {URGENT_WINDOW} 天要關（
            {asideBreakdown(aside).map((x) => `${x.label} ${x.n} 件`).join('、')}）。
            不跟上面混排：{aside.length} 比 {rows.length}，混著排會把上面那 {rows.length} 件沖掉。
          </p>
          {aside.slice(0, SHOW_TICKETED_CLOSING).map(({ e, left }) => (
            <div key={e.id} className="flex items-baseline justify-between gap-3 border-b border-line-soft py-1.5">
              <a
                href={e.detailUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-token-xs text-ink-muted transition-colors duration-fast hover:text-accent"
              >
                {e.title}
              </a>
              <span className="shrink-0 text-token-xs tabular-nums text-ink-faint">
                {md(e.closesAt)} {e.closesAtKind} · {left === 0 ? '今天最後一天' : `剩 ${left} 天`}
              </span>
            </div>
          ))}
          {aside.length > SHOW_TICKETED_CLOSING ? (
            <p className="mt-1.5 text-token-xs text-ink-faint">
              還有 {aside.length - SHOW_TICKETED_CLOSING} 件，
              <a href="#ticketed" className="text-accent underline underline-offset-2">
                在下面的售票節目裡
              </a>
              。
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/*
 * 第二區：接下來的活動。來源分組，組內照時間——不排序。
 *
 * 不做「重要度」排序是刻意的：這個系統要對付的是「滑兩百則垃圾換三則有用的」，而演算法
 * 替人決定什麼重要，正是那個病本身。這裡只負責把東西照時間攤平，判斷留給讀者。
 */
function Upcoming({ today }) {
  const groups = useMemo(() => {
    const shown = events.filter((e) => inDefaultView(e) && !isOngoing(e, today));
    return defaultEventSources
      .map((s) => ({
        source: s,
        rows: shown.filter((e) => e.source === s.id).sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .filter((g) => g.rows.length > 0);
  }, [today]);

  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  /* 預設視圖以外、但同樣來自這幾個來源的場次。這個數字要講出來——不講的話，這一區看起來
     就像那幾個來源的全部，而它只是我追蹤的那部分。 */
  const notFollowed = useMemo(
    () => events.filter((e) => !isAside(e) && !inDefaultView(e) && !isOngoing(e, today)).length,
    [today],
  );

  return (
    <section className="mt-12 border-t border-line pt-6">
      <h2 id="upcoming" className="font-display text-token-lg text-ink">
        接下來的活動
        <span className="ml-2 text-token-sm text-ink-faint">{total} 場</span>
      </h2>
      <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">
        {groups.map((g) => `${g.source.label} ${g.rows.length} 場`).join('、')}
        ，只列我追蹤的 {followed.length} 個主辦單位。另外 {notFollowed} 場在沒追蹤的單位底下，一樣在庫裡，
        <Link to="/brief/events?hosts=all" className="text-accent underline underline-offset-2">
          活動曆
        </Link>
        切一下就找得到——篩選是視圖，不是入庫條件。
      </p>

      {groups.map(({ source, rows }) => (
        <div key={source.id} className="mt-6">
          <h3 className="mb-1 font-display text-token-base text-ink-muted">
            {source.label}
            <span className="ml-2 text-token-xs text-ink-faint">{rows.length} 場</span>
          </h3>
          {monthsOf(rows).map(({ key, rows: inMonth }) => (
            <div key={key} className="mt-3">
              <p className="mb-0.5 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">
                {monthLabel(key)}
              </p>
              {inMonth.map((e) => (
                <EventRow key={e.id} event={e} today={today} showSource={false} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function monthsOf(rows) {
  const out = [];
  for (const e of rows) {
    const k = monthKey(e.date);
    if (out.length === 0 || out[out.length - 1].key !== k) out.push({ key: k, rows: [e] });
    else out[out.length - 1].rows.push(e);
  }
  return out;
}

/*
 * 第三區：正在進行中的。跨日的東西自成一區，別混進「接下來」。
 *
 * 一個 6/29 開始、7/17 結束的暑期課程，混進「接下來的活動」裡會排在最前面然後標「18 天前」，
 * 讀起來像過期的東西——它其實今天還開著。開始日已經過去、但還沒結束，那是第三種處境。
 */
function Ongoing({ today }) {
  const rows = useMemo(
    () => events.filter((e) => inDefaultView(e) && isOngoing(e, today)).sort((a, b) => a.endDate.localeCompare(b.endDate)),
    [today],
  );
  const asideCount = useMemo(() => events.filter((e) => isAside(e) && isOngoing(e, today)).length, [today]);

  if (rows.length === 0 && asideCount === 0) return null;

  return (
    <section className="mt-12 border-t border-line pt-6">
      <h2 id="ongoing" className="font-display text-token-lg text-ink">
        正在進行中
        <span className="ml-2 text-token-sm text-ink-faint">{rows.length} 場</span>
      </h2>
      <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">
        已經開始、還沒結束。這種東西在只看開始日的清單上會在開幕隔天消失，而它還開著。
      </p>
      {rows.map((e) => (
        <EventRow key={e.id} event={e} today={today} showSource />
      ))}
      {asideCount > 0 ? (
        <p className="mt-2 text-token-xs leading-relaxed text-ink-faint">
          另有 {asideCount} 檔售票節目正在檔期中，在
          <a href="#ticketed" className="text-accent underline underline-offset-2">
            下面
          </a>
          。
        </p>
      ) : null}
    </section>
  );
}

/*
 * 第四區：讀的東西。
 *
 * 兩個來源分開兩區，不合併成「文章」：arXiv 是作者自己貼的一手預印本（沒人審過、會改版），
 * BIS 是別人挑過整理過的二手收錄。它們不同類，併成一堆就是把「誰說的」抹掉。
 *
 * **沒有倒數。** 論文沒有「來不及」——它的日期是「什麼時候出來的」，不是「你得在那天到場」。
 * 拿倒數去算一篇三天前的預印本還剩幾天，就是把兩種東西畫成同一種。
 */
function Reading() {
  return (
    <section className="mt-12 border-t border-line pt-6">
      <h2 id="reading" className="font-display text-token-lg text-ink">
        讀的東西
        <span className="ml-2 text-token-sm text-ink-faint">{items.length} 篇</span>
      </h2>
      <p className="mb-2 mt-1 text-token-sm leading-relaxed text-ink-muted">
        只排新舊，不倒數——這些東西沒有「來不及」。每個來源各自的配額，話多的不會把話少的擠掉。
      </p>

      {itemSources.map((s) => {
        const rows = items
          .filter((i) => i.source === s.id)
          .sort((a, b) => (b.revisedAt ?? b.publishedAt).localeCompare(a.revisedAt ?? a.publishedAt));
        if (rows.length === 0) return null;
        const shown = rows.slice(0, ITEMS_PER_SOURCE);
        return (
          <div key={s.id} className="mt-6">
            <h3 className="font-display text-token-base text-ink-muted">
              {s.label}
              <span className="ml-2 text-token-xs text-ink-faint">{rows.length} 篇</span>
            </h3>
            <p className="mb-2 text-token-xs leading-relaxed text-ink-faint">{s.note}</p>
            {shown.map((i) => (
              <div key={i.id} className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2 sm:grid-cols-[5rem_minmax(0,1fr)]">
                <div className="text-token-xs leading-relaxed tabular-nums text-ink-faint">
                  {md(i.publishedAt)}
                  {i.revisedAt ? <span className="ml-1">改版 {md(i.revisedAt)}</span> : null}
                </div>
                <div className="min-w-0">
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-token-sm leading-snug text-ink transition-colors duration-fast hover:text-accent"
                  >
                    {i.title}
                  </a>
                  <div className="text-token-xs leading-relaxed text-ink-faint">
                    {[
                      i.authors?.length ? i.authors.slice(0, 3).join('、') + (i.authors.length > 3 ? ' 等' : '') : null,
                      i.journalRef,
                      i.topics?.length ? i.topics.slice(0, 3).join(' ') : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
              </div>
            ))}
            {rows.length > shown.length ? (
              <p className="mt-1.5 text-token-xs text-ink-faint">還有 {rows.length - shown.length} 篇在資料裡，這頁還沒有翻頁。</p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

/*
 * 第五區：售票節目。預設收起來——444 檔，他大部分沒興趣，攤開會把上面每一區都淹掉。
 *
 * 收起來不是刪掉：數字、售票期間、進去看的路都在，只是不佔據注意力。倉裡還有其他 19 個
 * 城市的節目沒送上站，那是版面的選擇，不是收錄的選擇。
 */
function Ticketed({ today }) {
  const [open, setOpen] = useState(false);
  // 看的是來源，不是 inDefaultView——後者會把沒追蹤的所的講座也算成戲票。
  const rows = useMemo(() => events.filter(isAside).sort((a, b) => a.date.localeCompare(b.date)), []);
  if (rows.length === 0) return null;

  const cities = [...new Set(rows.map((e) => e.city).filter(Boolean))];

  return (
    <section className="mt-12 border-t border-line pt-6">
      <h2 id="ticketed" className="font-display text-token-lg text-ink">
        售票節目
        <span className="ml-2 text-token-sm text-ink-faint">{rows.length} 檔</span>
      </h2>
      <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">
        {asideEventSources.map((s) => s.label).join('、')}，{cities.join('、')}
        。預設收起來：這一區的量比上面全部加起來還大，攤開就會把上面淹掉。
      </p>
      <p className="mt-1 text-token-xs leading-relaxed text-ink-faint">
        剩幾張票這裡不存——那種數字幾小時就過期，存下來只會說謊。倉裡放穩定的、用來找到東西的；
        要決定買不買，得去售票頁看當下的票況。
      </p>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-token-xs text-accent underline underline-offset-2"
        >
          {open ? '收起來' : `展開前 ${Math.min(TICKETED_PREVIEW, rows.length)} 檔`}
        </button>
        <Link to="/brief/events?sources=all" className="ml-4 text-token-xs text-accent underline underline-offset-2">
          在活動曆裡看全部
        </Link>
      </div>
      {open ? (
        <div className="mt-3">
          {rows.slice(0, TICKETED_PREVIEW).map((e) => (
            <EventRow key={e.id} event={e} today={today} showSource={false} />
          ))}
          <p className="mt-1.5 text-token-xs text-ink-faint">
            這裡只放前 {Math.min(TICKETED_PREVIEW, rows.length)} 檔。全部 {rows.length} 檔在活動曆，可以按類型與月份切。
          </p>
        </div>
      ) : null}
    </section>
  );
}

/* 第六區：資料從哪裡來、看不到什麼。這一格會長，版面先假設它會長。 */
function Provenance() {
  return (
    <>
      <section className="mt-12 border-t border-line pt-6">
        <h2 id="sources" className="font-display text-token-lg text-ink">
          資料來自哪裡
          <span className="ml-2 text-token-sm text-ink-faint">{[...defaultEventSources, ...asideEventSources, ...itemSources].length} 個來源</span>
        </h2>
        <dl className="mt-4">
          {[...defaultEventSources, ...asideEventSources, ...itemSources].map((s) => (
            <div key={s.id} className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="text-token-sm text-ink">
                {s.label}
                <span className="ml-1.5 text-token-xs text-ink-faint">{s.kind}</span>
              </dt>
              <dd className="text-token-xs leading-relaxed text-ink-faint">
                {s.note}
                <div className="tabular-nums">
                  {(s.collection === 'events'
                    ? [
                        `未來或進行中 ${s.upcoming} 場`,
                        `留著可查 ${s.recorded.toLocaleString()} 場`,
                        s.hosts ? `${s.hosts} 個主辦單位` : null,
                        s.citiesRecorded ? `庫裡 ${s.citiesRecorded} 個城市` : null,
                        s.defaultCity ? `站上只送${s.defaultCity}` : null,
                        s.registrationChecked ? `進場方式查清楚 ${s.registrationChecked} 場` : null,
                      ]
                    : [`送上站 ${s.sent} 篇`, `庫裡 ${s.recorded} 篇`, `最新 ${s.newest}`]
                  )
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 border-t border-line pt-6">
        <h2 id="blind-spots" className="font-display text-token-lg text-ink">
          這裡看不到什麼
        </h2>
        <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">
          有缺口就講出來。一份看起來完整的清單，比一份說得出自己漏了什麼的清單危險。
        </p>
        <dl className="mt-4">
          {blindSpots.map((s) => (
            <div key={s.id} className="border-b border-line-soft py-2.5">
              <dt className="text-token-sm text-ink">{s.title}</dt>
              <dd className="mt-0.5 text-token-xs leading-relaxed text-ink-faint">{s.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

export default function Brief() {
  const [scale, setScale] = useFontScale();
  const today = todayInTaipei();

  return (
    <PageShell
      title="簡報"
      eyebrow="Brief"
      width="prose"
      fontScale={scale}
      controls={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
    >
      <p className="text-token-sm leading-relaxed text-ink-muted">
        打開就看得到的東西，每天累積。快關門的排在最上面，售票節目收在最下面——這頁只替你排這一次，
        每一區裡面都照時間，不按「重要」重排。
        要細看活動、換個軸去切，
        <Link to="/brief/events" className="text-accent underline underline-offset-2">
          進活動曆
        </Link>
        。
      </p>

      <div className="mt-8">
        <ClosingSoon today={today} />
        <Upcoming today={today} />
        <Ongoing today={today} />
        <Reading />
        <Ticketed today={today} />
        <Provenance />
      </div>
    </PageShell>
  );
}
