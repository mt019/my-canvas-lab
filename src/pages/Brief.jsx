import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppearanceMenu from '../components/AppearanceMenu';
import AccountControl from '../components/AccountControl';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import Tabs, { useTabParams } from '../components/lab/Tabs';
import DashboardLayout from '../components/lab/DashboardLayout';
import MarkButton from './brief/_MarkButton';
import { liveOf, snapshotEvent, snapshotItem, useGoing, useKept, useSeen, useWent } from './brief/marks';
import {
  blindSpots,
  closingIn,
  dateText,
  dayDiff,
  entryOf,
  entryText,
  eventFacts,
  eventInWindow,
  eventSections,
  events,
  followed,
  inDays,
  inDefaultView,
  isAsideSection,
  isOngoing,
  itemDateText,
  itemFacts,
  itemRevisedText,
  itemInWindow,
  itemSections,
  items,
  itemsOfSource,
  md,
  sectionId,
  sourceLabel,
  sources,
  todayInTaipei,
  URGENT_WINDOW,
  WINDOWS,
} from './brief/data';

/*
 * 打開就看到的那一頁。它是儀表板，不是連結列表——一份「活動曆 →」的索引，讀者還是得
 * 點進去才知道有沒有事，那等於什麼都沒回答。這頁直接回答：有什麼快關門了、每一類各有
 * 什麼新的、看不到什麼。
 *
 * **區塊從資料長出來。** 上一版是手寫的六區，於是資料端從 5 個來源長到 27 個的那一天，
 * 站上還是六區，多出來的 22 個來源全部擠進「讀的東西」底下一條長清單。現在每個 kind 一區
 * （見 data.js 的 sectionsOf），資料倉加一個新類的來源＝站上多一區，這裡一個字都不用改。
 *
 * **版面的比例不跟資料的比例走。** 活動 528 場、讀的東西 247 篇，但活動只有 2 種 kind、
 * 讀的東西有 10 種——區塊數照類別算，不照筆數算。使用者原話：「活動只是整個 brief 裡面
 * 很小的一部分。」量最大的東西會把版面長成它的形狀，而那個形狀看起來完全正常。
 *
 * 區之間排一次，照「錯過的代價」：門這幾天要關的在最上面（錯過就真的沒了），活動有日期
 * 要排行程，讀的東西不會消失所以在後面，整區預設不跳出來的沉到該收藏的位置。**各區內部
 * 一律照時間，不按「重要」重排**——替他決定什麼重要，正是這個東西要殺的病。
 *
 * 每一區只出每個來源的前幾件，全部在內頁（活動曆／讀的東西）。這兩件事在這裡是同一條規則：
 * 上一版活動有一整個內頁，讀的東西一個都沒有——那也是一種版面跟著資料比例走。
 *
 * 每個數字都從它旁邊那個名字所指的同一個集合算出來。這條規矩是自己犯錯換來的：挑「預設
 * 視圖的來源」當名字、卻拿「全部場次」當數字，寫出「中研院、NCTS，共 528 場」，而那 528
 * 裡有 444 場是售票節目。名字兩個、數字三個。
 */

const PREVIEW_PER_SOURCE = 4;
const SHOW_ASIDE_CLOSING = 5;

/* 這一批東西各來自哪個來源、各幾件——名字與數字從同一個陣列數出來，不是從別處搬來的。 */
function breakdown(rows, key = (x) => x.source) {
  const n = new Map();
  for (const r of rows) n.set(key(r), (n.get(key(r)) ?? 0) + 1);
  return [...n.entries()].map(([id, count]) => ({ label: sourceLabel(id), n: count }));
}

/* 一區的抬頭：類別的名字、這一區有幾件、來自哪幾個來源。三個數字同一個集合。 */
function SectionHead({ sec, count, unit, children }) {
  return (
    <>
      <h2 id={sectionId(sec.kind)} className="font-display text-token-lg text-ink">
        {sec.kind}
        <span className="ml-2 text-token-sm tabular-nums text-ink-faint">
          {count} {unit}
        </span>
      </h2>
      <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">{children}</p>
    </>
  );
}

/*
 * 一個類別只有一個來源時，來源標題就不印。
 *
 * 「預印本 12 篇」底下再掛一個「arXiv 12 篇」，而區的說明那行也寫著「arXiv 12 篇」——同一個
 * 數字講三遍，多出來的兩層一個字的資訊都沒有。分層要分得出東西：用一個所有項目都相同的
 * 欄位去分組，等於印出一排講同一個詞的標題，比不分組更糟。
 *
 * 這是條件不是特例：資料倉哪天在「預印本」底下多接一個來源，那一層自己就會長回來。
 */
function SourceHead({ source, count, unit, note, alone }) {
  if (alone) return note ? <p className="mb-2 text-token-xs leading-relaxed text-ink-faint">{note}</p> : null;
  return (
    <>
      <h3 id={`src-${source.id}`} className="font-display text-token-base text-ink-muted">
        {source.label}
        <span className="ml-2 text-token-xs tabular-nums text-ink-faint">
          {count} {unit}
        </span>
      </h3>
      {note ? <p className="mb-2 text-token-xs leading-relaxed text-ink-faint">{note}</p> : null}
    </>
  );
}

function EventRow({ event, today, showSource, going, went }) {
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
        {going || went ? (
          <div className="mt-0.5 flex flex-col items-start gap-0.5 sm:items-end">
            {going ? (
              <MarkButton
                on={going.has(event.id)}
                onToggle={() => {
                  if (!going.has(event.id)) went.remove(event.id);
                  going.toggle(snapshotEvent(event));
                }}
                label="我要去"
              />
            ) : null}
            {went ? (
              <MarkButton
                on={went.has(event.id)}
                onToggle={() => {
                  if (!went.has(event.id)) going.remove(event.id);
                  went.toggle(snapshotEvent(event));
                }}
                label="我去了"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/*
 * 最上面那一區：門這幾天就要關的。
 *
 * 它不是照 kind 長出來的，因為它問的是另一個軸：**不是「這是哪一類東西」，是「哪些東西
 * 今天不動手就沒了」。** 這是整個站上唯一「錯過就真的沒了」的東西，所以它在最上面，而且
 * 不分來源也不分類——中研院是報名截止、OPENTIX 是售票結束，對讀者的意義相同：過了就進不去。
 *
 * 只有活動有門（讀的東西沒有 closesAt，論文不會關門），所以這裡只掃 events。哪天有個來源
 * 的東西也會關門（投稿截止之類），它帶 closesAt 進來就會自己出現在這裡。
 *
 * 但預設視圖以外的另置一塊，不跟上面混在同一條清單裡。今天的實況：這 7 天要關門的 36 件
 * 裡，34 件是售票結束，2 件是報名截止——混著按急迫度排，那 2 件會沉在 34 檔戲中間，而其中
 * 一件正是渡邊浩那場（8/14 開、7/20 截止）。把量大的來源跟量小的混排，就是把使用者真正在
 * 追的東西沖掉，那正是這頁存在要消滅的失敗模式。
 */
function ClosingSoon({ today }) {
  const { core, aside, untilFull } = useMemo(() => {
    const soon = (e) => {
      const left = closingIn(e, today);
      return left != null && left >= 0 && left <= URGENT_WINDOW;
    };
    const rows = events.filter(soon).map((e) => ({ e, left: closingIn(e, today) }));
    return {
      // 額滿為止：要報名、有報名表，一個日期都沒公告。沒有任何一天可以倒數，所以它排在
      // 有截止日的前面——它比有截止日的更急，不是更鬆。
      untilFull: events.filter((e) => entryOf(e) === 'untilFull' && inDefaultView(e)),
      core: rows.filter(({ e }) => inDefaultView(e)).sort((a, b) => a.left - b.left),
      // 另置一塊的不是「售票的」，是「預設視圖以外的」——今天它剛好全是售票節目，但要是
      // 哪天某個沒追蹤的所有一場報名要截止，它得出現在這裡，不能被歸成戲票、也不能消失。
      aside: rows.filter(({ e }) => !inDefaultView(e)).sort((a, b) => a.left - b.left),
    };
  }, [today]);

  const rows = [...untilFull.map((e) => ({ e, left: null })), ...core];

  return (
    // 唯一「錯過就沒了」的區，用一道警示色的左細線把它從其餘等重的髮絲線列裡拉出來——
    // 是 keyline 不是卡片：不填底、不加框、不加圓角，只給一條墨線和一點左內距。
    <section className="border-l-2 border-warn pl-4 sm:pl-5">
      <h2 id="closing" className="font-display text-token-lg text-ink">
        這 {URGENT_WINDOW} 天關門的
        <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{rows.length} 件</span>
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
            {breakdown(aside.map(({ e }) => e)).map((x) => `${x.label} ${x.n} 件`).join('、')}）。
            不跟上面混排：{aside.length} 比 {rows.length}，混著排會把上面那 {rows.length} 件沖掉。
          </p>
          {aside.slice(0, SHOW_ASIDE_CLOSING).map(({ e, left }) => (
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
          {aside.length > SHOW_ASIDE_CLOSING ? (
            <p className="mt-1.5 text-token-xs text-ink-faint">
              還有 {aside.length - SHOW_ASIDE_CLOSING} 件，在下面各自的類別裡。
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/*
 * 一類活動一區。中研院＋NCTS 是「學術活動」，OPENTIX 是「文化活動」——那兩個字是資料倉
 * 標的（sources.json 的 kind），不是這裡編的分類。
 *
 * kind 不跨來源統一：每一筆活動自己的 kind（「演講或講座」對「音樂／戲劇」）是各來源自己
 * 的一套，硬併成一套就是編的。這裡分區用的是**來源層**的 kind，那一層資料倉已經編好了。
 */
function EventKindSection({ sec, today, first, pool, going, went }) {
  const aside = isAsideSection(sec);
  const all = useMemo(() => pool.events.filter((e) => sec.sources.some((s) => s.id === e.source)), [sec, pool]);
  /* 收起來的區整區都是預設不跳出來的來源，沒有「我追蹤誰」這回事；沒收起來的區預設只給
     我追蹤的主辦單位，其餘照實講有幾場、去哪找。 */
  const shown = useMemo(() => (aside ? all : all.filter((e) => inDefaultView(e))), [all, aside]);
  const [open, setOpen] = useState(!aside);

  const notFollowed = all.length - shown.length;
  const groups = sec.sources
    .map((s) => {
      const rows = shown
        .filter((e) => e.source === s.id)
        .sort((a, b) => {
          // 進行中的排前面：一個 6/29 開始、7/17 結束的暑期課程，照開始日排會沉到最底下
          // 然後標「18 天前」，讀起來像過期的東西——它今天還開著。
          const og = Number(isOngoing(b, today)) - Number(isOngoing(a, today));
          return og || a.date.localeCompare(b.date);
        });
      return { source: s, rows };
    })
    .filter((g) => g.rows.length > 0);

  if (groups.length === 0) return null;

  const cities = [...new Set(shown.map((e) => e.city).filter(Boolean))];
  const ongoingCount = shown.filter((e) => isOngoing(e, today)).length;

  return (
    <section className={first ? 'mt-8' : 'mt-12 border-t border-line pt-6'}>
      <SectionHead sec={sec} count={shown.length} unit="場">
        {groups.map((g) => `${g.source.label} ${g.rows.length} 場`).join('、')}
        {ongoingCount > 0 ? `。其中 ${ongoingCount} 場正在進行中——已經開始、還沒結束` : ''}
        {aside ? (
          <>
            。{cities.length > 0 ? `${cities.join('、')}。` : ''}
            預設收起來：這一區的量比其他全部加起來還大，攤開會把上面每一區都淹掉。收起來不是刪掉，
            數字、售票期間、進去看的路都在。
          </>
        ) : (
          <>
            ，只列精選的 {followed.length} 個主辦單位。另外 {notFollowed} 場在其餘單位底下，
            都還在，
            <Link to="/brief/events?hosts=all" className="text-accent underline underline-offset-2">
              活動曆
            </Link>
            切一下就找得到——篩選只是換個看法，不是把東西刪掉。
          </>
        )}
      </SectionHead>

      {aside ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mb-3 text-token-xs text-accent underline underline-offset-2"
        >
          {open ? '收起來' : `展開每個來源的前 ${PREVIEW_PER_SOURCE} 檔`}
        </button>
      ) : null}

      {open
        ? groups.map(({ source, rows }) => (
            <div key={source.id} className="mt-5">
              <SourceHead source={source} count={rows.length} unit="場" alone={groups.length === 1} />
              {rows.slice(0, PREVIEW_PER_SOURCE).map((e) => (
                <EventRow key={e.id} event={e} today={today} showSource={false} going={going} went={went} />
              ))}
              {rows.length > PREVIEW_PER_SOURCE ? (
                <p className="mt-1.5 text-token-xs text-ink-faint">
                  還有 {rows.length - PREVIEW_PER_SOURCE} 場，
                  <Link
                    to={`/brief/events?sources=${source.id}&hosts=${aside ? 'all' : 'followed'}`}
                    className="text-accent underline underline-offset-2"
                  >
                    在活動曆裡按月份或類型切
                  </Link>
                  。
                </p>
              ) : null}
            </div>
          ))
        : null}
    </section>
  );
}

/*
 * 一類讀的東西一區。10 區，因為資料倉標了 10 種 kind——不是因為我覺得該有 10 區。
 *
 * **沒有倒數。** 論文沒有「來不及」——它的日期是「什麼時候出來的」，不是「你得在那天到場」。
 * 拿倒數去算一篇三天前的預印本還剩幾天，就是把兩種東西畫成同一種。
 *
 * 同一區裡的來源不合併成一條清單：BIS 是別人挑過整理過的二手收錄，Fed 是講者自己貼的一手
 * 講辭，兩者都是「央行講辭」但「誰說的」不一樣，併成一堆就是把那件事抹掉。而且合併之後
 * 話多的來源會把話少的擠掉，畫面上完全看不出來。
 */
function ItemKindSection({ sec, today, first, pool, full, kept }) {
  const keep = useMemo(() => new Set(pool.items.map((i) => i.id)), [pool]);
  const groups = sec.sources
    .map((s) => ({ source: s, rows: itemsOfSource(s.id).filter((i) => keep.has(i.id)) }))
    .filter((g) => g.rows.length > 0);
  if (groups.length === 0) return null;

  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  /* 日報是拿來讀的，不是拿來找的：這一批是「我還沒看過的」，看得完，所以全出、連摘要。
     週報月報是回顧，112 與 192 篇——那個量攤開連摘要就是另一個滑不完的東西。 */
  const overflow = full ? [] : groups.filter((g) => g.rows.length > PREVIEW_PER_SOURCE);
  const readingHref = `/brief/reading?sources=${groups.map((g) => g.source.id).join(',')}`;

  return (
    <section className={first ? 'mt-8' : 'mt-12 border-t border-line pt-6'}>
      <SectionHead sec={sec} count={total} unit="篇">
        {groups.map((g) => `${g.source.label} ${g.rows.length} 篇`).join('、')}
        。只排新舊，不倒數——這些東西沒有「來不及」。
      </SectionHead>

      {groups.map(({ source, rows }) => (
        <div key={source.id} className="mt-5">
          <SourceHead source={source} count={rows.length} unit="篇" note={source.note} alone={groups.length === 1} />
          {(full ? rows : rows.slice(0, PREVIEW_PER_SOURCE)).map((i) => (
            <div key={i.id} className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2 sm:grid-cols-[5rem_minmax(0,1fr)]">
              <div className="text-token-xs leading-relaxed tabular-nums text-ink-faint">
                {itemDateText(i, today)}
                {itemRevisedText(i, today) ? <span className="ml-1">{itemRevisedText(i, today)}</span> : null}
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
                  {itemFacts(i).join(' · ')}
                  {itemFacts(i).length ? <span className="mx-1.5">·</span> : null}
                  <MarkButton on={kept.has(i.id)} onToggle={() => kept.toggle(snapshotItem(i))} label="留著" />
                </div>
                {/* 摘要可以是 null，而且那是事實（36/247：ECB 與 OECD 的登錄裡沒有 abstract，
                    Reddit 轉貼連結的貼文沒有內文）。空著就空著，不拿別的欄位去湊。 */}
                {full && i.summary ? (
                  <p className="mt-1 text-token-xs leading-relaxed text-ink-muted">{i.summary}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ))}

      {overflow.length > 0 ? (
        <p className="mt-3 text-token-xs leading-relaxed text-ink-faint">
          每個來源這裡只出前 {PREVIEW_PER_SOURCE} 篇。
          <Link to={readingHref} className="text-accent underline underline-offset-2">
            這一區全部 {total} 篇連摘要
          </Link>
          在「讀的東西」裡。
        </p>
      ) : null}
    </section>
  );
}

/*
 * 一筆標記怎麼畫。
 *
 * **庫裡還有就畫庫裡那一筆，輪替走了才退回快照。** 快照是退路不是主要來源：一場活動的
 * 售票結束日會往後延、一篇論文會改版，那些事快照不會知道——它只是按下去那一刻的樣子。
 *
 * 輪替走的那些**照樣列出來，而且明說它為什麼看起來比較少**。這是整個標記層存在的理由：
 * 每個來源只送最新 12 篇，你留的東西幾天內就會被新的擠出這批投影。安靜地讓它消失，
 * 等於這顆「留著」是假的。
 */
function MarkRow({ record, today, marks, label }) {
  const live = liveOf(record.id);
  const entry = live && record.kind === 'event' ? entryText(live, today) : null;
  const title = live?.title ?? record.title;
  const url = live ? (live.detailUrl ?? live.eventUrl ?? live.url ?? null) : record.url;
  const when =
    live && record.kind === 'event'
      ? `${dateText(live)} · ${isOngoing(live, today) ? '進行中' : inDays(dayDiff(today, live.date))}`
      : live
        ? itemDateText(live, today)
        : record.date;

  return (
    <div className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)_6rem]">
      <div className="text-token-xs leading-relaxed tabular-nums text-ink-muted">{when}</div>
      <div className="min-w-0">
        <a
          href={url ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="text-token-sm leading-snug text-ink transition-colors duration-fast hover:text-accent"
        >
          {title}
        </a>
        <div className="text-token-xs leading-relaxed text-ink-faint">
          {[record.sourceLabel, entry?.text].filter(Boolean).join(' · ')}
        </div>
        {!live ? (
          <div className="text-token-xs leading-relaxed text-ink-faint">
            已經不在現在這批裡了——每個來源只送最新幾篇，它被新的擠出去了。連結還在，內容也還在原網站上。
          </div>
        ) : null}
      </div>
      <div className="sm:text-right">
        <MarkButton on onToggle={() => marks.remove(record.id)} label={label ?? (record.kind === 'event' ? '我要去' : '留著')} />
      </div>
    </div>
  );
}

/*
 * 「留著的」：這台瀏覽器記得的東西。
 *
 * 它不屬於任何一期，所以它不照日期收——**這一區的時間軸是「我什麼時候按的」**，不是東西
 * 本身的日期。你上禮拜留的那篇 2019 年的論文，是上禮拜的事。
 *
 * 我要去的分成還沒到的與已經過去的兩塊。過去的不刪：一場你標了要去的活動辦完了，把它
 * 從清單上抹掉是替你決定那件事不再存在——它是你今年去過哪些地方的紀錄。但它也不能跟
 * 還沒到的混在一起，那樣「我接下來要去哪」這個問題就沒人回答了。
 *
 * 「我去了」與「我要去」各自獨立：一場你可以只按「我去了」（臨時去的、沒先說要去），也可以
 * 兩個都按。所以它不是「我要去」的續集，是另一份清單——你今年實際去過哪些地方。
 */
function LectureMarks({ today, going, went, tab, onTabChange }) {
  const [upcoming, past] = useMemo(() => {
    const rows = going.list;
    return [
      rows.filter((r) => (r.endDate ?? r.date ?? '') >= today),
      rows.filter((r) => (r.endDate ?? r.date ?? '') < today),
    ];
  }, [going.list, today]);

  return (
    <section className="mt-4">
      <p className="max-w-2xl text-token-sm leading-relaxed text-ink">
        把實體講座的安排與足跡放在一起。標記只存在這台瀏覽器，不會上傳；同一場只會出現在一種狀態。
      </p>
      <Tabs
        variant="underline"
        label="我的講座"
        value={tab}
        onChange={onTabChange}
        className="mt-5"
        items={[
          { id: 'going', label: '要去', count: going.size },
          { id: 'went', label: '去過', count: went.size },
        ]}
      />

      {tab === 'going' ? (
        <div className="mt-6">
          <h2 id="going" className="font-display text-token-lg text-ink">
            接下來要去
            <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{upcoming.length} 場</span>
          </h2>
          <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">
            依活動日期整理你已經排進行程的講座。
          </p>
          {upcoming.length > 0 ? upcoming.map((r) => (
            <LectureMarkRow key={r.id} record={r} today={today} state="going" going={going} went={went} />
          )) : (
            <p className="py-6 text-token-sm text-ink-muted">還沒有安排講座。到日報或活動曆按「我要去」，就會收進這裡。</p>
          )}
          {past.length > 0 ? (
            <div className="mt-10 border-t border-line pt-6">
              <h3 className="font-display text-token-base text-ink">
                待確認
                <span className="ml-2 text-token-xs tabular-nums text-ink-faint">{past.length} 場</span>
              </h3>
              <p className="mb-2 text-token-xs leading-relaxed text-ink-muted">
                日期已經過去，但還沒有確認是否到場。去過就移到「去過」，沒去則取消安排。
              </p>
              {past.map((r) => (
                <LectureMarkRow key={r.id} record={r} today={today} state="going" going={going} went={went} />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-6">
          <h2 id="went" className="font-display text-token-lg text-ink">
            我去過的
            <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{went.size} 場</span>
          </h2>
          <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">你的實體講座足跡，最近標記的排在前面。</p>
          {went.size > 0 ? went.list.map((r) => (
            <LectureMarkRow key={r.id} record={r} today={today} state="went" going={going} went={went} />
          )) : (
            <p className="py-6 text-token-sm text-ink-muted">還沒有去過的講座紀錄。臨時參加的，也可以直接在活動列按「我去了」。</p>
          )}
        </div>
      )}
    </section>
  );
}

function LectureMarkRow({ record, today, state, going, went }) {
  const live = liveOf(record.id);
  const title = live?.title ?? record.title;
  const url = live ? (live.detailUrl ?? live.eventUrl ?? null) : record.url;
  const date = live?.date ?? record.date;
  const time = live?.time ?? record.time;
  const venue = live?.venue ?? record.venue;
  const speaker = live?.speaker ?? record.speaker;
  const poster = live?.poster ?? record.poster;
  const posterSourceUrl = live?.posterSourceUrl ?? record.posterSourceUrl;
  const description = live?.description ?? record.description;
  const when = live ? dateText(live) : [date, time].filter(Boolean).join(' ');

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-2 border-b border-line-soft py-4 sm:grid-cols-[8.5rem_6rem_minmax(0,1fr)_8rem]">
      <div className="text-token-xs leading-relaxed tabular-nums text-ink">
        {when}
        {date ? <div className="text-ink-muted">{inDays(dayDiff(today, date))}</div> : null}
      </div>
      <div className={`flex w-24 items-center justify-center overflow-hidden rounded-token-sm border border-line-soft bg-surface ${poster ? '' : 'min-h-[72px]'}`}>
        {poster ? (
          <img
            src={poster}
            alt={`${title}活動海報`}
            loading="lazy"
            className="block h-auto w-full"
          />
        ) : (
          posterSourceUrl ? (
            <a href={posterSourceUrl} target="_blank" rel="noreferrer" className="px-2 text-center font-accent text-token-xs leading-relaxed tracking-[0.08em] text-accent">
              查看活動圖
            </a>
          ) : <span className="font-accent text-token-xs tracking-[0.12em] text-ink-muted">講座</span>
        )}
      </div>
      <div className="min-w-0">
        <a href={url ?? undefined} target="_blank" rel="noreferrer" className="text-token-sm leading-snug text-ink transition-colors duration-fast hover:text-accent">
          {title}
        </a>
        <div className="mt-0.5 text-token-xs leading-relaxed text-ink-muted">{[speaker, venue, record.sourceLabel].filter(Boolean).join(' · ')}</div>
        {description ? <p className="mt-1 line-clamp-2 text-token-xs leading-relaxed text-ink-muted">{description}</p> : null}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 sm:mt-0 sm:justify-end">
        {state === 'going' ? (
          <>
            <MarkButton on onToggle={() => going.remove(record.id)} label="我要去" />
            <MarkButton
              on={false}
              onToggle={() => {
                going.remove(record.id);
                went.toggle({ ...record, markedAt: new Date().toISOString() });
              }}
              label="我去了"
            />
          </>
        ) : (
          <MarkButton on onToggle={() => went.remove(record.id)} label="我去了" />
        )}
      </div>
    </div>
  );
}

function KeptMarks({ kept, today }) {
  return (
    <section className="mt-4">
      <h2 id="kept" className="font-display text-token-lg text-ink">
        要讀的
        <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{kept.size} 篇</span>
      </h2>
      <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">你留下來準備讀的文章，照標記時間排列。</p>
      {kept.size > 0 ? kept.list.map((r) => (
        <MarkRow key={r.id} record={r} today={today} marks={kept} />
      )) : (
        <p className="py-6 text-token-sm text-ink-muted">還沒有要讀的文章。按文章列上的「留著」，它就不會隨資料更新消失。</p>
      )}
    </section>
  );
}

const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const occursOn = (event, date) => event.date <= date && (event.endDate ?? event.date) >= date;

function TodayEvents({ today, day, onDayChange, going, went }) {
  const choices = [
    { id: 'today', label: '今天', offset: 0 },
    { id: 'tomorrow', label: '明天', offset: 1 },
    { id: 'after', label: '後天', offset: 2 },
  ];
  const selected = choices.find((x) => x.id === day) ?? choices[0];
  const date = addDays(today, selected.offset);
  const rows = events
    .filter((e) => inDefaultView(e) && occursOn(e, date))
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.title.localeCompare(b.title, 'zh-Hant'));

  return (
    <section className="mt-4">
      <p className="max-w-2xl text-token-sm leading-relaxed text-ink">
        不用翻週報找今天。這裡只回答一件事：接下來三天，哪一天有哪些實體活動。
      </p>
      <Tabs
        variant="underline"
        label="近日活動日期"
        value={selected.id}
        onChange={onDayChange}
        className="mt-5"
        items={choices.map((x) => ({
          id: x.id,
          label: x.label,
          count: events.filter((e) => inDefaultView(e) && occursOn(e, addDays(today, x.offset))).length,
        }))}
      />
      <div className="mt-6">
        <h2 id="today-events" className="font-display text-token-lg text-ink">
          {selected.label}的活動
          <span className="ml-2 text-token-sm tabular-nums text-ink-muted">{rows.length} 場</span>
        </h2>
        <p className="mb-4 mt-1 text-token-sm text-ink-muted">{dateText({ date, allDay: true })}，依開始時間排列；跨日且仍在進行的也算。</p>
        {rows.length > 0 ? rows.map((event) => (
          <EventRow key={event.id} event={event} today={today} showSource going={going} went={went} />
        )) : (
          <p className="py-6 text-token-sm text-ink-muted">這一天目前沒有預設關注範圍內的活動。</p>
        )}
      </div>
    </section>
  );
}

/* 最後兩區：資料從哪裡來、看不到什麼。這一格會長，版面先假設它會長——上一輪它從 5 列長到 27 列。 */
function Provenance() {
  return (
    <>
      <section className="mt-12 border-t border-line pt-6">
        <h2 id="sources" className="font-display text-token-lg text-ink">
          資料來自哪裡
          <span className="ml-2 text-token-sm tabular-nums text-ink-faint">{sources.length} 個來源</span>
        </h2>
        <p className="mb-4 mt-1 text-token-sm leading-relaxed text-ink-muted">
          {breakdown(sources, (s) => s.collection).map((x) => x.n).join(' 個來源給活動、')} 個來源給讀的東西。
          上面每一區的名字（{[...new Set(sources.map((s) => s.kind))].length} 種類別）就是從這張表長出來的，
          加一個來源＝多一區。
        </p>
        <dl>
          {sources.map((s) => (
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
                        `歷來累積 ${s.recorded.toLocaleString()} 場`,
                        s.hosts ? `${s.hosts} 個主辦單位` : null,
                        s.citiesRecorded ? `涵蓋 ${s.citiesRecorded} 個城市` : null,
                        s.defaultCity ? `這裡只列${s.defaultCity}` : null,
                        s.registrationChecked ? `查清楚進場方式的 ${s.registrationChecked} 場` : null,
                      ]
                    : [`這裡列出 ${s.sent} 篇`, `歷來累積 ${s.recorded} 篇`, `最新 ${s.newest}`]
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

/*
 * 分頁切的是**時間**，不是類別。這一頁是一份報，不是一份目錄。
 *
 * 上一版切 collection（讀的東西／活動／資料來自哪裡），於是它回答的是「這個站有哪些東西」。
 * 使用者要的是「這段時間發生了什麼」——那是報。類別降成報裡面的欄目（區塊照樣從 sources[]
 * 長出來，見 sectionsOf），時間升上來當主軸。
 *
 * **日報＝我還沒看過的，不是「今天」。** 拿自然日當日報，每天早上打開都是空的：今天才過
 * 一點，只有 3 篇，而昨天那 25 篇已經掉進週報了。而且月精度的來源（NBER、IMF 共 24 篇）
 * 日期全部是該月 1 號，任何以日期為準的日報都會讓它們在 1 號噴出 24 篇、其餘 30 天掛零。
 * 改成記 id（見 marks.js）之後兩個問題一起消失：看過就是看過，跟它宣稱哪天出生無關。
 *
 * **週報月報是往兩個方向走的。** 同一個天數，讀的東西往回看（這 7 天出了什麼），活動往前看
 * （這 7 天要去哪）——因為那兩種日期的意義本來就相反。見 data.js 的 WINDOWS。
 *
 * **「這 N 天關門的」釘在分頁之上，不屬於任何一個分頁。** 錯過就沒了的東西不能藏在別的
 * 分頁後面——切到月報就看不到今天最後一天的報名，那正是這個站要消滅的失敗模式。
 */
const SOURCES_VIEW = 'sources';
const TODAY_VIEW = 'today-events';
const LECTURES_VIEW = 'lectures';
const KEPT_VIEW = 'kept';

export default function Brief() {
  const [scale, setScale] = useFontScale();
  const [{ view, lectures, activityDay }, setTabs] = useTabParams({ view: 'daily', lectures: 'going', activityDay: 'today' });
  const { marks: seen, add: markSeen } = useSeen();
  const kept = useKept();
  const going = useGoing();
  const went = useWent();
  const today = todayInTaipei();

  /* 整區預設不跳出來的沉到同一個 collection 的最後面。這是排序不是特例——今天剛好是
     文化活動，哪天資料倉改了標記，換誰在最後面就自己會變。 */
  const eventBlocks = useMemo(
    () => [...eventSections].sort((a, b) => Number(isAsideSection(a)) - Number(isAsideSection(b))),
    [],
  );

  /*
   * 這一期報裡有什麼。**每個分頁的數字都是它自己這一批數出來的**，不是從別處搬來的——
   * 分頁標籤上的數字跟它底下的東西不是同一個集合時，讀者不會發現，他只會相信那個數字。
   */
  const poolOf = useCallback(
    (id) => {
      if (id === 'daily') {
        return {
          items: items.filter((i) => !seen.has(i.id)),
          events: events.filter((e) => !seen.has(e.id)),
        };
      }
      const days = WINDOWS.find((w) => w.id === id)?.days;
      return {
        items: items.filter((i) => itemInWindow(i, today, days)),
        events: events.filter((e) => eventInWindow(e, today, days)),
      };
    },
    [seen, today],
  );

  const pool = useMemo(() => poolOf(view), [poolOf, view]);

  /* 分頁上的數字只數預設視圖裡的活動：把 444 檔售票節目算進「週報 N」，那個數字講的就不是
     這一頁在給你看的東西。收起來的那一區自己會在區裡講它有幾檔。 */
  const countOf = (p) => p.items.length + p.events.filter(inDefaultView).length;

  const full = view === 'daily';
  const unread = poolOf('daily');
  const todayEventCount = events.filter((e) => inDefaultView(e) && occursOn(e, today)).length;
  const shownIds = [...pool.items.map((i) => i.id), ...pool.events.map((e) => e.id)];

  useEffect(() => {
    document.title = '簡報';
  }, []);

  /* 左欄那顆警示連結的數字：和 ClosingSoon 的 rows.length 同一個集合（額滿為止＋這幾天要
     關且在預設視圖裡），不從別處搬。 */
  const closingCount = useMemo(() => {
    const soon = (e) => {
      const left = closingIn(e, today);
      return left != null && left >= 0 && left <= URGENT_WINDOW;
    };
    return events.filter((e) => (soon(e) || entryOf(e) === 'untilFull') && inDefaultView(e)).length;
  }, [today]);

  return (
    <DashboardLayout
      scale={scale}
      back={{ href: '/', label: 'Canvas Lab' }}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
          <AccountControl />
        </>
      }
      eyebrow="Brief"
      title="簡報"
      summary="每天替你收進值得看的內容與台北實體活動。日報、週報、月報負責發現；我的講座與要讀的，留下你真正選中的東西。"
      tabs={{
        label: '簡報分頁',
        value: view,
        onChange: (v) => setTabs({ view: v }, { scroll: 'top' }),
        items: [
          { id: 'daily', label: '日報', count: countOf(unread) },
          ...WINDOWS.map((w) => ({ id: w.id, label: w.label, count: countOf(poolOf(w.id)) })),
          { id: TODAY_VIEW, label: '今日活動', count: todayEventCount },
          { id: LECTURES_VIEW, label: '我的講座', count: going.size + went.size },
          { id: KEPT_VIEW, label: '要讀的', count: kept.size },
          { id: SOURCES_VIEW, label: '資料來源', count: sources.length },
        ],
      }}
      leftRailTop={
        view === 'daily' && closingCount > 0 ? (
          <a
            href="#closing"
            className="mb-4 flex items-baseline gap-1.5 border-l-2 border-warn pl-3 text-token-xs leading-snug text-ink-muted transition-colors duration-fast hover:text-ink"
          >
            <span className="text-warn">⚠</span>
            <span>這 {URGENT_WINDOW} 天關門的 · {closingCount} 件</span>
          </a>
        ) : null
      }
      refreshKey={view}
    >
      {/* 完整那一大塊只在日報出現（它是「現在該動手的」，屬於日報）。其餘分頁不重複整塊，
          但錯過就沒了的東西不能藏在分頁後面——所以留一行連回日報，門還是每個分頁都看得到。 */}
      {view === 'daily' ? (
        <ClosingSoon today={today} />
      ) : closingCount > 0 ? (
        <button
          type="button"
          id="closing"
          onClick={() => setTabs({ view: 'daily' }, { scroll: 'top' })}
          className="flex w-full items-baseline gap-2 border-l-2 border-warn pl-3 text-left text-token-sm leading-snug text-ink-muted transition-colors duration-fast hover:text-ink"
        >
          <span className="text-warn">⚠</span>
          <span>這 {URGENT_WINDOW} 天有 {closingCount} 件要關門，別被分頁藏住——回日報看細節。</span>
        </button>
      ) : null}

      <div className={view === 'daily' ? 'mt-12 border-t border-line pt-8' : closingCount > 0 ? 'mt-8' : ''}>
        {view === 'daily' ? <DailyHead pool={pool} onMarkSeen={() => markSeen(shownIds)} /> : null}
        {view === 'week' || view === 'month' ? (
          <p className="text-token-sm leading-relaxed text-ink-muted">
            最近 {WINDOWS.find((w) => w.id === view).days} 天出的 {pool.items.length} 篇，
            加上接下來 {WINDOWS.find((w) => w.id === view).days} 天裡的{' '}
            {pool.events.filter(inDefaultView).length} 場活動。
            同一個天數，兩個方向——讀的東西的日期是「它什麼時候出來的」，活動的日期是「你什麼時候
            得到場」。每個來源這裡只出前 {PREVIEW_PER_SOURCE} 件。
          </p>
        ) : null}

        {view === SOURCES_VIEW ? (
          <Provenance />
        ) : view === TODAY_VIEW ? (
          <TodayEvents
            today={today}
            day={activityDay}
            onDayChange={(next) => setTabs({ activityDay: next }, { scroll: 'preserve' })}
            going={going}
            went={went}
          />
        ) : view === LECTURES_VIEW ? (
          <LectureMarks
            today={today}
            going={going}
            went={went}
            tab={lectures}
            onTabChange={(next) => setTabs({ lectures: next }, { scroll: 'preserve' })}
          />
        ) : view === KEPT_VIEW ? (
          <KeptMarks today={today} kept={kept} />
        ) : (
          <>
            {/* 活動排在讀的東西前面：活動有日期、要排行程、錯過就沒了；讀的東西不會消失，
                所以在後面。這是這頁開頭那段排序原則講的順序（先前程式碼把它做反了）。 */}
            {eventBlocks.map((sec, i) => (
              <EventKindSection key={sec.kind} sec={sec} today={today} pool={pool} going={going} went={went} first={i === 0} />
            ))}
            {itemSections.map((sec) => (
              <ItemKindSection key={sec.kind} sec={sec} today={today} pool={pool} full={full} first={false} kept={kept} />
            ))}
            {pool.items.length === 0 && pool.events.length === 0 ? (
              <p className="text-token-sm leading-relaxed text-ink-muted">
                {view === 'daily'
                  ? '這一批你都看過了。東西沒有不見——切到週報或月報就找得回來，或者到「讀的東西」把全部 ' +
                    items.length +
                    ' 篇攤開。'
                  : '這個窗口裡沒有東西。'}
              </p>
            ) : null}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/*
 * 日報的抬頭與「標為已讀」。
 *
 * **不自動標。** 打開頁面就把畫面上的東西記成看過，日報會在你看它的那一秒清空，重新整理
 * 就什麼都不剩——那不是讀完，那是弄丟。標記是一個動作，要按。
 *
 * 第一次來的人，這裡會是全部 247 篇。那是對的：你確實一篇都沒看過。
 */
function DailyHead({ pool, onMarkSeen }) {
  const n = pool.items.length;
  const e = pool.events.filter(inDefaultView).length;
  if (n + e === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <p className="min-w-0 flex-1 text-token-sm leading-relaxed text-ink-muted">
        你還沒看過的：{n} 篇讀的東西{e > 0 ? `、${e} 場活動` : ''}。
        這裡不看日期——只講得出月份的來源（NBER、IMF）日期一律記成該月 1 號，那個日子是湊的，
        拿它算「今天新的」會說謊。看過就是看過。
      </p>
      <button
        type="button"
        onClick={onMarkSeen}
        className="shrink-0 rounded-token-sm border border-line-soft px-2 py-1 text-token-xs text-ink-muted transition-colors duration-fast hover:border-line hover:text-ink"
      >
        這 {n + e} 件標為已讀
      </button>
    </div>
  );
}
