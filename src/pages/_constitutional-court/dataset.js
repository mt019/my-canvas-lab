// 憲法法庭快照的唯一取用入口：原始 JSON（含 編碼表）進、解碼完成的資料出。
// 頁面一律 import 這支，不要直接 import '../../data/constitutionalCourt.json'——
// 直接拿原始檔會讀到查表索引（數字）而非物件；validate-cc-dataset.mjs 守這條。
import raw from '../../data/constitutionalCourt.json';
import { decodeDataset } from './decode.js';

export default decodeDataset(raw);
