import { useCallback, useEffect, useState } from 'react';
import data from '../../data/brief-events.json';

/*
 * 標記層：這台瀏覽器記得的東西。使用者第五輪就點名要，這是它。
 *
 * **「新」＝這個 id 我沒看過，不是日期比大小。** 一開始想拿「上次打開的時間」去比 publishedAt，
 * 那條路是死的，有兩個各自足以殺死它的理由：
 *
 * 1. **publishedAt 是日期，不是時刻。** 上次打開是今天早上九點，一篇東西的日期是「今天」——
 *    它是九點前還是九點後出的？資料裡沒有這個資訊。拿日期去比時刻，答案會是猜的。
 * 2. **月精度的來源根本沒有日子。** NBER 與 IMF 那 24 篇的日期全部是 2026-07-01（見資料契約的
 *    datePrecision）。任何以日期為準的「新」，都會讓它們在每個月 1 號那天一次噴出 24 篇、
 *    其餘 30 天一篇都沒有——而那個 1 號是資料倉為了排序補的，沒有人講過那一天。
 *
 * 改成記 id 之後，兩個問題一起消失：看過就是看過，跟它宣稱自己哪天出生無關。
 *
 * **不自動標已讀。** 打開頁面就把畫面上的東西全部記成看過，會讓日報在你看它的那一秒清空，
 * 重新整理就什麼都不剩——那不是讀完，那是弄丟。標記是動作，要按。
 */

const KEYS = {
  seen: 'canvaslab:brief:seen',
  kept: 'canvaslab:brief:kept',
  going: 'canvaslab:brief:going',
};

/* 這份資料裡現在還存在的 id。用來剪掉已經不在庫裡的標記——投影每天換一批，不剪的話
   localStorage 會一直長，而且長的是一堆再也不會被問到的 id。 */
const LIVE = new Set([...data.items.map((i) => i.id), ...data.events.map((e) => e.id)]);

const read = (key) => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((id) => LIVE.has(id)) : []);
  } catch {
    return new Set();
  }
};

const write = (key, set) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* 無痕模式等等。標記丟了不該讓頁面壞掉——它是便利，不是資料。 */
  }
};

/*
 * 一種標記一個 hook。三種標記（看過／留著／我要去）行為完全一樣，差別只在存在哪個鍵，
 * 所以只有一份實作。
 *
 * 第一次來的人，seen 是空的＝247 篇全部沒看過＝日報就是全部。那是對的：你確實沒看過。
 */
function useMarks(key) {
  const [marks, setMarks] = useState(() => read(key));

  /* 另一個分頁動了同一組標記時跟著走。同一個站開兩個分頁、在一邊按了已讀、另一邊還顯示
     未讀，那兩個畫面會對同一件事講不同的話。 */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) setMarks(read(key));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const has = useCallback((id) => marks.has(id), [marks]);

  const toggle = useCallback(
    (id) => {
      setMarks((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        write(key, next);
        return next;
      });
    },
    [key],
  );

  const add = useCallback(
    (ids) => {
      setMarks((prev) => {
        const next = new Set([...prev, ...ids]);
        write(key, next);
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    setMarks(() => {
      write(key, new Set());
      return new Set();
    });
  }, [key]);

  return { marks, has, toggle, add, clear };
}

export const useSeen = () => useMarks(KEYS.seen);
export const useKept = () => useMarks(KEYS.kept);
export const useGoing = () => useMarks(KEYS.going);
