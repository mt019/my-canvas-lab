// 快照解碼：constitutionalCourt.json 的 `編碼表` 還原層。
//
// 資料倉 build-app-json.mjs 對 文件 裡高度重複的欄位做了查表編碼——7,228 筆文件的
// 職權分類只有 875 種相異值、審查結論 86 種，逐筆展開曾把快照撐到 11.15MB，編碼後
// 6.97MB。編碼規則在資料倉（建編碼表），這裡是唯一的解碼入口：把每筆文件裡的索引
// 換回 編碼表 裡的物件參照。只做賦值不做複製，所以幾千筆文件會共用同一個物件——
// 讀沒問題（前端全程唯讀，改這條約定前先 grep 賦值），千萬別就地改寫這些欄位。
//
// 冪等：解碼過的資料再過一次是 no-op（編碼表已刪），node 腳本與前端可放心共用。
export function decodeDataset(data) {
  const 編碼表 = data.編碼表;
  if (!編碼表) return data;
  for (const [欄, 表] of Object.entries(編碼表)) {
    for (const d of data.文件) {
      if (d[欄] !== undefined) d[欄] = 表[d[欄]];
    }
  }
  delete data.編碼表;
  return data;
}
