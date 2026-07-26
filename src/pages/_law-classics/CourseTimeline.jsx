import React, { useMemo, useRef, useState } from 'react';

/*
 * 法學名著選讀・教師時序圖（通用版，config 驅動）。
 *
 * 前身是 GermanLawCourseTimeline 從 Python 腳本 render_html() 一比一移植的孤島：
 * 自成一套奶油底色票、硬編碼領域 hex、tooltip 帶陰影、非站內字體，且**橫軸放 52 個
 * 學期**——長軸放橫向，寬度爆到 2000+px，內容欄只有 ~750px，得橫拉三次才看得完。
 *
 * 重建兩件事：(1) 全面吃 tokens.css（領域色改校準過的 --cat 分類色槽、tooltip 去發光、
 * Huiwen Mincho 字體）。(2) **轉置成縱向時間軸**——學期由上而下（早→近），教師（每個
 * 都短短三字名）當橫向列頭。短軸放橫向，寬度收進內容欄，整頁改成網頁天然的縱向捲動。
 *
 * 元件本身不認得任何語言：rows 是該課的去重班次，domainOrder 把領域名對到分類色槽
 * （固定順序＝圖例順序）。加英美／法文／日文法學名著，丟一份同 schema 的 JSON ＋ 一筆
 * config 即可，這裡不用動。
 */

// ── 縱向佈局常數。教師列頭斜排在頂部、學期標籤在左側。──────────────────
const MARGIN_TOP = 120; // 頂部：斜 45° 排的教師列頭
const MARGIN_LEFT = 66; // 左側：學期標籤（如「100-1」）
const X_STEP = 33; // 教師列間距
const Y_STEP = 26; // 學期行間距
const RIGHT_PAD = 74; // 容納最右列頭斜 45° 排的教師名＋筆數，不被 SVG 右緣裁掉
const BOTTOM_PAD = 40;
const DOT_R = 6;
const FALLBACK_SLOT = 8; // slate

function semesterKey(value) {
  const match = /^(\d+)-([12])$/.exec((value || '').trim());
  if (!match) return [-1, -1];
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

function compareTuples(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] - b[1];
}

function domainsToArray(domains) {
  if (Array.isArray(domains)) return domains;
  if (typeof domains === 'string' && domains) return domains.split('、');
  return [];
}

// 穩定的「最常見」聚合，同票數依首見順序（對應 Python collections.Counter.most_common()）。
function mostCommon(list) {
  const counts = new Map();
  for (const item of list) counts.set(item, (counts.get(item) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function buildLayout(rows, slotOf) {
  const colorFor = (domain) => `var(--cat-${slotOf.get(domain) ?? FALLBACK_SLOT}-tx)`;

  // 學期：數值升序，早的在上。
  const semesters = [...new Set(rows.map((r) => String(r.semester)))].sort((a, b) =>
    compareTuples(semesterKey(a), semesterKey(b))
  );

  // 教師：首次開課早的在左；同期再按開課筆數多寡、名字序。
  const teacherCounts = new Map();
  const teacherFirst = new Map();
  for (const row of rows) {
    const teacher = String(row.teacher);
    teacherCounts.set(teacher, (teacherCounts.get(teacher) || 0) + 1);
    if (!teacherFirst.has(teacher)) teacherFirst.set(teacher, semesterKey(String(row.semester)));
  }
  const teachers = [...teacherCounts.keys()].sort((a, b) => {
    const byFirst = compareTuples(teacherFirst.get(a), teacherFirst.get(b));
    if (byFirst !== 0) return byFirst;
    const byCount = teacherCounts.get(b) - teacherCounts.get(a);
    if (byCount !== 0) return byCount;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  const teacherX = new Map(teachers.map((t, i) => [t, MARGIN_LEFT + i * X_STEP]));
  const semY = new Map(semesters.map((s, i) => [s, MARGIN_TOP + i * Y_STEP]));

  const width = MARGIN_LEFT + X_STEP * (teachers.length - 1) + RIGHT_PAD;
  const height = MARGIN_TOP + Y_STEP * (semesters.length - 1) + BOTTOM_PAD;

  // 同一格（同學期同教師）多個班次：小幅錯開，橫向優先。
  const slotCounter = new Map();
  const dots = rows.map((row, idx) => {
    const teacher = String(row.teacher);
    const sem = String(row.semester);
    const slotKey = `${sem} ${teacher}`;
    const slotIndex = slotCounter.get(slotKey) || 0;
    slotCounter.set(slotKey, slotIndex + 1);

    const x = teacherX.get(teacher) + ((slotIndex % 3) - 1) * 5;
    const y = semY.get(sem) + Math.floor(slotIndex / 3) * 5;

    const domain = String(row.primary_domain || '');
    const domainsJoined = domainsToArray(row.domains).join('、');
    let overview = String(row.overview || '').replace(/\n/g, ' ');
    if (overview.length > 120) overview = `${overview.slice(0, 120)}…`;

    return {
      key: `${sem}-${teacher}-${idx}`,
      x,
      y,
      color: colorFor(domain),
      href: row.href || '',
      row,
      domainsJoined,
      overview,
    };
  });

  // 學期橫格線：只在上學期（-1）標學年、畫實線；下學期虛淡線。
  const semLines = semesters.map((sem) => {
    const y = semY.get(sem);
    const [year, half] = sem.split('-');
    return { y, year, major: half === '1' };
  });

  const teacherCols = teachers.map((teacher) => ({
    teacher,
    x: teacherX.get(teacher),
    count: teacherCounts.get(teacher),
  }));

  const byTeacher = new Map();
  for (const row of rows) {
    const teacher = String(row.teacher);
    if (!byTeacher.has(teacher)) byTeacher.set(teacher, []);
    byTeacher.get(teacher).push(row);
  }
  const tableRows = teachers.map((teacher) => {
    const teacherRows = byTeacher.get(teacher) || [];
    return {
      teacher,
      count: teacherCounts.get(teacher),
      semestersText: teacherRows.map((r) => String(r.semester)).join('、'),
      domainText: mostCommon(teacherRows.map((r) => String(r.primary_domain || '')))
        .map(([domain, count]) => `${domain}×${count}`)
        .join('、'),
    };
  });

  return { semesters, teachers, width, height, dots, semLines, teacherCols, tableRows };
}

const INK = 'var(--c-ink)';
const INK_FAINT = 'var(--c-ink-faint)';
const LINE = 'var(--c-line)';
const LINE_SOFT = 'var(--c-line-soft)';
const BODY_FONT = 'var(--font-body)';

export default function CourseTimeline({ rows, domainOrder, intro }) {
  const slotOf = useMemo(() => {
    const m = new Map();
    for (const d of domainOrder) m.set(d.domain, d.slot);
    return m;
  }, [domainOrder]);

  const layout = useMemo(() => buildLayout(rows, slotOf), [rows, slotOf]);
  const wrapRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const track = (dot) => (event) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, dot });
  };
  const hide = () => setTooltip(null);

  return (
    <div className="text-token-base leading-relaxed text-ink" style={{ fontFamily: BODY_FONT }}>
      {intro}

      {/* 圖例：橫排放在圖上方，領域名帶校準過的分類色墨點。 */}
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-token-sm text-ink-muted">
        {domainOrder.map((d) => (
          <li key={d.domain} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: `var(--cat-${d.slot}-tx)` }}
            />
            {d.domain}
          </li>
        ))}
      </ul>

      {/* 縱向點陣圖。SVG 固定寬（~720px），桌面內容欄放得下、不橫拉；更窄時容器橫向捲動兜底。 */}
      <div
        ref={wrapRef}
        className="relative mt-4 overflow-x-auto rounded-token-md border border-line-soft bg-surface-raised"
      >
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="教師時序圖：縱軸為學期、橫向列頭為教師"
          style={{ display: 'block', minWidth: layout.width }}
        >
          {/* 學期橫格線 ＋ 學年標籤（左） */}
          {layout.semLines.map(({ y, year, major }) => (
            <g key={`sem-${y}`}>
              <line
                x1={MARGIN_LEFT - 8}
                y1={y}
                x2={layout.width - RIGHT_PAD + 6}
                y2={y}
                stroke={major ? LINE : LINE_SOFT}
                strokeWidth={1}
                strokeDasharray={major ? undefined : '2 5'}
                opacity={major ? 0.9 : 0.7}
              />
              {major && (
                <text x={MARGIN_LEFT - 16} y={y + 4} fontSize={12} fill={INK_FAINT} textAnchor="end">
                  {year}
                </text>
              )}
            </g>
          ))}

          {/* 教師列頭：斜 45° 排在頂部，名字後接開課筆數 */}
          {layout.teacherCols.map(({ teacher, x, count }) => (
            <g key={`col-${teacher}`}>
              <line
                x1={x}
                y1={MARGIN_TOP - 12}
                x2={x}
                y2={layout.height - BOTTOM_PAD + 6}
                stroke={LINE_SOFT}
                strokeWidth={1}
                opacity={0.6}
              />
              <text
                x={x}
                y={MARGIN_TOP - 18}
                fontSize={13}
                fill={INK}
                textAnchor="start"
                transform={`rotate(-45 ${x} ${MARGIN_TOP - 18})`}
              >
                {teacher}
                <tspan fill={INK_FAINT}> ({count})</tspan>
              </text>
            </g>
          ))}

          {/* 班次點：小面積鉻件，依 DESIGN.md 可用 ink 實色（校準過的 --cat-N-tx） */}
          {layout.dots.map((dot) => {
            const circle = (
              <circle
                cx={dot.x}
                cy={dot.y}
                r={DOT_R}
                fill={dot.color}
                stroke="var(--c-surface-raised)"
                strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={track(dot)}
                onMouseMove={track(dot)}
                onMouseLeave={hide}
              />
            );
            return dot.href ? (
              <a key={dot.key} href={dot.href} target="_blank" rel="noopener noreferrer">
                {circle}
              </a>
            ) : (
              <React.Fragment key={dot.key}>{circle}</React.Fragment>
            );
          })}
        </svg>

        {/* tooltip：紙面卡片，淡邊框＋faint shadow，不發光（no glow, ink only）。 */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-xs rounded-token-sm border border-line bg-surface-raised px-3 py-2 text-token-xs leading-relaxed text-ink shadow-token-sm"
            style={{
              left: Math.min(tooltip.x + 14, layout.width - 260),
              top: tooltip.y + 14,
            }}
          >
            <div className="font-semibold text-ink">
              {tooltip.dot.row.semester} 班次{tooltip.dot.row.class || '（無班次）'}｜{tooltip.dot.row.teacher}
            </div>
            <div className="mt-0.5 text-ink-muted">{tooltip.dot.domainsJoined}</div>
            {tooltip.dot.row.time_place && (
              <div className="text-ink-muted">{tooltip.dot.row.time_place}</div>
            )}
            {tooltip.dot.overview && <div className="mt-1 text-ink-muted">{tooltip.dot.overview}</div>}
          </div>
        )}
      </div>

      {/* 教師彙總表 */}
      <div className="mt-6 overflow-x-auto rounded-token-md border border-line-soft">
        <table className="w-full border-collapse text-token-sm">
          <thead>
            <tr className="bg-surface text-left">
              {['教師', '筆數', '出現學期', '主要領域分布'].map((h) => (
                <th key={h} className="border-b border-line-soft px-3 py-2 align-top font-semibold text-ink">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {layout.tableRows.map((r) => (
              <tr key={r.teacher} className="align-top">
                <td className="whitespace-nowrap border-b border-line-soft px-3 py-2 text-ink">{r.teacher}</td>
                <td className="border-b border-line-soft px-3 py-2 tabular-nums text-ink-muted">{r.count}</td>
                <td className="border-b border-line-soft px-3 py-2 text-ink-muted">{r.semestersText}</td>
                <td className="border-b border-line-soft px-3 py-2 text-ink-muted">{r.domainText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
