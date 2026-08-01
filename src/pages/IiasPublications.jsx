import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookMarked, ChevronRight, ChevronUp, ExternalLink, FileText, Globe, Landmark, Layers,
  LayoutGrid, Library, ListTree, Newspaper, Search, Shuffle, Users, X,
} from 'lucide-react';
import styles from './IiasPublications.module.css';
import PdfViewer from '../components/lab/PdfViewer';
import StickyHeading, { useStickyTop } from '../components/lab/StickyHeading';
import { useTabParam } from '../components/lab/Tabs';
import data from '../data/iiasPublications.json';
import BackLink from '../components/BackLink';
import SiteHomeEyebrow from '../components/SiteHomeEyebrow';

// 分類 → 固定 token 槽位（順序不重排；淡底 -bg 填面、ink -tx 細框，見 docs/DESIGN.md 色彩哲學）
const CATS = [
  { name: '法學期刊', slot: 1 },
  { name: '法學專書', slot: 2 },
  { name: '法學叢書', slot: 3 },
  { name: '外文出版品', slot: 4 },
];
const catVars = (name) => {
  const c = CATS.find((x) => x.name === name);
  const n = c ? c.slot : 8;
  return { tx: `var(--cat-${n}-tx)`, bg: `var(--cat-${n}-bg)` };
};

// 法學期刊類的出版品標題只存期次（「第38期」「創刊號」「2022特刊─…」），脫離期刊架脈絡就
// 看不出是哪份刊物。顯示層補上刊名——刊名由 category 導出、非逐筆資料，故屬前端投影，不改資料倉。
// （期刊架卡片本就在「《中研院法學期刊》」標頭下，那裡仍用原始短標題，不套此函式以免冗贅。）
const JOURNAL_SERIES = '中研院法學期刊';
const pubLabel = (pub) =>
  pub.category === '法學期刊' ? `《${JOURNAL_SERIES}》${pub.title}` : pub.title;

const pdfHref = (url) => `/api/pdf?url=${encodeURIComponent(url)}`;
// 篇章的開啟連結：pdf 走代理、線上閱覽走原網址、無檔則無連結
const chapterHref = (ch) => (ch.type === 'pdf' ? pdfHref(ch.url) : ch.type === 'read' ? ch.url : null);

// 頂緣收圓角、底邊齊平的矩形路徑（給堆疊條的最上段用）
const roundedTopRect = (x, y, w, h, r) =>
  `M${x},${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} H${x} Z`;
const coverSrc = (pub) => `/covers/iias/${pub.cover}`;

// 卡片允許選取文字：拖曳選字放開時不當成點擊
const guarded = (fn) => () => {
  if (window.getSelection?.()?.toString()) return;
  fn();
};

// 重點作者：多為前大法官、司法院長或比較法／兩岸法重量級學者，於本集著作數不多、
// 在依篇數的榜上排得靠後，特設側欄捷徑直達（名字用資料層正規化後的形態，缺席者自動略過）。
const NOTABLE_AUTHORS = [
  '翁岳生', '林子儀', '湯德宗', '許宗力', '蘇永欽', '王澤鑑', '王泰升', '陳弘毅', '張千帆',
  'Jerome A. Cohen', 'Jacques deLisle', 'William P. Alford', 'Albie Sachs',
];
const NOTABLE_LABEL = {
  'Jerome A. Cohen': '孔傑榮', 'Jacques deLisle': '戴傑', 'William P. Alford': '安守廉',
  'Albie Sachs': '奧比・薩克思',
};

// 分頁順序照「看什麼層級」排：先全集，再卷冊層的兩種切法（非期刊書系／期刊），
// 再降到篇章層，最後才是三個依主題重整的切面。
const MAIN_TABS = [
  { id: 'overview', label: '總覽', Icon: LayoutGrid },
  { id: 'catalog', label: '完整清單', Icon: Library },
  { id: 'series', label: '系列', Icon: Layers },
  { id: 'shelf', label: '期刊架', Icon: Newspaper },
  { id: 'index', label: '篇章檢索', Icon: ListTree },
  { id: 'authors', label: '作者', Icon: Users },
  { id: 'china', label: '兩岸四地', Icon: Globe },
  { id: 'institute', label: '所史', Icon: Landmark },
];

// 反覆出的書系。期刊另有「期刊架」，這裡只收非期刊的多冊系列；判別用書名。
// 沒收進來的都是單本（2008 法律思想與社會變遷、司改十週年會議實錄、研之得法、三本外文出版品）。
const SERIES = [
  {
    name: '憲法解釋之理論與實務',
    re: /憲法解釋之理論與實務/,
    note: '研討會論文集，本所收到的從 2005 年第四輯到 2025 年第十二輯（前三輯早於法律所）。每輯先有一位外國憲法學者的主題演說，台灣學者接著各談各的題目，比較憲法的方法論與個別釋字的評析都收。第六到第八輯分上下冊。',
  },
  {
    name: '行政管制與行政爭訟',
    re: /行政管制與行政爭訟/,
    note: '一年一屆的行政法研討會論文集，以屆次年份命名（2005 那屆到 2021 那屆），出版時間比會議晚一到數年。2011 屆起各冊另立主題，如民營化、行政契約、食品安全、行政程序法 2.0、防疫與法治。',
  },
  {
    name: '兩岸四地法律發展',
    re: /兩岸四地法律發展/,
    note: '台灣、大陸、香港、澳門輪流主辦的研討會，這裡是輪到台灣那三屆（2006、2010、2014）的論文集，各分上下冊。每篇論文後面配一到三篇來自其他三地的評論文。',
  },
  {
    name: '科技發展與法律規範雙年刊',
    re: /科技發展與法律規範雙年刊/,
    note: '兩年一冊，2007、2009、2011 三屆。',
  },
  {
    name: '司法制度實證研究',
    re: /司法制度實證研究/,
    note: '2008 與 2011 兩冊，法實證研究的論文集。',
  },
  {
    name: '法的理性—吳庚教授紀念論文集',
    re: /法的理性/,
    note: '2020 年出版，分上下冊。',
  },
  {
    name: '國際比較下我國著作權法之總檢討',
    re: /國際比較下我國著作權法之總檢討/,
    note: '2014 年出版，分上下冊。',
  },
];

// 「所史」分頁的收件範圍：這批出版品裡談這個所自己的篇章。三種——
// (1) 序與編務：出版序、出刊辭、主編序、所長序、發刊辭、編者序，署名者多是歷任所長與主編，
//     連起來就是誰在什麼時候當家；(2) 會議與紀念：致詞、引言、議程、緬懷、週年感言、文集序；
// (3) 十週年文集整本。附錄、索引、勘誤這類資料不收（那是書的零件，不是所的紀事）。
const isPrefaceWork = (t) => {
  const s = t || '';
  if (/週年感言|文集序/.test(s)) return false; // 歸紀念那組
  if (/出版序|出刊[辭詞]|發刊[辭詞]|編[者輯]序|主編序|所長序/.test(s)) return true;
  return /序$/.test(s) && !/(?:程|秩|順|次|時|工)序$/.test(s);
};
const isOccasionWork = (t) => /開幕致[詞辭]|閉幕致[詞辭]|^引言|弁言|^議程$|緬懷|悼念|週年感言|文集序/.test(t || '');

// 兩岸四地側欄跳卷鈕的短標：同一屆分上下冊，特刊自成一格。
const volumeShort = (title) => {
  if (/香港法治/.test(title)) return '香港特刊';
  if (/上冊/.test(title)) return '上冊';
  if (/下冊/.test(title)) return '下冊';
  return '全一冊';
};

// 作者榜「自動展開」滑桿的最右一格＝不看門檻、全部攤開（最左的 0 是全部收合）
const ALL_OPEN = 6;

// 期刊架側欄跳期鈕上的短標：期號數字最好認，創刊號與特刊各給一個短名。
const issueShort = (title) => {
  const t = title || '';
  const m = t.match(/第\s*(\d+)\s*期/);
  if (m) return m[1];
  if (/創刊/.test(t)) return '創刊';
  const s = t.match(/(\d{4})\s*特刊\s*(\d)?/);
  if (s) return s[2] ? `特${s[2]}` : '特刊';
  return t.slice(0, 3);
};

// 所史側欄年表。每一條都對得上這批出版品裡的一本書或一件事，不寫查不到出處的年份：
// 研討會日期取自該卷冊官網簡介，其餘取自出版品的出版年月。
// links 的 label 是 text 裡要變成連結的那段字（原字照抄，不然接不上）；
// pub＝跳到完整清單並展開該卷，tab＝跳到某個分頁。
const INSTITUTE_TIMELINE = [
  { year: '2004', text: '7 月設籌備處，湯德宗任主任', links: [{ label: '湯德宗', tab: 'curator' }] },
  {
    year: '2005',
    text: '《憲法解釋之理論與實務》第四輯，本站最早的一本',
    links: [{ label: '《憲法解釋之理論與實務》第四輯', pub: /憲法解釋之理論與實務 \(第四輯\)/ }],
  },
  {
    year: '2006',
    text: '首屆「兩岸四地法律發展」研討會（6/2–3）',
    links: [{ label: '「兩岸四地法律發展」', tab: 'china' }],
  },
  { year: '2007', text: '《中研院法學期刊》創刊號', links: [{ label: '創刊號', pub: /^創刊號$/ }] },
  {
    year: '2010',
    text: '《司法改革十週年的回顧與展望》會議實錄',
    links: [{ label: '《司法改革十週年的回顧與展望》會議實錄', pub: /司法改革十週年/ }],
  },
  {
    year: '2011',
    text: '7 月 1 日正式成所，湯德宗首任所長；9 月底卸任、赴任大法官',
    links: [{ label: '湯德宗', tab: 'curator' }],
  },
  {
    year: '2018',
    text: '2014 那屆兩岸四地論文集出版，此系列止於此',
    links: [{ label: '兩岸四地論文集', tab: 'china' }],
  },
  { year: '2021', text: '成所十年，《研之得法》文集', links: [{ label: '《研之得法》文集', tab: 'institute-anniv' }] },
  { year: '2022', text: '《香港法治之變局》特刊', links: [{ label: '《香港法治之變局》', pub: /香港法治之變局/ }] },
  { year: '2023', text: '「行政管制與行政爭訟」補齊 2017、2019 兩屆' },
  {
    year: '2025',
    text: '《憲法解釋之理論與實務》第十二輯',
    links: [{ label: '《憲法解釋之理論與實務》第十二輯', pub: /憲法解釋之理論與實務（第12輯）/ }],
  },
  {
    year: '2026',
    text: '成所十五年；最新一期是《中研院法學期刊》第 38 期',
    links: [{ label: '第 38 期', pub: /^第38期$/ }],
  },
];

// 把 text 裡 links 指名的字串換成可點的按鈕，其餘照原樣輸出。
function TimelineText({ text, links = [], onLink }) {
  if (!links.length) return text;
  const labels = links.map((l) => l.label).sort((a, b) => b.length - a.length); // 長的先比，免得短的先吃掉
  const re = new RegExp(`(${labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);
  return text.split(re).map((seg, i) => {
    const hit = links.find((l) => l.label === seg);
    // 用 span 不用 button：button 是 inline-block，長書名折行時會自成一塊、
    // 把後面的字擠到下一行，年份也跟著掉到中間。span 就照一般文字流折行。
    return hit
      ? (
        <span
          key={i}
          className={styles.tlLink}
          role="button"
          tabIndex={0}
          onClick={() => onLink(hit)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLink(hit); } }}
        >
          {seg}
        </span>
      )
      : <React.Fragment key={i}>{seg}</React.Fragment>;
  });
}

// 兩岸四地主題判別：兩岸四地法律發展系列與香港特刊整本在題內，其餘刊物取逐篇命中者。
// 「大陸」排除「大陸法系」（民法法系，非兩岸議題）。
const CHINA_RE = /中國|中華人民|兩岸|大陸(?!法系)|港澳|香港|澳門|China|[Cc]ross-?[Ss]trait/;
const isChinaFlagship = (p) => /兩岸四地|香港法治/.test(p.title);

// 非研究性篇章（序、編務、附錄、索引等資料）判別，供作者統計與策展人專頁共用、分類一致。
// 一為序與編務（各種序、發刊辭、致詞、引言、緬懷、文集序、週年感言），二為附錄與資料
// （附錄、索引、議程、勘誤、更正聲明）；另補「標題以『序』收尾」者，程序／秩序等複合詞除外。
const isAncillary = (t) => {
  const s = t || '';
  if (/出版序|出刊[辭詞]|發刊[辭詞]|編[者輯]序|主編序|所長序|開幕致[詞辭]|閉幕致[詞辭]|引言|弁言|緬懷|悼念|文集序|週年感言/.test(s)) return true;
  if (/^附錄|索引$|^議程$|勘誤|更正聲明/.test(s)) return true;
  return /序$/.test(s) && !/(?:程|秩|順|次|時|工)序$/.test(s);
};

function CatBadge({ name }) {
  const v = catVars(name);
  return (
    <span className={styles.badge} style={{ '--badge-tx': v.tx, '--badge-bg': v.bg }}>
      {name}
    </span>
  );
}

// 滑過篇名／取得鈕時，用 <link rel="prefetch"> 讓瀏覽器低優先度預抓該 PDF，等真的點開時
// 多半已在快取裡，開啟近乎瞬時。每個 URL 只掛一次。（配合 /api/pdf 代理的長效 Cache-Control。）
const prefetched = new Set();
const prefetchPdf = (rawUrl) => {
  const href = pdfHref(rawUrl);
  if (prefetched.has(href)) return;
  prefetched.add(href);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

// PDF 開啟一律用真的 <a href>：純左鍵點走頁內彈窗，Cmd/Ctrl/中鍵仍照常開新分頁；
// 且錨點天生靠左，換行不會像 <button> 那樣置中（底層禁止醜 wrap）。
const openOnClick = (run) => (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  run();
};

// 篇名呈現：PDF 走頁內彈窗（滑過即預抓），線上閱覽走新分頁，無檔則純文字。
function ChapterTitle({ ch, pub, onOpen }) {
  // 雙語兩版本的譯本標「中譯」——同一篇作品的另一語言版本，看得出來就不會誤以為是兩篇
  const tag = ch.translationOf ? <span className={styles.transTag}>中譯</span> : null;
  if (ch.type === 'pdf') {
    return (
      <>
        <a
          className={styles.chTitleLink}
          href={pdfHref(ch.url)}
          onClick={openOnClick(() => onOpen(ch, pub))}
          onMouseEnter={() => prefetchPdf(ch.url)}
        >
          {ch.title}
        </a>
        {tag}
      </>
    );
  }
  if (ch.type === 'read') {
    return (
      <>
        <a className={styles.chTitleLink} href={ch.url} target="_blank" rel="noreferrer">{ch.title}</a>
        {tag}
      </>
    );
  }
  return <>{ch.title}{tag}</>;
}

function GetLink({ ch, onOpen }) {
  if (ch.type === 'pdf') {
    return (
      <a
        className={styles.getLink}
        href={pdfHref(ch.url)}
        onClick={openOnClick(() => onOpen(ch))}
        onMouseEnter={() => prefetchPdf(ch.url)}
      >
        <FileText size={12} />PDF{ch.pdfPages ? `・${ch.pdfPages} 頁` : ''}
      </a>
    );
  }
  if (ch.type === 'read') {
    return (
      <a className={styles.getLink} href={ch.url} target="_blank" rel="noreferrer">
        <ExternalLink size={12} />線上閱覽
      </a>
    );
  }
  return <span className={styles.noFile}>—</span>;
}

// 作者欄：把每位（正規化後的）作者做成可點的名字，點了跳「作者」分頁並展開其著作清單。
// 少數無正規化名單的篇章（非人名／已剔除者）退回純文字、不可點。
function AuthorCell({ ch, onAuthor }) {
  const list = ch.authorList || [];
  // 譯者取自譯本 PDF 首頁署名（官網欄位沒有）。只顯示、不算作者，著作仍歸原作者。
  const tr = ch.translator ? <span className={styles.translatorTag}>{ch.translator} 譯</span> : null;
  if (!list.length) return <>{ch.authors || null}{tr}</>;
  return (
    <>
      {list.map((name, i) => (
        <React.Fragment key={name}>
          {i > 0 ? '、' : null}
          <button type="button" className={styles.authorTag} onClick={() => onAuthor(name)}>{name}</button>
        </React.Fragment>
      ))}
      {tr}
    </>
  );
}

// 出處：可點回到「完整清單」該本出版品（展開其目次）。
function SourceLink({ pub, onSource }) {
  return (
    <button type="button" className={styles.srcLink} onClick={() => onSource(pub)}>
      {pubLabel(pub)}（{pub.date}）
    </button>
  );
}

// 作者頁的著作清單（單一作者，故無作者欄）；論著與序・編務兩段共用。
function WorksTable({ rows, onOpen, onSource }) {
  return (
    <table className={styles.indexTable}>
      <thead>
        <tr>
          <th>篇名</th>
          <th>出處</th>
          <th className={styles.chPages}>頁碼</th>
          <th>取得</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ ch, pub }, i) => (
          <tr key={i}>
            <td className={styles.chTitle}><ChapterTitle ch={ch} pub={pub} onOpen={onOpen} /></td>
            <td className={styles.src}><SourceLink pub={pub} onSource={onSource} /></td>
            <td className={styles.chPages}>{ch.pages || ''}</td>
            <td><GetLink ch={ch} onOpen={() => onOpen(ch, pub)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 跨出版品的篇章表（篇名／作者／出處／頁碼／取得）。篇章檢索、兩岸四地、所史三處共用，
// 免得同一張表在檔內抄三份、改一處漏兩處。
function IndexTable({ rows, onOpen, onAuthor, onSource }) {
  return (
    <table className={styles.indexTable}>
      <thead>
        <tr>
          <th>篇名</th>
          <th>作者</th>
          <th>出處</th>
          <th className={styles.chPages}>頁碼</th>
          <th>取得</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ ch, pub }, i) => (
          <tr key={i}>
            <td className={styles.chTitle}><ChapterTitle ch={ch} pub={pub} onOpen={onOpen} /></td>
            <td className={styles.chAuthors}><AuthorCell ch={ch} onAuthor={onAuthor} /></td>
            <td className={styles.src}><SourceLink pub={pub} onSource={onSource} /></td>
            <td className={styles.chPages}>{ch.pages || ''}</td>
            <td><GetLink ch={ch} onOpen={() => onOpen(ch, pub)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChapterTable({ chapters, pub, onOpen, onAuthor }) {
  const rows = [];
  let prevSection = null;
  chapters.forEach((ch, i) => {
    const sec = ch.section || '';
    if (sec && sec !== prevSection) {
      rows.push(
        <tr key={`s${i}`} className={styles.sectionRow}>
          <td colSpan={4}>{sec}</td>
        </tr>,
      );
    }
    prevSection = sec || prevSection;
    rows.push(
      <tr key={i}>
        <td className={styles.chTitle}>
          <ChapterTitle ch={ch} pub={pub} onOpen={onOpen} />
        </td>
        <td className={styles.chAuthors}><AuthorCell ch={ch} onAuthor={onAuthor} /></td>
        <td className={styles.chPages}>{ch.pages || ''}</td>
        <td><GetLink ch={ch} onOpen={() => onOpen(ch, pub)} /></td>
      </tr>,
    );
  });
  return (
    <table className={styles.chapterTable}>
      <thead>
        <tr>
          <th>篇名</th>
          <th>作者</th>
          <th className={styles.chPages}>頁碼</th>
          <th>取得</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

// 出版年表：年 × 分類堆疊條。淡底填色＋同色相 ink 1px 細框、段間 2px 留白、hover 明細。
function YearChart({ pubs }) {
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);

  const { years, maxTotal } = useMemo(() => {
    const byYear = new Map();
    for (const p of pubs) {
      const y = (p.date || '').slice(0, 4);
      if (!y) continue;
      if (!byYear.has(y)) byYear.set(y, Object.fromEntries(CATS.map((c) => [c.name, 0])));
      byYear.get(y)[p.category] += 1;
    }
    const ys = [...byYear.keys()].map(Number);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const list = [];
    let m = 0;
    for (let y = min; y <= max; y++) {
      const counts = byYear.get(String(y)) || Object.fromEntries(CATS.map((c) => [c.name, 0]));
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      m = Math.max(m, total);
      list.push({ year: y, counts, total });
    }
    return { years: list, maxTotal: m };
  }, [pubs]);

  const W = 960;
  const H = 240;
  const M = { top: 18, right: 8, bottom: 26, left: 26 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const slot = plotW / years.length;
  const barW = Math.min(30, slot - 8);
  const yScale = (v) => (v / maxTotal) * plotH;
  const ticks = maxTotal <= 6 ? [...Array(maxTotal + 1).keys()] : [0, 3, 6, 9, 12].filter((t) => t <= maxTotal);

  const showTip = (e, y) => {
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: e.clientX - box.left + 12, y: e.clientY - box.top - 10, ...y });
  };

  return (
    <div className={styles.chartWrap} ref={wrapRef}>
      <div className={styles.chartLegend}>
        {CATS.map((c) => {
          const v = catVars(c.name);
          const n = pubs.filter((p) => p.category === c.name).length;
          return (
            <span key={c.name} className={styles.item}>
              <span className={styles.swatch} style={{ '--sw-tx': v.tx, '--sw-bg': v.bg }} />
              {c.name}・{n} 種
            </span>
          );
        })}
      </div>
      <svg className={styles.chartSvg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="各年份出版品數量，依分類堆疊">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={M.left} x2={W - M.right}
              y1={M.top + plotH - yScale(t)} y2={M.top + plotH - yScale(t)}
              stroke="var(--c-line-soft)" strokeWidth="1"
            />
            <text x={M.left - 6} y={M.top + plotH - yScale(t) + 3} textAnchor="end" fontSize="13" fill="var(--c-ink-faint)">{t}</text>
          </g>
        ))}
        {years.map((y, i) => {
          const x = M.left + i * slot + (slot - barW) / 2;
          let acc = 0;
          // 只有整落最上段收圓角（資料末端），其餘齊平方角，段與段之間留 2px 紙色間隙。
          const topName = [...CATS].reverse().find((c) => y.counts[c.name] > 0)?.name;
          return (
            <g key={y.year} onMouseMove={(e) => showTip(e, y)} onMouseLeave={() => setTip(null)}>
              <rect x={M.left + i * slot} y={M.top} width={slot} height={plotH} fill="transparent" />
              {CATS.map((c) => {
                const v = y.counts[c.name];
                if (!v) return null;
                const SEAM = 1.5; // 段與段之間留 1.5px 紙色間隙
                const segTop = M.top + plotH - yScale(acc) - yScale(v);
                acc += v;
                const yTop = segTop + SEAM;
                const h = Math.max(yScale(v) - SEAM, 1);
                const cv = catVars(c.name);
                const isTop = c.name === topName;
                const r = isTop ? Math.min(4, barW / 2, h) : 0;
                const capH = Math.min(2.5, h); // 頂緣一道飽和細帶當該類記號
                // 條身＝溫潤粉彩：先取輕實填（22% 墨混同色相淡底）當基底，保留其自然明度（本就偏淡），
                // 再用相對色彩「只把 chroma ×1.9、不動明度」把灰救回成乾淨色相。不硬拉明度＝不刺眼。
                // （鎖 L.90 那版太亮成螢光糖果色，與墨紙調打架，故不採。）頂緣全飽和細帶當分類記號。
                const paleFill = `color-mix(in oklab, ${cv.tx} 22%, ${cv.bg})`;
                const body = { fill: `oklch(from ${paleFill} l calc(c * 1.9) h)` };
                const cap = { fill: cv.tx, fillOpacity: 1 };
                return (
                  <g key={c.name}>
                    {isTop
                      ? <path d={roundedTopRect(x, yTop, barW, h, r)} {...body} />
                      : <rect x={x} y={yTop} width={barW} height={h} {...body} />}
                    {isTop
                      ? <path d={roundedTopRect(x, yTop, barW, capH, Math.min(r, capH))} {...cap} />
                      : <rect x={x} y={yTop} width={barW} height={capH} {...cap} />}
                  </g>
                );
              })}
              {y.total > 0 && (
                <text x={x + barW / 2} y={M.top + plotH - yScale(y.total) - 5} textAnchor="middle" fontSize="13" fill="var(--c-ink-faint)">{y.total}</text>
              )}
              <text x={M.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize="13" fill="var(--c-ink-muted)">{y.year}</text>
            </g>
          );
        })}
        <line x1={M.left} x2={W - M.right} y1={M.top + plotH} y2={M.top + plotH} stroke="var(--c-line)" strokeWidth="1" />
      </svg>
      {tip && (
        <div className={styles.chartTip} style={{ left: tip.x, top: tip.y }}>
          <div className={styles.tipYear}>{tip.year} 年・共 {tip.total} 種</div>
          {CATS.filter((c) => tip.counts[c.name] > 0).map((c) => {
            const v = catVars(c.name);
            return (
              <div key={c.name} className={styles.tipRow}>
                <span className={styles.name}>
                  <span className={styles.swatch} style={{ '--sw-tx': v.tx, '--sw-bg': v.bg }} />
                  {c.name}
                </span>
                <span>{tip.counts[c.name]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PubCard({ pub, open, onToggle, onOpen, onAuthor }) {
  return (
    <article className={styles.pubCard}>
      <button type="button" className={styles.pubHead} onClick={guarded(onToggle)} aria-expanded={open}>
        <img className={styles.pubCover} src={coverSrc(pub)} alt="" loading="lazy" />
        <div className={styles.pubMain}>
          <div className={styles.pubTitleRow}>
            <span className={styles.pubTitle}>{pubLabel(pub)}</span>
            <span className={styles.pubDate}>{pub.date}</span>
            <CatBadge name={pub.category} />
            {/* 書號＝出版線的流水號（官網原本寫在書名裡，投影時拆出來）。與主題書系不同軸：
                同一個主題系列會跨分類，所以書號連號的兩本未必是同一個系列。 */}
            {pub.serial && <span className={styles.serialTag}>{pub.serial.label}</span>}
          </div>
          {pub.summary && <p className={styles.pubSummary}>{pub.summary}</p>}
          <div className={styles.pubMeta}>
            <span>{pub.chapters.length} 篇</span>
            <a href={pub.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              官網頁面 <ExternalLink size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
            </a>
          </div>
        </div>
        <ChevronRight size={18} className={`${styles.chevron} ${open ? styles.open : ''}`} />
      </button>
      {open && (
        <>
          {/* 目次一長，捲到中段就看不到自己在哪一本底下。這條停在吸頂分頁列下方，
              捲出這張卡片時被下一張的頂上去（VS Code 捲長檔那種行為）。 */}
          <StickyHeading className={styles.stickyPub}>
            <span className={styles.stickyPubTitle}>{pubLabel(pub)}</span>
            <span className={styles.stickyPubMeta}>{pub.date}・{pub.chapters.length} 篇</span>
          </StickyHeading>
          <ChapterTable chapters={pub.chapters} pub={pub} onOpen={onOpen} onAuthor={onAuthor} />
        </>
      )}
    </article>
  );
}

export default function IiasPublications() {
  const [tab, setTab] = useTabParam('tab', 'overview'); // 分頁狀態同步到 ?tab=，可書籤／上一頁
  // 「整理者的話」預設不顯示，但一律留在 DOM 裡（只以 CSS 收起，不做條件渲染）：檢視原始碼、
  // 帶著 #colophon 進來、或抓取頁面的人照樣讀得到，畫面上則要自己找到那個墨記才會展開。
  const [noteOpen, setNoteOpen] = useState(() =>
    typeof window !== 'undefined' && decodeURIComponent(window.location.hash) === '#colophon');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  // 預設全展開：collapsed 集合為空＝全開（站規：可展開卡片一律預設展開）
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [issueId, setIssueId] = useState(null);
  const [authorSel, setAuthorSel] = useState(null); // 選中的作者（看其著作）
  const [aq, setAq] = useState(''); // 作者分頁內的姓名篩選（可觸及長尾）
  const [authorSort, setAuthorSort] = useState('count'); // 'count'（依篇數）| 'name'（依姓名）
  // 排序方向：再按一下同一顆就翻面。各鍵有自己的預設方向（篇數多→少、姓名 A→Z），
  // 切換到別的鍵時回到該鍵的預設，不把上一個鍵的方向帶過去。
  const [authorDir, setAuthorDir] = useState('desc');
  // 長尾作者（全集裡只出現一兩次）點開才看得到內容，太費事。門檻以下的直接攤開著作，
  // 0＝關閉。以 total（論著＋序編務）計，只掛過一篇序的人也算得進去。
  const [autoOpen, setAutoOpen] = useState(1);
  const [indexSort, setIndexSort] = useState('date'); // 篇章檢索排序：'date'｜'title'｜'author'
  const [seriesSel, setSeriesSel] = useState(SERIES[0].name); // 書系分頁看哪一個系列
  const [seriesClosed, setSeriesClosed] = useState(() => new Set()); // 空集合＝全展開（站規）
  const [indexDir, setIndexDir] = useState('desc');
  const [randTick, setRandTick] = useState(0); // 每次隨機挑作者遞增，觸發捲動 effect
  // 吸頂分頁列的高度寫進 --lab-sticky-top，卡片與作者列的小標據此停在它下面
  const tabBarRef = useRef(null);
  useStickyTop(tabBarRef);
  const boardRef = useRef(null);
  const scrollPendingRef = useRef(null); // 隨機挑選的目標作者名；手動點選不設，故不跳頁
  const shelfRef = useRef(null);
  const [shelfCols, setShelfCols] = useState(1); // 期刊架每列欄數，用來把目次插在整列之後（而非被點封面之後）
  const [viewing, setViewing] = useState(null); // 頁內 PDF 彈窗：{ src, title, subtitle, roll } 或 null
  const [pick, setPick] = useState(null); // 側欄「抽一篇」當前隨機篇章：{ ch, pub }
  // 兩岸四地與所史頁收起來的卷冊 id。空集合＝全開（站規：可展開卡片一律預設展開）
  const [chinaClosed, setChinaClosed] = useState(() => new Set());

  useEffect(() => { document.title = '中研院法研所出版品'; }, []);

  const pubs = data.publications;
  const query = q.trim().toLowerCase();

  // 下面三個 useMemo 都用它。它只依賴 query，而三處都列了 query，所以原本沒列它也還是對的——
  // 但那是碰巧對的。用 useCallback 把它固定住並列進依賴，往後改動 chapterHit 吃什麼都不會漏。
  const chapterHit = useCallback(
    (ch) =>
      ch.title.toLowerCase().includes(query) ||
      (ch.authors || '').toLowerCase().includes(query) ||
      (ch.section || '').toLowerCase().includes(query),
    [query],
  );

  const filteredPubs = useMemo(() => {
    let list = pubs;
    if (cat !== 'all') list = list.filter((p) => p.category === cat);
    if (query) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.summary || '').toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query) ||
          p.chapters.some(chapterHit),
      );
    }
    return list;
  }, [pubs, cat, query, chapterHit]);

  const journals = useMemo(() => {
    let list = pubs.filter((p) => p.category === '法學期刊');
    if (query) list = list.filter((p) => p.title.toLowerCase().includes(query) || p.chapters.some(chapterHit));
    return list;
  }, [pubs, query, chapterHit]);

  // 篇章檢索的排序。預設「依出版時間，新到舊；同一本依原目次」——這是資料本身的順序
  // （publications 已是日期遞減），先前沒寫出來，讀者看不出規律，故另加可切換的排序與說明。
  const INDEX_SORTS = {
    date: { label: '出版', base: 'desc', desc: '依出版時間，新到舊；同一本依原目次', asc: '依出版時間，舊到新；同一本依原目次' },
    title: { label: '篇名', base: 'asc', asc: '依篇名筆畫，順排', desc: '依篇名筆畫，倒排' },
    author: { label: '作者', base: 'asc', asc: '依第一作者，順排', desc: '依第一作者，倒排' },
  };
  const indexRows = useMemo(() => {
    const rows = [];
    for (const p of filteredPubs) {
      for (const ch of p.chapters) {
        if (query && !chapterHit(ch)) continue;
        rows.push({ ch, pub: p });
      }
    }
    const sign = indexDir === 'asc' ? 1 : -1;
    if (indexSort === 'title') {
      rows.sort((x, y) => sign * (x.ch.title || '').localeCompare(y.ch.title || '', 'zh-Hant'));
    } else if (indexSort === 'author') {
      const first = (r) => (r.ch.authorList || [])[0] || '￿'; // 無署名的排在最後
      rows.sort((x, y) => sign * first(x).localeCompare(first(y), 'zh-Hant')
        || (y.pub.date || '').localeCompare(x.pub.date || ''));
    } else {
      // 依出版時間。sort 是穩定的，所以只比日期，同一本書的篇章維持原目次順序
      // （這裡不能用 reverse——那會把目次也倒過來讀）。
      rows.sort((x, y) => sign * (x.pub.date || '').localeCompare(y.pub.date || ''));
    }
    return rows;
  }, [filteredPubs, query, chapterHit, indexSort, indexDir]);


  // 作者索引：以正規化後的 authorList 統計（正規化在資料倉 build-app-json）。著作與序・編務分開，
  // 排序與榜上數字只看研究性著作（count），序、編務、附錄另計（ancillaryCount），與策展人專頁的分法一致。
  const authorStats = useMemo(() => {
    const map = new Map();
    for (const p of pubs) for (const ch of p.chapters) {
      // 雙語兩版本（《研之得法》外稿的原文＋中譯）在官網各占一列。譯本不另計一篇，
      // 否則那十一位外國作者的篇數會各多一倍；譯本仍列在原文那一列旁（見 WorksTable）。
      if (ch.translationOf) continue;
      for (const a of (ch.authorList || [])) {
        if (!map.has(a)) map.set(a, { name: a, works: [], ancillary: [] });
        const e = map.get(a);
        (isAncillary(ch.title) ? e.ancillary : e.works).push({ ch, pub: p });
      }
    }
    const entries = [...map.values()].map((e) => ({
      ...e,
      count: e.works.length,
      ancillaryCount: e.ancillary.length,
      total: e.works.length + e.ancillary.length,
    }));
    const ranked = entries.sort(
      (x, y) => y.count - x.count || y.total - x.total || x.name.localeCompare(y.name, 'zh-Hant'),
    );
    return {
      map: new Map(entries.map((e) => [e.name, e])),
      ranked,
      total: ranked.length,
      max: ranked[0]?.count || 1,
      solo: ranked.filter((a) => a.total === 1).length,
    };
  }, [pubs]);

  // 榜單：列出全部作者（不截斷），依 authorSort 排序；姓名篩選作用於全體（含長尾）
  const boardAuthors = useMemo(() => {
    const query2 = aq.trim().toLowerCase();
    let list = query2
      ? authorStats.ranked.filter((a) => a.name.toLowerCase().includes(query2))
      : authorStats.ranked;
    list = authorSort === 'name'
      ? [...list].sort((x, y) => x.name.localeCompare(y.name, 'zh-Hant'))
      : [...list]; // 'count' 時 ranked 本已依篇數排序
    // 各鍵的預設方向：篇數多→少（desc）、姓名 A→Z（asc）。與預設相反才翻面。
    if (authorDir !== (authorSort === 'name' ? 'asc' : 'desc')) list.reverse();
    return list;
  }, [authorStats, aq, authorSort, authorDir]);

  // 排序鍵按鈕：按同一顆翻面，按別顆換鍵並回到該鍵的預設方向。
  const cycleSort = (key, cur, setKey, dir, setDir, base) => {
    if (key === cur) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setKey(key); setDir(base); }
  };

  // 隨機挑一位作者：清篩選、選中，並把目標記進 ref；randTick 每次遞增以觸發捲動 effect
  // （用 tick 而非 authorSel 當依賴——手動點選作者不該跳頁，只有隨機才捲到畫面中央）
  const pickRandomAuthor = () => {
    const pool = authorStats.ranked;
    if (!pool.length) return;
    const name = pool[Math.floor(Math.random() * pool.length)].name;
    setAq('');
    scrollPendingRef.current = name;
    setAuthorSel(name);
    setRandTick((t) => t + 1);
  };
  useEffect(() => {
    const name = scrollPendingRef.current;
    if (!name || !boardRef.current) return;
    scrollPendingRef.current = null;
    const el = boardRef.current.querySelector(`[data-author="${CSS.escape(name)}"]`);
    if (el) el.scrollIntoView({ block: 'center' }); // 瞬間定位——隨機翻頁要快，展開＋高亮已足夠標示落點
  }, [randTick]);

  // 期刊架每列欄數：數 grid 實際軌道數（隨容器寬度變），用來把展開的目次插在
  // 被點封面「所在整列的最後一格」之後——否則目次會擠掉同列右側的封面到下方。
  useEffect(() => {
    if (tab !== 'shelf') return undefined;
    const el = shelfRef.current;
    if (!el) return undefined;
    const measure = () => {
      const cols = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
      setShelfCols(cols || 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const recent = pubs.slice(0, 8);
  const yearSpan = `${pubs[pubs.length - 1].date.slice(0, 4)}–${pubs[0].date.slice(0, 4)}`;

  // 創所策展人湯德宗：把「作序／編務」（策展人的手）與「個人論著」（他自己的曲目）分開，
  // 免得把 20 篇出版序當成 20 篇著作。序類靠標題判別，其餘視為論述。
  const tang = useMemo(() => {
    const all = [];
    for (const p of pubs) for (const ch of p.chapters) {
      // 用正規化後的 authorList 比對（與作者分頁一致），避免同一人兩處計數差一。
      // 譯本同樣不另計（與作者榜同一條規矩）。
      if (ch.translationOf) continue;
      if ((ch.authorList || []).includes('湯德宗')) all.push({ ch, pub: p });
    }
    const works = all.filter((x) => !isAncillary(x.ch.title));
    const prefaces = all.filter((x) => isAncillary(x.ch.title));
    const seriesCount = new Set(prefaces.map((x) => x.pub.title.replace(/[（(].*$/, '').replace(/\d.*$/, '').trim())).size;
    return { all, works, prefaces, prefaceCount: prefaces.length, seriesCount };
  }, [pubs]);

  // 兩岸四地主題：旗艦整本（兩岸四地系列＋香港特刊）＋散見他刊的逐篇命中者。
  const chinaTopic = useMemo(() => {
    const flagship = pubs.filter(isChinaFlagship)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const extra = [];
    for (const p of pubs) {
      if (isChinaFlagship(p)) continue;
      for (const ch of p.chapters) {
        if (CHINA_RE.test(`${ch.title} ${ch.authors || ''} ${ch.section || ''}`)) extra.push({ ch, pub: p });
      }
    }
    extra.sort((a, b) => (b.pub.date || '').localeCompare(a.pub.date || ''));
    const flagshipChapters = flagship.reduce((n, p) => n + p.chapters.length, 0);
    return { flagship, extra, flagshipChapters };
  }, [pubs]);

  // 兩岸四地側欄的跳卷清單：依會議年份分組（書名裡的年份，不是出版年——2014 那屆拖到 2018 才出書）
  const chinaVolumes = useMemo(() => {
    const byYear = new Map();
    for (const p of chinaTopic.flagship) {
      const m = p.title.match(/(20\d{2})/);
      const y = m ? m[1] : (p.date || '').slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(p);
    }
    for (const list of byYear.values()) list.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'));
    return [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [chinaTopic]);

  // 點跳卷鈕：確保該卷是展開的，再捲到它。等一幀讓目次先進 DOM。
  const goToVolume = (p) => {
    setChinaClosed((prev) => { const n = new Set(prev); n.delete(p.id); return n; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelector(`[data-vol="${p.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  };

  // 隨機翻閱的抽籤池：有 PDF 的研究性篇章，排除序、編務、附錄、索引等非論述文字（同作者統計的判準）。
  const randomPool = useMemo(() => {
    const pool = [];
    for (const p of pubs) for (const ch of p.chapters) {
      if (ch.type === 'pdf' && ch.title && !isAncillary(ch.title)) pool.push({ ch, pub: p });
    }
    return pool;
  }, [pubs]);

  // 期刊架側欄的跳期清單：依年份分組（新到舊），組內依出版月新到舊
  const issueYears = useMemo(() => {
    const byYear = new Map();
    for (const p of journals) {
      const y = (p.date || '').slice(0, 4) || '—';
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(p);
    }
    return [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [journals]);

  // 點跳期鈕：展開該期並把它捲到畫面中央。等一幀讓目次先插進 DOM，位置才算得準。
  const goToIssue = (p) => {
    setIssueId((cur) => (cur === p.id ? cur : p.id));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelector(`[data-pub="${p.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
  };

  // 書系分頁：每個系列的卷冊（依出版時間由早到晚，當年表讀），加上不屬任何系列的單本。
  const seriesGroups = useMemo(() => {
    const used = new Set();
    const groups = SERIES.map((s) => {
      const vols = pubs.filter((p) => p.category !== '法學期刊' && s.re.test(p.title));
      vols.forEach((p) => used.add(p.id));
      return { ...s, vols: [...vols].sort((a, b) => (a.date || '').localeCompare(b.date || '')) };
    }).filter((g) => g.vols.length);
    const singles = pubs
      .filter((p) => p.category !== '法學期刊' && !used.has(p.id))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return { groups, singles };
  }, [pubs]);

  // 所史分頁的三批材料。序與編務依時間由早到晚（要當年表讀），會議與紀念同。
  const instituteRows = useMemo(() => {
    const prefaces = [];
    const occasions = [];
    for (const p of pubs) {
      for (const ch of p.chapters) {
        if (isOccasionWork(ch.title)) occasions.push({ ch, pub: p });
        else if (isPrefaceWork(ch.title)) prefaces.push({ ch, pub: p });
      }
    }
    const byDate = (x, y) => (x.pub.date || '').localeCompare(y.pub.date || '');
    prefaces.sort(byDate);
    occasions.sort(byDate);
    return {
      prefaces,
      occasions,
      anniversary: pubs.find((p) => /研之得法/.test(p.title)) || null,
    };
  }, [pubs]);

  // 跳到「作者」分頁、選中並展開該作者的著作清單（供作者欄可點與順藤摸瓜共用）。
  const goToAuthor = (name) => {
    setViewing(null);
    setTab('authors');
    setAq('');
    scrollPendingRef.current = name;
    setAuthorSel(name);
    setRandTick((t) => t + 1);
  };

  // 跳回「完整清單」該本出版品並展開其目次（出處可點）。
  const goToPub = (pub) => {
    setViewing(null);
    setTab('catalog');
    setCat('all');
    setQ(pub.title);
    setCollapsed((prev) => { const n = new Set(prev); n.delete(pub.id); return n; });
  };

  // 年表連結：指向某一卷就跳完整清單並展開它；指向分頁就換分頁。
  // 'institute-anniv' 是所史頁自己的十週年文集那一節，捲過去即可，不換分頁。
  const followTimeline = (link) => {
    if (link.tab === 'institute-anniv') {
      document.getElementById('iias-anniv')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (link.tab) { setTab(link.tab); return; }
    const target = pubs.find((p) => link.pub.test(p.title));
    if (target) goToPub(target);
  };

  // 策展人專輯入口。多處共用（策展人頁擺在簡歷之上，其餘分頁擺在側欄下方）。
  const curatorButton = (
    <button
      type="button"
      className={tab === 'curator' ? `${styles.curatorLink} ${styles.curatorLinkActive}` : styles.curatorLink}
      onClick={() => setTab('curator')}
    >
      <span className={styles.curatorEyebrow}>創所所長 · 前大法官</span>
      <span className={styles.curatorName}>湯德宗　個人專輯</span>
      <span className={styles.curatorMeta}>論著 {tang.works.length} 篇・作序 {tang.prefaceCount} 篇<ChevronRight size={13} /></span>
    </button>
  );

  // 順藤摸瓜跳點：每位作者各一顆（多作者就多顆）＋同一出處其餘篇章。
  const buildThreads = (ch, pub) => {
    const threads = [];
    for (const name of (ch.authorList || [])) {
      const info = authorStats.map.get(name);
      if (info && info.total > 1) {
        threads.push({ label: `${name} 另 ${info.total - 1} 篇`, run: () => goToAuthor(name) });
      }
    }
    if (pub) {
      const others = pub.chapters.filter((c) => c.type === 'pdf' && c !== ch).length;
      if (others > 0) {
        threads.push({
          label: `同一出處另 ${others} 篇`,
          run: () => { setViewing(null); setTab('catalog'); setCat('all'); setQ(pub.title); },
        });
      }
    }
    return threads;
  };

  // 開啟一篇：PDF 走頁內彈窗（帶順藤摸瓜與換一篇），線上閱覽退回新分頁，無檔不動作。
  const openChapter = (ch, pub = null) => {
    if (ch.type === 'read') { window.open(ch.url, '_blank', 'noopener,noreferrer'); return; }
    if (ch.type !== 'pdf') return;
    setViewing({
      src: pdfHref(ch.url),
      title: ch.title,
      subtitle: [ch.authors, pub && pubLabel(pub), ch.pdfPages && `${ch.pdfPages} 頁`].filter(Boolean).join('・'),
      roll: { threads: buildThreads(ch, pub), onReroll: reroll },
    });
  };

  // 換一篇：從抽籤池隨機挑，直接開在彈窗裡（順藤摸瓜的「再抽」）。
  function reroll() {
    if (!randomPool.length) return;
    const r = randomPool[Math.floor(Math.random() * randomPool.length)];
    prefetchPdf(r.ch.url);
    openChapter(r.ch, r.pub);
  }

  // 側欄「抽一篇」卡換一篇（只換卡片內容，不開彈窗）。
  const rollCard = () => {
    if (!randomPool.length) return;
    const r = randomPool[Math.floor(Math.random() * randomPool.length)];
    prefetchPdf(r.ch.url); // 先預抓，使用者按「開 PDF」時多半已在快取
    setPick(r);
  };
  useEffect(() => {
    if (!pick && randomPool.length) setPick(randomPool[Math.floor(Math.random() * randomPool.length)]);
  }, [pick, randomPool]);

  // 側欄控制只出現在它真正驅動的分頁上（見側欄註解）：
  // 搜尋作用於三個瀏覽分頁，不作用於「總覽」（整批館藏的儀表板）；
  // 分類篩選只作用於「完整清單」與「篇章檢索」，「期刊架」已鎖定法學期刊。
  const showSearch = tab !== 'overview' && tab !== 'curator' && tab !== 'authors';
  const showCategory = tab === 'catalog' || tab === 'index';

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar}>
        <BackLink />
        <button
          type="button"
          className={styles.sidebarBrand}
          onClick={() => { setTab('overview'); setIssueId(null); setQ(''); setAuthorSel(null); setAq(''); }}
          title="回總覽"
        >
          <div className={styles.brandMark}><BookMarked size={18} /></div>
          <div>
            <strong>中研院法律學研究所</strong>
            <span>出版品總覽</span>
          </div>
        </button>

        {showSearch && (
          <label className={styles.quickSearch}>
            <Search size={14} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋書名、篇名、作者"
            />
            {q && (
              <button type="button" className={styles.clearSearch} onClick={() => setQ('')} aria-label="清除搜尋">
                <X size={14} />
              </button>
            )}
          </label>
        )}

        {tab === 'authors' && (
          <div className={styles.sideControls}>
            <label className={styles.quickSearch}>
              <Search size={14} />
              <input value={aq} onChange={(e) => setAq(e.target.value)} placeholder="篩選作者姓名" />
              {aq && (
                <button type="button" className={styles.clearSearch} onClick={() => setAq('')} aria-label="清除篩選">
                  <X size={14} />
                </button>
              )}
            </label>
            <div className={styles.sortToggle} role="group" aria-label="排序方式">
              {[['count', '依篇數', 'desc'], ['name', '依姓名', 'asc']].map(([k, label, base]) => (
                <button
                  key={k}
                  type="button"
                  className={authorSort === k ? `${styles.sortBtn} ${styles.sortActive}` : styles.sortBtn}
                  onClick={() => cycleSort(k, authorSort, setAuthorSort, authorDir, setAuthorDir, base)}
                  title={authorSort === k ? '再按一下換方向' : undefined}
                >
                  {label}
                  {authorSort === k && <span className={styles.sortArrow}>{authorDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              ))}
            </div>
            <div className={styles.threshold}>
              <label className={styles.thresholdHead} htmlFor="iias-author-autoopen">
                <span>自動展開</span>
                <span className={styles.thresholdValue}>
                  {autoOpen === 0 ? '全部收合' : autoOpen === ALL_OPEN ? '全部展開' : `${autoOpen} 篇以下`}
                </span>
              </label>
              {/* 這根滑桿兩端就是「一鍵全收」與「一鍵全開」，中間是門檻，所以不另外放兩顆按鈕：
                  全開全收本來就是門檻的兩個極端，拆成三個控制項只會讓人猜它們誰蓋過誰。 */}
              <input
                id="iias-author-autoopen"
                type="range"
                className={styles.thresholdRange}
                min={0}
                max={ALL_OPEN}
                step={1}
                value={autoOpen}
                onChange={(e) => setAutoOpen(Number(e.target.value))}
              />
              <p className={styles.thresholdNote}>
                {autoOpen === 0
                  ? '一律點姓名才展開'
                  : `${boardAuthors.filter((a) => autoOpen === ALL_OPEN || a.total <= autoOpen).length} 位直接攤開著作`}
              </p>
            </div>
            <button type="button" className={styles.randomBtn} onClick={pickRandomAuthor}>
              <Shuffle size={14} /> 隨機一位
            </button>
          </div>
        )}

        {showCategory && (
          <div className={styles.sideSection}>
            <p className={styles.filterHeader}>分類</p>
            <button
              type="button"
              className={cat === 'all' ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
              onClick={() => setCat('all')}
            >
              <span className={styles.catDot} />
              全部
              <span className={styles.count}>{pubs.length}</span>
            </button>
            {CATS.map((c) => {
              const v = catVars(c.name);
              const n = pubs.filter((p) => p.category === c.name).length;
              return (
                <button
                  type="button"
                  key={c.name}
                  className={cat === c.name ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
                  onClick={() => setCat(c.name)}
                >
                  <span className={styles.catDot} style={{ '--dot-tx': v.tx, '--dot-bg': v.bg }} />
                  {c.name}
                  <span className={styles.count}>{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 策展人專頁的簡歷放側欄：正文留給他在這批書裡的實際痕跡（作序與論著）。
            專輯入口擺在簡歷之上；列舉性的欄目（學歷、任職、學說）用清單，不要擠成一句。 */}
        {tab === 'curator' && (
          <>
            {curatorButton}
            <div className={styles.sideSection}>
              <dl className={styles.factList}>
                <div>
                  <dt>學歷</dt>
                  <dd>
                    <ul className={styles.factItems}>
                      <li>臺灣大學法學士，1978</li>
                      <li>臺灣大學法學碩士，1981</li>
                      <li>哈佛大學 LL.M.，1984</li>
                      <li>杜蘭大學 S.J.D.，1989</li>
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>任職</dt>
                  <dd>
                    <ul className={styles.factItems}>
                      <li>法研所籌備處主任，2004 年 7 月起</li>
                      <li>法研所首任所長，2011 年 7 月 1 日成所後接任、同年 9 月 30 日卸任</li>
                      <li>司法院大法官，2011 年 10 月起至 2019 年</li>
                    </ul>
                  </dd>
                </div>
                <div><dt>專長</dt><dd>憲法、行政法、環境保護法與政策（本所網頁所列）</dd></div>
                <div>
                  <dt>學說</dt>
                  <dd>
                    <ul className={styles.factItems}>
                      <li>權力分立的「動態平衡」，《權力分立新論》兩卷即以此立題</li>
                      <li>「階層式比例原則」的違憲審查基準體系，見 2009 年《憲法解釋之理論與實務》第六輯下冊</li>
                      <li>違憲審查制度由「多元多軌」改為「一元單軌」</li>
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>專書</dt>
                  <dd>
                    <ul className={styles.factItems}>
                      <li>《權力分立新論》卷一《憲法結構與動態平衡》</li>
                      <li>《權力分立新論》卷二《違憲審查與動態平衡》</li>
                    </ul>
                  </dd>
                </div>
                <div><dt>在本站</dt><dd>論著 {tang.works.length} 篇、作序 {tang.prefaceCount} 篇</dd></div>
              </dl>
            </div>
          </>
        )}

        {tab === 'series' && (
          <div className={styles.sideSection}>
            <p className={styles.filterHeader}>書系</p>
            {seriesGroups.groups.map((g) => (
              <button
                type="button"
                key={g.name}
                className={seriesSel === g.name ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
                onClick={() => setSeriesSel(g.name)}
              >
                {g.name}
                <span className={styles.count}>{g.vols.length}</span>
              </button>
            ))}
            <button
              type="button"
              className={seriesSel === '單本' ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
              onClick={() => setSeriesSel('單本')}
            >
              未成系列的單本
              <span className={styles.count}>{seriesGroups.singles.length}</span>
            </button>
          </div>
        )}

        {tab === 'china' && (
          <>
            <div className={styles.sideSection}>
              <p className={styles.filterHeader}>卷冊</p>
              {chinaVolumes.map(([year, list]) => (
                <div className={styles.issueYear} key={year}>
                  <span className={styles.issueYearLabel}>{year}</span>
                  <div className={styles.issueChips}>
                    {list.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        className={styles.issueChip}
                        onClick={() => goToVolume(p)}
                        title={`${p.title}（${p.date} 出版）`}
                      >
                        {volumeShort(p.title)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.scopeNote}>
              年份是研討會的年份，出版通常晚一到數年。2014 那屆的論文集 2018 年才出，此後這個系列沒有再辦。
            </p>
          </>
        )}

        {tab === 'institute' && (
          <div className={styles.sideSection}>
            <p className={styles.filterHeader}>年表</p>
            <ol className={styles.timeline}>
              {INSTITUTE_TIMELINE.map((row) => (
                <li key={row.year}>
                  <span className={styles.tlYear}>{row.year}</span>
                  <span className={styles.tlText}>
                    <TimelineText text={row.text} links={row.links} onLink={followTimeline} />
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {tab === 'index' && (
          <div className={styles.sideControls}>
            <p className={styles.filterHeader}>排序</p>
            <div className={`${styles.sortToggle} ${styles.sortToggle3}`} role="group" aria-label="排序方式">
              {Object.entries(INDEX_SORTS).map(([k, s]) => (
                <button
                  key={k}
                  type="button"
                  className={indexSort === k ? `${styles.sortBtn} ${styles.sortActive}` : styles.sortBtn}
                  onClick={() => cycleSort(k, indexSort, setIndexSort, indexDir, setIndexDir, s.base)}
                  title={indexSort === k ? '再按一下換方向' : undefined}
                >
                  {s.label}
                  {indexSort === k && <span className={styles.sortArrow}>{indexDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              ))}
            </div>
            <p className={styles.thresholdNote}>{INDEX_SORTS[indexSort][indexDir]}</p>
          </div>
        )}

        {tab === 'catalog' && (
          <div className={styles.sideControls}>
            <div className={styles.sortToggle} role="group" aria-label="展開收合">
              <button type="button" className={styles.sortBtn} onClick={() => setCollapsed(new Set())}>全部展開</button>
              <button type="button" className={styles.sortBtn} onClick={() => setCollapsed(new Set(pubs.map((p) => p.id)))}>全部收合</button>
            </div>
          </div>
        )}

        {tab === 'overview' && (
          <div className={styles.sideIntro}>
            <p className={styles.sideIntroHead}>這批館藏</p>
            <p>
              中研院法研所自 2005 年起出版期刊、專書、叢書與外文出版品四類。本頁收錄全部 {data.meta.出版品數} 種、{data.meta.篇章數} 篇章的完整目錄，各篇可直接開啟原檔（多為 PDF）。
            </p>
          </div>
        )}


        {tab === 'authors' && (
          <div className={styles.sideSection}>
            <p className={styles.filterHeader}>重點作者</p>
            {NOTABLE_AUTHORS.map((name) => {
              const info = authorStats.map.get(name);
              if (!info) return null;
              return (
                <button
                  type="button"
                  key={name}
                  className={name === authorSel ? `${styles.sideFilter} ${styles.active}` : styles.sideFilter}
                  onClick={() => goToAuthor(name)}
                >
                  {NOTABLE_LABEL[name] || name}
                  {/* 與榜上同一個數字（只計論著）。原本這裡用 total，於是側欄的湯德宗是 36、
                      榜上是 10，同一頁兩個數字對不上。0 篇者比照榜上改標序編務。 */}
                  <span className={info.count === 0 ? `${styles.count} ${styles.aCountAlt}` : styles.count}>
                    {info.count === 0 ? `序編務 ${info.ancillaryCount}` : info.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 創所所長・前大法官——側欄入口只擺在總覽與篇章檢索這兩個側欄本來就空的分頁。
            完整清單、期刊架、系列、作者、兩岸四地、所史各有自己該放的東西（分類篩選、
            重點作者、書系、年表），不必每一頁都掛一個人的入口。策展人頁另在簡歷之上擺一顆。 */}
        {(tab === 'overview' || tab === 'index') && curatorButton}

        {tab === 'overview' && pick && (
          <div className={styles.diceCard}>
            <p className={styles.diceHead}><Shuffle size={12} />隨機翻閱</p>
            <button
              type="button"
              className={styles.diceTitle}
              onClick={() => openChapter(pick.ch, pick.pub)}
              onMouseEnter={() => prefetchPdf(pick.ch.url)}
              onFocus={() => prefetchPdf(pick.ch.url)}
              title="開啟這一篇"
            >
              {pick.ch.title}
            </button>
            <p className={styles.diceMeta}>{[pick.ch.authors, pubLabel(pick.pub)].filter(Boolean).join('・')}</p>
            <div className={styles.diceActions}>
              <button type="button" className={styles.diceLink} onClick={() => openChapter(pick.ch, pick.pub)}>開 PDF</button>
              <span className={styles.diceSep}>·</span>
              <button type="button" className={styles.diceLink} onClick={rollCard}>換一篇</button>
            </div>
          </div>
        )}
        {tab === 'shelf' && (
          <>
            <div className={styles.sideSection}>
              <p className={styles.filterHeader}>快速跳期</p>
              {/* 42 期在架上要捲很久才找得到某一期。這裡依年份列出期號，點了就捲到那格並展開目次。 */}
              {issueYears.map(([year, list]) => (
                <div className={styles.issueYear} key={year}>
                  <span className={styles.issueYearLabel}>{year}</span>
                  <div className={styles.issueChips}>
                    {list.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        className={p.id === issueId ? `${styles.issueChip} ${styles.issueChipActive}` : styles.issueChip}
                        onClick={() => goToIssue(p)}
                        title={`${p.title}（${p.date}）`}
                      >
                        {issueShort(p.title)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.scopeNote}>期刊架僅收《中研院法學期刊》{journals.length} 期，可用上方搜尋在期內找篇章。</p>
          </>
        )}

        <div className={styles.sideFoot}>
          資料截至 {data.meta.資料截至}
          <br />
          來源：<a href={data.meta.來源} target="_blank" rel="noreferrer">中研院法律學研究所</a>
        </div>
      </aside>

      <section className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <SiteHomeEyebrow as="p" className={styles.eyebrow} linkClassName="hover:text-[var(--c-accent)]">
              Institutum Iurisprudentiae, Academia Sinica
            </SiteHomeEyebrow>
            <h1>中研院法律學研究所出版品</h1>
            <p className={styles.subtitle}>法學期刊、專書、叢書與外文出版品的全集清單，篇章直達原文</p>
          </div>
          <span className={styles.headerMeta}>
            {data.meta.出版品數} 種出版品 · {data.meta.篇章數} 篇章 · {yearSpan}
          </span>
        </header>

        <nav className={styles.mainTabBar} ref={tabBarRef}>
          {MAIN_TABS.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              className={tab === id ? `${styles.mainTabButton} ${styles.active}` : styles.mainTabButton}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>最新出版</h2>
                <span className={styles.aside}>近 {recent.length} 種・點封面到清單</span>
              </div>
              <div className={styles.recentRow}>
                {recent.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className={styles.recentCard}
                    onClick={guarded(() => { setTab('catalog'); setCat('all'); setQ(p.title); })}
                  >
                    <img src={coverSrc(p)} alt="" loading="lazy" />
                    <span>
                      <span className={styles.rTitle}>{pubLabel(p)}</span>
                      <span className={styles.rDate}>{p.date}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <div className={styles.overviewGrid}>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>分類構成</h2>
              </div>
              <table className={styles.statTable}>
                <thead>
                  <tr>
                    <th>分類</th>
                    <th className={styles.num}>出版品</th>
                    <th className={styles.num}>篇章</th>
                    <th className={styles.num}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {CATS.map((c) => {
                    const list = pubs.filter((p) => p.category === c.name);
                    const chs = list.flatMap((p) => p.chapters);
                    return (
                      <tr key={c.name}>
                        <td><CatBadge name={c.name} /></td>
                        <td className={styles.num}>{list.length}</td>
                        <td className={styles.num}>{chs.length}</td>
                        <td className={styles.num}>{chs.filter((x) => x.type === 'pdf').length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>出版年表</h2>
                <span className={styles.aside}>各年出版品數，依分類堆疊</span>
              </div>
              <YearChart pubs={pubs} />
            </section>
            </div>

            <section className={`${styles.panel} ${styles.aboutPanel}`}>
              <div className={styles.sectionHead}>
                <h2>本站說明</h2>
              </div>
              <div className={styles.aboutBody}>
                <p>
                  這是中央研究院法律學研究所公開出版品的完整整理與導覽。全部 {data.meta.出版品數} 種出版品、{data.meta.篇章數} 篇章都在此建成可檢索的目錄，每一篇都能在頁內直接開啟 PDF 閱讀，不必再回官網逐頁點選。原本的線上翻頁閱覽器已停用，全部改為可直接閱讀、下載的 PDF。
                </p>
                <p>
                  資料取自中研院法研所官方網站，截至 {data.meta.資料截至}。作者欄整理過：同一個人的不同署名寫法會併成一位（外國學者以英文名為準），方便在「作者」分頁看齊某人的所有著作；各篇的原始署名仍如實保留。
                </p>
                <p>
                  怎麼逛：<b>完整清單</b>依出版品逐本展開目次；<b>期刊架</b>只收《中研院法學期刊》、點封面看該期目次；<b>篇章檢索</b>跨全集搜書名、篇名、作者；<b>作者</b>看發表最密的研究群、點姓名讀其著作；<b>兩岸四地</b>把台灣、大陸、香港、澳門的法制比較聚在一起；<b>所史</b>收這批書裡談這個所自己的篇章（序、致詞、十週年文集）。總覽側欄的<b>隨機翻閱</b>會抽一篇實質論文；開啟後可沿著同作者、同一本書「順藤摸瓜」讀下去。
                </p>
                <p className={styles.aboutWhy}>
                  會做這個，是因為官網不好用：書目分在四個分頁，篇章要逐頁點開，PDF 還藏在翻頁閱覽器後面。本來只想隨手整理，做著做著變成一邊整理一邊讀，時間多半花在讀上面。所以這裡的入口開得多，完整清單、系列、期刊架、篇章檢索、作者、兩岸四地、所史，同一批東西橫看成嶺側成峰。我要的是翻書那種手感：隨便翻開一頁，就能從那裡讀下去。
                </p>
                <p className={styles.colophonRow}>
                  <button
                    type="button"
                    className={styles.colophonMark}
                    aria-expanded={noteOpen}
                    aria-controls="iias-colophon"
                    aria-label={noteOpen ? '收起整理者的話' : '整理者的話'}
                    onClick={() => setNoteOpen((v) => !v)}
                  />
                </p>
                <div id="iias-colophon" className={noteOpen ? styles.colophon : styles.colophonHidden}>
                <p className={styles.aboutReflectHead}>整理者的話</p>
                <p className={styles.colophonCaveat}>
                  以下是我讀完這批出版品後的個人觀感，不是中研院法研所的立場。裡面有幾段對具體論文的方法提出批評，對事不對人，所引的數字都可回原文覆核。
                </p>
                <p>
                  法律學研究所在中央研究院裡是很年輕的一個所。2004 年 7 月設籌備處，湯老師接下籌備處主任，把它從一紙計畫、幾個人，一手籌了七年。2011 年 7 月 1 日終於掛牌成所，他成為<a href="https://www.iias.sinica.edu.tw/DirectorofPreprartory" target="_blank" rel="noreferrer">第一任所長</a>。同一年他獲提名為大法官，臨危受命，於是所長只做到 9 月 30 日，隔天他就從法律所退休、赴任大法官去了。今年是法律所十五年，以研究機構的年紀論，它還在長身體，而這批出版品，差不多就是它從無到有的那些年，一頁一頁累起來的東西。
                </p>
                <p>
                  這批書的長相是規劃出來的。成所前要先寫籌備規劃書，裡面挑定<a href="https://www.iias.sinica.edu.tw/introduction" target="_blank" rel="noreferrer">六個重點研究領域</a>：憲政體制與人權保障、行政管制與行政爭訟、科技發展與法律規範、法律思想與社會變遷、中國大陸與港澳法制發展，以及司法制度、司法行為與立法研究。四類出版品裡那些一輯接一輯的書系，大致就是照這六項來的。六項裡有五項各有一套書：《憲法解釋之理論與實務》、《行政管制與行政爭訟》、《科技發展與法律規範雙年刊》、《兩岸四地法律發展》、《司法制度實證研究》。剩下的「法律思想與社會變遷」只出過 2008 那一本，沒有續下去。
                </p>
                <p>
                  這六項我是在課堂上聽他一項一項講出來的。2026 年 6 月，東吳大學大學部憲法課的最後一堂，期末問答，我問他：法律所現在的定位，跟當初的規劃有沒有差別。他從規劃書講起，說我們不是百貨店，不可能什麼都有，只能挑重點，接著就一項一項數過來。講到兩岸四地，他說同文同種、都是華人社會，可是一百多年的歷史讓四地承受了完全不一樣的法律文化。講到法律實證研究，他反問我們：刑法分則這麼多條，哪幾條最常用、哪幾條幾乎沒用過？要修法你怎麼修？那些領域是二十年前寫在規劃書上的，他隔著二十年一項一項說出來，還說之後文章還要出來。
                </p>
                <p>
                  他講的那六項，在書架上是這個樣子。出得最久的是第一項，《憲法解釋之理論與實務》，本站收到的從 2005 年第四輯到 2025 年第十二輯，前三輯早於法律所。它是研討會的論文集：每一輯先請一位外國憲法學者做主題演說，Mark Tushnet、Michel Troper、Aharon Barak、Stefan Korioth、David Law、長谷部恭男都來過，台灣的學者接著各談各的題目，有比較憲法的方法論，也有針對個別釋字的評析。湯德宗的「階層式比例原則」就是 2009 年第六輯下冊那篇〈違憲審查基準體系建構初探〉提出來的。它做兩件事：把外面的討論接進來，同時讓大法官的解釋在同代學者面前受檢。二十年沒有斷過。
                </p>
                <p>
                  另一個方向是六項裡的最後一項，法實證研究。湯德宗在司改十週年論壇的致詞裡說得明白，「司法制度的比較研究與司法行為的實證研究」是規劃書選定的重點之一，籌備處 2004 年成立起就在開拓，隨即辦起「司法制度實證研究國際研討會」。早期做這件事的是黃國昌，〈律師代理對民事訴訟結果之影響〉、〈刑事第二審制度變革之影響評估〉、〈勞資爭議協調程序之實證研究〉都在這批書裡；後來主要由張永健接手做大，另設了法實證研究資料中心。方向我認為是對的，做出來的東西則要說老實話，多半還很陽春。典型的一篇長這樣。到判決資料庫用案由或條號撈一批地方法院判決，分層隨機抽樣、人工編碼，再跑敘述統計、卡方檢定和邏輯斯迴歸，報告某種分割方式占幾成、某個變數的係數顯不顯著。〈分割共有物判決之實證研究〉以「分割共有物」的裁判案由在法源撈到 2,702 筆，抽四分之一，剔除調解和解終結、裁定駁回等等，得到可用的 500 件。〈越界建築訴訟之實證研究〉以民法第 796 條、796 條之 1、796 條之 2 撈到 1,181 筆，同樣抽四分之一得 253 件，剔除第二審與無關者後剩 192 筆。這 192 筆裡真正討論到 796 條之 1 構成要件的只有 22 筆，跑不動迴歸，作者只好第二波再撈 368 筆、剔除後留 156 筆的母體來補，而這批跟前一批還重疊 18 件。樣本一路縮到這個量級，判斷照樣下：那 22 筆扣掉 4 筆要件不符，剩 18 筆，法院在其中 12 筆認為不得請求移除，論文報的 67% 分母就是這 18。要測民法修法有沒有改變法院行為，靠的是修法前後對照。這個對照要成立，得先假定修法前後的案件組成沒有變。作者把這個假定寫進註腳，還在同一條註腳裡自己寫出了反例：新法容許的彈性可能讓原本不告的共有人決定起訴，爭議組成因此改變，方向恰好會壓低原物分割的比率。自覺停在註腳，沒有進到設計裡，全篇沒有對照組。
                </p>
                <p>
                  更麻煩的是材料本身。判決書只留得住走到判決的案件，和解、撤回、根本沒進法院的那些，一開始就不在資料裡；分割共有物那篇的抽樣程序甚至明文把調解、和解終結的事件剔出去。判決書載的是法官願意寫下來的理由，心證如何形成，紙面上看不到。越界建築那 192 筆，明確談到越界者心理狀態的判決只有 8 筆，其中 5 筆認定故意、1 筆重大過失、2 筆輕過失，可是民法第 796 條的保護，正以越界者「非因故意或重大過失」為前提。這樣的材料能穩當回答的問題，比作者想問的窄得多。經濟分析那一半跟數判決那一半也常常分開走，〈越界建築之經濟分析〉2013 年、〈越界建築訴訟之實證研究〉2014 年，一篇推理論、一篇報數字。後者全文只引前者兩次，一次在註 1 說自己「奠基於此理論論述之上」，一次在參考書目，沒有任何一段把經濟模型的預測寫成可檢驗的假設再拿數據去驗。這些工作把現象清點出來了，離檢驗假設還有一段距離。
                </p>
                <p>
                  這個方向留得住的東西在別處：資料中心那樣的基建，還有它拉來的國際合作。另外有一件事我想記下來。2020 年第 27 期，賀劍評張永健《物權法之經濟分析》的書評六十二頁，張永健的答辯五十二頁，兩篇前後排在一起刊出。被評的是自家研究員多年的代表作，評的人說它方法論走錯了路，期刊照登。
                </p>
                <p>
                  第五項是中國大陸與港澳法制發展。這一塊我讀得最久。陳弘毅記得清楚：湯德宗費了很大力氣，創建一年一度的兩岸四地法學研討會，輪流在台灣、大陸、香港、澳門開；法研所另設大陸與港澳訪問學人計畫，每年給名額，對多位大陸學者來說，在中研院訪問的那幾個月是他們學術生涯的轉捩點。本站收到輪在台灣主辦的三本論文集，2006、2010、2014。
                </p>
                <p>
                  翻 2006 那本會唏噓。上冊整卷在比四地的違憲審查制度：北京大學的張千帆寫〈從憲法到憲政——中國大陸憲法審查制度的歷史、現狀與未來〉，社科院的莫紀宏寫大陸違憲審查的發展趨勢，而替他們寫評論文的是湯德宗，題目叫〈試論大陸確立違憲審查制度的途徑〉。一位台灣學者在那個場合認真替大陸盤算憲法審查該怎麼建起來，大陸的學者就坐在同一張桌子上聽。每篇論文都配一到三篇來自其他三地的評論，這個格式本身就是那幾年的空氣：大家默認彼此在同一條路上，只是走到不同的地方。
                </p>
                <p>
                  2010 那屆談法學教育與法律人怎麼養成，2014 那屆談華文法學與研究方法，出書已經拖到 2018 年。這批出版品裡，這個系列停在那一屆。再出現香港的專號，已經是 2022 年的《香港法治之變局》，篇名一路是恐懼之術、自由憲政秩序的崩壞、一國兩制的難產與早夭、總體國家安全觀對法治人權的侵蝕；2006 年並排坐著的那些大陸高校學者，這本裡一個也沒有。李建良在出刊辭裡寫，香港的學術自由同樣受到國安法影響，因此「國際社會間可以研討香港議題的平臺日益顯得重要」，希望批判性的觀點「可以持續找到思辨空間」。從替大陸設想違憲審查該怎麼建，到替香港留一塊還能把話說完的地方，中間隔了十六年。
                </p>
                <p>
                  向大陸與港澳那一邊收窄了，望向更大的世界那一邊還在。外文出版品那一類是同一個方向的產物，Empirical Legal Analysis、Law and Economics of Possession、Selection and Decision in Judicial Process around the World，把各國學者請進同一本書裡寫。孔傑榮、戴傑、安守廉這些讀中國法的人，從十週年文集一路寫到香港特刊；2022 那本特刊打頭的就是孔傑榮，二十頁，講香港的刑事司法怎麼變成製造恐懼的工具。他是第一個在中國執業的美國律師，教過馬英九和呂秀蓮，呂秀蓮坐政治牢的那些年他參與過營救。2025 年 9 月他在紐約過世，九十五歲。
                </p>
                <p>
                  到今天（{data.meta.資料截至.slice(0, 4)} 年），它有的是這樣一批東西：四類出版品、將近八百篇文章、一群還在發表的研究者，和一份跟這座島的公法、行政、憲政纏在一起的紀錄。它以後會長成什麼樣，誰也說不準；法治從來不是一個研究所守得住的。可是這幾百篇翻下來，我一直有同一個印象：這是個埋頭做慢事的地方。
                </p>
                </div>
                <p className={styles.aboutNote}>
                  本站為研究與檢索用途的非官方整理。著作權歸原作者與中研院法研所所有，以官方網站
                  {' '}<a href={data.meta.來源} target="_blank" rel="noreferrer">{data.meta.來源}</a>{' '}
                  為準。
                </p>
              </div>
            </section>
          </>
        )}

        {tab === 'curator' && (
          <section className={`${styles.panel} ${styles.tangCard}`}>
            <p className={styles.tangEyebrow}>創所所長 · 前大法官 · Curator</p>
            <h2 className={styles.tangName}>湯德宗</h2>
            <p className={styles.tangLatin}>Dennis Te-Chung Tang</p>
            <p className={styles.prose}>
              這批自 2005 年以來的出版品，多在他籌備與掌所的那些年成形。本頁下方的作序 {tang.prefaceCount} 篇，是那段編務留下的痕跡；個人論著 {tang.works.length} 篇，看得出他自己在寫什麼。左欄是簡歷與學說要點。
            </p>

            <div className={styles.trackHead}>個人論著 {tang.works.length} 篇</div>
            <ol className={styles.trackList}>
              {[...tang.works]
                .sort((a, b) => (b.pub.date || '').localeCompare(a.pub.date || ''))
                .map(({ ch, pub }, i) => {
                  const href = chapterHref(ch);
                  return (
                    <li key={`w${i}`} className={styles.track}>
                      {ch.type === 'pdf' ? (
                        <a
                          className={styles.trackTitle}
                          href={pdfHref(ch.url)}
                          onClick={openOnClick(() => openChapter(ch, pub))}
                          onMouseEnter={() => prefetchPdf(ch.url)}
                        >
                          {ch.title}
                          <ExternalLink size={11} className={styles.trackIcon} />
                        </a>
                      ) : href ? (
                        <a className={styles.trackTitle} href={href} target="_blank" rel="noreferrer">
                          {ch.title}
                          <ExternalLink size={11} className={styles.trackIcon} />
                        </a>
                      ) : (
                        <span className={styles.trackTitle}>{ch.title}</span>
                      )}
                      <span className={styles.trackSrc}>{pubLabel(pub)}・{pub.date}</span>
                    </li>
                  );
                })}
            </ol>

            <div className={styles.trackHead}>編務・作序 {tang.prefaces.length} 篇</div>
            <ol className={styles.trackList}>
              {[...tang.prefaces]
                .sort((a, b) => (b.pub.date || '').localeCompare(a.pub.date || ''))
                .map(({ ch, pub }, i) => {
                  const href = chapterHref(ch);
                  return (
                    <li key={`p${i}`} className={styles.track}>
                      {ch.type === 'pdf' ? (
                        <a
                          className={styles.trackTitle}
                          href={pdfHref(ch.url)}
                          onClick={openOnClick(() => openChapter(ch, pub))}
                          onMouseEnter={() => prefetchPdf(ch.url)}
                        >
                          {ch.title}
                          <ExternalLink size={11} className={styles.trackIcon} />
                        </a>
                      ) : href ? (
                        <a className={styles.trackTitle} href={href} target="_blank" rel="noreferrer">
                          {ch.title}
                          <ExternalLink size={11} className={styles.trackIcon} />
                        </a>
                      ) : (
                        <span className={styles.trackTitle}>{ch.title}</span>
                      )}
                      <span className={styles.trackSrc}>{pubLabel(pub)}・{pub.date}</span>
                    </li>
                  );
                })}
            </ol>
          </section>
        )}

        {tab === 'catalog' && (
          <>
            <div className={styles.sectionHead}>
              <h2>完整清單</h2>
              <span className={styles.aside}>{filteredPubs.length} 種</span>
            </div>
            {filteredPubs.length === 0 && <p className={styles.emptyNote}>沒有符合條件的出版品。</p>}
            {filteredPubs.map((p) => (
              <PubCard key={p.id} pub={p} open={!collapsed.has(p.id)} onToggle={() => toggle(p.id)} onOpen={openChapter} onAuthor={goToAuthor} />
            ))}
          </>
        )}

        {tab === 'shelf' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>期刊架</h2>
              <span className={styles.aside}>《中研院法學期刊》{journals.length} 期・點封面看目次</span>
            </div>
            <div className={styles.shelfGrid} ref={shelfRef}>
              {(() => {
                const sel = journals.find((p) => p.id === issueId) || null;
                const selIdx = sel ? journals.findIndex((p) => p.id === issueId) : -1;
                // 目次插在被點封面「所在整列的最後一格」之後，整列封面才不被擠散
                const detailAfter = selIdx < 0
                  ? -1
                  : Math.min(Math.floor(selIdx / shelfCols) * shelfCols + shelfCols - 1, journals.length - 1);
                return journals.map((p, i) => (
                  <React.Fragment key={p.id}>
                    <button
                      type="button"
                      data-pub={p.id}
                      className={p.id === issueId ? `${styles.shelfItem} ${styles.selected}` : styles.shelfItem}
                      onClick={guarded(() => setIssueId(p.id === issueId ? null : p.id))}
                    >
                      <img src={coverSrc(p)} alt={p.title} loading="lazy" />
                      <span className={styles.sTitle}>{p.title}</span>
                      <span className={styles.sDate}>{p.date}</span>
                    </button>
                    {i === detailAfter && sel && (
                      <div className={`${styles.issueDetail} ${styles.shelfDetail}`}>
                        <div className={styles.sectionHead}>
                          <h2>{pubLabel(sel)}</h2>
                          <span className={styles.aside}>
                            {sel.date}・
                            <a href={sel.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--c-info)' }}>官網頁面</a>
                          </span>
                        </div>
                        {sel.summary && <p className={styles.pubSummary} style={{ marginBottom: 10 }}>{sel.summary}</p>}
                        <ChapterTable chapters={sel.chapters} pub={sel} onOpen={openChapter} onAuthor={goToAuthor} />
                        <button
                          type="button"
                          className={styles.collapseDetail}
                          onClick={guarded(() => setIssueId(null))}
                        >
                          <ChevronUp size={14} /> 收起
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                ));
              })()}
            </div>
          </section>
        )}

        {tab === 'authors' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>作者</h2>
              <span className={styles.aside}>{authorStats.total} 位作者・點姓名看其著作</span>
            </div>
            <p className={styles.authorIntro}>
              全集共 {authorStats.total} 位作者。發表最密的是本所核心研究群與長年合作的學者；
              另有 {authorStats.solo} 位僅出現一次，多為譯介外國文獻論文集裡的一次性作者。
              榜上數字只計研究性著作，出版序、發刊辭、附錄、索引等非論述篇章不計入，於作者頁另列；
              少數人在這批館藏裡只留下序與編務，數字欄就直接標「序編務」幾篇。
              十週年文集裡的外稿有原文與中譯兩個版本，官網各列一筆；這裡當一篇算，譯本仍照常列出、標「中譯」。
              左欄可切換排序、鍵入姓名篩選、隨機翻一位，或拉「自動展開」的門檻，讓篇數少的作者不必點就攤開著作；那根滑桿推到最左是全部收合，推到最右是全部展開。
            </p>
            {boardAuthors.length === 0 ? (
              <p className={styles.emptyNote}>沒有符合的作者。</p>
            ) : (
              <ol className={styles.authorBoard} ref={boardRef}>
                {boardAuthors.map((a) => {
                  const selected = a.name === authorSel;
                  // 門檻以下者不必點就攤開；攤開的樣子從簡（沒有標題列、沒有收起鈕），
                  // 免得三百多位長尾作者各頂一塊完整詳目。點姓名仍會切成完整那一種。
                  const auto = !selected && autoOpen > 0 && (autoOpen === ALL_OPEN || a.total <= autoOpen);
                  return (
                  <li key={a.name} data-author={a.name}>
                    <button
                      type="button"
                      // 展開時整列黏在分頁列下方：著作一多，捲到中段就不知道在誰底下了
                      className={[
                        styles.authorRow,
                        selected ? styles.selected : '',
                        (selected || auto) ? styles.authorRowSticky : '',
                      ].filter(Boolean).join(' ')}
                      onClick={guarded(() => setAuthorSel(selected ? null : a.name))}
                    >
                      <span className={styles.aRank}>{authorStats.ranked.indexOf(a) + 1}</span>
                      <span className={styles.aName}>{a.name}</span>
                      <span className={a.count === 0 ? `${styles.aCount} ${styles.aCountAlt}` : styles.aCount}>
                        {a.count === 0 ? `序編務 ${a.ancillaryCount}` : a.count}
                      </span>
                      <span className={styles.barTrack}>
                        <span className={styles.barFill} style={{ width: `${(a.count / authorStats.max) * 100}%` }} />
                      </span>
                    </button>
                    {(selected || auto) && (
                      <div className={`${styles.issueDetail} ${styles.authorDetail}${auto ? ` ${styles.authorDetailAuto}` : ''}`}>
                        {!auto && (
                          <div className={styles.sectionHead}>
                            <h2>{a.name}</h2>
                            <span className={styles.aside}>
                              {a.count} 篇論著{a.ancillaryCount ? `・${a.ancillaryCount} 篇序、編務與附錄` : ''}
                            </span>
                          </div>
                        )}
                        {a.works.length > 0
                          ? <WorksTable rows={a.works} onOpen={openChapter} onSource={goToPub} />
                          : (!auto && <p className={styles.emptyNote}>這批館藏中沒有其研究性著作，僅有下列序、編務與附錄。</p>)}
                        {a.ancillary.length > 0 && (
                          <>
                            <div className={styles.editorialHead}>序・編務・附錄 {a.ancillary.length} 篇</div>
                            <WorksTable rows={a.ancillary} onOpen={openChapter} onSource={goToPub} />
                          </>
                        )}
                        {!auto && (
                          <button
                            type="button"
                            className={styles.collapseDetail}
                            onClick={guarded(() => setAuthorSel(null))}
                          >
                            <ChevronUp size={14} /> 收起
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}

        {tab === 'index' && (
          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2>篇章檢索</h2>
              <span className={styles.aside}>{indexRows.length} 篇・{INDEX_SORTS[indexSort][indexDir]}</span>
            </div>
            {indexRows.length === 0 ? (
              <p className={styles.emptyNote}>沒有符合條件的篇章。</p>
            ) : (
              <table className={styles.indexTable}>
                <thead>
                  <tr>
                    <th>篇名</th>
                    <th>作者</th>
                    <th>出處</th>
                    <th className={styles.chPages}>頁碼</th>
                    <th>取得</th>
                  </tr>
                </thead>
                <tbody>
                  {indexRows.map(({ ch, pub }, i) => (
                    <tr key={i}>
                      <td className={styles.chTitle}>
                        <ChapterTitle ch={ch} pub={pub} onOpen={openChapter} />
                      </td>
                      <td className={styles.chAuthors}><AuthorCell ch={ch} onAuthor={goToAuthor} /></td>
                      <td className={styles.src}><SourceLink pub={pub} onSource={goToPub} /></td>
                      <td className={styles.chPages}>{ch.pages || ''}</td>
                      <td><GetLink ch={ch} onOpen={() => openChapter(ch, pub)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'china' && (
          <>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>兩岸四地</h2>
                <span className={styles.aside}>{chinaTopic.flagship.length} 本專題卷冊・另 {chinaTopic.extra.length} 篇散見他刊</span>
              </div>
              <p className={styles.authorIntro}>
                設所規劃書的第五項是「中國大陸與港澳法制發展」，在書架上就是「兩岸四地法律發展」系列：2006 年起輪流在台灣、大陸、香港、澳門舉辦的研討會論文集，四地法制並置比較，2022 年另有香港法治變局特刊。這裡把這批卷冊集中起來，並收攏散見於各期期刊、十週年文集裡談大陸與港澳法制的篇章。這是依主題整理的選讀，不是完整書目。點卷冊展開目次。
              </p>
              {chinaTopic.flagship.map((p) => (
                <div key={p.id} data-vol={p.id}>
                <PubCard
                  pub={p}
                  open={!chinaClosed.has(p.id)}
                  onToggle={() => setChinaClosed((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                    return next;
                  })}
                  onOpen={openChapter}
                  onAuthor={goToAuthor}
                />
                </div>
              ))}
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>散見各刊的相關篇章</h2>
                <span className={styles.aside}>{chinaTopic.extra.length} 篇</span>
              </div>
              {chinaTopic.extra.length === 0 ? (
                <p className={styles.emptyNote}>沒有其他相關篇章。</p>
              ) : (
                <IndexTable rows={chinaTopic.extra} onOpen={openChapter} onAuthor={goToAuthor} onSource={goToPub} />
              )}
            </section>
          </>
        )}

        {tab === 'series' && (() => {
          const g = seriesGroups.groups.find((x) => x.name === seriesSel);
          const vols = g ? g.vols : seriesGroups.singles;
          const chs = vols.reduce((s, p) => s + p.chapters.length, 0);
          const years = vols.map((p) => (p.date || '').slice(0, 4)).filter(Boolean).sort();
          const span = years.length ? `${years[0]}–${years[years.length - 1]}` : '';
          return (
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>{g ? g.name : '未成系列的單本'}</h2>
                <span className={styles.aside}>{vols.length} 冊・{chs} 篇章{span ? `・${span}` : ''}</span>
              </div>
              <p className={styles.authorIntro}>
                {g ? g.note : '不屬於任何反覆出版之書系的單本：會議實錄、紀念文集，以及三本外文出版品。期刊另見「期刊架」。'}
              </p>
              {vols.map((p) => (
                <PubCard
                  key={p.id}
                  pub={p}
                  open={!seriesClosed.has(p.id)}
                  onToggle={() => setSeriesClosed((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                    return next;
                  })}
                  onOpen={openChapter}
                  onAuthor={goToAuthor}
                />
              ))}
            </section>
          );
        })()}

        {tab === 'institute' && (
          <>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>所史</h2>
                <span className={styles.aside}>這批書裡談這個所自己的篇章</span>
              </div>
              <p className={styles.authorIntro}>
                法律學研究所 2004 年設籌備處、2011 年正式成所。它的歷史散在自己出的書裡：每一本前面的序、每一場會議的致詞、十週年時請人寫的那本文集。這一頁把這些篇章從各卷冊裡抽出來按時間排好。研究論文不在此列，那些請走「篇章檢索」。
              </p>
            </section>

            {instituteRows.anniversary && (
              <section className={styles.panel} id="iias-anniv">
                <div className={styles.sectionHead}>
                  <h2>十週年文集</h2>
                  <span className={styles.aside}>{instituteRows.anniversary.chapters.length} 篇</span>
                </div>
                <p className={styles.authorIntro}>
                  成所十年時編的《研之得法》，是這個所最集中的一份自述。前半是所內外的人回頭看這十年，王汎森、翁岳生、王澤鑑、許宗力、陳弘毅、Jerome A. Cohen、William P. Alford、Cass R. Sunstein 等人各寫一篇；後半是所內研究者交代自己這些年在做什麼。外稿多是原文與中譯各一篇，本站當一篇計，譯本標「中譯」並列出譯者。
                </p>
                <p className={styles.authorIntro}>
                  這本裡有一篇容易被目次埋掉的：南非憲法法院前大法官奧比・薩克思（Albie Sachs）的〈帶我去月球〉。他從 1950 年代的記憶寫起。那時的台灣在南非反種族隔離運動者眼裡屬於敵營，他記得一次南非海軍校閱，肯來的只有皮諾契的艦隊和台灣的船。多年後他第一次受邀來台，講題卻是同性婚姻，地點在蔡瑞月舞蹈社，聽眾席地而坐。後來他在聖地牙哥啃著兩顆免費蘋果準備演講，收到通知信說他得了首屆唐獎法治獎、獎金一百萬美元，他當成詐騙、讀了好幾遍才相信，最後捐掉一半。標題那個月球是真的：中央大學把一顆小行星命名為 Albie Sachs。
                </p>
                <PubCard
                  pub={instituteRows.anniversary}
                  open={!chinaClosed.has(`anniv-${instituteRows.anniversary.id}`)}
                  onToggle={() => setChinaClosed((prev) => {
                    const next = new Set(prev);
                    const k = `anniv-${instituteRows.anniversary.id}`;
                    if (next.has(k)) next.delete(k); else next.add(k);
                    return next;
                  })}
                  onOpen={openChapter}
                  onAuthor={goToAuthor}
                />
              </section>
            )}

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>序與編務</h2>
                <span className={styles.aside}>{instituteRows.prefaces.length} 篇・由早到晚</span>
              </div>
              <p className={styles.authorIntro}>
                每一本書、每一期期刊前面那篇署名的序。署名的人身分不一：所長序與出刊辭出自當時的所長，主編序、編者序、出版序則是那一卷的主編或負責編務的研究員。按出版時間排在這裡，可以看這批書是怎麼一本一本交出去的。
              </p>
              <IndexTable rows={instituteRows.prefaces} onOpen={openChapter} onAuthor={goToAuthor} onSource={goToPub} />
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>會議與紀念</h2>
                <span className={styles.aside}>{instituteRows.occasions.length} 篇</span>
              </div>
              <p className={styles.authorIntro}>
                開閉幕致詞、引言、議程，以及週年感言與悼念文。這些是所裡辦過什麼、送別過誰的直接痕跡。
              </p>
              {instituteRows.occasions.length === 0 ? (
                <p className={styles.emptyNote}>沒有這類篇章。</p>
              ) : (
                <IndexTable rows={instituteRows.occasions} onOpen={openChapter} onAuthor={goToAuthor} onSource={goToPub} />
              )}
            </section>
          </>
        )}
      </section>
      {viewing && (
        <PdfViewer
          src={viewing.src}
          title={viewing.title}
          subtitle={viewing.subtitle}
          roll={viewing.roll}
          onClose={() => setViewing(null)}
        />
      )}
    </main>
  );
}
