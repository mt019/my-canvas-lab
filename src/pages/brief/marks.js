import { useCallback, useEffect, useMemo, useState } from 'react';
import data from '../../data/brief-events.json';
import { queuePersonalMutation, watchPersonalState } from '../../personal-state/sync';
import { sourceLabel } from './data';

/*
 * 標記層：這台瀏覽器記得的東西。使用者第五輪就點名要，這是它。
 *
 * 三種標記，但**存法只有兩種，而且分界不是隨便切的**：
 *
 *   看過（seen）      只記 id。
 *   留著 / 我要去      記整筆快照。
 *
 * 分界在**這個標記在講誰**。「看過」講的是我跟那個 id 的關係——那個 id 從投影裡輪替出去
 * 之後，再也不會有人問「它我看過了嗎」，記著只是讓 localStorage 一直長。「留著」講的是
 * 那個東西本身：我要它留下來，那是它存在的唯一理由。
 *
 * **這件事是一個 bug 換來的，不是設計潔癖。** 上一版三種標記共用同一份實作，一律只記 id，
 * 而且一律剪掉「已經不在這份投影裡」的 id。但資料倉的投影是輪替的——每個來源只送最新
 * 12 篇（sync-to-canvas.mjs 的 ITEM_QUOTA_DEFAULT），所以一篇東西幾天內就會被新的擠出去。
 * 於是：你按了留著，過幾天資料倉一 sync，那筆標記被當成「不在庫裡的垃圾」剪掉，東西連同
 * 你的標記一起消失，**而畫面上一個字都不會說**。一個會把你留的東西弄丟的「留著」，比沒有
 * 留著更糟——後者你至少知道自己得自己記。
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
  went: 'canvaslab:brief:went',
};

/* 這份投影裡現在還在的東西。 */
const LIVE = new Map([
  ...data.items.map((i) => [i.id, i]),
  ...data.events.map((e) => [e.id, e]),
]);

export const isLive = (id) => LIVE.has(id);

/* 這個 id 在這批投影裡的那一筆，沒有就是 null。「留著的」那一區靠它決定要畫新的還是
   退回快照——快照是輪替之後的退路，不是主要來源。庫裡的東西還在時，畫面上該是庫裡
   那一筆：摘要改過、售票結束日往後延過，快照都不會知道。 */
export const liveOf = (id) => LIVE.get(id) ?? null;

/*
 * 一筆標記存什麼。
 *
 * **只存「這個東西不在了也還認得出它」所需的最少欄位**：標題、連結、日期、來源、標記的時間。
 * 摘要、講者、票價那些都不存——它們是投影的東西，投影還在的時候直接拿新的render（見
 * Brief 的「留著的」那一區：live 的用 live 的畫，只有輪替出去的才退回快照）。存快照不是
 * 為了做一份第二資料庫，是為了在資料倉輪替之後，那一行還說得出它是什麼、還點得進去。
 *
 * markedAt 是時刻不是日期：這是這台瀏覽器自己按下去的那一刻，我們有這個資訊。
 * 東西本身的日期（publishedAt／活動日）另存 date，兩個不能混——一篇 7/15 的論文我今天
 * 才留，「7/15」跟「今天留的」講的是兩件事。
 */
export function snapshot(x, kind) {
  return {
    id: x.id,
    kind,
    title: x.title,
    url: kind === 'event' ? (x.detailUrl ?? x.eventUrl ?? null) : (x.url ?? null),
    date: kind === 'event' ? x.date : x.publishedAt,
    endDate: kind === 'event' ? (x.endDate ?? null) : null,
    time: kind === 'event' ? (x.time ?? null) : null,
    venue: kind === 'event' ? (x.venue ?? null) : null,
    speaker: kind === 'event' ? (x.speaker ?? null) : null,
    host: kind === 'event' ? (x.host ?? null) : null,
    poster: kind === 'event' ? (x.poster ?? null) : null,
    posterSourceUrl: kind === 'event' ? (x.posterSourceUrl ?? null) : null,
    description: kind === 'event' ? (x.description ?? null) : null,
    source: x.source,
    sourceLabel: sourceLabel(x.source),
    markedAt: new Date().toISOString(),
  };
}

export const snapshotItem = (i) => snapshot(i, 'item');
export const snapshotEvent = (e) => snapshot(e, 'event');

/* ── 看過：一組 id ───────────────────────────────────────────────────────── */

const readIds = (key) => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    /* 剪掉已經不在投影裡的。對「看過」這是對的：那個 id 再也不會被問到，留著只會讓這份
       清單一直長。**只有這一種標記可以這樣剪**，理由見檔頭。 */
    return new Set(Array.isArray(raw) ? raw.filter((id) => LIVE.has(id)) : []);
  } catch {
    return new Set();
  }
};

const readRecords = (key) => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!Array.isArray(raw)) return new Map();
    /* 這裡不剪。輪替出去的照樣留著——那正是你按它的原因。 */
    return new Map(raw.filter((r) => r && typeof r.id === 'string').map((r) => [r.id, r]));
  } catch {
    return new Map();
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value instanceof Map ? [...value.values()] : [...value]));
  } catch {
    /* 無痕模式、或 localStorage 滿了。標記丟了不該讓頁面壞掉——它是便利，不是資料。 */
  }
};

/*
 * 跨分頁同步。同一個站開兩個分頁、在一邊按了已讀、另一邊還顯示未讀，那兩個畫面會對
 * 同一件事講不同的話。
 */
function useStorageSync(key, reload) {
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) reload();
    };
    window.addEventListener('storage', onStorage);
    const unwatch = watchPersonalState((changedKey) => {
      if (changedKey === key) reload();
    });
    return () => {
      window.removeEventListener('storage', onStorage);
      unwatch();
    };
  }, [key, reload]);
}

/*
 * 看過。
 *
 * 第一次來的人，seen 是空的＝247 篇全部沒看過＝日報就是全部。那是對的：你確實沒看過。
 */
export function useSeen() {
  const [marks, setMarks] = useState(() => readIds(KEYS.seen));
  useStorageSync(KEYS.seen, useCallback(() => setMarks(readIds(KEYS.seen)), []));

  const has = useCallback((id) => marks.has(id), [marks]);

  const add = useCallback((ids) => {
    setMarks((prev) => {
      const next = new Set([...prev, ...ids]);
      write(KEYS.seen, next);
      ids.forEach((id) => queuePersonalMutation({
        state: 'seen', entityType: 'brief', entityId: id, active: true,
      }));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setMarks(() => {
      marks.forEach((id) => queuePersonalMutation({
        state: 'seen', entityType: 'brief', entityId: id, active: false,
      }));
      write(KEYS.seen, new Set());
      return new Set();
    });
  }, [marks]);

  return { marks, has, add, clear };
}

/*
 * 留著／我要去／我去了。三種行為完全一樣，差別只在存在哪個鍵，所以只有一份實作。
 *
 * toggle 吃的是整筆快照不是 id——**按下去的那一刻是唯一還拿得到那個東西的時候**。等到
 * 要畫「留著的」那一頁時才想去查它是什麼，資料可能已經輪替走了，那時候手上只剩一個 id，
 * 什麼都畫不出來。
 */
function useRecords(key, state, entityType) {
  const [marks, setMarks] = useState(() => readRecords(key));
  useStorageSync(key, useCallback(() => setMarks(readRecords(key)), [key]));

  const has = useCallback((id) => marks.has(id), [marks]);

  const toggle = useCallback(
    (record) => {
      setMarks((prev) => {
        const next = new Map(prev);
        const active = !next.has(record.id);
        if (!active) next.delete(record.id);
        else next.set(record.id, record);
        write(key, next);
        queuePersonalMutation({ state, entityType, entityId: record.id, active, metadata: record });
        return next;
      });
    },
    [key, state, entityType],
  );

  const remove = useCallback(
    (id) => {
      setMarks((prev) => {
        const next = new Map(prev);
        next.delete(id);
        write(key, next);
        queuePersonalMutation({ state, entityType, entityId: id, active: false });
        return next;
      });
    },
    [key, state, entityType],
  );

  /* 最近標的在前面。這是這一份清單唯一的排序，而且是它自己的時間軸——不照東西本身的
     日期排：你上禮拜留的那篇 2019 年的論文，是上禮拜的事，不是 2019 年的事。 */
  const list = useMemo(
    () => [...marks.values()].sort((a, b) => (b.markedAt ?? '').localeCompare(a.markedAt ?? '')),
    [marks],
  );

  return { marks, has, toggle, remove, list, size: marks.size };
}

export const useKept = () => useRecords(KEYS.kept, 'kept', 'item');
export const useGoing = () => useRecords(KEYS.going, 'going', 'event');
/* 我去了：與我要去各自獨立的一份。沒先標「我要去」也能直接按「我去了」（臨時去的），
   兩份互不牽動——同一份實作，只差存哪個鍵。 */
export const useWent = () => useRecords(KEYS.went, 'went', 'event');
