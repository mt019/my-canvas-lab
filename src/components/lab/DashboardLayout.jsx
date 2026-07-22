import { useRef } from 'react';
import Eyebrow from '../Eyebrow';
import Tabs from './Tabs';
import TableOfContents from './TableOfContents';

/*
 * 儀表板版的兩欄殼——`/brief` 手刻過，抽到這裡讓別的儀表板頁共用（DESIGN.md 元件表）。
 *
 * 跟文章版（ArticleLayout）是姊妹不是同一個：文章版有固定閱讀寬度（44rem）、右欄是整份
 * 目次，服務的是一篇長文；儀表板要的是**滿寬的內容欄**放一批批密集列，加一條**吸頂的分頁列**
 * 切「看哪一期／哪個視圖」。兩種意圖不同，所以是兩個殼，不是一個殼硬吃兩種版型。
 *
 * 原本是三欄（左欄列 h2、右欄跟著捲動只攤開當前那區的細目）。改成兩欄：分頁列本身已經是
 * 「大專題」那層導覽，左欄再列一次 h2 等於同一件事講兩次；TableOfContents 本來就同時支援
 * h2+h3（DashboardLayout 舊版只給它 levels=[2]，把它閹割成跟 SubOutline 分工），現在單獨一欄
 * 放右邊、拿掉 levels 限制，就是一份完整的「本頁區塊」大綱（Notion／GitHub／Obsidian 的
 * on-this-page 慣例也在右邊）。內容欄因此變寬，表格、案例卡這類需要橫向空間的東西比較舒展。
 *
 * header 會被捲走，分頁列吸在最上面永遠看得到——不像埋在正文一千多像素下面的舊版。右欄在
 * lg 以下收起：手機塞側欄比沒有側欄更糟（ArticleLayout 同此）。
 *
 * 頁面自己提供的：抬頭那一句、分頁項目、右欄目次上方那條（如緊急提醒，prop 名稱沿用
 * leftRailTop——只是現在渲染在右欄，改名要動到呼叫端，非必要不動）、內容。殼只負責版型
 * 與把 TableOfContents 接到內容容器上。
 */
export default function DashboardLayout({
  scale,
  back,
  headerRight,
  eyebrow,
  title,
  summary,
  tabs,
  leftRailTop,
  tocLabel = '本頁區塊',
  refreshKey,
  children,
}) {
  const bodyRef = useRef(null);

  return (
    <main className="min-h-screen bg-paper paper-texture text-ink" style={{ '--reader-scale': scale }}>
      {/* 抬頭：捲走的那一段。返回、識別、一句話說明這頁是什麼。控制項收在右上。
          字級只放大識別那一塊（reader-scale），返回／控制項那一列固定不動；殼的
          max-w-7xl 框在 zoom 之外，所以放大字級不會動到左右邊界。 */}
      <header className="border-b border-line-soft">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            {back ? (
              <a href={back.href} className="text-token-sm text-ink-faint transition-colors duration-fast hover:text-accent">
                ← {back.label}
              </a>
            ) : (
              <span />
            )}
            {headerRight ? <div className="flex items-center gap-2">{headerRight}</div> : null}
          </div>
          <div className="reader-scale">
            {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
            <h1 className="font-display text-token-2xl leading-tight sm:text-token-3xl">{title}</h1>
            {summary ? (
              <p className="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{summary}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* 吸頂的分頁列：永遠看得到。dashboard variant 是裝在 bg-surface 膠囊裡的實心藥丸鈕
          （仿 ConstitutionalCourt.jsx 的吸頂導覽）；膠囊只包住按鈕本身寬度（inline-flex），
          按鈕少時也不會孤零零貼在空白左側——但膠囊仍靠左對齊，跟上面標題／內文同一條左邊界
          （不置中：置中會讓它脫離文字的視覺起點，反而更奇怪）。**不用毛玻璃**——這條又寬、
          按鈕又少時，毛玻璃把「大片空白」變成「一整條模糊」，比空白本身更顯眼；純色底＋底線
          就夠。
          **`reader-scale`（zoom）務必掛在最內層、外面再包一層不縮放的定位框**——跟上面
          header 同一個結構：外層 `mx-auto max-w-7xl px-4` 先在 zoom=1 算好置中與邊界，
          `reader-scale` 只包住真正要放大的內容。曾經把 `reader-scale` 直接掛在
          `mx-auto max-w-7xl px-4` 那層本身，結果 `zoom` 連 auto-margin 置中的計算都一起
          縮放，字級放大時整條分頁列的位置跟著往左漂移、跟 header 對不上——100% 時因為沒有
          縮放差異看不出來，字級調高後才會顯形，好幾輪才抓到（見 HISTORY）。 */}
      <div className="sticky top-0 z-20 border-b border-line-soft bg-paper">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="reader-scale flex">
            <Tabs
              variant="dashboard"
              label={tabs.label}
              value={tabs.value}
              onChange={tabs.onChange}
              items={tabs.items}
            />
          </div>
        </div>
      </div>

      {/* 寬內容欄＋右欄本頁大綱（h2+h3，跟著捲動高亮）。右欄在 lg 以下收起。 */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div ref={bodyRef} className="reader-scale min-w-0">{children}</div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto border-l border-line-soft pb-10 pl-5">
            {leftRailTop}
            <TableOfContents containerRef={bodyRef} label={tocLabel} refreshKey={refreshKey} />
          </div>
        </aside>
      </div>
    </main>
  );
}
