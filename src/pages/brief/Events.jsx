import { useMemo, useState } from 'react';
import { useFontScale } from '../../components/FontSizeControl';
import SiteHeader from '../../components/SiteHeader';
import ArticleLayout from '../../components/lab/ArticleLayout';
import SourceFilter, { usePersistedFlag } from '../../components/lab/SourceFilter';
import Tabs, { useTabParams } from '../../components/lab/Tabs';
import MarkButton from './_MarkButton';
import { snapshotEvent, useGoing, useWent } from './marks';
import {
  ENTRY_LABEL,
  URGENT_WINDOW,
  blindSpots,
  dateSegments,
  dayDiff,
  defaultEventSources,
  entryOf,
  entryText,
  eventFacts,
  eventSources,
  events,
  followed,
  inDays,
  isFollowed,
  isOngoing,
  md,
  monthKey,
  monthLabel,
  needsAction,
  sourceLabel,
  todayInTaipei,
  weekStart,
} from './data';

/*
 * 活動曆：把同一批場次換個軸去看的地方。門口（/brief）回答「有什麼快關門了」，這裡回答
 * 「某個主辦單位什麼時候有東西」「八月到底排得多滿」——那是兩種問題，需要兩種形狀。
 *
 * 一份資料，三種看法（條列／月曆／交叉表），不是三頁也不是三份資料。看法與篩選一律進
 * 網址，切看法不會把篩選弄丟。
 *
 * 這頁自己算的只有「剩幾天」，其餘每個字都來自資料倉。
 *
 * 沒有徽章、沒有色塊、沒有卡片。分層靠對齊、留白與墨色深淺。
 *
 * **來源是可以切的，不是寫死的。** 上一版的篩選只有「我關注的／全部來源」兩顆按鈕，而
 * 「全部來源」是把 444 檔售票節目倒進同一條清單，中研院那 70 場當場被沖掉；說明文字還寫著
 * 「切到全院就找得到」——OPENTIX 跟 NCTS 沒有「院」。來源清單從資料長出來，加一個來源是
 * 資料倉加一筆，這裡不用改。
 */

const ENTRY_ORDER = ['deadline', 'untilFull', 'open', 'ticketed', 'unknown'];

const HOST_FALLBACK = '（來源沒給主辦單位）';

const ROW_AXES = [
  { id: 'host', label: '主辦', of: (e) => e.host ?? HOST_FALLBACK },
  { id: 'source', label: '來源', of: (e) => sourceLabel(e.source) },
  { id: 'kind', label: '類型', of: (e) => e.kind ?? '（未註明）' },
  { id: 'entry', label: '進場方式', of: (e) => ENTRY_LABEL[entryOf(e)] },
];
const COL_AXES = [
  { id: 'week', label: '週', of: (e) => weekStart(e.date), label_: (k) => md(k) },
  { id: 'month', label: '月', of: (e) => monthKey(e.date), label_: (k) => `${Number(k.slice(5, 7))} 月` },
];

const DEFAULT_SOURCES = defaultEventSources.map((s) => s.id).join(',');
/* 有指名主辦單位的來源才需要「我關注的／全部」這個開關——NCTS 只有一個主辦單位，
   給它一顆「我關注的」按鈕是家具不是篩選。 */
const FOLLOWED_SOURCES = new Set(followed.map((f) => f.source));

/*
 * 一場活動一列。時間線排法：左邊窄欄放日期，右邊一整塊放標題與其下的一切——不是三欄
 * 表格。三欄表格的問題是中欄（標題＋名單＋場地）動輒五到十行，兩側短欄只有兩三行，於是
 * 每列被撐得跟標題一樣高、旁邊留一大片空白，讀起來像壞掉。窄螢幕本來就是這樣疊的，讀起來
 * 反而順，桌機照抄那個順序，只把日期拉到左邊。
 *
 * 進場方式與「我要去／我去了」收進標題底下的一行 meta，不另立一欄。而且**佔多數的
 * 「還沒查到」不印字**——48 場裡 42 場都是它，印出來就是整頁重複同一句沒用的話（entryText
 * 早就為了同個理由不給它掛徽章，這裡把文字也一起收掉，只有真的有截止日／額滿／自由入座
 * 才印進場方式）。
 */
function EventLine({ event, today, showSource, going, went }) {
  const entry = entryText(event, today);
  const facts = eventFacts(event);
  const d = dateSegments(event);
  const showEntry = Boolean(entry.text);
  return (
    <div className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,4fr)]">
      <div className="text-token-xs leading-relaxed tabular-nums text-ink">
        <span className="whitespace-nowrap">{d.start}</span>
        {d.end ? <>–<span className="whitespace-nowrap">{d.end}</span></> : null}
        {d.time ? <span className="whitespace-nowrap"> {d.time}</span> : null}{' '}
        <span className="whitespace-nowrap text-ink-faint">
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
        {event.scheduleNote ? (
          <div className="text-token-xs leading-relaxed text-ink-faint">{event.scheduleNote}</div>
        ) : null}
        {showEntry || event.registerUrl || going || went ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-token-xs tabular-nums">
            {showEntry ? <span className={entry.loud ? 'text-ink' : 'text-ink-faint'}>{entry.text}</span> : null}
            {event.registerUrl ? (
              <a href={event.registerUrl} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                報名
              </a>
            ) : null}
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
 * 月曆。想看的是時間怎麼排——同一週擠了三場、或整個八月只有兩場，這種事寫成清單讀不出來，
 * 畫成格子一眼就看到。
 *
 * 格子放的是**開始日**。跨日的東西只在它開始那天出現：一檔開到 2030 年的常設展要是每天
 * 都畫一格，整個月曆就只剩它。所以底下那行字要照實講，別讓人以為格子是空的就沒事。
 */
function CalendarView({ events: shown, today }) {
  const months = useMemo(() => {
    const keys = [...new Set(shown.map((e) => monthKey(e.date)))].sort();
    return keys.map((k) => ({ key: k, events: shown.filter((e) => monthKey(e.date) === k) }));
  }, [shown]);

  const closingDays = useMemo(() => {
    const m = new Map();
    for (const e of shown) {
      if (!e.closesAt || !needsAction(e, today)) continue;
      if (!m.has(e.closesAt)) m.set(e.closesAt, []);
      m.get(e.closesAt).push(e);
    }
    return m;
  }, [shown, today]);

  if (shown.length === 0) return null;

  return (
    <div>
      {months.map(({ key, events: inMonth }) => {
        const first = new Date(`${key}-01T00:00:00Z`);
        const lead = (first.getUTCDay() + 6) % 7;
        const total = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
        const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
        return (
          <div key={key} className="mb-8">
            <h3 id={`m-${key}`} className="mb-2 font-display text-token-base text-ink">
              {monthLabel(key)}
              <span className="ml-2 text-token-xs text-ink-faint">{inMonth.length} 場</span>
            </h3>
            <div className="grid grid-cols-7 border-l border-t border-line-soft">
              {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                <div key={w} className="border-b border-r border-line-soft px-1 py-1 text-token-xs text-ink-faint">
                  {w}
                </div>
              ))}
              {cells.map((n, i) => {
                if (n == null) return <div key={`x${i}`} className="min-h-[4.5rem] border-b border-r border-line-soft" />;
                const date = `${key}-${String(n).padStart(2, '0')}`;
                const onDay = inMonth.filter((e) => e.date === date);
                const closing = closingDays.get(date) ?? [];
                const isToday = date === today;
                return (
                  <div key={date} className="min-h-[4.5rem] border-b border-r border-line-soft px-1 py-1 align-top">
                    <div className="mb-0.5 text-token-xs tabular-nums leading-none">
                      <span
                        className={[
                          isToday ? 'rounded border border-line-strong px-1 py-0.5 font-medium text-ink' : '',
                          onDay.length || closing.length ? 'text-ink' : 'text-ink-faint/50',
                          closing.length ? 'border-b-2 border-accent' : '',
                        ].join(' ')}
                      >
                        {n}
                      </span>
                    </div>
                    {closing.map((e) => (
                      <div key={`c-${e.id}`} className="mb-0.5 text-[10px] leading-tight text-ink">
                        {e.closesAtKind}：{e.title.slice(0, 8)}
                        {e.title.length > 8 ? '…' : ''}
                      </div>
                    ))}
                    {onDay.slice(0, 2).map((e) => (
                      <a
                        key={e.id}
                        href={e.detailUrl ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        title={`${e.time ?? ''} ${e.title}${e.speaker ? ` — ${e.speaker}` : ''}`}
                        className="mb-0.5 block text-[10px] leading-tight text-ink-muted transition-colors duration-fast hover:text-accent"
                      >
                        {e.allDay ? '' : `${e.time} `}
                        {e.title.slice(0, 12)}
                        {e.title.length > 12 ? '…' : ''}
                        {e.endDate && e.endDate !== e.date ? ` 至${md(e.endDate)}` : ''}
                      </a>
                    ))}
                    {onDay.length > 2 ? (
                      <div className="text-[10px] leading-tight text-ink-faint">＋{onDay.length - 2} 場</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-token-xs leading-relaxed text-ink-faint">
        畫線的日子有門要關（報名截止或售票結束），框起來的是今天。格子放的是開始日——跨日的東西
        只在開始那天出現，標「至 X/X」；已經開始的那些不會在今天的格子裡。格子跟著左邊的篩選走。
      </p>
    </div>
  );
}

/*
 * 交叉表。同一批場次換一個軸去看：哪個主辦單位什麼時候有東西、哪一類的活動集中在哪幾週。
 *
 * 這不是把等差數列丟進桶子裡（那種圖分佈一定是平的，畫了等於沒畫）；列軸是真的類別、
 * 格子是真的場次數，疏密本身就是內容——近史所八月初擠了一整批，統計所整個秋天只有兩場，
 * 這在清單上讀不出來。
 *
 * 類型（kind）這個軸不跨來源合併：「演講或講座」與「音樂」本來就不是同一套分類，硬併成
 * 一套就是編的。它們在表上各佔一列，這樣才看得出哪一套是誰的。
 */
function PivotView({ events: shown, today, rows, cols, onPick, picked, going, went }) {
  const rowAxis = ROW_AXES.find((a) => a.id === rows) ?? ROW_AXES[0];
  const colAxis = COL_AXES.find((a) => a.id === cols) ?? COL_AXES[0];

  const { rowKeys, colKeys, cells } = useMemo(() => {
    const cells = new Map();
    const rowTotals = new Map();
    const colSet = new Set();
    for (const e of shown) {
      const r = rowAxis.of(e);
      const c = colAxis.of(e);
      const k = `${r} ${c}`;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(e);
      rowTotals.set(r, (rowTotals.get(r) ?? 0) + 1);
      colSet.add(c);
    }
    return {
      rowKeys: [...rowTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([r]) => r),
      colKeys: [...colSet].sort(),
      cells,
    };
  }, [shown, rowAxis, colAxis]);

  if (shown.length === 0) return null;
  const pickedEvents = picked ? cells.get(picked) ?? [] : [];

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-token-xs tabular-nums">
          <thead>
            <tr>
              <th className="border-b border-line px-2 py-1 text-left font-normal text-ink-faint">
                {rowAxis.label} ＼ {colAxis.label}
              </th>
              {colKeys.map((c) => (
                <th key={c} className="border-b border-line px-2 py-1 text-right font-normal text-ink-muted">
                  {colAxis.label_(c)}
                </th>
              ))}
              <th className="border-b border-line px-2 py-1 text-right font-normal text-ink-faint">計</th>
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((r) => {
              const total = colKeys.reduce((s, c) => s + (cells.get(`${r} ${c}`)?.length ?? 0), 0);
              return (
                <tr key={r}>
                  <th className="whitespace-nowrap border-b border-line-soft px-2 py-1 text-left font-normal text-ink-muted">
                    {r}
                  </th>
                  {colKeys.map((c) => {
                    const key = `${r} ${c}`;
                    const list = cells.get(key) ?? [];
                    const act = list.some((e) => needsAction(e, today));
                    return (
                      <td key={c} className="border-b border-line-soft px-2 py-1 text-right">
                        {list.length === 0 ? (
                          <span className="text-ink-faint/40">·</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onPick(picked === key ? null : key)}
                            className={`transition-colors duration-fast hover:text-accent ${
                              picked === key ? 'font-medium text-accent underline underline-offset-2' : 'text-ink'
                            }`}
                          >
                            {list.length}
                            {act ? <span className="text-accent">*</span> : null}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-line-soft px-2 py-1 text-right text-ink-faint">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-token-xs leading-relaxed text-ink-faint">
        標 * 的格子裡有這 {URGENT_WINDOW} 天要關的門，或是額滿為止的報名。點數字看那一格是哪幾場。
        欄軸放的是開始日。
      </p>

      {picked ? (
        <div className="mt-6">
          <h3 className="mb-1 font-display text-token-base text-ink">
            {picked.split(' ')[0]} · {colAxis.label_(picked.split(' ')[1])}
            <span className="ml-2 text-token-xs text-ink-faint">{pickedEvents.length} 場</span>
          </h3>
          {pickedEvents.map((e) => (
            <EventLine key={e.id} event={e} today={today} showSource going={going} went={went} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Events() {
  const [scale, setScale] = useFontScale();
  const [{ mode, sources: sourceParam, hosts, rows, cols }, setTabs] = useTabParams({
    mode: 'list',
    sources: DEFAULT_SOURCES,
    hosts: 'followed',
    rows: 'host',
    cols: 'week',
  });
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  // 單選模式是 UI 偏好，重開頁面不該重置（選擇本身在網址）。
  const [radio, setRadio] = usePersistedFlag('canvaslab:brief:events:radio');
  const going = useGoing();
  const went = useWent();
  const today = todayInTaipei();

  const selected = useMemo(() => {
    if (sourceParam === 'all') return eventSources.map((s) => s.id);
    if (sourceParam === 'none') return []; // 全不選是合法狀態，內容區有空狀態
    const ids = sourceParam.split(',').filter((id) => eventSources.some((s) => s.id === id));
    return ids.length ? ids : defaultEventSources.map((s) => s.id);
  }, [sourceParam]);

  // 空集合是合法狀態（全不選）：內容區有它自己的空狀態，不再擋。
  const writeSources = (ids) => {
    const ordered = eventSources.filter((s) => ids.includes(s.id)).map((s) => s.id);
    setTabs({
      sources: ordered.length === 0 ? 'none' : ordered.length === eventSources.length ? 'all' : ordered.join(','),
    }, { scroll: 'preserve' });
    setPicked(null);
  };

  /* 「我關注的」只對有指名主辦單位的來源起作用；其他來源不受它影響，也不會因此消失。 */
  const hostSwitchApplies = selected.some((id) => FOLLOWED_SOURCES.has(id));

  /*
   * 篩選只決定先看到什麼，不決定存了什麼。沒列出來的場次一樣在庫裡、一樣搜得到。
   *
   * 講者用子字串比對，不切名字。多位講者之間沒有分隔符號（實測有一頁是「陳建綱（…特聘
   * 教授）林育民（…博士後研究員）」，兩個名字中間什麼都沒有），切了會生出不存在的人。
   */
  const shown = useMemo(() => {
    const q = query.trim();
    return events.filter((e) => {
      if (!selected.includes(e.source)) return false;
      if (hosts === 'followed' && FOLLOWED_SOURCES.has(e.source) && !isFollowed(e)) return false;
      if (!q) return true;
      return [e.speaker, e.organizers, e.title, e.host, e.venue, e.series]
        .filter(Boolean)
        .some((f) => f.includes(q));
    });
  }, [selected, hosts, query]);

  const byMonth = useMemo(() => {
    const sorted = [...shown].sort((a, b) => a.date.localeCompare(b.date));
    const out = [];
    for (const e of sorted) {
      const k = monthKey(e.date);
      if (out.length === 0 || out[out.length - 1].key !== k) out.push({ key: k, events: [e] });
      else out[out.length - 1].events.push(e);
    }
    return out;
  }, [shown]);

  /* 名字與數字從同一個集合算。這一行的每個數字都是 shown 自己數出來的，不是從 coverage
     搬來的——coverage 是整份資料的，跟畫面上這一批不是同一個集合。 */
  const perSource = eventSources
    .filter((s) => selected.includes(s.id))
    .map((s) => ({ label: s.label, n: shown.filter((e) => e.source === s.id).length }))
    .filter((x) => x.n > 0);
  const closingCount = shown.filter((e) => needsAction(e, today)).length;

  const rail = (
    <nav className="text-token-xs">
      <SourceFilter
        sources={eventSources}
        selectedIds={selected}
        onChange={writeSources}
        radio={radio}
        onRadioChange={setRadio}
        countOf={(id) => events.filter((e) => e.source === id).length}
      />
      <p className="mb-5 mt-3 leading-relaxed text-ink-faint">
        預設不含{eventSources.filter((s) => !s.inDefaultView).map((s) => s.label).join('、')}
        ——它一個來源就比其他全部加起來多，混進來會把別的沖掉。
      </p>

      {hostSwitchApplies ? (
        <>
          <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">主辦單位（中研院）</p>
          <Tabs
            variant="quiet"
            label="主辦單位（中研院）"
            value={hosts}
            onChange={(v) => { setTabs({ hosts: v }, { scroll: 'preserve' }); setPicked(null); }}
            className="mb-5 !flex-col !items-start gap-0.5"
            items={[
              { id: 'followed', label: `精選 ${followed.length} 個` },
              { id: 'all', label: '全部' },
            ]}
          />
        </>
      ) : null}

      <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">找講者或講題</p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="例：渡邊浩"
        className="mb-5 w-full rounded border border-line-soft bg-paper px-2 py-1 text-token-xs text-ink outline-none focus:border-accent"
      />

      {mode === 'pivot' ? (
        <>
          <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">列軸</p>
          <Tabs
            variant="quiet"
            label="列軸"
            value={rows}
            onChange={(v) => { setTabs({ rows: v }, { scroll: 'preserve' }); setPicked(null); }}
            className="mb-4 !flex-col !items-start gap-0.5"
            items={ROW_AXES.map((a) => ({ id: a.id, label: a.label }))}
          />
          <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">欄軸</p>
          <Tabs
            variant="quiet"
            label="欄軸"
            value={cols}
            onChange={(v) => { setTabs({ cols: v }, { scroll: 'preserve' }); setPicked(null); }}
            className="mb-5 !flex-col !items-start gap-0.5"
            items={COL_AXES.map((a) => ({ id: a.id, label: a.label }))}
          />
        </>
      ) : null}

      <p className="leading-relaxed text-ink-faint">
        篩選只是換個看法，不是把東西刪掉。沒列出來的都還在——把來源或主辦單位切成全部就找得到。
      </p>
    </nav>
  );

  return (
    <main className="reading-grain min-h-screen bg-paper pb-10 text-ink" style={{ '--reader-scale': scale }}>
      <SiteHeader back={{ href: '/brief', label: '簡報' }} width="article" scale={scale} onScaleChange={setScale} />
      <ArticleLayout
        title="活動曆"
        eyebrow="Brief"
        summary="同一批場次，三種看法：想找特定一場用條列，想看時間怎麼排用月曆，想看誰什麼時候有東西用交叉表。看法與篩選都在網址裡。"
        nav={rail}
        tocLabel="本頁目次"
        tocKey={`${mode}-${sourceParam}-${hosts}-${byMonth.length}`}
      >
        <section>
          <h2 id="all-events" className="font-display text-token-lg text-ink">
            場次
            <span className="ml-2 text-token-sm text-ink-faint">{shown.length} 場</span>
          </h2>
          <p className="mt-1 text-token-sm leading-relaxed text-ink">
            {perSource.map((x) => `${x.label} ${x.n} 場`).join('、') || '這個篩選底下沒有場次'}
            {closingCount > 0 ? `。其中 ${closingCount} 場的門這 ${URGENT_WINDOW} 天要關，或是額滿為止——` : '。'}
            {closingCount > 0 ? (
              <a href="/brief#closing" className="text-accent underline underline-offset-2">
                那幾場在門口列著
              </a>
            ) : null}
            {closingCount > 0 ? '。' : ''}
          </p>

          <div className="mb-5 mt-3">
            <Tabs
              variant="underline"
              label="看法"
              value={mode}
              onChange={(v) => { setTabs({ mode: v }, { scroll: 'preserve' }); setPicked(null); }}
              items={[
                { id: 'list', label: '條列' },
                { id: 'calendar', label: '月曆' },
                { id: 'pivot', label: '交叉表' },
              ]}
            />
          </div>

          {shown.length === 0 ? (
            <p className="py-6 text-token-sm text-ink-muted">
              {query ? `「${query}」在這個篩選底下沒有場次。` : '這個篩選底下沒有場次。'}
              　東西都還在——把來源或主辦單位切成全部再找一次。
            </p>
          ) : mode === 'calendar' ? (
            <CalendarView events={shown} today={today} />
          ) : mode === 'pivot' ? (
            <PivotView events={shown} today={today} rows={rows} cols={cols} picked={picked} onPick={setPicked} going={going} went={went} />
          ) : (
            byMonth.map(({ key, events: inMonth }) => (
              <div key={key} className="mt-6">
                <h3 id={`m-${key}`} className="mb-1 font-display text-token-base text-ink">
                  {monthLabel(key)}
                  <span className="ml-2 text-token-xs text-ink-faint">{inMonth.length} 場</span>
                </h3>
                {inMonth.map((e) => (
                  <EventLine key={e.id} event={e} today={today} showSource={selected.length > 1} going={going} went={went} />
                ))}
              </div>
            ))
          )}
        </section>

        <section className="mt-12 border-t border-line pt-6">
          <h2 id="entry" className="font-display text-token-lg text-ink">
            右邊那一欄在講什麼
          </h2>
          <p className="mt-1 text-token-sm leading-relaxed text-ink">
            進場的方式不只報名一種，而「還沒查到」跟「不用」是兩件不同的事。這幾種狀態底下各有幾場，
            是這個篩選自己數的。
          </p>
          <dl className="mt-4">
            {ENTRY_ORDER.map((state) => {
              const n = shown.filter((e) => entryOf(e) === state).length;
              if (n === 0) return null;
              return (
                <div key={state} className="grid grid-cols-1 gap-x-4 border-b border-line-soft py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
                  <dt className="text-token-sm text-ink">
                    {ENTRY_LABEL[state]}
                    <span className="ml-1.5 text-token-xs tabular-nums text-ink-faint">{n} 場</span>
                  </dt>
                  <dd className="text-token-xs leading-relaxed text-ink-faint">{ENTRY_NOTE[state]}</dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section className="mt-12 border-t border-line pt-6">
          <h2 id="blind-spots" className="font-display text-token-lg text-ink">
            這裡看不到什麼
          </h2>
          <p className="mt-1 text-token-sm leading-relaxed text-ink">
            有缺口就講出來。一份看起來完整的清單，比一份說得出自己漏了什麼的清單危險。
            每個來源的涵蓋範圍在
            <a href="/brief#sources" className="text-accent underline underline-offset-2">
              門口的「資料來自哪裡」
            </a>
            。
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
      </ArticleLayout>
    </main>
  );
}

/* 每一種狀態底下那句灰字。差別由字承擔，不由顏色承擔——「查過＝自由入座」與「還沒查＝
   不知道」畫成一樣就是說謊，但那個區別不該靠五種顏色去喊。 */
const ENTRY_NOTE = {
  deadline: '有公告的截止日，倒數看得見。標「可能更早」的是額滿會提前關。',
  untilFull: '要報名、有報名表，一個日期都沒公告。額滿就關，沒有任何一天可以倒數——這種比有截止日的更急。',
  open: '查過了，不用報名也不用買票。可以放心。',
  ticketed: '要買票，有票價與售票期間。剩幾張票這裡不存，那種數字幾小時就過期。',
  unknown: '這場要不要報名、買不買票，還沒查到——不是「不用」，是還沒查證，得自己去問。',
};
