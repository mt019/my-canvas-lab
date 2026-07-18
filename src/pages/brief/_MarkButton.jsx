/*
 * 標記一件東西的那顆鍵。留著（讀的東西）與我要去（活動）共用一顆——它們是同一個動作，
 * 差別只在那個東西是拿來讀的還是要到場的。
 *
 * 用 ■/□ 而不是星星或愛心：這個站已經有一套開關的講法（來源逐個可切、整類一起切都是
 * ■/□），標記是同一種東西——**開著或關著，沒有程度**。星星會讓人以為可以給幾顆，
 * 那是排序、是評分，正是這個站在殺的病。
 *
 * 沒有動畫、沒有「已加入！」的提示。按下去那格從 □ 變 ■，字從「留著」變「留著了」，
 * 這就是回饋。標籤本身已經以「了」結尾的（「我去了」）就不再加一個，免得變成「我去了了」。
 */
export default function MarkButton({ on, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      data-mark={label}
      className={`shrink-0 text-token-xs tabular-nums transition-colors duration-fast hover:text-accent ${
        on ? 'text-ink-muted' : 'text-ink-faint'
      }`}
    >
      <span className="mr-1">{on ? '■' : '□'}</span>
      {on && !label.endsWith('了') ? `${label}了` : label}
    </button>
  );
}
