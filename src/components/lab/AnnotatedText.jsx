import AnnotatedHtml from './AnnotatedHtml';
import { noteHtml } from './textNotes';

/*
 * 一段帶 [^id] 註標的母本字串，渲染成帶浮卡的正文。
 * 編號與 payload 由呼叫端的 buildNotes 一次算好（見 textNotes.js），因為編號依賴
 * 整頁的渲染順序，單獨一段看不出來。
 */
export default function AnnotatedText({ text, numberOf, notes, className }) {
  return <AnnotatedHtml html={noteHtml(text, numberOf)} notes={notes} className={className} />;
}
