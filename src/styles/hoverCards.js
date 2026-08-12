import { useSyncExternalStore } from 'react';

/*
 * 浮出註卡的開關。與色票、紙紋同一層的閱讀偏好：存 localStorage、開頁即生效、
 * 預設開。關掉之後引用與術語的虛線底線照舊；點擊時引用捲到章末的資料來源
 * 清單，術語直接進它自己的頁。
 *
 * 預設值用「沒有那個 key」表示，所以清掉瀏覽器資料就回到預設，不會留下一個
 * 寫著 'on' 的殘值要遷移。
 */
const KEY = 'site-hover-cards';
const listeners = new Set();

export function getHoverCardsEnabled() {
  try {
    return window.localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setHoverCardsEnabled(on) {
  try {
    if (on) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, 'off');
  } catch {
    /* 私隱模式沒有 localStorage：本頁內照樣切換，只是不記住 */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useHoverCardsEnabled() {
  // 第三個參數是 prerender 用的：伺服器端沒有 localStorage，一律當開。
  return useSyncExternalStore(subscribe, getHoverCardsEnabled, () => true);
}
