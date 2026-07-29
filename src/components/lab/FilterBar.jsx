/*
 * 清單頁上方那一列篩選控制：上下細線夾著一排控制項，底下一行「列出幾筆」。
 *
 * 朱家驊那頁與手記那頁各自刻過一份，兩份的 class 串一樣（`flex flex-wrap items-center
 * gap-x-4 gap-y-3 border-y border-line py-3` ＋ 一行 tabular-nums 的計數）。抽在這裡之後，
 * 篩選列的形狀只有一份定義，控制項本身仍由各頁自己給（SearchField、Dropdown、切換鈕，
 * 每頁需要的不一樣，這裡不猜）。
 *
 * `label` 是選配的前綴字：只有一顆下拉的時候，光一顆孤零零的按鈕看不出它在篩什麼。
 * `note` 是控制項底下那行字（通常是「列出 N 筆」）。
 */
export default function FilterBar({ label, note, children, className = '' }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-line py-3">
        {label ? <span className="text-token-sm text-ink-muted">{label}</span> : null}
        {children}
      </div>
      {note ? <p className="mt-3 text-token-sm tabular-nums text-ink-faint">{note}</p> : null}
    </div>
  );
}
