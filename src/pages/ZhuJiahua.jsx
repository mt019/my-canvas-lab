import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Check,
  LibraryBig,
  Quote,
  ScrollText,
} from 'lucide-react';
import AppearanceMenu from '../components/AppearanceMenu';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParams } from '../components/lab/Tabs';
import data from '../data/zhuJiahua.json';

const TAB_ITEMS = [
  { id: 'overview', label: '研究起點' },
  { id: 'legal', label: '法律教育' },
  { id: 'text', label: '校訂原文' },
  { id: 'materials', label: '材料狀態' },
];

const TAB_PATHS = {
  overview: '/zhujiahua',
  legal: '/zhujiahua/legal-education',
  text: '/zhujiahua/original-text',
  materials: '/zhujiahua?tab=materials',
};

// 六篇校訂全文各有一個可預先產生、可被搜尋引擎收錄的網址。
// 順序即原書篇次，前後篇導覽與分頁列的「校訂原文」都吃這份清單。
const TEXTS = [
  { id: 'ZJH-LE-001', slug: 'original-text' },
  { id: 'ZJH-LE-002', slug: 'text-a-view-of-legal-education' },
  { id: 'ZJH-LE-003', slug: 'text-committee-5th' },
  { id: 'ZJH-LE-004', slug: 'text-committee-6th' },
  { id: 'ZJH-LE-005', slug: 'text-committee-7th' },
  { id: 'ZJH-LE-006', slug: 'text-rule-of-law-administration' },
];
const TEXT_PATH = Object.fromEntries(TEXTS.map(({ id, slug }) => [id, `/zhujiahua/${slug}`]));

function Overview() {
  return (
    <div>
      <section>
        <p className="text-token-xs font-bold tracking-[.12em] text-accent">研究起點</p>
        <h2 className="mt-2 font-serif text-token-xl font-bold leading-snug">從法律教育，讀一套民主與法治的制度構想</h2>
        <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">{data.project.focus}</p>
        <Link
          to="/zhujiahua/legal-education"
          className="mt-6 inline-flex items-center gap-2 border-b border-accent pb-1 text-token-sm font-bold text-accent transition-transform duration-fast hover:translate-x-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          進入法律教育專題 <ArrowRight size={16} />
        </Link>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-serif text-token-lg font-bold">目前掌握的材料</h2>
        <dl className="mt-5 divide-y divide-line-soft border-y border-line">
          <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-token-sm text-ink-faint">篇幅</dt>
            <dd className="text-token-body tabular-nums">全書 {data.materialCoverage.physicalPages} 頁</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-token-sm text-ink-faint">目錄</dt>
            <dd className="text-token-body">十四頁目錄已完整定位；法律教育六篇已核定</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-token-sm text-ink-faint">正文起點</dt>
            <dd className="text-token-body">法律教育篇群涵蓋原書第 303 至 330 頁</dd>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-4 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="text-token-sm text-ink-faint">公開範圍</dt>
            <dd className="text-token-body">公開已核篇目；完成校訂的篇章提供全文閱讀</dd>
          </div>
        </dl>
      </section>

      <section className="mt-12 border-l-2 border-accent pl-5">
        <div className="flex items-start gap-3">
          <LibraryBig className="mt-1 shrink-0 text-accent" size={20} />
          <div>
            <h2 className="font-serif text-token-lg font-bold">先從一篇完整原文開始</h2>
            <p className="mt-2 max-w-3xl text-token-body leading-[1.85] text-ink-muted">
              〈中國之法律教育問題〉已逐頁校訂完成。其餘五篇先呈現篇名、年代與場合，全文會依校讀進度陸續加入。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function LegalEducation() {
  const section = data.legalEducation;

  return (
    <div>
      <section className="border-b border-line pb-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-token-sm text-ink-faint">
          <span className="inline-flex items-center gap-2"><CalendarDays size={16} />{section.period}</span>
          <span>六篇言論</span>
          <span>原書第 303–330 頁</span>
        </div>
        <h2 className="mt-4 max-w-3xl font-serif text-token-2xl font-bold leading-tight">法律教育如何成為民主政治的基礎</h2>
        <p className="mt-5 max-w-3xl text-token-body leading-[1.95] text-ink-muted">{section.introduction}</p>
      </section>

      <section className="mt-10 grid gap-px overflow-hidden rounded-token-lg border border-line bg-line md:grid-cols-3">
        {section.readingGuide.map((item, index) => (
          <article key={item.title} className="bg-paper p-6">
            <span className="font-accent text-token-sm tabular-nums text-accent">0{index + 1}</span>
            <h3 className="mt-5 font-serif text-token-lg font-bold">{item.title}</h3>
            <p className="mt-3 text-token-sm leading-[1.85] text-ink-muted">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 border-y border-line py-8">
        <p className="text-token-xs font-bold tracking-[.12em] text-accent">先讀答案</p>
        <h2 className="mt-2 font-serif text-token-xl font-bold">朱家驊如何理解法律教育？</h2>
        <dl className="mt-7 grid gap-7 md:grid-cols-2">
          <div>
            <dt className="font-serif text-token-body font-bold">法律教育為何與民主政治有關？</dt>
            <dd className="mt-2 text-token-sm leading-[1.85] text-ink-muted">
              因為民主制度不只需要法律條文，也需要人民具有法的觀念、守法的道德與行法的能力；法律教育負責培養能把這些條件帶入社會的法學人才。
            </dd>
          </div>
          <div>
            <dt className="font-serif text-token-body font-bold">他認為當時最大的問題是什麼？</dt>
            <dd className="mt-2 text-token-sm leading-[1.85] text-ink-muted">
              問題不只在人數不足，還包括專業水準、師資、課程與地域失衡。朱家驊因此用「質、量、分佈」三面安排改革次序。
            </dd>
          </div>
          <div>
            <dt className="font-serif text-token-body font-bold">法學人才應具備哪些能力？</dt>
            <dd className="mt-2 text-token-sm leading-[1.85] text-ink-muted">
              除基本法學知識外，還要依司法、行政或外交等職務掌握特種法學，並理解相關學科、社會習慣與實際人情。
            </dd>
          </div>
          <div>
            <dt className="font-serif text-token-body font-bold">六篇言論涵蓋哪段時間？</dt>
            <dd className="mt-2 text-token-sm leading-[1.85] text-ink-muted">
              從 1945 年法律教育委員會第一次會議，到 1950 年在臺灣所講的〈法治行政〉，跨越戰後復員與政府遷臺前後。
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-token-xs font-bold tracking-[.12em] text-accent">篇章次序</p>
            <h2 className="mt-2 font-serif text-token-xl font-bold">從重慶到臺灣</h2>
          </div>
          <span className="hidden text-token-sm text-ink-faint sm:block">1945—1950</span>
        </div>
        <ol>
          {section.items.map((item, index) => (
            <li key={item.id} className="group grid gap-4 border-b border-line-soft py-6 sm:grid-cols-[4rem_9rem_1fr_auto] sm:items-start">
              <span className="font-accent text-token-lg tabular-nums text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
              <div className="text-token-sm leading-relaxed text-ink-muted">
                <p className="tabular-nums">{item.dateIso.slice(0, 4)}</p>
                <p>第 {item.bookPages} 頁</p>
              </div>
              <div>
                <h3 className="font-serif text-token-lg font-bold leading-snug">
                  <Link
                    to={TEXT_PATH[item.id]}
                    className="border-b border-transparent transition-colors duration-fast hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-2 text-token-sm leading-relaxed text-ink-muted">{item.occasion}</p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-token-xs ${item.status === '全文已校訂' ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-faint'}`}>
                {item.status}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 flex flex-col gap-5 rounded-token-lg bg-accent-soft p-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <ScrollText className="mt-1 shrink-0 text-accent" size={24} />
          <div>
            <h2 className="font-serif text-token-lg font-bold">六篇全文皆已逐頁校訂</h2>
            <p className="mt-2 text-token-sm leading-relaxed text-ink-muted">點篇名讀任一篇，或從 1945 年的〈中國之法律教育問題〉依序讀起。</p>
          </div>
        </div>
        <Link
          to="/zhujiahua/original-text"
          className="inline-flex shrink-0 items-center gap-2 self-start border-b border-accent pb-1 text-token-sm font-bold text-accent transition-transform duration-fast hover:translate-x-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:self-auto"
        >
          閱讀校訂全文 <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

function OriginalText({ textId = 'ZJH-LE-001' }) {
  const index = TEXTS.findIndex((item) => item.id === textId);
  const text = data.verifiedTexts.find((item) => item.id === textId);
  const previous = index > 0 ? data.legalEducation.items[index - 1] : null;
  const next = index >= 0 && index < TEXTS.length - 1 ? data.legalEducation.items[index + 1] : null;

  return (
    <article className="mx-auto max-w-3xl">
      <header className="border-b border-line pb-8 text-center">
        <p className="text-token-xs font-bold tracking-[.14em] text-accent">校訂原文</p>
        <h2 className="mt-4 font-serif text-token-2xl font-bold leading-tight">{text.title}</h2>
        <p className="mt-4 text-token-sm text-ink-muted">{text.dateLine}</p>
        <p className="mt-1 text-token-sm text-ink-muted">{text.occasion}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-token-xs text-ink-faint">
          <Check size={14} className="text-accent" /> 原書第 {text.bookPages} 頁，逐頁校訂
        </div>
      </header>

      <div className="mt-9 text-justify text-scaled-base leading-[2.05] text-ink">
        {text.paragraphs.map((paragraph, index) => (
          <p key={index} className="mt-6 first:mt-0">{paragraph}</p>
        ))}
      </div>

      <footer className="mt-12 border-t border-line pt-6">
        <div className="flex items-start gap-3 text-token-sm leading-relaxed text-ink-muted">
          <Quote size={18} className="mt-1 shrink-0 text-accent" />
          <p>本文依《朱家驊先生言論集》原頁校訂；保留原文用字與當時語彙。</p>
        </div>
        <nav className="mt-8 grid gap-4 border-t border-line-soft pt-6 sm:grid-cols-2">
          {previous ? (
            <Link
              to={TEXT_PATH[previous.id]}
              className="group text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="text-token-xs text-ink-faint">前一篇 · {previous.dateIso.slice(0, 4)}</span>
              <span className="mt-1 block font-serif text-token-body font-bold group-hover:text-accent">{previous.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link
              to={TEXT_PATH[next.id]}
              className="group text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-right"
            >
              <span className="text-token-xs text-ink-faint">後一篇 · {next.dateIso.slice(0, 4)}</span>
              <span className="mt-1 block font-serif text-token-body font-bold group-hover:text-accent">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      </footer>
    </article>
  );
}

function Questions() {
  return (
    <section>
      <p className="text-token-xs font-bold tracking-[.12em] text-accent">閱讀線索</p>
      <h2 className="mt-2 font-serif text-token-xl font-bold">三條彼此牽動的問題</h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {data.researchQuestions.map((item, index) => (
          <article key={item.title} className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr]">
            <span className="font-accent text-token-xl tabular-nums text-accent">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="font-serif text-token-lg font-bold">{item.title}</h3>
              <p className="mt-3 max-w-3xl text-token-body leading-[1.9] text-ink-muted">{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 flex items-start gap-3 border-l-2 border-line pl-5">
        <BookOpenText className="mt-1 shrink-0 text-accent" size={20} />
        <div>
          <h2 className="font-serif text-token-lg font-bold">選集也是一種歷史安排</h2>
          <p className="mt-2 max-w-3xl text-token-body leading-[1.85] text-ink-muted">
            篇章的收入、刪落與次序都出自後來編纂。研究時會把原始言論的年代與場合，和選集呈現的人物形象分開考察。
          </p>
        </div>
      </div>
    </section>
  );
}

function Materials() {
  return (
    <div>
      <section>
        <p className="text-token-xs font-bold tracking-[.12em] text-accent">材料狀態</p>
        <h2 className="mt-2 font-serif text-token-xl font-bold">全書已分出四個區段</h2>
        <div className="mt-7 divide-y divide-line border-y border-line">
          {data.materialSegments.map((item) => (
            <article key={item.label} className="grid gap-3 py-5 sm:grid-cols-[8rem_8rem_1fr] sm:gap-5">
              <h3 className="font-serif text-token-body font-bold">{item.label}</h3>
              <p className="text-token-sm tabular-nums text-accent">第 {item.pdfPages} 頁</p>
              <p className="text-token-sm leading-relaxed text-ink-muted">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-token-lg font-bold">整理次序</h2>
        <ol className="mt-5 divide-y divide-line-soft border-t border-line">
          {data.methodPlan.map((item, index) => (
            <li key={item.step} className="grid gap-3 py-5 sm:grid-cols-[3rem_9rem_1fr]">
              <span className="font-accent tabular-nums text-ink-faint">{index + 1}</span>
              <h3 className="font-serif text-token-body font-bold">{item.step}</h3>
              <p className="text-token-sm leading-relaxed text-ink-muted">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-token-lg font-bold">解讀時必須留意</h2>
        <div className="mt-5 divide-y divide-line-soft border-y border-line">
          {data.riskRegister.map((item) => (
            <article key={item.risk} className="grid gap-3 py-5 sm:grid-cols-[10rem_1fr]">
              <h3 className="font-serif text-token-body font-bold">{item.risk}</h3>
              <p className="text-token-sm leading-relaxed text-ink-muted">{item.response}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ZhuJiahua({ forcedTab, forcedText }) {
  const [scale, setScale] = useFontScale();
  const [{ tab: queryTab }, setTabs] = useTabParams({ tab: 'overview' });
  const navigate = useNavigate();
  const tab = forcedTab || queryTab;
  const changeTab = (value) => {
    if (TAB_PATHS[value]) navigate(TAB_PATHS[value]);
    else setTabs({ tab: value }, { scroll: 'top' });
  };
  const textId = forcedText || 'ZJH-LE-001';
  const textMeta = data.legalEducation.items.find((item) => item.id === textId);
  const headerTitle = forcedTab === 'legal'
    ? '朱家驊的法律教育論'
    : forcedTab === 'text'
      ? textMeta.title
      : data.project.title;
  const headerSummary = forcedTab === 'legal'
    ? '六篇言論、年代、場合與制度脈絡'
    : forcedTab === 'text'
      ? `${textMeta.date}・${textMeta.occasion}・人工逐頁校訂全文`
      : data.project.subtitle;

  return (
    <DashboardLayout
      scale={scale}      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow="Chu Chia-hua Research"
      title={headerTitle}
      titleClassName="font-serif font-bold"
      summary={headerSummary}
      tabs={{
        label: '研究室分頁',
        value: tab,
        onChange: changeTab,
        items: TAB_ITEMS,
      }}
      refreshKey={tab === 'text' ? textId : tab}
    >
      {tab === 'overview' ? <Overview /> : null}
      {tab === 'legal' ? <LegalEducation /> : null}
      {tab === 'text' ? <OriginalText textId={textId} /> : null}
      {tab === 'questions' ? <Questions /> : null}
      {tab === 'materials' ? <Materials /> : null}
    </DashboardLayout>
  );
}
