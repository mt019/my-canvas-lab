import { useEffect, useLayoutEffect } from 'react';

/*
 * 量位置、量高度的 effect 在伺服器上沒有意義——那裡沒有版面可量，React 也會出一段
 * useLayoutEffect 的警告。建置時（各站的 entry-server）改用 useEffect，它在伺服器上
 * 本來就不執行；瀏覽器裡仍然是 useLayoutEffect，畫面繪出前就把位置定好，不會閃一下。
 */
export const useLayoutEffectOnClient = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default useLayoutEffectOnClient;
