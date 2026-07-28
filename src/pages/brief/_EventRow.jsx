import { dateSegments, dayDiff, entryText, eventFacts, inDays, isOngoing, md, posterOf, sourceLabel } from './data';
import MarkButton from './_MarkButton';
import { eventRecord } from './marks';

/*
 * 一場活動一列，全站只有這一份寫法。
 *
 * 來歷（2026-07-28）：同一批活動先前被五個地方各自手刻一次——日報的分區、「這 N 天關門的」、
 * 今日活動、活動曆的條列、我的講座。五份寫法就是五套行為，而它們只會愈差愈遠：海報只有
 * 我的講座畫得出來，「我要去」在關門那一區整個沒有（那正是最該按的一區，因為它列的就是
 * 快要來不及的東西）。改一個地方永遠會漏掉另外四個，所以合成一份。
 *
 * 版面是時間線不是三欄表：左邊窄欄放日期，右邊一整塊放其餘的一切。三欄表格的問題是中欄
 * 動輒五到十行、兩側只有兩三行，每列被撐得跟標題一樣高，旁邊留一大片空白。窄螢幕本來就
 * 是這樣疊的，桌機照抄那個順序，只把日期拉到左邊。
 *
 * 有海報就貼在右邊那塊的左側，跟文字並排（不是自己佔一欄）。寬度用比例不用固定像素——
 * 固定 96px 的縮圖在手機上是一枚小郵票、在寬螢幕上又小得看不出畫的是什麼。比例值配一個
 * 上下限，兩邊都不會失控。圖一律保持原始比例，不裁切也不套統一長寬比：這些是各所自己
 * 做的公告，直式橫式都有，硬裁會把講者的臉或日期切掉。
 */

function Poster({ event }) {
  const src = posterOf(event);
  if (!src) return null;
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      title="在新分頁開啟活動圖"
      className="group block w-[30%] min-w-[4.5rem] max-w-[9rem] shrink-0 cursor-zoom-in self-start overflow-hidden rounded-token-sm border border-line-soft"
    >
      <img
        src={src}
        alt={`${event.title}活動圖`}
        loading="lazy"
        className="block h-auto w-full transition-opacity duration-fast group-hover:opacity-80"
      />
    </a>
  );
}

/*
 * 日期欄。跨日的印起訖，跟「幾天後／進行中」一起放。closing 那一區另外印門什麼時候關——
 * 那一區排序的依據是關門日不是活動日，不把它印出來，讀者看到的順序會像亂的。
 */
function When({ event, today, closesIn }) {
  const d = dateSegments(event);
  return (
    <div className="text-token-xs leading-relaxed tabular-nums text-ink">
      <span className="whitespace-nowrap">{d.start}</span>
      {d.end ? <>–<span className="whitespace-nowrap">{d.end}</span></> : null}
      {d.time ? <span className="whitespace-nowrap"> {d.time}</span> : null}{' '}
      <span className="whitespace-nowrap text-ink-faint">
        {isOngoing(event, today) ? '進行中' : inDays(dayDiff(today, event.date))}
      </span>
      {closesIn !== undefined ? (
        <div className="text-ink-muted">
          {closesIn == null
            ? '額滿為止，無公告截止日'
            : `${md(event.closesAt)} ${event.closesAtKind}${event.mayCloseWhenFull ? '，可能更早' : ''}` +
              ` · ${closesIn === 0 ? '今天最後一天' : `剩 ${closesIn} 天`}`}
        </div>
      ) : null}
    </div>
  );
}

/*
 * event：來自公開投影或本機快照的一筆活動。
 * showSource：第二行要不要印來源（同一區已經寫明來源時就不必再印一次）。
 * closesIn：有值就是「這一區在講門什麼時候關」，null 代表額滿為止（沒有一天可以倒數）。
 * going／went：兩份標記；傳進來才畫得出按鈕。
 * ended：這場已經結束了。已結束又沒標過的不畫「我要去」——那顆按鈕對一場開完的活動沒有
 *   意義；已經標了要去卻沒去成的照畫，只是那個狀態叫待確認（不自動假定有到場）。
 */
export default function EventRow({ event, today, showSource = false, closesIn, going, went, ended = false }) {
  const entry = entryText(event, today);
  const facts = eventFacts(event);
  const showEntry = Boolean(entry.text);
  const goingOn = Boolean(going?.has(event.id));
  const wentOn = Boolean(went?.has(event.id));

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-1 border-b border-line-soft py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,4fr)]">
      <When event={event} today={today} closesIn={closesIn} />
      <div className="flex min-w-0 gap-3 sm:gap-4">
        <Poster event={event} />
        <div className="min-w-0 flex-1">
          <a
            href={event.detailUrl ?? event.eventUrl ?? event.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="text-token-sm leading-snug text-ink transition-colors duration-fast hover:text-accent"
          >
            {event.title}
          </a>
          {event.status === '暫訂' ? <span className="ml-1.5 text-token-xs text-ink-faint">（暫訂）</span> : null}
          <div className="text-token-xs leading-relaxed text-ink-faint">
            {showSource ? <span className="text-ink-muted">{event.sourceLabel ?? sourceLabel(event.source)}</span> : null}
            {showSource && facts.length ? ' · ' : ''}
            {facts.join(' · ')}
          </div>
          {event.scheduleNote ? (
            <div className="text-token-xs leading-relaxed text-ink-faint">{event.scheduleNote}</div>
          ) : null}
          {event.description ? (
            <p className="mt-1 line-clamp-2 text-token-xs leading-relaxed text-ink-muted">{event.description}</p>
          ) : null}
          {showEntry || event.registerUrl || event.registerSourceUrl || going || went ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-token-xs tabular-nums">
              {showEntry ? <span className={entry.loud ? 'text-ink' : 'text-ink-faint'}>{entry.text}</span> : null}
              {event.registerUrl ? (
                <a href={event.registerUrl} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                  報名
                </a>
              ) : null}
              {closesIn !== undefined && event.registerSourceUrl ? (
                <a href={event.registerSourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  期限出處
                </a>
              ) : null}
              {going && (!ended || goingOn) ? (
                <MarkButton
                  on={goingOn}
                  onToggle={() => {
                    if (!goingOn) went?.remove(event.id);
                    going.toggle(eventRecord(event));
                  }}
                  label={ended && goingOn ? '待確認' : '我要去'}
                />
              ) : null}
              {went ? (
                <MarkButton
                  on={wentOn}
                  onToggle={() => {
                    if (!wentOn) going?.remove(event.id);
                    went.toggle(eventRecord(event));
                  }}
                  label="我去了"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
