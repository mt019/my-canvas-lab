import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Film,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import catalogData from '../data/taipeiffPrograms.json';

const TZ = 'Asia/Taipei';
const OPENTIX_EVENT = 'https://www.opentix.life/event/';
const CATALOG_PROGRAMS = catalogData.programs ?? [];
const INTEREST_KEY = 'taipeiff-interest-v1';
const DEFAULT_INTEREST = {
  '2059851638187614208': 'interested',
  '2056705720054296577': 'interested',
};
const INTEREST_LABEL = {
  interested: '感興趣',
  maybe: '可能',
  excluded: '排除',
};
const INTEREST_ORDER = {
  interested: 0,
  maybe: 1,
  none: 2,
  excluded: 3,
};

const WATCHLIST = [
  { id: '2059553080492548097', title: '順流逆流', priority: 70, lane: '動作單元（低優先）', creators: '徐克', language: '粵語', genre: '動作 / 港片', why: '動作片已降優先；只作電影史補片。' },
  { id: '2058792162612088833', title: '極樂', priority: 30, lane: '已看/回顧', language: '待確認', genre: '國際新導演', why: '6/30 已看；保留作紀錄。' },
  {
    id: '2057384480759422977',
    title: '不受待見的我們',
    priority: 3,
    lane: '焦點影人',
    creators: '內山拓也',
    language: '日語',
    genre: '焦點影人 / 日本青年困境',
    why: '內山拓也焦點影人片，7/2 是可執行場次。',
    excludeEventIds: ['2057384485771505665', '2057387501446377473'],
  },
  { id: '2059851638187614208', title: '左撇子女孩', priority: 4, lane: '台灣新片', creators: '鄒時擎', language: '華語 / 台語', genre: '台灣新片 / 家庭', why: '平日日場，台灣家庭與女性視角。' },
  { id: '2056645779652419585', title: '鯽魚', priority: 8, lane: '台灣新片', creators: '張哲龍', language: '華語 / 台語', genre: '台灣新片 / 民俗', why: '台灣民俗、觀落陰與舞台劇改編。' },
  { id: '2059586376272044033', title: '死亡賭局', priority: 7, lane: '國際作者', language: '波斯語', genre: '國際作者 / 審查', why: '地下放映、審查與影展語境高度相關。' },
  { id: '2058878775014318081', title: '籠民', priority: 9, lane: '經典修復', language: '粵語', genre: '經典修復 / 香港社會寫實', why: '香港社會寫實經典，適合補電影史。' },
  { id: '2059847212707586048', title: '女孩', priority: 5, lane: '台灣新片', creators: '舒淇', language: '華語 / 台語', genre: '台灣新片 / 女性成長', why: '舒淇導演作品，主創與國際影展路徑明確。' },
  { id: '2059595864451817473', title: '大濛', priority: 6, lane: '台灣新片', creators: '陳玉勳', language: '華語 / 台語', genre: '台灣新片 / 歷史', why: '今年台灣片重點，白色恐怖題材。' },
  { id: '2059588448597958657', title: '深度安靜', priority: 10, lane: '台灣新片', creators: '沈可尚', language: '華語', genre: '台灣新片 / 心理劇', why: '沈可尚新作，親密關係與家庭創傷。' },
  { id: '2054201327492128769', title: '我的棋王爺爺', priority: 20, lane: '閉幕片', creators: '陳怡蓉', language: '華語 / 台語', genre: '閉幕片 / 世界首映', why: '閉幕片；若 OpenTix 回票才有行動價值。' },
  { id: '2059559733464535040', title: '鬼打鬼', priority: 80, lane: '動作單元（低優先）', creators: '洪金寶', language: '粵語', genre: '動作 / 靈幻武打', why: '動作片已降優先；除非想補香港類型史。' },
  { id: '2059545798841065472', title: '失序男孩', priority: 81, lane: '動作單元（低優先）', language: '日語', genre: '動作 / 青年暴力', why: '動作片已降優先；只在對青年暴力主題有興趣時看。' },
  { id: '2057026451564601345', title: '茉莉人生', priority: 15, lane: '德黑蘭', language: '法語 / 波斯語', genre: '動畫 / 伊朗回顧', why: '伊朗革命、流亡與成長，深夜補片。' },
  { id: '2057033100324970497', title: '房屋是黑的＋磚與鏡', priority: 14, lane: '德黑蘭', language: '波斯語', genre: '伊朗回顧 / 電影史', why: '伊朗電影史入口，適合電影史補課。' },
  { id: '2058811111880777729', title: '枯葉', priority: 16, lane: '國際作者', language: '喬治亞語', genre: '國際作者 / 形式實驗', why: '形式實驗強，片長很吃狀態。' },
  { id: '2059947847980015617', title: '陽光女子合唱團', priority: 13, lane: '台灣新片', language: '華語', genre: '台灣新片 / 音樂', why: '7/7 映後場一般席已售罄；僅保留查核。' },
];

function localTs(iso) {
  return Math.floor(new Date(`${iso}+08:00`).getTime() / 1000);
}

const ACTIVITIES = [
  {
    id: 'forum-first-frame',
    title: '國際新導演論壇：第一格，獨立製片的起點',
    creators: '李駿碩、長久允、山繆．亞伯拉罕；主持 Vicky 郭若琦',
    lane: '活動/論壇',
    priority: 0,
    start: localTs('2026-06-30T16:00:00'),
    end: localTs('2026-06-30T17:30:00'),
    venue: '中山堂 2F 光復廳',
    action: '需報名 / 可候補',
    url: 'https://reurl.cc/grX9Kp',
    why: '低預算開案、國際市場定位、第一部長片的製片路線。',
  },
  {
    id: 'new-talent-awards',
    title: '國際新導演競賽頒獎典禮暨交流酒會',
    creators: '國際新導演競賽團隊與入圍影人',
    lane: '活動/論壇',
    priority: 18,
    start: localTs('2026-06-30T19:00:00'),
    end: localTs('2026-06-30T21:00:00'),
    venue: '中山堂 2F 光復廳',
    action: '國新競賽票根入場',
    why: '社交與頒獎場合；有票根且想交流時納入。',
  },
  {
    id: 'action-live',
    title: 'Action! 動作正發生：創作現場',
    creators: '洪昰顥、許富翔、潘客印；演員江齊、林怡婷',
    lane: '活動/論壇',
    priority: 70,
    start: localTs('2026-07-04T14:00:00'),
    end: localTs('2026-07-04T16:00:00'),
    venue: '中山堂 2F 光復廳',
    action: '需報名 / 可候補',
    why: '看動作戲如何從劇本文字轉成身體調度。',
  },
  {
    id: 'action-wire',
    title: '動作論壇：威牙之下、軟墊之上',
    creators: '董瑋、黃泰維；主持塗翔文',
    lane: '活動/論壇',
    priority: 71,
    start: localTs('2026-07-07T18:30:00'),
    end: localTs('2026-07-07T20:00:00'),
    venue: '中山堂 2F 光復廳',
    action: '需報名 / 可候補',
    url: 'https://reurl.cc/8eZj1X',
    why: '香港動作傳統與台灣新世代動作設計對話。',
  },
  {
    id: 'action-kungfu',
    title: '動作論壇：打出一部《功夫》',
    creators: '九把刀、張材旭、洪昰顥；主持百白',
    lane: '活動/論壇',
    priority: 72,
    start: localTs('2026-07-08T18:30:00'),
    end: localTs('2026-07-08T20:00:00'),
    venue: '中山堂 2F 光復廳',
    action: '需報名 / 可候補',
    url: 'https://www.taipeiff.taipei/form/72FB741C0e18',
    why: '台韓動作組合作與商業類型片工業流程。',
  },
  {
    id: 'spotlight-contribution',
    title: '卓越貢獻獎講座',
    creators: '陳伯任；與談塗翔文',
    lane: '講座/焦點',
    priority: 60,
    start: localTs('2026-06-28T19:00:00'),
    end: localTs('2026-06-28T20:30:00'),
    venue: '光點華山 1 廳',
    action: '隨映後講堂',
    why: '已過期；保留在完整活動資料中。',
  },
  {
    id: 'spotlight-uchiyama',
    title: '焦點影人講堂：內山拓也',
    creators: '內山拓也',
    lane: '講座/焦點',
    priority: 61,
    start: localTs('2026-06-30T19:30:00'),
    end: localTs('2026-06-30T21:00:00'),
    venue: '光點華山 1 廳',
    action: '隨映後講堂',
    why: '已過期；保留在完整活動資料中。',
  },
  {
    id: 'survey-gift',
    title: '觀影問卷拿好禮',
    creators: '台北電影節服務台',
    lane: '活動/論壇',
    priority: 40,
    start: localTs('2026-06-30T13:00:00'),
    end: localTs('2026-07-07T22:00:00'),
    venue: '影展服務台',
    action: '票根 + 問卷',
    why: '看完有價票券場次後填問卷，出示畫面兌換。',
  },
  {
    id: 'audience-vote',
    title: '觀眾票選抽好禮',
    creators: '台北電影節觀眾票選',
    lane: '活動/論壇',
    priority: 41,
    start: localTs('2026-06-30T13:00:00'),
    end: localTs('2026-07-07T22:00:00'),
    venue: '官網 / 中山堂服務台',
    action: '票根抽獎',
    why: '觀影後投票；中獎名單隔日 13:00 前公布。',
  },
];

const REFERENCE_ITEMS = [
  {
    title: '閉幕片：我的棋王爺爺',
    meta: '7/5 19:00 中山堂｜陳怡蓉｜世界首映｜OpenTix 6/30 查核售罄',
  },
  {
    title: '開幕片：怎麼可能我家的祖先是你家的鬼',
    meta: '6/26 19:00 中山堂｜開幕片｜已過期，保留底本',
  },
  {
    title: '國際新導演論壇：第一格，獨立製片的起點',
    meta: '6/30 16:00 中山堂 2F 光復廳｜已參與｜大型廳候補壓力低',
  },
  {
    title: '卓越貢獻獎講座',
    meta: '6/28 光點華山 1 廳｜陳伯任、塗翔文｜已過期',
  },
  {
    title: '焦點影人講堂：內山拓也',
    meta: '6/30 光點華山 1 廳｜隨《不受待見的我們》映後｜已過期',
  },
];

const VENUE_SHORT = [
  ['臺北市中山堂中正廳', '中山堂'],
  ['光點華山電影館 1廳', '光點 1'],
  ['光點華山電影館 2廳', '光點 2'],
  ['誠品電影院A廳', '誠品 A'],
  ['誠品電影院B廳', '誠品 B'],
  ['誠品電影院C廳', '誠品 C'],
];

function fmtTime(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: TZ,
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ts * 1000));
}

function dayKey(ts) {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: TZ,
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(new Date(ts * 1000));
}

function compactVenue(name = '') {
  return VENUE_SHORT.find(([full]) => name.includes(full))?.[1] ?? name.replace('臺北市', '').replace('電影館', '').replace('電影院', '');
}

function flattenSections(event) {
  if (Array.isArray(event.sections)) return event.sections;
  if (Array.isArray(event.groupSections)) return event.groupSections;
  if (event.groupSections && typeof event.groupSections === 'object') {
    return Object.values(event.groupSections).flat().filter(Boolean);
  }
  return [];
}

function publicSeatCount(event) {
  const sections = flattenSections(event);
  const normal = sections.find((s) => s.name === '一般席');
  const eligibleSections = normal
    ? [normal]
    : sections.filter((section) => {
      const name = section.name ?? '';
      const price = Number(section.price ?? 0);
      return price > 0 && !name.includes('貴賓') && !name.includes('VIP');
    });
  const raw = eligibleSections.reduce((sum, section) => sum + Number(section.quantity?.remainingQuantity ?? 0), 0);
  return Number.isFinite(raw) ? raw : 0;
}

function totalSeatCount(event) {
  const raw = event.quantity?.remainingQuantity ?? 0;
  return Number.isFinite(raw) ? raw : 0;
}

function guestLabel(note = '') {
  if (note.includes('映後')) return '映後座談';
  if (note.includes('影人')) return '影人出席';
  if (note.includes('★')) return '影人場';
  return '';
}

function textFromHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function filmMeta(program) {
  const text = textFromHtml(program.description ?? '');
  const match = text.match(/([^｜]{2,80})｜([^｜]{2,80})｜(\d{4})｜(?:[^｜]{0,40}｜)?(\d+\s*min)/);
  if (!match) return { creators: '', production: '' };
  return {
    creators: match[1].trim(),
    production: `${match[2].trim()} / ${match[3]} / ${match[4].replace(/\s+/g, '')}`,
  };
}

function bestTicketType(ts) {
  const date = new Date(ts * 1000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 24);
  const weekdayDaytime = !['Sat', 'Sun'].includes(weekday) && hour < 18;
  return weekdayDaytime ? '平日日場 180' : '學生 220 / 兌換券';
}

function normalizeProgram(program, meta = {}) {
  const parsed = filmMeta(program);
  const events = (program.eventVenues ?? []).flatMap((venueBlock) => {
    const venue = compactVenue(venueBlock.venue?.name ?? '');
    return (venueBlock.events ?? [])
      .filter((event) => !(meta.excludeEventIds ?? []).includes(event.id))
      .map((event) => ({
      id: event.id,
      programId: program.id,
      kind: 'film',
      title: program.name,
      englishTitle: program.enUsName,
      creators: meta.creators ?? parsed.creators,
      production: meta.production ?? parsed.production,
      language: meta.language ?? '待確認',
      genre: meta.genre ?? meta.lane ?? program.programMainCategoryName ?? '電影',
      lane: meta.lane ?? program.programMainCategoryName ?? '電影',
      why: meta.why ?? '',
      priority: meta.priority ?? 99,
      start: event.startDateTime,
      end: event.endDateTime,
      time: fmtTime(event.startDateTime),
      day: dayKey(event.startDateTime),
      venue,
      note: event.description ?? '',
      guest: guestLabel(event.description ?? ''),
      remaining: publicSeatCount(event),
      totalRemaining: totalSeatCount(event),
      ticketType: bestTicketType(event.startDateTime),
      url: `${OPENTIX_EVENT}${program.id}`,
    }));
  });
  return { id: program.id, title: program.name, events };
}

function normalizeActivity(activity) {
  return {
    ...activity,
    kind: 'activity',
    programId: activity.id,
    time: fmtTime(activity.start),
    day: dayKey(activity.start),
    remaining: null,
    guest: '',
    ticketType: activity.action,
    production: '',
  };
}

async function fetchProgram(id) {
  const res = await fetch(`/api/opentix-csm/programs/${id}`);
  if (!res.ok) throw new Error(`OpenTix program ${id}: ${res.status}`);
  const json = await res.json();
  return json.result;
}

async function searchPrograms(query) {
  const res = await fetch('/api/opentix/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ queryString: query, language: 'zh-CHT' }),
  });
  if (!res.ok) throw new Error(`OpenTix search: ${res.status}`);
  const json = await res.json();
  return json.result?.found?.map((item) => item.source) ?? [];
}

function StatusPill({ remaining }) {
  let label = '可買';
  let cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (remaining <= 10) {
    label = '少量';
    cls = 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-black ${cls}`}>
      <Ticket size={12} />
      {label} {remaining}
    </span>
  );
}

function ActionPill({ label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-black text-sky-700">
      <Users size={12} />
      {label}
    </span>
  );
}

function EventRow({ event, compact = false }) {
  const Wrapper = event.url ? 'a' : 'div';
  return (
    <Wrapper
      href={event.url || undefined}
      target={event.url ? '_blank' : undefined}
      rel={event.url ? 'noreferrer' : undefined}
      className={`grid grid-cols-[78px_1fr_auto] items-center gap-3 border-b border-slate-200/80 px-3 py-3 last:border-b-0 ${
        event.url ? 'hover:bg-slate-50' : ''
      }`}
    >
      <div className="text-[12px] font-black tabular-nums text-slate-600">{event.time.replace(' ', '\n')}</div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-[14px] font-black text-slate-950">{event.title}</div>
          {event.kind === 'activity' ? (
            <span className="inline-flex shrink-0 items-center border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-black text-sky-700">
              活動
            </span>
          ) : null}
          {event.guest ? (
            <span className="inline-flex shrink-0 items-center gap-1 border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700">
              <Star size={11} />
              {event.guest}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin size={12} />{event.venue}</span>
          {!compact ? <span>{event.ticketType}</span> : null}
          {!compact && event.why ? <span className="truncate">{event.why}</span> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-600">
          {event.creators ? <span>主創：{event.creators}</span> : null}
          {event.production ? <span>{event.production}</span> : null}
          {event.kind === 'film' ? <span>語言：{event.language}</span> : null}
          {event.kind === 'film' ? <span>類型：{event.genre}</span> : null}
        </div>
      </div>
      {event.kind === 'activity' ? <ActionPill label={event.action} /> : <StatusPill remaining={event.remaining} />}
    </Wrapper>
  );
}

function Metric({ icon: Icon, label, value, sub }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-500">{label}</span>
        <Icon size={16} className="text-slate-400" />
      </div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-[11px] font-bold text-slate-500">{sub}</div>
    </div>
  );
}

function CatalogProgramRow({ program, interest = 'none', onSetInterest }) {
  const available = program.availableScreeningCount ?? 0;
  const screenings = program.screenings ?? [];
  const interestClass = {
    interested: 'border-rose-200 bg-rose-50 text-rose-700',
    maybe: 'border-amber-200 bg-amber-50 text-amber-700',
    excluded: 'border-slate-300 bg-slate-100 text-slate-500',
    none: 'border-slate-200 bg-white text-slate-500',
  }[interest] ?? 'border-slate-200 bg-white text-slate-500';
  return (
    <div className="block border-b border-slate-200 px-3 py-3 last:border-b-0 hover:bg-slate-50">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <a href={program.url} target="_blank" rel="noreferrer" className="text-sm font-black text-slate-950 hover:underline">
              {program.title}
            </a>
            {program.englishTitle ? <span className="text-[11px] font-bold text-slate-400">{program.englishTitle}</span> : null}
            {interest !== 'none' ? (
              <span className={`border px-1.5 py-0.5 text-[10px] font-black ${interestClass}`}>
                {INTEREST_LABEL[interest]}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
            {program.creator ? <span>主創：{program.creator}</span> : null}
            {program.production ? <span>{program.production}</span> : null}
            {program.rating ? <span>{program.rating}</span> : null}
          </div>
          {program.synopsis ? (
            <p className="mt-2 line-clamp-3 text-xs font-medium leading-relaxed text-slate-600">
              {program.synopsis}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-1">
            {(program.categories ?? []).slice(0, 4).map((category) => (
              <span key={category} className="border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                {category}
              </span>
            ))}
          </div>
        </div>
        <div className={`shrink-0 border px-2 py-1 text-[11px] font-black ${
          available > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
        }`}>
          可買場次 {available}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ['interested', '感興趣'],
          ['maybe', '可能'],
          ['excluded', '排除'],
          ['none', '清除'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onSetInterest(program.id, value)}
            className={`border px-2 py-1 text-[11px] font-black ${
              interest === value
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {screenings.length ? screenings.map((screening) => (
          <span
            key={screening.eventId}
            className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] font-black ${
              screening.remaining > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
            }`}
          >
            {fmtTime(screening.start)} · {screening.venue}
            {screening.guest ? ` · ${screening.guest}` : ''}
            {screening.remaining > 0
              ? ` · 一般席 ${screening.remaining}`
              : screening.totalRemaining > 0
                ? ` · 僅非公開席 ${screening.totalRemaining}`
                : ' · 售罄/未開放'}
          </span>
        )) : (
          <span className="border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500">無公開售票場次</span>
        )}
      </div>
    </div>
  );
}

export default function TaipeiFilmFestival() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [activeLane, setActiveLane] = useState('全部');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('全部');
  const [catalogSort, setCatalogSort] = useState('interest');
  const [activeTab, setActiveTab] = useState('radar');
  const [interestMap, setInterestMap] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_INTEREST;
    try {
      const saved = JSON.parse(window.localStorage.getItem(INTEREST_KEY) || '{}');
      return { ...DEFAULT_INTEREST, ...saved };
    } catch {
      return DEFAULT_INTEREST;
    }
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const loaded = await Promise.all(
        WATCHLIST.map(async (meta) => normalizeProgram(await fetchProgram(meta.id), meta)),
      );
      setPrograms(loaded);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message || 'OpenTix 同步失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = '台北電影節售票視覺化';
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    window.localStorage.setItem(INTEREST_KEY, JSON.stringify(interestMap));
  }, [interestMap]);

  const events = useMemo(() => {
    const filmEvents = programs
      .flatMap((program) => program.events)
      .filter((event) => event.remaining > 0);
    const activityEvents = ACTIVITIES.map(normalizeActivity);
    return [...filmEvents, ...activityEvents].sort((a, b) => a.start - b.start || a.priority - b.priority);
  }, [programs]);

  const lanes = useMemo(() => ['全部', '影人場', ...new Set([...WATCHLIST.map((item) => item.lane), ...ACTIVITIES.map((item) => item.lane)])], []);
  const visibleEvents = useMemo(() => {
    if (activeLane === '全部') return events;
    if (activeLane === '影人場') return events.filter((event) => event.guest);
    return events.filter((event) => event.lane === activeLane);
  }, [activeLane, events]);

  const now = Date.now() / 1000;
  const upcoming = visibleEvents.filter((event) => event.start >= now);
  const urgent = upcoming
    .filter((event) => event.priority <= 6 || (event.kind === 'film' && event.remaining <= 80))
    .sort((a, b) => a.priority - b.priority || (a.remaining ?? 9999) - (b.remaining ?? 9999))
    .slice(0, 8);
  const today = upcoming.filter((event) => dayKey(event.start) === dayKey(now));
  const lowStock = upcoming.filter((event) => event.kind === 'film' && event.remaining <= 20).sort((a, b) => a.remaining - b.remaining);
  const days = [...new Set(upcoming.map((event) => event.day))].slice(0, 8);
  const catalogEvents = useMemo(() => CATALOG_PROGRAMS.flatMap((program) => (program.screenings ?? []).map((screening) => ({
    ...screening,
    programId: program.id,
    title: program.title,
    englishTitle: program.englishTitle,
    creator: program.creator,
    production: program.production,
    categories: program.categories ?? [],
    url: program.url,
    day: dayKey(screening.start),
    time: fmtTime(screening.start),
    interest: interestMap[program.id] ?? 'none',
  }))).sort((a, b) => a.start - b.start || a.title.localeCompare(b.title, 'zh-Hant')), [interestMap]);
  const catalogDayKeys = useMemo(() => [...new Set(catalogEvents.map((event) => event.day))], [catalogEvents]);
  const catalogFilters = useMemo(() => {
    const base = ['全部', '感興趣', '可能', '排除', '未標記', '可買', '售罄/未開放'];
    const categories = new Set();
    CATALOG_PROGRAMS.forEach((program) => (program.categories ?? []).forEach((category) => categories.add(category)));
    return [...base, ...categories];
  }, []);
  const filteredCatalog = useMemo(() => {
    const normalizedQuery = catalogQuery.trim().toLowerCase();
    return CATALOG_PROGRAMS.filter((program) => {
      const interest = interestMap[program.id] ?? 'none';
      const matchesQuery = !normalizedQuery || [
        program.title,
        program.englishTitle,
        program.creator,
        program.production,
        ...(program.categories ?? []),
      ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        catalogFilter === '全部'
        || (catalogFilter === '感興趣' && interest === 'interested')
        || (catalogFilter === '可能' && interest === 'maybe')
        || (catalogFilter === '排除' && interest === 'excluded')
        || (catalogFilter === '未標記' && interest === 'none')
        || (catalogFilter === '可買' && program.availableScreeningCount > 0)
        || (catalogFilter === '售罄/未開放' && program.availableScreeningCount === 0)
        || (program.categories ?? []).includes(catalogFilter);
      return matchesQuery && matchesFilter;
    }).sort((a, b) => {
      const aInterest = interestMap[a.id] ?? 'none';
      const bInterest = interestMap[b.id] ?? 'none';
      if (catalogSort === 'interest') {
        return INTEREST_ORDER[aInterest] - INTEREST_ORDER[bInterest]
          || (b.availableScreeningCount ?? 0) - (a.availableScreeningCount ?? 0)
          || (a.firstStart ?? 9999999999) - (b.firstStart ?? 9999999999)
          || a.title.localeCompare(b.title, 'zh-Hant');
      }
      if (catalogSort === 'available') {
        return (b.availableScreeningCount ?? 0) - (a.availableScreeningCount ?? 0)
          || (a.firstStart ?? 9999999999) - (b.firstStart ?? 9999999999)
          || a.title.localeCompare(b.title, 'zh-Hant');
      }
      if (catalogSort === 'time') {
        return (a.firstStart ?? 9999999999) - (b.firstStart ?? 9999999999)
          || a.title.localeCompare(b.title, 'zh-Hant');
      }
      return a.title.localeCompare(b.title, 'zh-Hant');
    });
  }, [catalogFilter, catalogQuery, catalogSort, interestMap]);
  const setProgramInterest = useCallback((programId, value) => {
    setInterestMap((current) => {
      const next = { ...current };
      if (value === 'none') delete next[programId];
      else next[programId] = value;
      return next;
    });
  }, []);
  const tabs = [
    { id: 'radar', label: '行動雷達', icon: Ticket, count: urgent.length },
    { id: 'daily', label: '每日視圖', icon: CalendarDays, count: catalogDayKeys.length },
    { id: 'catalog', label: '去重節目單', icon: Film, count: filteredCatalog.length },
    { id: 'sources', label: '資料底本', icon: Users, count: REFERENCE_ITEMS.length },
  ];

  const runSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      setResults(await searchPrograms(query.trim()));
    } catch (err) {
      setError(err.message || '搜尋失敗');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
                <Film size={16} />
                Taipei Film Festival
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">台北電影節售票雷達</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
                第一屏只顯示可行動資訊：立即購票、今日行程、低餘額、每日重點。每 60 秒同步 OpenTix。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.opentix.life/search/%20/ABOUT_TO_BEGIN?category=%E9%9B%BB%E5%BD%B1All&type=programs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                OpenTix <ExternalLink size={14} />
              </a>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                立即同步
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Ticket} label="可行項目" value={upcoming.length} sub={activeLane === '全部' ? '白名單與活動同步' : activeLane} />
            <Metric icon={AlertCircle} label="需要先決定" value={urgent.length} sub="低餘額或高優先" />
            <Metric icon={CalendarDays} label="今日可接" value={today.length} sub="以台北時間計算" />
            <Metric icon={Clock} label="同步時間" value={updatedAt ? updatedAt.toLocaleTimeString('zh-TW', { hour12: false }) : '--:--'} sub="每 60 秒自動刷新" />
          </div>

          {error ? (
            <div className="flex items-center gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <section className="space-y-4">
          <div className="border border-slate-200 bg-white p-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between border px-3 py-2 text-left transition ${
                      active
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-white'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-black">
                      <Icon size={16} />
                      {tab.label}
                    </span>
                    <span className={`text-[11px] font-black ${active ? 'text-white/70' : 'text-slate-400'}`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'radar' ? (
            <>
          <div className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-lg font-black">立即購票隊列</h2>
                <p className="text-xs font-bold text-slate-500">{activeLane === '全部' ? '照這個順序處理，不看過期選項。' : `目前篩選：${activeLane}`}</p>
              </div>
              <Ticket className="text-slate-400" size={20} />
            </div>
            <div>
              {urgent.map((event) => <EventRow key={`${event.programId}-${event.id}`} event={event} />)}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                <CalendarDays size={18} className="text-slate-500" />
                <h2 className="text-base font-black">今日可接</h2>
              </div>
              {today.length ? today.map((event) => <EventRow key={`${event.programId}-${event.id}`} event={event} compact />) : (
                <div className="px-4 py-8 text-sm font-bold text-slate-500">今日白名單內沒有可接場次。</div>
              )}
            </div>

            <div className="border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                <AlertCircle size={18} className="text-amber-600" />
                <h2 className="text-base font-black">低餘額</h2>
              </div>
              {lowStock.length ? lowStock.map((event) => <EventRow key={`${event.programId}-${event.id}`} event={event} compact />) : (
                <div className="px-4 py-8 text-sm font-bold text-slate-500">目前沒有 20 張以下的白名單場次。</div>
              )}
            </div>
          </div>
            </>
          ) : null}

          {activeTab === 'daily' ? (
          <div className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-black">每日視圖</h2>
              <p className="text-xs font-bold text-slate-500">這裡使用 OpenTix 去重售票索引的完整場次，不是個人白名單。</p>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              {catalogDayKeys.map((day) => (
                <div key={day} className="border-b border-r border-slate-200">
                  <div className="bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">{day}</div>
                  {catalogEvents.filter((event) => event.day === day).map((event) => (
                    <a
                      key={`${event.programId}-${event.eventId}`}
                      href={event.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block border-b border-slate-200 px-3 py-2 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[12px] font-black tabular-nums text-slate-500">{event.time}</span>
                            <span className="text-sm font-black text-slate-950">{event.title}</span>
                            {event.interest !== 'none' ? (
                              <span className="border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-black text-rose-700">
                                {INTEREST_LABEL[event.interest]}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                            <span>{event.venue}</span>
                            {event.guest ? <span>{event.guest}</span> : null}
                            {event.production ? <span>{event.production}</span> : null}
                          </div>
                        </div>
                        <span className={`shrink-0 border px-2 py-1 text-[11px] font-black ${
                          event.remaining > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
                        }`}>
                          {event.remaining > 0 ? `一般席 ${event.remaining}` : event.totalRemaining > 0 ? `非公開 ${event.totalRemaining}` : '售罄'}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          ) : null}

          {activeTab === 'catalog' ? (
          <div className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-black">OpenTix 去重售票索引</h2>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                    以 OpenTix program id 為主鍵，一個節目只出現一次；下方列出所有售票網場次。這不是完整官方節目單，完整片單仍需併入節目專刊 PDF 與官網電影列表。
                  </p>
                </div>
                <div className="text-[11px] font-black text-slate-400">
                  顯示 {filteredCatalog.length} 部 / 售票索引 {CATALOG_PROGRAMS.length} 部
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[160px_180px_1fr]">
                <select
                  value={catalogFilter}
                  onChange={(event) => setCatalogFilter(event.target.value)}
                  className="border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-slate-950"
                >
                  {catalogFilters.map((filter) => <option key={filter} value={filter}>{filter}</option>)}
                </select>
                <select
                  value={catalogSort}
                  onChange={(event) => setCatalogSort(event.target.value)}
                  className="border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-slate-950"
                >
                  <option value="interest">排序：興趣優先</option>
                  <option value="available">排序：可買場次多</option>
                  <option value="time">排序：最早場次</option>
                  <option value="title">排序：片名</option>
                </select>
                <input
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder="搜尋片名、英文名、主創、國家、分類"
                  className="border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-slate-950"
                />
              </div>
            </div>
            <div className="max-h-[760px] overflow-auto">
              {filteredCatalog.map((program) => (
                <CatalogProgramRow
                  key={program.id}
                  program={program}
                  interest={interestMap[program.id] ?? 'none'}
                  onSetInterest={setProgramInterest}
                />
              ))}
            </div>
          </div>
          ) : null}

          {activeTab === 'sources' ? (
            <div className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-lg font-black">資料底本</h2>
                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                  這裡保留開幕、閉幕、講座、論壇與已過期但仍需查核的資料。完整片單底本仍以節目專刊 PDF 與官網為主，OpenTix 僅補票務狀態。
                </p>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {REFERENCE_ITEMS.map((item) => (
                  <div key={item.title} className="border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="text-sm font-black text-slate-900">{item.title}</div>
                    <div className="mt-1 text-xs font-bold leading-relaxed text-slate-500">{item.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <form onSubmit={runSearch} className="border border-slate-200 bg-white p-4">
            <label className="text-sm font-black text-slate-950">臨時查片名</label>
            <div className="mt-3 flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：大濛、女孩"
                className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-slate-950"
              />
              <button className="inline-flex items-center justify-center bg-slate-950 px-3 text-white" type="submit">
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {results.slice(0, 6).map((item) => (
                <a
                  key={item.id}
                  href={`${OPENTIX_EVENT}${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate">{item.title}</span>
                  <ExternalLink size={14} className="shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          </form>

          <div className="border border-slate-200 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <Users size={17} className="text-slate-500" />
              購票規則
            </h2>
            <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
              <div className="flex items-start gap-2"><Check size={15} className="mt-0.5 text-emerald-600" />平日 17:59 前優先平日日場 180。</div>
              <div className="flex items-start gap-2"><Check size={15} className="mt-0.5 text-emerald-600" />晚場與假日用學生票 220 或兌換券。</div>
              <div className="flex items-start gap-2"><Check size={15} className="mt-0.5 text-emerald-600" />兌換券優先用在晚場、假日、有影人場。</div>
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black">分類篩選</h2>
              <span className="text-[11px] font-black text-slate-400">{activeLane}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {lanes.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => setActiveLane(lane)}
                  className={`border px-2 py-1 text-[11px] font-black transition ${
                    activeLane === lane
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  {lane}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-bold leading-relaxed text-slate-500">
              點分類會同步改變左側所有列表；點「全部」恢復完整視圖。
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
