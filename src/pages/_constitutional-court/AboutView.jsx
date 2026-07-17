import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import data from '../../data/constitutionalCourt.json';
import { formatDate } from '../../utils/date';
import { Badge, CaseRef, SegControl, docs, pdfHref, usePref } from './shared';

// 未獲同意的被提名人批次（113/114，賴清德提名、立法院全數否決）：資料層 justice-nominees.json
// 經快照 被提名人批次 帶入；掛在哪些案件卡片由資料的 相關案件 決定（現為 114年憲判字第1號——
// 兩批否決造成的員額僵局即憲訴法修正案的脈絡），前端不寫死字號。
const nomineeBatches = data.被提名人批次 ?? null;

function NomineeDossiers({ pdfMode }) {
  if (!nomineeBatches?.批次?.length) return null;
  return (
    <div className="mt-3 rounded-lg bg-[var(--cc-opinion-bg)] px-3 py-2">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">本案脈絡：未獲同意的大法官被提名人（總統府公布之自傳／簡歷）</p>
      {nomineeBatches.批次.map((b) => (
        <div key={b.批次} className="mt-1.5">
          <p className="text-[12.5px] font-bold text-[var(--cc-ink-heavy)]">
            {b.批次}
            <span className="ml-2 font-normal text-[var(--cc-ink-soft)]">{b.提名總統}提名（{String(b.提名公布).slice(0, 10)}）・{b.結果}</span>
          </p>
          <div className="mt-1 divide-y divide-[var(--cc-row-border)]">
            {b.名單.map((p) => (
              <div key={p.姓名} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1 text-[13px]">
                <span className="w-[64px] font-bold text-[var(--cc-ink)]">{p.姓名}</span>
                <span className="w-[128px] text-[12px] text-[var(--cc-ink-soft)]">{p.提名職務}</span>
                <a href={pdfHref(p.自傳, pdfMode)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
                  自傳 <FileText size={10} />
                </a>
                <a href={pdfHref(p.簡歷, pdfMode)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
                  簡歷 <FileText size={10} />
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="mt-1.5 text-[11px] text-[var(--cc-ink-soft)]">總統府已陸續撤下落選批次檔案，撤下者連至網際網路檔案館存檔。</p>
    </div>
  );
}
export default function AboutView() {
  const typedTotal = docs.filter((d) => d.結論類型).length;
  return (
    <div className="max-w-3xl">
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">資料來源</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">行憲後取自憲法法庭官網，行憲前取自維基文庫（公有領域）</h2>
        <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          <p>
            <strong className="text-[var(--cc-accent)]">行憲後</strong>：司法院大法官解釋 {data.統計.機關?.大法官 ?? 0} 件（釋字第 1–813 號，1949–2021）、憲法法庭判決 {data.統計.判決} 件（2022 年憲法訴訟法施行起）、實體裁定 {data.統計.實體裁定} 件（含暫時處分），取自憲法法庭官網。程序性不受理裁定未收錄。
          </p>
          <p>
            <strong className="text-[var(--cc-accent)]">行憲前</strong>：統一解釋 {data.統計.行憲前} 件——大理院統字 {data.統計.機關?.大理院}（1913–1927）、最高法院解字 {data.統計.機關?.最高法院}（1927–1928）、司法院院字／院解字 {data.統計.機關?.司法院}（1929–1948），取自維基文庫（轉錄自司法院法學資料檢索系統與《司法院解釋彙編》，公有領域）。此係統一解釋法令，非大法官憲法解釋，與釋字分計；統字多無逐號日期（源頭即缺），院字／院解字帶完整年月日與彙編冊頁。
          </p>
          <p>
            每件案件的爭點、主文、相關法令、意見書清單與立場表連結均解析自官方頁面；文件下載一律連回官方網站，本站不代管任何檔案副本。
          </p>
          <p>
            主題分類、稅法子主題與審查結論由規則初步標註；粗軸判不出的「待人工」件，其中大法官釋字＋憲法法庭憲判部分已由類型學逐件覆核（卡片改標處分模式，如「純解釋」「違憲宣告」，詳見下節），其餘仍標「結論待人工判讀」。意見書作者與共同具名關係解析自官方檔名；早期意見書僅收於抄本合訂檔者，已從抄本檔名拆出（卡片上仍連向抄本 PDF）。中期釋字（約第 100–400 號）的意見書常整卷收於抄本且檔名未列作者，該時期的意見書統計為下限而非全貌。
          </p>
          <p>
            「審查基準」欄依湯德宗三級架構（寬鬆／中度／嚴格）機標：本院自釋字第 578 號起才明確區分寬嚴審查基準，之前案件不標；機標只認理由書明示字樣，多數案件為「未明示」，同案命中多級者標「待人工」。參與大法官名單：釋字取自官方頁解釋文／理由書末尾的大法官署名列（813 件全覆蓋，署名列不含迴避或未參與評議者），憲法法庭判決與裁定取自官方合議庭名單欄。
          </p>
        </div>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">審查結論類型學</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">六個軸，替粗軸看不見的處分模式補上解析度</h2>
        <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          <p>
            粗軸「審查結論」只有六格（合憲／違憲／違憲定期失效／法令解釋／補充前解釋／變更前解釋），另有一批文字規則判不出的「待人工」殘餘。類型學在粗軸之外另立六個分析軸，替這批殘餘補上細分：
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li><strong className="text-[var(--cc-ink-strong)]">A 處分模式</strong>（單選）：合憲性判斷的九種樣態——單純合憲、合憲性限縮、合憲附警告、違憲宣告、純解釋、權限歸屬宣告、程序／暫時處分、不受理、位階審查。</li>
            <li><strong className="text-[var(--cc-ink-strong)]">B 違憲處分技術</strong>（多值）：即時失效、定期失效、未定失效時點、排除適用、連帶失效、部分違憲、漏未規定型違憲。</li>
            <li><strong className="text-[var(--cc-ink-strong)]">C 標的類型</strong>（單選）：受審查／受解釋的對象是法律、命令函釋、判例決議、憲法條文、法律涵義⋯⋯</li>
            <li><strong className="text-[var(--cc-ink-strong)]">D 對前解釋關係</strong>（多值）：補充、變更、維持、訂正、區別前解釋。</li>
            <li><strong className="text-[var(--cc-ink-strong)]">E 救濟與後續</strong>（多值）：課予修法義務、過渡規則、個案救濟、裁判憲法審查救濟、框架性立法指示、部分不受理。</li>
            <li><strong className="text-[var(--cc-ink-strong)]">F 解釋權能</strong>（多值）：憲法解釋或統一解釋。</li>
          </ul>
          <p>
            範圍目前只涵蓋「大法官釋字＋憲法法庭憲判」中粗軸判不出的「待人工」殘餘 {typedTotal} 件，均經雙盲逐件覆核。這批殘餘拆開後，逾半其實是文字規則抓不到「與憲法」字樣的純解釋與統一解釋。已由粗軸分好的合憲／違憲等件尚未逐件套細軸。
          </p>
          <p>
            「案件索引」的類型學 6 軸篩選只作用在這 {typedTotal} 件；「案件時間軸」的「主題×處分模式」矩陣則把已覆核件與粗軸換算件合併呈現 A 軸分佈（換算：合憲→P1、違憲→P4、法令解釋→P5⋯⋯，無法細分限縮 P2／附警告 P3），矩陣圖說已標明兩者比例。編碼本與逐件貼標見資料庫的 <span className="text-[var(--cc-ink-soft)]">materials/審查結論類型學.json</span>。
          </p>
        </div>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">批次下載</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">篩選後想把檔案抓回本機讀？</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          瀏覽器無法代替你向官方網站批次下載。作法：在「案件索引」匯出「批次下載清單」，回到研究資料庫在本機執行批次下載命令，官方 PDF 就會下載到本機資料夾。清單裡每一筆都是官方網址，來源可驗證。
        </p>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">更新</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">資料怎麼保持最新</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">
          資料庫以官方清單頁差分更新：偵測新公布的判決與裁定、只抓新增案件、重建統計後同步到本頁。本頁資料產生於 {data.產生時間?.slice(0, 10)}。
        </p>
      </section>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">相關外部連結</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">原始資料的官方出處</h2>
        <div className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed">
          <a href="https://cons.judicial.gov.tw/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]">
            憲法法庭全球資訊網（大法官解釋、憲法法庭判決與裁定官方查詢系統） <ExternalLink size={11} />
          </a>
        </div>
      </section>
    </div>
  );
}
// 114 憲判 1 號深度解析：純渲染資料層 doc.深度分析（策展層，見 constitutional-court-research-data/
// data/materials/深度分析.json）。內容零寫死；顏色只走 --cc-* token 與校準過的 Badge tone。
// 站位中立並陳多數/不同意見兩造，不裁決「5 人判決是否有效」。
export function Case1Analysis() {
  const [tlMode, setTlMode] = useState('議題');
  const [pdfMode] = usePref('pdfMode', 'preview');
  const doc = docs.find((d) => d.字號 === '114年憲判字第1號');
  const da = doc?.深度分析;
  if (!da) {
    return (
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">找不到「114 年憲判字第 1 號」的深度分析資料（資料層尚未同步）。</p>
      </section>
    );
  }
  const 多數 = da.組成爭議?.多數立場;
  const 不同意見 = da.組成爭議?.不同意見立場;
  // 時間軸雙維度：預設「依議題」（缺額與提名／修法與釋憲，左右分側），有 行為人 欄位時可切「依行為人」。
  // 色位一律走 --cat-* 分類色；議題兩軸吃 cat-1(plum)/cat-2(blue)，行為人吃固定色位（標籤負責辨識）。
  const events = (da.時間軸 ?? []).slice().sort((a, b) => a.日期.localeCompare(b.日期));
  const hasActor = events.some((t) => t.行為人);
  const mode = hasActor ? tlMode : '議題';
  const 軸COLOR = { 缺額與提名: 1, 修法與釋憲: 2 };
  const ACTOR_COLOR = { 立法院: 2, 行政院: 4, 總統: 1, 司法院: 5, 其他: 8 };
  // 主事者（資料欄位名沿用「行為人」，顯示層改稱主事者）：泳道分欄用，固定欄序讓欄位穩定。
  const actorsPresent = ['立法院', '行政院', '總統', '司法院', '其他'].filter((a) => events.some((t) => t.行為人 === a));
  const toneOf = (t) => (軸COLOR[t.軸] ?? 8);
  const sideOf = (t) => (t.軸 === '缺額與提名' ? 'L' : 'R');
  const legend = [['缺額與提名', 軸COLOR.缺額與提名], ['修法與釋憲', 軸COLOR.修法與釋憲]];
  const srcLink = (href) => (
    <a href={href} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center align-baseline text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]" aria-label="來源">
      <ExternalLink size={10} />
    </a>
  );
  return (
    <div>
      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">深度解析 · Case Study</p>
        <h2 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]"><CaseRef 字號={doc.字號} />：{da.案名}</h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">{da.一句話}</p>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[var(--cc-ink-soft)]">{da.背景}</p>
        <p className="mt-3 max-w-3xl rounded-lg border border-[var(--cc-line)] p-2.5 text-[12px] leading-relaxed text-[var(--cc-figure-note)]">
          本頁並陳多數與不同意見兩造立場，不對「5 位大法官作成的判決是否有效」下判斷——這個元爭議之上並無更高階的中立仲裁機關。用語採「分立政府／在野聯盟過半」等中性表述。
        </p>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">事件時間軸</p>
            <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">
              {mode === '議題' ? '兩條交纏的軸線：缺額凍結與門檻拉高如何同時發生' : '誰在推動：立法院、總統與司法院的動作序列'}
            </h3>
          </div>
          {hasActor ? (
            <SegControl value={tlMode} onChange={setTlMode} options={[['議題', '依議題'], ['行為人', '依主事者']]} />
          ) : null}
        </div>
        {mode === '議題' ? (
          <>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--cc-ink-soft)]">
              {legend.map(([label, n]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border" style={{ background: `var(--cat-${n}-bg)`, borderColor: `var(--cat-${n}-tx)` }} />
                  {label}
                </span>
              ))}
            </div>
            {/* 中央軸時間軸：手機單欄（軸線靠左），sm 以上軸線置中、事件依側別分掛左右。 */}
            <div className="relative mt-4 max-w-4xl">
              <span className="absolute inset-y-0 left-[6px] w-px bg-[var(--cc-line)] sm:left-1/2 sm:-translate-x-1/2" aria-hidden />
              <ol className="space-y-3">
                {events.map((t, i) => {
                  const n = toneOf(t);
                  const side = sideOf(t);
                  return (
                    <li key={i} className="relative sm:grid sm:grid-cols-2 sm:gap-x-8">
                      <span
                        className="absolute left-[6px] top-2.5 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 sm:left-1/2"
                        style={{ background: `var(--cat-${n}-bg)`, borderColor: `var(--cat-${n}-tx)` }}
                        aria-hidden
                      />
                      <div className={`pl-5 sm:pl-0 ${side === 'L' ? 'sm:col-start-1 sm:pr-9 sm:text-right' : 'sm:col-start-2 sm:pl-9'}`}>
                        <div className="rounded-lg border border-[var(--cc-line)] p-2.5">
                          <p className="text-[12.5px] font-bold text-[var(--cc-ink-strong)]">
                            {formatDate(t.日期)}
                            {t.行為人 ? <span className="ml-1.5 font-normal text-[var(--cc-ink-soft)]">· {t.行為人}</span> : null}
                          </p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
                            {t.事件}{t.來源 ? srcLink(t.來源) : null}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        ) : (
          <>
            {/* 依主事者：每方一直欄（泳道），由上而下＝時間先後；同一時點只有發動方有卡片，各方動作在同一時間軸上錯落並讀。 */}
            <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">每一直欄是一個主事者，由上而下即時間先後；同一時點只有發動的一方有卡片，故各方動作在同一條時間軸上錯落並排。</p>
            <div className="mt-3 hidden sm:block">
              <div className="grid gap-x-3" style={{ gridTemplateColumns: `repeat(${actorsPresent.length}, minmax(0, 1fr))` }}>
                {actorsPresent.map((a) => (
                  <div key={a} className="flex items-center gap-1.5 border-b border-[var(--cc-line)] pb-1.5 text-[12px] font-bold" style={{ color: `var(--cat-${ACTOR_COLOR[a]}-tx)` }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--cat-${ACTOR_COLOR[a]}-bg)`, border: `1px solid var(--cat-${ACTOR_COLOR[a]}-tx)` }} />
                    {a}
                  </div>
                ))}
              </div>
              <div className="grid gap-x-3 gap-y-2 pt-2" style={{ gridTemplateColumns: `repeat(${actorsPresent.length}, minmax(0, 1fr))` }}>
                {events.map((t, i) => {
                  const n = ACTOR_COLOR[t.行為人] ?? 8;
                  const col = actorsPresent.indexOf(t.行為人) + 1;
                  return (
                    <div key={i} style={{ gridColumn: col, gridRow: i + 1, background: `var(--cat-${n}-bg)`, borderLeft: `3px solid var(--cat-${n}-tx)` }} className="rounded-md border border-[var(--cc-line)] p-2">
                      <p className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{formatDate(t.日期)}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{t.事件}{t.來源 ? srcLink(t.來源) : null}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 手機：欄位太窄，退回單欄時間序，左邊主事者色標＋標籤 */}
            <ol className="mt-3 space-y-2.5 border-l border-[var(--cc-line)] pl-4 sm:hidden">
              {events.map((t, i) => {
                const n = ACTOR_COLOR[t.行為人] ?? 8;
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-2.5 h-2.5 w-2.5 rounded-full border" style={{ background: `var(--cat-${n}-bg)`, borderColor: `var(--cat-${n}-tx)` }} aria-hidden />
                    <div className="rounded-md border border-[var(--cc-line)] p-2" style={{ borderLeft: `3px solid var(--cat-${n}-tx)` }}>
                      <p className="text-[12px] font-bold text-[var(--cc-ink-strong)]">{formatDate(t.日期)}<span className="ml-1.5 font-normal" style={{ color: `var(--cat-${n}-tx)` }}>· {t.行為人}</span></p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--cc-ink-mid)]">{t.事件}{t.來源 ? srcLink(t.來源) : null}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">判決 · {formatDate('2025-12-19')}</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">主文與論證</h3>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--cc-ink-mid)]">{da.判決主文}</p>
        <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
          {(da.論證主軸 ?? []).map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">核心爭議 · 5 vs 3</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">憲法法庭是否合法組成？署名 5 人與拒審 3 人的對立</h3>
        <div className="mt-3 grid max-w-3xl gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--cc-line)] p-3">
            <div className="flex items-center gap-2"><Badge tone="blue">{多數?.標籤}</Badge></div>
            <p className="mt-1.5 text-[12px] text-[var(--cc-ink-soft)]">{(多數?.大法官 ?? []).join('、')}{多數?.主筆 ? `（主筆 ${多數.主筆}）` : ''}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
              {(多數?.要點 ?? []).map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            {多數?.個別註記 ? <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--cc-figure-note)]">{多數.個別註記}</p> : null}
          </div>
          <div className="rounded-lg border border-[var(--cc-line)] p-3">
            <div className="flex items-center gap-2"><Badge tone="red">{不同意見?.標籤}</Badge></div>
            <p className="mt-1.5 text-[12px] text-[var(--cc-ink-soft)]">{(不同意見?.大法官 ?? []).join('、')}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
              {(不同意見?.要點 ?? []).map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            {不同意見?.文件 ? <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--cc-figure-note)]">{不同意見.文件}</p> : null}
          </div>
        </div>
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">不同意見書要旨</p>
          <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">三位大法官《不同意法律意見書》十點要旨</h3>
          <ol className="mt-2 max-w-3xl list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">
            {(da.不同意見書要旨 ?? []).map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">開放問題 · Known Unknowns</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">已知有爭議、尚無定論</h3>
        <ul className="mt-2 max-w-3xl space-y-1.5">
          {(da.known_unknowns ?? []).map((p, i) => (
            <li key={i} className="rounded-lg border border-[var(--cc-line)] p-2.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">{p}</li>
          ))}
        </ul>
      </section>

      <section className="border-t border-[var(--cc-line)] py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">更深層 · Unknown Unknowns</p>
        <h3 className="text-[15px] font-bold text-[var(--cc-title-ink)]">結構性、尚未被清楚框定的風險</h3>
        <ul className="mt-2 max-w-3xl space-y-1.5">
          {(da.unknown_unknowns ?? []).map((p, i) => (
            <li key={i} className="rounded-lg border border-[var(--cc-line)] p-2.5 text-[13px] leading-relaxed text-[var(--cc-ink-mid)]">{p}</li>
          ))}
        </ul>
      </section>

      {/* 被提名大法官資料（113/114 落選 14 人的自傳/簡歷）——屬本案（缺額與提名）脈絡，
          放在此專屬分頁，不再掛在通用案件預覽卡片上。 */}
      <NomineeDossiers pdfMode={pdfMode} />
    </div>
  );
}
