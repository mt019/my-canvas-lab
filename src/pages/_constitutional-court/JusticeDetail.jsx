import { useMemo } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { formatDate } from '../../utils/date';
import { Badge, citeString, coSign, docs, downloadFile, formatTenureRange, justices, pdfHref, toBibtex, usePref } from './shared';

// 大法官個人頁（?tab=justices&j=姓名）：基本資料、意見書清單、參與判決、共同具名、打包匯出
export default function JusticeDetail({ name, onBack, onOpen, onOpenDoc }) {
  const j = justices.find((x) => x.姓名 === name);
  const [pdfMode] = usePref('pdfMode', 'preview'); // 與案件頁共用同一 localStorage 偏好

  const opinions = useMemo(() => {
    const ops = [];
    for (const d of docs) {
      for (const op of d.意見書) {
        if (op.作者類別 !== '大法官') continue;
        const role = op.提出?.includes(name) ? '提出' : op.加入?.includes(name) ? '加入' : null;
        if (role) ops.push({ d, op, role });
      }
    }
    return ops.sort((a, b) => (b.d.日期 ?? '').localeCompare(a.d.日期 ?? ''));
  }, [name]);

  const participated = useMemo(
    () => docs.filter((d) => d.參與大法官?.includes(name)).sort((a, b) => (b.日期 ?? '').localeCompare(a.日期 ?? '')),
    [name],
  );

  const partners = useMemo(() => coSign
    .filter((e) => e.甲 === name || e.乙 === name)
    .map((e) => ({ 對象: e.甲 === name ? e.乙 : e.甲, 次數: e.次數 }))
    .sort((a, b) => b.次數 - a.次數), [name]);

  const involvedCases = useMemo(() => {
    const m = new Map();
    for (const { d } of opinions) m.set(d.字號, d);
    for (const d of participated) m.set(d.字號, d);
    return [...m.values()].sort((a, b) => (b.日期 ?? '').localeCompare(a.日期 ?? ''));
  }, [opinions, participated]);

  // 僅參與（署名列/合議庭名單有名，但無個人意見書）——以緊湊字號 chips 呈現
  const participationOnly = useMemo(() => {
    const withOpinion = new Set(opinions.map(({ d }) => d.字號));
    return participated.filter((d) => !withOpinion.has(d.字號));
  }, [opinions, participated]);

  if (!j) {
    return (
      <div className="py-8">
        <button onClick={onBack} className="text-[13px] font-bold text-[var(--cc-accent)] hover:underline">← 回大法官總覽</button>
        <p className="mt-4 text-[14px] text-[var(--cc-ink-mid)]">名冊裡查無「{name}」。</p>
      </div>
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const opinionCite = ({ d, op }) =>
    `${citeString(d).replace(/（.*?）$/, '')}${(op.提出 ?? []).join('、')}大法官${op.類型}${d.日期 ? `（${formatDate(d.日期)}）` : ''}`;
  const exportCites = () => downloadFile(
    [...opinions.map(opinionCite), ...participated.map(citeString)].join('\n'),
    `${name}_引註清單_${stamp}.txt`, 'text/plain',
  );
  const exportBib = () => downloadFile(toBibtex(involvedCases), `${name}_案件_${stamp}.bib`, 'text/plain');
  const exportManifest = () => downloadFile(JSON.stringify({
    說明: '此清單供本機批次下載使用：到資料庫 repo 執行 npm run fetch-batch -- --manifest <本檔>',
    大法官: name,
    產生時間: new Date().toISOString(),
    文件: involvedCases.map((d) => ({
      字號: d.字號,
      官方頁: d.官方頁,
      意見書: d.意見書
        .filter((op) => (op.提出?.includes(name) || op.加入?.includes(name)) && op.下載網址)
        .map((op) => ({ 文件名: op.文件名, 下載網址: op.下載網址 })),
      ...(d.立場表下載 && d.參與大法官?.includes(name) ? { 立場表: d.立場表下載 } : {}),
    })).filter((e) => e.意見書.length || e.立場表), // 僅參與而無可下載文件的案件不進下載清單
  }, null, 1), `${name}_下載清單_${stamp}.json`, 'application/json');

  const tenureText = (j.任期 ?? []).map(formatTenureRange).join('；');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cc-line)] py-4">
        <button onClick={onBack} className="text-[13px] font-bold text-[var(--cc-accent)] hover:underline">← 回大法官總覽</button>
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <span className="text-[var(--cc-eyebrow)]">打包這位大法官的全部資料：</span>
          <button onClick={exportCites} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />引註清單</button>
          <button onClick={exportBib} className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] hover:text-[var(--cc-link-hover)]"><Download size={11} />BibTeX</button>
          <button onClick={exportManifest} className="inline-flex items-center gap-1 font-bold text-[var(--cc-blue-ink)] hover:text-[var(--cc-blue-ink-hover)]"><Download size={11} />批次下載清單</button>
        </div>
      </div>

      <section className="py-5">
        <h2 className="text-2xl font-bold text-[var(--cc-heading)]">{j.姓名}</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-[var(--cc-ink-mid)]">
          {/* 屆次推定的任期純由屆次標籤推出，兩欄重複，只留屆次一行；
              簡歷頁/人工核定者任期有獨立資訊（多段、辭職、卒於任內、現任起日）才另列 */}
          {j.屆次?.length ? (
            <span>
              <strong className="text-[var(--cc-accent)]">屆次</strong>　{j.屆次.join('、')}
              {j.任期來源 === '屆次推定' ? <span className="text-[11.5px] text-[var(--cc-figure-note)]">（任期依屆次推定）</span> : null}
            </span>
          ) : null}
          {tenureText && j.任期來源 !== '屆次推定' ? (
            <span><strong className="text-[var(--cc-accent)]">任期</strong>　{tenureText}{j.任期來源 === '人工核定' ? '（人工核定）' : ''}</span>
          ) : null}
          {/* 多段任期＝兩次以上受不同總統提名（如許宗力 2003 陳水扁／2016 蔡英文再任），列出各段提名人；
              單段列 scalar。提名總統經 justices-提名批次.json 逐批核定，個別批次見 title。 */}
          {j.提名總統 ? (
            <span title={j.提名批次 ?? undefined}>
              <strong className="text-[var(--cc-accent)]">提名</strong>
              {j.各段提名總統?.length > 1 ? [...new Set(j.各段提名總統)].join('、') : j.提名總統}
            </span>
          ) : null}
          {j.出身 && j.出身 !== '待確認' ? <span><strong className="text-[var(--cc-accent)]">出身</strong>　{j.出身}</span> : null}
          {j.留學國 ? <span><strong className="text-[var(--cc-accent)]">留學</strong>　{j.留學國}</span> : null}
          {j.性別 === '女' ? <span><strong className="text-[var(--cc-accent)]">性別</strong>　女</span> : null}
          {j.簡歷頁 ? (
            <a href={j.簡歷頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
              官方簡歷 <ExternalLink size={11} />
            </a>
          ) : null}
          {j.提名文件?.自傳 ? (
            <a href={pdfHref(j.提名文件.自傳, pdfMode)} target="_blank" rel="noreferrer" title={`${j.提名文件.批次}公布（${j.提名文件.連結形態}）`}
              className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
              自傳 <FileText size={11} />
            </a>
          ) : null}
          {j.提名文件?.簡歷 ? (
            <a href={pdfHref(j.提名文件.簡歷, pdfMode)} target="_blank" rel="noreferrer" title={`${j.提名文件.批次}公布（${j.提名文件.連結形態}）`}
              className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
              提名簡歷 <FileText size={11} />
            </a>
          ) : null}
          {j.提名文件?.報告 ? (
            <a href={pdfHref(j.提名文件.報告, pdfMode)} target="_blank" rel="noreferrer" title={`${j.提名文件.批次}列席立法院全院委員會口頭報告（${j.提名文件.連結形態}）`}
              className="inline-flex items-center gap-1 font-bold text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">
              學思歷程報告 <FileText size={11} />
            </a>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
          {[['提出意見書', j.提出意見書], ['加入意見書', j.加入意見書], ['主筆判決', j.主筆判決], ['參與解釋', j.參與解釋 ?? 0], ['參與裁判', j.參與判決]].map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-[12px] font-bold text-[var(--cc-icon)]">{label}</span>
              <span className="font-display text-lg sm:text-xl font-bold text-[var(--cc-ink)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {involvedCases.length ? (
        <section className="border-t border-[var(--cc-line)] py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">案件參與 {involvedCases.length} 件</p>
          {opinions.length ? (
            <>
              <h3 className="text-base sm:text-lg font-bold text-[var(--cc-title-ink)]">
                意見書 {opinions.length} 份：{Object.entries(j.意見書類型 ?? {}).map(([k, v]) => `${k.replace('意見書', '')} ${v}`).join('・') || ''}
              </h3>
              <div className="mt-2 divide-y divide-[var(--cc-row-border)]">
                {opinions.map(({ d, op, role }, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 text-[13px]">
                    <span className="w-[104px] whitespace-nowrap text-[12px] text-[var(--cc-figure-note)]">{formatDate(d.日期)}</span>
                    <button onClick={() => onOpenDoc(d.字號)} title="開啟案件預覽（含全部大法官意見書）" className="w-[130px] text-left font-bold text-[var(--cc-ink-strong)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">{d.字號}</button>
                    <Badge tone={op.類型.includes('不同') ? 'red' : op.類型.includes('協同') ? 'blue' : 'slate'}>{op.類型}</Badge>
                    {role === '加入' ? <Badge tone="slate">加入</Badge> : null}
                    {d.主筆 === name ? <Badge tone="plum">主筆</Badge> : null}
                    {d.主席 === name ? <Badge tone="plum">主席</Badge> : null}
                    {op.收於抄本 ? <Badge tone="gold">收於抄本</Badge> : null}
                    {op.加入註記?.some((s) => s.startsWith(name)) ? (
                      <span className="text-[11.5px] text-[var(--cc-figure-note)]">（{op.加入註記.filter((s) => s.startsWith(name)).join('；')}）</span>
                    ) : null}
                    <span className="max-w-[400px] truncate text-[12px] text-[var(--cc-ink-soft)]">{d.爭點?.slice(0, 40)}</span>
                    {op.下載網址 ?? (op.內嵌 ? d.官方頁 : null) ? (
                      <a href={op.下載網址 ? pdfHref(op.下載網址, pdfMode) : d.官方頁} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-[var(--cc-accent)] underline decoration-[var(--cc-link-underline)] underline-offset-2">{op.下載網址 ? 'PDF' : '官方頁'} <ExternalLink size={10} /></a>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {participationOnly.length ? (
            <div className="mt-4">
              <p className="text-[12px] font-bold text-[var(--cc-ink-soft)]">
                僅參與、無個人意見書（{participationOnly.length} 件；解釋為署名列、裁判為官方合議庭名單）
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
                {participationOnly.map((d) => (
                  <button key={d.字號} onClick={() => onOpenDoc(d.字號)} title={`${formatDate(d.日期)}　${d.爭點?.slice(0, 60) ?? ''}`}
                    className="text-[12px] text-[var(--cc-ink-mid)] underline decoration-[var(--cc-link-underline)] underline-offset-2 hover:text-[var(--cc-accent)]">
                    {d.字號.startsWith('釋字第') ? `釋${d.字號.slice(3, -1)}` : d.字號}
                    {d.主筆 === name ? '＊' : ''}{d.主席 === name ? '†' : ''}
                  </button>
                ))}
              </div>
              {participationOnly.some((d) => d.主筆 === name || d.主席 === name) ? (
                <p className="mt-1 text-[11.5px] text-[var(--cc-figure-note)]">＊＝主筆　†＝會議主席</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {partners.length ? (
        <section className="border-t border-[var(--cc-line)] py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cc-eyebrow)]">共同具名對象</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {partners.map((p) => (
              <button key={p.對象} onClick={() => onOpen(p.對象)}
                className="rounded-md border border-[var(--cc-border)] bg-white px-2.5 py-1 text-[12.5px] font-bold text-[var(--cc-accent)] hover:bg-[var(--cc-hover-bg)]">
                {p.對象} × {p.次數}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <p className="border-t border-[var(--cc-line)] py-4 text-[12px] leading-relaxed text-[var(--cc-ink-soft)]">
        意見書清單解析自官方附件檔名與內嵌正文；「收於抄本」表示該意見書僅收於全案合訂 PDF。參與名單皆為官方實據：
        解釋來自官方頁末尾的大法官署名列（813 件全覆蓋，迴避或未參與評議者不在列），裁判來自官方合議庭名單；
        「加入◯◯部分」等範圍限定照檔名原文附註。批次下載清單需回研究資料庫執行
        <code className="mx-1 rounded bg-[var(--cc-hover-bg)] px-1">npm run fetch-batch -- --manifest</code>下載官方 PDF。
      </p>
    </div>
  );
}
