import React, { useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, Film, Info, MapPin, Star } from 'lucide-react';
import PageShell from '../components/PageShell';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import Tabs, { useTabParam } from '../components/lab/Tabs';
import Badge from '../components/lab/Badge';
import catalogData from '../data/taipeiffPrograms.json';

const TZ = 'Asia/Taipei';
const CATALOG = catalogData.programs ?? [];
const CATALOG_BY_ID = new Map(CATALOG.map((program) => [program.id, program]));

// Interest marks are frozen as a read-only record (the festival closed 7/7):
// whatever the reader marked stays visible, but is no longer editable.
const INTEREST_KEY = 'taipeiff-interest-v1';
const DEFAULT_INTEREST = {
  '2059851638187614208': 'interested',
  '2056705720054296577': 'interested',
};
const INTEREST_LABEL = { interested: '感興趣', maybe: '可能', excluded: '排除' };
const INTEREST_TONE = { interested: 'success', maybe: 'warning', excluded: 'neutral' };

// The films I actually went to. Nothing aspirational lives here — the full
// 108-program catalogue is one tab over, and that is where unwatched films belong.
const WATCHLIST = [
  { id: '2058792162612088833', title: '極樂', creators: '凱文．蓋格、劉育樹、邱立偉等', watched: '6/30', why: '台灣動畫長片，六組導演共作。' },
  { id: '2059847212707586048', title: '女孩', creators: '舒淇', watched: '7/3 中山堂映後場', why: '舒淇的導演首作。' },
  { id: '2059595864451817473', title: '大濛', creators: '陳玉勳', watched: '7/3 中山堂映後場，接在《女孩》之後', why: '白色恐怖題材，今年台灣片重點。' },
  { id: '2056705720054296577', title: '一個夜晚與三個夏天', creators: '崗珍', watched: '7/7 光點 1', why: '拉薩，一部關於拍自己童年的電影。' },
];
const WATCHLIST_BY_ID = new Map(WATCHLIST.map((item) => [item.id, item]));

function localTs(iso) {
  return Math.floor(new Date(`${iso}+08:00`).getTime() / 1000);
}

const ACTIVITIES = [
  { id: 'forum-first-frame', title: '國際新導演論壇：第一格，獨立製片的起點', creators: '李駿碩、長久允、山繆．亞伯拉罕；主持 Vicky 郭若琦', group: '論壇', start: localTs('2026-06-30T16:00:00'), venue: '中山堂 2F 光復廳', why: '低預算開案、國際市場定位、第一部長片的製片路線。', attended: true },
  { id: 'action-live', title: 'Action! 動作正發生：創作現場', creators: '洪昰顥、許富翔、潘客印；演員江齊、林怡婷', group: '論壇', start: localTs('2026-07-04T14:00:00'), venue: '中山堂 2F 光復廳', why: '看動作戲如何從劇本文字轉成身體調度。' },
  { id: 'action-wire', title: '動作論壇：威牙之下、軟墊之上', creators: '董瑋、黃泰維；主持塗翔文', group: '論壇', start: localTs('2026-07-07T18:30:00'), venue: '中山堂 2F 光復廳', why: '香港動作傳統與台灣新世代動作設計對話。' },
  { id: 'action-kungfu', title: '動作論壇：打出一部《功夫》', creators: '九把刀、張材旭、洪昰顥；主持百白', group: '論壇', start: localTs('2026-07-08T18:30:00'), venue: '中山堂 2F 光復廳', why: '台韓動作組合作與商業類型片工業流程。' },
  { id: 'spotlight-contribution', title: '卓越貢獻獎講座', creators: '陳伯任；與談塗翔文', group: '講座', start: localTs('2026-06-28T19:00:00'), venue: '光點華山 1 廳', why: '隨映後講堂。' },
  { id: 'spotlight-uchiyama', title: '焦點影人講堂：內山拓也', creators: '內山拓也', group: '講座', start: localTs('2026-06-30T19:30:00'), venue: '光點華山 1 廳', why: '隨《不受待見的我們》映後。' },
];

const ATTENDED_ACTIVITIES = ACTIVITIES.filter((item) => item.attended);

const REFERENCE_ITEMS = [
  { title: '開幕片：怎麼可能我家的祖先是你家的鬼', meta: '6/26 19:00 中山堂｜開幕片' },
  { title: '閉幕片：我的棋王爺爺', meta: '7/5 19:00 中山堂｜陳怡蓉｜世界首映' },
  { title: '國際新導演論壇：第一格，獨立製片的起點', meta: '6/30 16:00 中山堂 2F 光復廳｜已參與' },
  { title: '卓越貢獻獎講座', meta: '6/28 光點華山 1 廳｜陳伯任、塗翔文' },
  { title: '焦點影人講堂：內山拓也', meta: '6/30 光點華山 1 廳｜隨《不受待見的我們》映後' },
];

function fmtTime(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: TZ, month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(ts * 1000));
}

function dayKey(ts) {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: TZ, month: 'numeric', day: 'numeric', weekday: 'short',
  }).format(new Date(ts * 1000));
}

function timeOfDay(ts) {
  return new Intl.DateTimeFormat('zh-TW', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts * 1000));
}

function cleanCategory(name) {
  return name.replace(/^電影-/, '');
}

// Categories that group more than one film — the rest are per-film unit tags
// (noise as a filter). Ordered by size, national/foreign split kept legible.
const FACETS = (() => {
  const counts = new Map();
  CATALOG.forEach((program) => (program.categories ?? []).forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([raw, n]) => ({ raw, label: cleanCategory(raw), count: n }));
})();

function PosterThumb({ program }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex h-[72px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-token-sm border border-line-soft bg-surface">
      {program.imageUrl && !broken ? (
        <img
          src={program.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Film size={18} className="text-ink-faint" />
      )}
    </div>
  );
}

function ScreeningChips({ screenings }) {
  if (!screenings?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {screenings.map((s) => (
        <span
          key={s.eventId}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-token-sm border border-line-soft px-2 py-0.5 text-token-xs text-ink-muted"
        >
          <span className="tabular-nums">{fmtTime(s.start)}</span>
          <span className="text-ink-faint">·</span>
          {s.venue}
          {s.guest ? <><span className="text-ink-faint">·</span><span className="text-info">映後</span></> : null}
        </span>
      ))}
    </div>
  );
}

function FilmRow({ program, interest }) {
  const pick = WATCHLIST_BY_ID.get(program.id);
  return (
    <article className="grid grid-cols-[52px_1fr] gap-3 border-b border-line-soft py-4 last:border-b-0">
      <PosterThumb program={program} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <a
            href={program.url}
            target="_blank"
            rel="noreferrer"
            className="font-display text-token-lg leading-snug text-ink transition-colors duration-fast hover:text-accent"
          >
            {program.title}
          </a>
          {program.englishTitle ? <span className="text-token-sm text-ink-faint">{program.englishTitle}</span> : null}
          {pick ? <Badge tone="cat-5">我看了</Badge> : null}
          {interest ? <Badge tone={INTEREST_TONE[interest]}>{INTEREST_LABEL[interest]}</Badge> : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-token-sm text-ink-muted">
          {program.creator ? <span>{program.creator}</span> : null}
          {program.production ? <span>{program.production}</span> : null}
          {program.rating ? <span>{program.rating}</span> : null}
        </div>
        {program.synopsis ? (
          <p className="mt-2 line-clamp-2 text-token-sm leading-relaxed text-ink-muted">{program.synopsis}</p>
        ) : null}
        <ScreeningChips screenings={program.screenings} />
      </div>
    </article>
  );
}

function PickRow({ item }) {
  const program = CATALOG_BY_ID.get(item.id);
  return (
    <div className="flex items-start gap-3 border-b border-line-soft py-3 last:border-b-0">
      {program ? <PosterThumb program={program} /> : <div className="flex h-[72px] w-[52px] shrink-0 items-center justify-center rounded-token-sm border border-line-soft bg-surface"><Film size={18} className="text-ink-faint" /></div>}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {program ? (
            <a href={program.url} target="_blank" rel="noreferrer" className="font-display text-token-lg leading-snug text-ink transition-colors duration-fast hover:text-accent">
              {item.title}
            </a>
          ) : (
            <span className="font-display text-token-lg leading-snug text-ink">{item.title}</span>
          )}
          {item.creators ? <span className="text-token-sm text-ink-faint">{item.creators}</span> : null}
          {item.watched ? <Badge tone="success">已看</Badge> : null}
        </div>
        {(program?.production || program?.rating) ? (
          <div className="mt-1 flex flex-wrap gap-x-3 text-token-sm text-ink-muted">
            {program.production ? <span>{program.production}</span> : null}
            {program.rating ? <span>{program.rating}</span> : null}
          </div>
        ) : null}
        <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">{item.why}</p>
        {item.watched ? <p className="mt-0.5 text-token-sm text-ink-faint">看的場次：{item.watched}</p> : null}
      </div>
    </div>
  );
}

function ActivityRow({ item }) {
  return (
    <div className="border-b border-line-soft py-3 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-token-lg leading-snug text-ink">{item.title}</span>
        {item.attended ? <Badge tone="success">已參與</Badge> : null}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-token-sm text-ink-muted">
        <span className="inline-flex items-center gap-1 tabular-nums"><CalendarDays size={13} />{fmtTime(item.start)}</span>
        <span className="inline-flex items-center gap-1"><MapPin size={13} />{item.venue}</span>
      </div>
      {item.creators ? <div className="mt-1 text-token-sm text-ink-muted">{item.creators}</div> : null}
      <p className="mt-1 text-token-sm leading-relaxed text-ink-muted">{item.why}</p>
    </div>
  );
}

export default function TaipeiFilmFestival() {
  const [scale, setScale] = useFontScale();
  const [tab, setTab] = useTabParam('view', 'films');
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('全部');
  const [onlyMarked, setOnlyMarked] = useState(false);

  // Read-only: whatever was marked before the festival closed, frozen.
  const [interestMap] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_INTEREST;
    try {
      const saved = JSON.parse(window.localStorage.getItem(INTEREST_KEY) || '{}');
      return { ...DEFAULT_INTEREST, ...saved };
    } catch {
      return DEFAULT_INTEREST;
    }
  });

  const filteredFilms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((program) => {
      const interest = interestMap[program.id];
      const matchesQuery = !q || [program.title, program.englishTitle, program.creator, program.production, program.synopsis, ...(program.categories ?? [])]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
      const matchesCat = activeCat === '全部' || (program.categories ?? []).includes(activeCat);
      const matchesMarked = !onlyMarked || interest || WATCHLIST_BY_ID.has(program.id);
      return matchesQuery && matchesCat && matchesMarked;
    }).sort((a, b) => {
      const aMark = WATCHLIST_BY_ID.has(a.id) || interestMap[a.id] ? 0 : 1;
      const bMark = WATCHLIST_BY_ID.has(b.id) || interestMap[b.id] ? 0 : 1;
      return aMark - bMark || (a.firstStart ?? 0) - (b.firstStart ?? 0) || a.title.localeCompare(b.title, 'zh-Hant');
    });
  }, [query, activeCat, onlyMarked, interestMap]);


  const screeningsByDay = useMemo(() => {
    const rows = CATALOG.flatMap((program) => (program.screenings ?? []).map((s) => ({
      eventId: s.eventId, start: s.start, venue: s.venue, guest: s.guest, title: program.title, url: program.url,
    }))).sort((a, b) => a.start - b.start || a.title.localeCompare(b.title, 'zh-Hant'));
    const days = new Map();
    rows.forEach((row) => {
      const key = dayKey(row.start);
      if (!days.has(key)) days.set(key, []);
      days.get(key).push(row);
    });
    return [...days.entries()];
  }, []);

  const tabs = [
    { id: 'films', label: '片單', count: CATALOG.length },
    { id: 'picks', label: '我看的', count: WATCHLIST.length + ATTENDED_ACTIVITIES.length },
    { id: 'schedule', label: '場次表', count: screeningsByDay.reduce((n, [, r]) => n + r.length, 0) },
    { id: 'about', label: '關於這份資料' },
  ];

  return (
    <PageShell
      eyebrow="Taipei Film Festival 2026"
      title="台北電影節・回顧"
      width="wide"
      fontScale={scale}
      controls={<FontSizeControl scale={scale} onChange={setScale} />}
    >
      <p className="max-w-2xl text-token-body leading-relaxed text-ink-muted">
        2026 台北電影節已於 7 月 7 日閉幕。這裡把當時的售票片單、我實際看的四部片與參加過的論壇留成一份回顧——票務狀態不再更新，標記也不再改動。
      </p>

      <div className="mt-6">
        <Tabs items={tabs} value={tab} onChange={setTab} label="回顧視圖" />
      </div>

      {tab === 'films' ? (
        <section className="mt-6">
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {[{ raw: '全部', label: '全部' }, ...FACETS].map((facet) => {
                const active = activeCat === facet.raw;
                return (
                  <button
                    key={facet.raw}
                    type="button"
                    onClick={() => setActiveCat(facet.raw)}
                    className={`rounded-token-md border px-2.5 py-1 text-token-xs transition-colors duration-fast ${
                      active ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-muted hover:border-accent hover:text-accent'
                    }`}
                  >
                    {facet.label}
                  </button>
                );
              })}
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋片名、導演、國家"
              className="w-full rounded-token-md border border-line bg-surface-raised px-3 py-1.5 text-token-sm text-ink outline-none transition-colors duration-fast focus:border-accent sm:w-64"
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-token-sm text-ink-faint">
            <span>顯示 {filteredFilms.length} 部 / 售票片單 {CATALOG.length} 部</span>
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={onlyMarked} onChange={(event) => setOnlyMarked(event.target.checked)} className="accent-[var(--c-accent)]" />
              只看我標記過的
            </label>
          </div>
          <div className="mt-2">
            {filteredFilms.length ? (
              filteredFilms.map((program) => <FilmRow key={program.id} program={program} interest={interestMap[program.id]} />)
            ) : (
              <p className="py-10 text-center text-token-sm text-ink-faint">沒有符合條件的影片。</p>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'picks' ? (
        <section className="mt-6 space-y-8">
          <div>
            <h2 className="mb-1 font-display text-token-xl text-ink">看的片</h2>
            <div>{WATCHLIST.map((item) => <PickRow key={item.id} item={item} />)}</div>
          </div>
          <div>
            <h2 className="mb-1 font-display text-token-xl text-ink">講座與論壇</h2>
            <div>{ATTENDED_ACTIVITIES.map((item) => <ActivityRow key={item.id} item={item} />)}</div>
          </div>
        </section>
      ) : null}

      {tab === 'schedule' ? (
        <section className="mt-6">
          <p className="mb-4 max-w-2xl text-token-sm leading-relaxed text-ink-muted">
            這份場次表來自 6 月 30 日的售票快照，涵蓋 7 月 1 至 7 日仍在售票的放映；開幕週與已售完場次不在其中。
          </p>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {screeningsByDay.map(([day, rows]) => (
              <div key={day}>
                <h2 className="mb-2 border-b border-line pb-1 font-display text-token-lg text-ink">{day}</h2>
                <div className="space-y-1.5">
                  {rows.map((row) => (
                    <a
                      key={row.eventId}
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-baseline gap-2.5 rounded-token-sm px-1 py-1 text-token-sm transition-colors duration-fast hover:bg-surface"
                    >
                      <span className="shrink-0 tabular-nums text-ink-faint">{timeOfDay(row.start)}</span>
                      <span className="min-w-0 flex-1 truncate text-ink">{row.title}</span>
                      <span className="shrink-0 text-ink-faint">{row.venue}</span>
                      {row.guest ? <Star size={12} className="shrink-0 text-info" /> : null}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'about' ? (
        <section className="mt-6 max-w-2xl space-y-5">
          <div className="flex items-start gap-2 text-token-body leading-relaxed text-ink-muted">
            <Info size={18} className="mt-1 shrink-0 text-ink-faint" />
            <p>
              片單來自 OpenTix 售票資料的一次快照（2026 年 6 月 30 日擷取），每部片只列一次，涵蓋當時仍在售票的 {CATALOG.length} 部。它不是官方完整節目單——開幕、閉幕、部分特別放映與已售完場次，要對照官網與節目專刊才齊全。
            </p>
          </div>
          <div>
            <h2 className="mb-2 font-display text-token-lg text-ink">開閉幕與講座底本</h2>
            <div className="border-t border-line-soft">
              {REFERENCE_ITEMS.map((item) => (
                <div key={item.title} className="border-b border-line-soft py-3">
                  <div className="text-token-base text-ink">{item.title}</div>
                  <div className="mt-0.5 text-token-sm text-ink-faint">{item.meta}</div>
                </div>
              ))}
            </div>
          </div>
          <a
            href="https://www.taipeiff.taipei/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-token-sm text-accent transition-colors duration-fast hover:underline"
          >
            台北電影節官網 <ExternalLink size={14} />
          </a>
        </section>
      ) : null}
    </PageShell>
  );
}
