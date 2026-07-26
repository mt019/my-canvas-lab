import { useEffect } from 'react';
import AppearanceMenu from '../components/AppearanceMenu';
import FontSizeControl, { useFontScale } from '../components/FontSizeControl';
import DashboardLayout from '../components/lab/DashboardLayout';
import { useTabParams } from '../components/lab/Tabs';
import CourseTimeline from './_law-classics/CourseTimeline';
import { GLCT_TITLE } from './_law-classics/seo';
import germanRows from '../data/germanLawCourseTimeline.json';

/*
 * 法學名著選讀・教師時序。每個分頁是一個語言的「XX 文法學名著選讀」——同一門課系列的
 * 不同語言版本，走 ConstitutionalCourt／TaxLitigation 一樣的吸頂分頁 pattern（見
 * DashboardLayout）。目前只有德文一個分頁；加英美／法文／日文，往 LANGUAGES 增一筆
 * config ＋ 一份同 schema 的 rows JSON，CourseTimeline 元件不用動。
 *
 * config 只描述「這個語言的課長什麼樣」：領域名怎麼對到校準過的分類色槽（domainOrder，
 * 順序＝圖例順序）、開場說明、資料來源。色值本身在 tokens.css 的 --cat-1..8，這裡只引槽號。
 */

// 德文七個領域 → --cat 分類色槽。順序即圖例順序；色相取自校準過的 Badge tone，
// 語意上盡量沿用舊配色的直覺（公法藍、刑事紅、法史土黃、歐盟綠、泛用灰）。
const GERMAN_DOMAIN_ORDER = [
  { domain: '公法/憲法', slot: 2 }, // blue
  { domain: '刑事法', slot: 6 }, // red
  { domain: '民事法/民訴', slot: 1 }, // plum
  { domain: '基礎法/法史', slot: 4 }, // amber
  { domain: '歐盟/跨國/數位', slot: 3 }, // green
  { domain: '研究工具', slot: 5 }, // teal
  { domain: '泛法學德文', slot: 8 }, // slate
];

const GermanIntro = (
  <div className="max-w-2xl space-y-3 text-token-sm leading-relaxed text-ink-muted">
    <p>
      縱軸是學期，由上而下、由早而近；橫向列頭是教師，名字後的括號為其在資料中的開課筆數。每個圓點代表一個
      去重後班次，顏色為該班次的主要法學領域。滑過圓點可看班次、領域、時間教室與課綱摘要，點擊開啟原始來源頁。
    </p>
    <p>
      93 學年以前使用臺大歷年課表 PDF 的 OCR 與頁圖確認課表事實；因舊 PDF 未附詳細課綱，領域依教師公開研究
      專長推斷。93 學年以後主要依 NOL 課綱文字推定。
    </p>
  </div>
);

const LANGUAGES = [
  {
    id: 'de',
    label: '德文',
    rows: germanRows,
    domainOrder: GERMAN_DOMAIN_ORDER,
    intro: GermanIntro,
  },
];

export default function GermanLawCourseTimeline() {
  const [scale, setScale] = useFontScale();
  const [{ tab }, setTabs] = useTabParams({ tab: LANGUAGES[0].id });

  useEffect(() => {
    document.title = GLCT_TITLE;
  }, []);

  const active = LANGUAGES.find((l) => l.id === tab) ?? LANGUAGES[0];

  return (
    <DashboardLayout
      scale={scale}
      headerRight={
        <>
          <FontSizeControl scale={scale} onChange={setScale} />
          <AppearanceMenu />
        </>
      }
      eyebrow="NTU Legal Classics"
      title="法學名著選讀・教師時序"
      summary="臺大「法學名著選讀」歷年開課的教師時間軸——誰在教、教了幾年、偏哪個法學領域。縱軸是二十餘年的學期，橫向列頭是教師，點的顏色是該班次的主要領域。"
      tabs={{
        label: '看哪個語言',
        value: active.id,
        onChange: (v) => setTabs({ tab: v }, { scroll: 'top' }),
        items: LANGUAGES.map((l) => ({ id: l.id, label: l.label })),
      }}
      refreshKey={active.id}
      hideToc
    >
      <CourseTimeline rows={active.rows} domainOrder={active.domainOrder} intro={active.intro} />
    </DashboardLayout>
  );
}
