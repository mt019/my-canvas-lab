import React, { useState, useEffect } from 'react';
import {
  Wind, Factory, Car, Building2, Scale, Calculator,
  ChevronRight, Info, Shield, BookOpen, TrendingUp,
  ClipboardList, AlertTriangle, Gavel, CheckCircle,
  ArrowRight, History, Landmark,
} from 'lucide-react';

// ─── Fee rate data ──────────────────────────────────────────────────────────

const POLLUTANTS = {
  SOx: {
    name: '硫氧化物', abbr: 'SOx',
    color: '#d4c4a8', textColor: '#6a5030',
    desc: '燃燒含硫燃料（煤、重油）產生，為酸雨與呼吸道疾病主因。',
    tiers: [
      { label: '第一級', range: '季排放 > 40 公噸' },
      { label: '第二級', range: '14 ～ 40 公噸' },
      { label: '第三級', range: '1 ～ 14 公噸' },
      { label: '第四級', range: '0.01 ～ 1 公噸', flat: true },
    ],
    rates: {
      zone2:  { q23: [9, 7, 5, '450 元/季'],  q14: [13, 11, 9,  '450 元/季'] },
      zone13: { q23: [10.5, 8.5, 6, '450 元/季'], q14: [15, 13, 10, '450 元/季'] },
    },
  },
  NOx: {
    name: '氮氧化物', abbr: 'NOx',
    color: '#a8c4b4', textColor: '#2a6048',
    desc: '高溫燃燒過程產生，為臭氧與 PM2.5 的前驅物。',
    tiers: [
      { label: '第一級', range: '季排放 > 70 公噸' },
      { label: '第二級', range: '24 ～ 70 公噸' },
      { label: '第三級', range: '1 ～ 24 公噸' },
      { label: '第四級', range: '0.01 ～ 1 公噸', flat: true },
    ],
    rates: {
      zone2:  { q23: [10, 8, 6,    '450 元/季'], q14: [14, 12, 10,  '450 元/季'] },
      zone13: { q23: [12, 10, 7.5, '450 元/季'], q14: [16, 14, 12, '450 元/季'] },
    },
  },
  VOCs: {
    name: '揮發性有機物', abbr: 'VOCs',
    color: '#b8a8d4', textColor: '#50388a',
    desc: '石化、塗料、印刷等行業排放，為臭氧前驅物，部分具毒性。',
    tiers: [
      { label: '第一級', range: '季排放 > 90 公噸' },
      { label: '第二級', range: '50 ～ 90 公噸' },
      { label: '第三級', range: '7.5 ～ 50 公噸' },
      { label: '第四級', range: '1 ～ 7.5 公噸' },
    ],
    rates: {
      zone2:  { q23: [30, 25, 20, 15], q14: [40, 35, 30, 25] },
      zone13: { q23: [35, 30, 25, 20], q14: [45, 40, 35, 30] },
    },
  },
  PM: {
    name: '粒狀污染物', abbr: 'PM',
    color: '#c4b4a4', textColor: '#6a5848',
    desc: '含細懸浮微粒（PM2.5），直接危害呼吸道與心血管健康。',
    tiers: [
      { label: '第一級', range: '製程季排放 > 15 公噸' },
      { label: '第二級', range: '10 ～ 15 公噸' },
      { label: '第三級', range: '1 ～ 10 公噸' },
      { label: '第四級', range: '0.01 ～ 1 公噸', flat: true },
    ],
    rates: {
      zone2:  { q23: [43, 38, 32, '450 元/季'], q14: [51, 46, 38, '450 元/季'] },
      zone13: { q23: [51, 46, 38, '450 元/季'], q14: [60, 55, 46, '450 元/季'] },
    },
  },
};

// ─── Section content ────────────────────────────────────────────────────────

const ELEMENTS_DATA = [
  {
    id: 'subject', no: '01', title: '義務主體',
    icon: Factory, color: '#d0e8d8', textColor: '#3a6848', badge: '三類',
    content: [
      '固定污染源：排放空氣污染物之公私場所（工廠、電廠、焚化廠等），每季申報排放量並繳費。',
      '移動污染源：燃料之銷售者或進口者（由供應端代繳，依燃料含硫量分三級計費），再由市場機制轉嫁消費者。',
      '營建工程：承攬或辦理達一定規模之工程業者，依工程類別、施工面積與工期計費，由地方主管機關徵收。',
    ],
  },
  {
    id: 'object', no: '02', title: '課徵客體',
    icon: Wind, color: '#e0d0e8', textColor: '#683878', badge: '6 類污染物',
    content: [
      '固定源課徵項目：SOx（硫氧化物）、NOx（氮氧化物）、VOCs（揮發性有機物）、PM（粒狀污染物含 PM2.5）、重金屬（鉛鎘汞砷六價鉻）、戴奧辛。',
      '起徵門檻（固定源）：SOx、NOx 季排放量 > 0.01 公噸；VOCs > 1 公噸/季。低於門檻者免徵，但仍負申報義務。',
      '移動源：汽柴油依含硫量分三級（一級最潔淨，費率最低；使用天然氣或液化石油氣者，SOx 適用零費率）。',
    ],
  },
  {
    id: 'basis', no: '03', title: '計費基準',
    icon: Calculator, color: '#e8e0c8', textColor: '#686030', badge: '累進費率',
    content: [
      '基本公式：費額 = 【Σ（各級排放量 × 各級費率）】× D × E',
      '三層費率結構：①防制區等級（二級 vs. 一三級，依當地空品等級；一三級費率較高）②季節差別（Q1/Q4 冬季費率高於 Q2/Q3 夏季）③排放量累進分級（排放量越大適用費率越高）。',
      '優惠係數 D（40%～100%）：裝設控制設備使排放濃度低於管制限值 50% 以下，依符合條件之排放量佔全廠比率，最低可享四折優惠（D = 40%）；條件不符者 D = 100%（無折扣）。',
      '減量係數 E（70%～100%，僅 Q1/Q4）：當季實際排放量較前三年同季基準平均減少達 30% 以上者，E = 70%（費額打七折）；減量比例愈低，E 愈趨近 100%；線性內插計算。Q2/Q3 不適用（E 恆為 1）。',
    ],
  },
];

const QUARTERLY_DEADLINES = [
  { q: 'Q1', period: '1–3 月', deadline: '4 月 30 日', season: 'q23' },
  { q: 'Q2', period: '4–6 月', deadline: '7 月 31 日', season: 'q23' },
  { q: 'Q3', period: '7–9 月', deadline: '10 月 31 日', season: 'q23' },
  { q: 'Q4', period: '10–12 月', deadline: '次年 1 月 31 日', season: 'q14' },
];

const PROCEDURE_STEPS = [
  {
    step: '01', title: '申報義務與截止日',
    icon: ClipboardList, color: '#d0dce8', textColor: '#3a5878',
    items: [
      '固定源業者須於每季結束後次月底前，向直轄市或縣市主管機關申報當季排放量（Q1→4月30日；Q2→7月31日；Q3→10月31日；Q4→次年1月31日）。',
      '逾期申報：未於截止日前完成申報者，主管機關得依空污法第76條裁處罰鍰，並按查核方式核算費額補繳；不得以「尚未計算完畢」為由延後。',
      '申報方式：登入環境部「固定污染源空污費申報系統」線上申報，系統自動計費；達重大排放門檻者，CEMS 數據由系統直接匯入，不得改以手動數值替代。',
      '移動源（燃料端）：燃料進口商或煉製廠於進口或出廠時即觸發繳費義務，免季末申報，由海關或能源主管機關協助稽核數量。',
    ],
  },
  {
    step: '02', title: '排放量計量方式',
    icon: Calculator, color: '#d0e8d8', textColor: '#3a6848',
    items: [
      '連續自動監測（CEMS）：達法定規模之固定源強制安裝，數據即時傳輸，為最高位階之排放量認定依據；設備異常期間不得自行免報，應依環境部公告之「異常期間推估方式」補算。',
      '質量平衡法：依原料投入量、製程產出量及廢棄物量推估排放，為 VOCs 等逸散型污染物之主要計量方式；申報時須檢附原料購入憑證及盤點紀錄供查核。',
      '公告排放係數法：乘以生產量計算，適用中小型固定源；業者可另提具代表性之自廠實測數據申請認可「自廠排放係數」，經主管機關核定後替代公告值使用，有效期限通常三年，期滿須重新申請。',
    ],
  },
  {
    step: '03', title: '核算、繳費與延滯金',
    icon: Scale, color: '#e8e0c8', textColor: '#686030',
    items: [
      '費額核算：主管機關收到申報後核算費額，作成核課處分（繳費通知），送達義務人。義務人應於繳費通知所載期限（通常為送達後 30 日）內繳納。',
      '延滯金（§74）：逾繳費期限起每日加徵滯納金額之 0.5%，並另按郵政儲金一年期定存固定利率計日加計利息（兩者並行，無累計上限）。實務上長期欠繳者延滯金可超過本金；繳清本金後延滯金方停止計算。',
      '分期繳納：費額龐大（通常逾一定金額門檻）者，得事前申請分期繳納，最多分 __ 期，惟須提供相當之擔保（如銀行保證書），且各期仍需依期付款，遲誤一期視同全部到期。',
      '優惠係數 D 申請：需於申報同時或申報前提出，不得事後補申請；主管機關審核防制設備符合條件後方予適用，生效溯及當季。',
    ],
  },
  {
    step: '04', title: '核課時效與追繳',
    icon: Shield, color: '#e0d0e8', textColor: '#683878',
    items: [
      '核課時效（追徵期間）：依行政程序法第131條，公法上請求權原則上自得行使起 5 年間不行使而消滅。主管機關對已申報但核算有誤、或查獲低報者，得於 5 年內補徵差額費額。',
      '故意逃漏（虛偽申報）之例外：若義務人有詐欺、虛偽申報等故意行為，核課時效延長至行為終了後 10 年，防止惡意業者藉時效規避追繳。',
      '強制執行時效：核課處分確定（義務人未申請救濟或救濟確定）後，行政執行之執行時效為 5 年（行政執行法第7條）；逾期未移送執行則請求權消滅，義務人即免責。',
      '行政罰鍰時效：違反申報義務等行政罰，依行政罰法第27條，裁處權時效為 3 年，自違規行為終了日起算；違規行為繼續者（如持續不申報），自行為終了時起算。',
    ],
  },
  {
    step: '05', title: '稽查機制',
    icon: Info, color: '#d8e8d0', textColor: '#487840',
    items: [
      '書面稽查：主管機關定期審核申報資料與 CEMS 監測紀錄，比對生產量、燃料使用量是否相符；異常申報列為現場稽查優先對象。稽查選案以排放量高、歷年申報波動異常者為主。',
      '現場稽查：稽查人員可至廠區要求業者提供生產紀錄、燃料採購憑證、防制設備運轉日誌；得委託環境檢測機構進行實地排放量量測，量測費用由業者承擔。',
      '外部資料交叉比對：以海關進出口燃料量、電力使用量（台電提供）、工廠登記產能等外部資料交叉驗證，偵測異常低報；近年亦引入衛星遙測輔助大面積工業區排放監控。',
    ],
  },
  {
    step: '06', title: '爭議救濟與期限',
    icon: Gavel, color: '#e8d8d0', textColor: '#784030',
    items: [
      '申請復查：對費額核課處分不服者，應於處分書送達後 30 日內向原處分機關申請復查（類稅法復查，非行政訴訟前置程序，但為訴願前置）；逾期不申請，處分即確定，不得再爭執費額。',
      '訴願：對復查決定不服者，應於決定書送達後 30 日內提起訴願（訴願法第14條）；訴願機關為上級主管機關或訴願管轄機關，通常在 3 個月內作成決定（得延長 2 個月）。',
      '行政訴訟：對訴願決定不服者，應於決定書送達後 2 個月內向行政法院提起撤銷訴訟（行政訴訟法第106條）；逾期起訴，法院以裁定駁回，處分確定。行政訴訟進行中，原則上仍須先繳費（暫停執行需聲請停止執行）。',
    ],
  },
];

const EFFECTS_DATA = [
  {
    id: 'duty', title: '繳費義務之成立',
    icon: Scale, color: '#d0dce8', textColor: '#3a5878',
    content: [
      '空污費屬「金錢給付公法義務」。主管機關依義務人申報之排放量核算費額，作成行政處分（繳費通知），義務人須於期限內依通知金額繳納，逾期不發生使義務消滅之效果。',
      '法律關係特徵：義務人自行申報排放量（具公示效）→ 機關核算費額（核課處分）→ 義務人依限履行（給付義務）。核課處分送達即生拘束力，義務人如有不服須依行政救濟途徑，不得以不服為由拒繳。',
    ],
  },
  {
    id: 'enforce', title: '未履行之強制效果',
    icon: Gavel, color: '#e8e0c8', textColor: '#686030',
    content: [
      '逾期未繳費（§74）：每逾一日加徵 0.5% 滯納金，並另計郵政儲金一年期定存利率之利息（兩者並行）。滯納金性質上為行政加給，非稅法之「利息」，旨在促使義務人迅速履行並彌補基金資金成本。',
      '長期欠繳：主管機關得移送行政執行署依《行政執行法》執行，手段包括：命義務人報告財產狀況、扣押動產不動產、限制出境，直至拍賣財產以清償費額及滯納金。',
      '情節重大者另可依空污法罰則處以罰鍰（罰鍰與補繳費額並行，互不取代），構成「雙重行政不利益」——但罰鍰之裁量需符合比例原則，不得逾越法律所定上限。',
    ],
  },
];

const FINANCE_DATA = {
  // 收入來源與徵收主體（附中央地方分工）
  revenue: [
    {
      label: '固定污染源費', pct: 72, color: '#a8c4b4',
      collector: '地方', collectorNote: '直轄市、縣（市）主管機關徵收',
      fund: '地方空污基金', note: '工廠、電廠每季申報繳費',
    },
    {
      label: '移動污染源費', pct: 24, color: '#b8a8d4',
      collector: '中央', collectorNote: '環境部統一徵收（燃料供應端）',
      fund: '中央空污基金', note: '依各縣市車輛數、空品等因子回分配地方',
    },
    {
      label: '營建工程費', pct: 4, color: '#d4c4a8',
      collector: '地方', collectorNote: '直轄市、縣（市）主管機關徵收',
      fund: '地方空污基金', note: '達規模工程依施工面積與工期計費',
    },
  ],
  // 基金支出結構
  expenditure: [
    { label: '移動源管制', pct: 37.5, color: '#a8c4b4' },
    { label: '空品淨化區設置', pct: 19.6, color: '#b8a8d4' },
    { label: '執行空污防制計畫', pct: 19.6, color: '#d4c4a8' },
    { label: '固定源管制', pct: 11.9, color: '#c4d4a8' },
    { label: '策略推動/研發', pct: 9.3, color: '#c4b4a4' },
    { label: '空品監測', pct: 1.4, color: '#b4c4d4' },
    { label: '一般行政建設', pct: 0.8, color: '#d4c4b8' },
  ],
  // 中央地方基金關係
  centralLocal: [
    {
      title: '中央空污基金',
      color: '#d0dce8', textColor: '#3a5878',
      items: [
        '來源：移動源費（燃料供應端全數繳入）',
        '管理：環境部空污基金管理委員會',
        '用途：全國性空污防制計畫、研發、跨縣市空品管制、補助地方防制工作',
        '撥付地方：依各縣市車輛數、空品狀況、防制績效等公式分配，不直接由地方留存',
      ],
    },
    {
      title: '地方空污基金',
      color: '#d0e8d8', textColor: '#3a6848',
      items: [
        '來源：固定源費及營建工程費（由縣市政府徵收，直接入地方基金）',
        '管理：各直轄市、縣（市）政府設管理委員會',
        '用途：地方固定源管制、空品淨化區設置、地方空品監測站維護',
        '中央監督：地方基金用途須符合空污法及環境部核定計畫，非地方可自由運用',
      ],
    },
  ],
};

const HISTORY_TIMELINE = [
  {
    year: '1975', label: '空污法制定',
    color: '#d0dce8', textColor: '#3a5878',
    desc: '《空氣污染防制法》首次制定，確立基本管制框架，但尚無空污費條款；管制手段以行政許可為主。',
  },
  {
    year: '1992', label: '費徵授權入法',
    color: '#d0e8d8', textColor: '#3a6848',
    desc: '空污法大幅修正，第10條明定主管機關得依排放種類及排放量徵收空氣污染防制費，確立「污染者付費」法律依據；同年確立設置「空氣污染防制基金」，專款專用，為特別公課立法模式之先例。',
  },
  {
    year: '1995', label: 'SOx 費開徵',
    color: '#e0d8c8', textColor: '#685830',
    desc: '固定污染源空污費正式實施，首先徵收硫氧化物（SOx）排放費；移動污染源費同步開辦，依汽柴油含硫量三級計費，由燃料銷售商代繳。此為台灣最早以經濟誘因工具管制空污的實踐。',
  },
  {
    year: '1996–1998', label: 'NOx 納入徵收',
    color: '#e0d0e8', textColor: '#683878',
    desc: '氮氧化物（NOx）納入固定源徵收範圍，擴大污染物覆蓋；費率首度調整，並引入季節差別費率雛形（夏季臭氧問題較冬季嚴重，費率設計開始分化）。',
  },
  {
    year: '2002', label: '費率首次全面調整',
    color: '#d8e8d0', textColor: '#487840',
    desc: '對 SOx、NOx 費率進行系統性調整，提高費率以強化減量誘因；同步評估 VOCs 徵費可行性，為後續開徵奠基。',
  },
  {
    year: '2007', label: 'VOCs 費開徵',
    color: '#e8e0c8', textColor: '#686030',
    desc: '揮發性有機物（VOCs）正式納入固定源徵費範圍，成為繼 SOx、NOx 之後第三類主要課徵污染物；此政策背景為：1990年代以來 O₃（臭氧）濃度不降反升，顯示前驅物 VOCs 管制不足。',
  },
  {
    year: '2010', label: '費率結構大幅改革',
    color: '#d8d0e8', textColor: '#504878',
    desc: '引入三層累進費率結構：①防制區等級（一三級vs二級）②季節差別（Q1/Q4冬季高於Q2/Q3夏季）③排放量累進分級。同時建立優惠係數D（裝設防制設備可享四至十折優惠）及減量係數E（冬季實際減排享費率折扣），形成雙軌誘因機制。',
  },
  {
    year: '2018', label: '空污法全面修正',
    color: '#d0e8e8', textColor: '#306870',
    desc: '空污法修正，空污費條文由舊法第10條改為現行第16條（條次重新編排）；強化 PM2.5 獨立管制規範，PM 類費率計費基準細化；徵收機關由環保署（現環境部）統一督導，固定源由直轄市/縣市政府徵收，移動源由中央統一辦理。',
  },
  {
    year: '2020–迄今', label: '持續精進',
    color: '#e8d8d0', textColor: '#785048',
    desc: '配合國家空品改善方案（AQMP）定期檢討費率，移動源費率隨燃料品質提升動態調整；積極推動以 CEMS 即時數據取代估算申報，提高課徵精確度；並研議將戴奧辛、重金屬費率接軌實際毒性危害，反映環境成本。',
  },
];

const EVASION_DATA = [
  {
    id: 'types', title: '常見逃漏型態',
    icon: AlertTriangle, color: '#e8d8c8', textColor: '#784830',
    badge: '行為態樣',
    items: [
      { label: '低報排放量', desc: '申報量遠低於實際排放：如以行業排放係數申報但高污染製程未列入、調降生產量以縮小計費基礎，或刻意在稽查頻率較低的季度集中排放。' },
      { label: '設備故障期間不申報', desc: '防制設備停機時排放量驟增，業者未申報或主張豁免；惟空污法明定設備異常期間仍須以推估方式申報，不得自行免除申報義務。' },
      { label: '切割申報單位', desc: '將同一場所分拆為多個義務人，使各單位排放量落在較低費率級距，規避累進費率設計。' },
      { label: '假冒潔淨燃料', desc: '移動源端：申報使用一級低硫燃料，實際供應或使用含硫量較高油品，以享較低費率；由海關進口量數據可交叉稽核。' },
      { label: '拒絕或妨礙稽查', desc: '拒絕稽查人員進入廠區、不提供生產紀錄或燃料消耗憑證，使主管機關無從查核實際排放量。' },
    ],
  },
  {
    id: 'admin', title: '行政責任',
    icon: Gavel, color: '#e0d0d8', textColor: '#783848',
    badge: '空污法',
    items: [
      {
        label: '§74　逾期未申報或未繳費',
        desc: '逾繳費期限每日加徵 0.5% 滯納金，並另按郵政儲金一年期定存固定利率計日加計利息（兩者並行）。逾期 30 日仍未申報或繳納者，對工商廠場處 NT$10 萬元以上 100 萬元以下罰鍰；一般對象處 NT$1,500 以上 6 萬元以下。',
      },
      {
        label: '§75　虛偽申報低報（補徵加倍）',
        desc: '查獲低報或漏報者，固定源依排放係數二倍、移動源及營建工程依費率二倍計算補徵費額，追溯期限為五年（自起徵日起算）；補徵費額另計利息（自主管機關通知期限屆滿翌日起依郵政儲金定存利率計日計）。此為補徵機制而非罰鍰，可與罰鍰並行，不受一事不二罰限制。',
      },
      {
        label: '§62　未申報排放量（申報義務違反）',
        desc: '違反第21、22條排放量記錄與申報義務者，工商廠場處 NT$10 萬元以上 2,000 萬元以下罰鍰，按次處罰；屆期仍未補正得令停工停業或廢止操作許可。',
      },
      {
        label: '§71　拒絕或妨礙稽查',
        desc: '規避、妨礙或拒絕主管機關依第48條稽查者，公私場所處 NT$20 萬元以上 100 萬元以下罰鍰，得按次處罰，並得強制執行稽查。',
      },
    ],
  },
  {
    id: 'criminal', title: '刑事責任',
    icon: Scale, color: '#d8d0e8', textColor: '#4a3870',
    badge: '空污法',
    items: [
      {
        label: '§54　虛偽申報／業務文書不實（最核心）',
        desc: '明知為不實事項而申請或申報，或於業務上所作文書為虛偽記載：3 年以下有期徒刑、拘役，或科或併科 NT$20 萬元以上 500 萬元以下罰金。涵蓋低報排放量、偽造 CEMS 數據、虛構生產紀錄等書面不實行為，為逃漏空污費最直接適用之刑事條款。',
      },
      {
        label: '§53　固定源超標排放有害空氣污染物',
        desc: '排放管道排放違反有害空氣污染物排放限值，且足以生損害於他人生命、身體健康：7 年以下有期徒刑，得併科 NT$100 萬元以上 1,500 萬元以下罰金。',
      },
      {
        label: '§51　突發事故未採應變措施致生損害',
        desc: '違反緊急應變義務致人死亡：無期徒刑或 7 年以上有期徒刑，得併科 NT$3,000 萬元以下罰金；致重傷：3 年以上 10 年以下有期徒刑；致危害健康：6 月以上 5 年以下有期徒刑。',
      },
      {
        label: '§56　不遵行停工停業命令',
        desc: '不遵行主管機關停工或停業命令，處負責人 3 年以下有期徒刑、拘役，或科或併科 NT$20 萬元以上 500 萬元以下罰金。',
      },
      {
        label: '§57　兩罰規定（法人連帶）',
        desc: '法人之代表人或受僱人因執行業務犯 §51–§54、§55第1項、§56 之罪者，除處罰行為人外，對法人亦科以各該條「十倍以下」之罰金；使法人不能藉組織屏蔽個人刑事責任。',
      },
    ],
  },
  {
    id: 'concurrence', title: '行政／刑事競合',
    icon: BookOpen, color: '#d8e8d0', textColor: '#487840',
    badge: '行政罰法 §26',
    items: [
      {
        label: '一事不二罰原則',
        desc: '同一行為同時觸犯刑事法律及行政罰者，依刑事法律處罰（行政罰法第26條第1項）；主管機關不得另外再裁處罰鍰，以避免重複處罰。但沒入或其他種類行政罰（如停工、撤銷許可）仍可一併執行。',
      },
      {
        label: '不起訴或緩起訴後的行政罰',
        desc: '若檢察官為不起訴處分、緩起訴期滿未被撤銷，或法院判決無罪確定者，主管機關得依行政罰法另行裁處罰鍰（行政罰法第26條第2項），恢復行政裁罰權。',
      },
      {
        label: '§75補徵費額不受競合限制',
        desc: '§75的加倍補徵費額性質上是「公法上不當得利之返還加計」而非罰鍰，不屬於行政罰法所稱之「行政罰」，故不受一事不二罰原則拘束——即使業者已受刑事追訴，主管機關仍得依§75補徵加倍費額及利息。',
      },
      {
        label: '移送偵辦義務',
        desc: '主管機關稽查發現涉嫌虛偽申報等刑事犯罪情節者，依法應移送（或函請）檢察機關偵辦，不得以行政罰了事；裁處罰鍰與移送偵辦並不互斥。',
      },
    ],
  },
  {
    id: 'enforcement', title: '稽查與防逃手段',
    icon: Shield, color: '#e8e8d0', textColor: '#606830',
    badge: '主管機關',
    items: [
      { label: '強制安裝 CEMS', desc: '達法定規模之固定源須裝設連續自動監測系統，數據即時傳輸主管機關，從源頭封堵低報空間。異常期間須依推估方式補算，不得自行免報。' },
      { label: '外部資料交叉稽核', desc: '以海關進出口燃料量、台電電力使用量、工廠進料量與申報排放量交叉比對，偵測申報異常低報；近年引入衛星遙測輔助工業區監控。' },
      { label: '舉報獎勵', desc: '主管機關設有環境檢舉管道，舉報查證屬實者依規定獎勵，形成社會監督力量補充稽查能量。' },
      { label: '許可證連動管制', desc: '空污費制度與排放許可證雙軌並行：業者遭查獲逃漏，除補繳及罰款外，許可證核定排放量上限得被調降，影響後續生產規模，形成額外嚇阻。' },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function AirPollutionFee() {
  const [section, setSection] = useState('elements');
  const [openEl, setOpenEl] = useState(() => new Set(ELEMENTS_DATA.map(e => e.id)));
  const [openProc, setOpenProc] = useState(() => new Set(PROCEDURE_STEPS.map(p => p.step)));
  const [openEffect, setOpenEffect] = useState(() => new Set(EFFECTS_DATA.map(e => e.id)));
  const [openEvasion, setOpenEvasion] = useState(() => new Set(EVASION_DATA.map(e => e.id)));
  const toggle = (setter, id) => setter(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const [activeTab, setActiveTab] = useState('SOx');
  const [zone, setZone] = useState('zone2');
  const [season, setSeason] = useState('q23');
  const [showRates, setShowRates] = useState(false);

  useEffect(() => { document.title = '台灣空氣污染防制費'; }, []);

  const p = POLLUTANTS[activeTab];
  const rates = p.rates[zone][season];
  const maxRate = Math.max(...rates.filter(r => typeof r === 'number'));

  const SECTIONS = [
    { id: 'elements',  label: '構成要件', icon: BookOpen },
    { id: 'procedure', label: '稽徵程序', icon: ClipboardList },
    { id: 'effects',   label: '法律效果', icon: Scale },
    { id: 'evasion',   label: '逃漏',     icon: AlertTriangle },
    { id: 'finance',   label: '財政收支', icon: Landmark },
    { id: 'history',   label: '制度沿革', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#f5eceb] font-sans" style={{ paddingBottom: 64 }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#f5eceb]/90 backdrop-blur-md border-b border-[#e8d3d1] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#d0dce8] flex items-center justify-center">
          <Wind size={16} className="text-[#3a5878]" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#b09e9c]">空污法 §16 · 特別公課</p>
          <p className="text-xs font-black text-[#6b5b58] leading-none">空氣污染防制費</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">

        {/* Section nav */}
        <div className="grid grid-cols-3 gap-1.5 mb-5">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl text-[10px] font-black transition-all duration-200 ${
                  section === s.id
                    ? 'bg-[#6b5b58] text-white shadow-sm'
                    : 'bg-white/70 text-[#8a7a78] border border-[#e8d3d1]'
                }`}
              >
                <Icon size={14} strokeWidth={2.2} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── 構成要件 ──────────────────────────────────────────── */}
        {section === 'elements' && (
          <div className="space-y-3">
            {/* 授權法源 — 非構成要件，另立顯示 */}
            <div className="rounded-[1.5rem] border border-[#d0dce8] bg-[#eef2f8] px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className="text-[#3a5878]" strokeWidth={2.5} />
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#3a5878]">授權法源</p>
              </div>
              <p className="text-[12px] text-[#4a6880] leading-relaxed mb-1">
                空污法第 16 條第 1 項：「各級主管機關應依污染源排放空氣污染物之種類及排放量，徵收空氣污染防制費。」費率由中央主管機關（環境部）公告。
              </p>
              <p className="text-[12px] text-[#4a6880] leading-relaxed">
                性質為「<strong>特別公課</strong>」（大法官釋字第 426 號），非稅捐。特別公課有別於稅：費款專入空污基金、不統收統支；繳費多寡直接連結排放量，內建減量誘因。
              </p>
            </div>

            {ELEMENTS_DATA.map(el => {
              const Icon = el.icon;
              const isOpen = openEl.has(el.id);
              return (
                <Accordion
                  key={el.id}
                  isOpen={isOpen}
                  onToggle={() => toggle(setOpenEl, el.id)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: el.color }}>
                        <Icon size={15} style={{ color: el.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-[#b09e9c]">{el.no}</span>
                          <span className="text-sm font-black text-[#6b5b58]">{el.title}</span>
                          <Tag color={el.color} text={el.badge} textColor={el.textColor} />
                        </div>
                      </div>
                    </div>
                  }
                >
                  <BulletList items={el.content} />
                </Accordion>
              );
            })}

            {/* Fee rates embedded */}
            <button
              onClick={() => setShowRates(!showRates)}
              className="w-full flex items-center gap-3 rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm shadow-rose-100/60 hover:shadow-md transition-all"
            >
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[#e8e0c8] flex items-center justify-center">
                <Calculator size={15} className="text-[#686030]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-[#6b5b58]">費率查詢</p>
                <p className="text-[11px] text-[#a09088]">SOx、NOx、VOCs、PM 各級費率互動查詢</p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-[#c5b4b2] transition-transform duration-200"
                style={{ transform: showRates ? 'rotate(90deg)' : 'none' }} />
            </button>

            {showRates && (
              <div className="space-y-3 -mt-1 pl-2">
                {/* Pollutant tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {Object.entries(POLLUTANTS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        activeTab === key ? 'text-white shadow-sm border-transparent' : 'bg-white/70 border-[#e8d3d1] text-[#8a7a78]'
                      }`}
                      style={activeTab === key ? { backgroundColor: val.textColor } : {}}
                    >
                      {val.abbr}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <ToggleGroup
                    label="防制區"
                    options={[['zone2', '二級'], ['zone13', '一三級']]}
                    value={zone}
                    onChange={setZone}
                  />
                  <ToggleGroup
                    label="季別"
                    options={[['q23', 'Q2/Q3'], ['q14', 'Q1/Q4']]}
                    value={season}
                    onChange={setSeason}
                  />
                </div>

                {season === 'q14' && (
                  <InfoBox text="第一、四季（冬季）費率較高，另乘減量係數E。" warn />
                )}

                <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-2.5 border-b border-[#f5eceb]">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c]">
                      {p.abbr}｜{zone === 'zone2' ? '二級防制區' : '一三級防制區'}｜第{season === 'q23' ? '二、三' : '一、四'}季
                    </p>
                  </div>
                  <div className="divide-y divide-[#f8f4f3]">
                    {p.tiers.map((tier, i) => {
                      const rate = rates[i];
                      const isFlat = typeof rate === 'string';
                      return (
                        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="shrink-0 w-[68px]">
                            <p className="text-[11px] font-black text-[#6b5b58]">{tier.label}</p>
                            <p className="text-[9px] text-[#b09e9c] leading-tight mt-0.5">{tier.range}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-2.5">
                            {!isFlat && (
                              <div className="flex-1 h-2 rounded-full bg-[#f0e8e6]">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${(rate / maxRate) * 100}%`, backgroundColor: p.color }} />
                              </div>
                            )}
                            <span className="shrink-0 text-[13px] font-black" style={{ color: p.textColor }}>
                              {isFlat ? rate : `${rate} 元/kg`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 稽徵程序 ──────────────────────────────────────────── */}
        {section === 'procedure' && (
          <div className="space-y-3">
            <InfoBox
              title="稽徵架構"
              text="固定污染源採「自行申報、按季繳納、事後稽查」模式，與稅法「核定課徵」有別，業者負主動申報義務，主管機關事後稽核。申報→繳納→稽查→救濟，構成完整行政程序鏈。"
            />

            {/* Flow diagram */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-5 py-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-3">稽徵流程</p>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['每季申報', '計算費額', '繳款', '稽查核對', '爭議救濟'].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <div className="shrink-0 rounded-xl bg-[#f5eceb] border border-[#e8d3d1] px-3 py-2 text-center">
                      <p className="text-[11px] font-black text-[#6b5b58] whitespace-nowrap">{step}</p>
                    </div>
                    {i < arr.length - 1 && <ArrowRight size={12} className="shrink-0 text-[#c5b4b2]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {PROCEDURE_STEPS.map(proc => {
              const Icon = proc.icon;
              const isOpen = openProc.has(proc.step);
              return (
                <Accordion
                  key={proc.step}
                  isOpen={isOpen}
                  onToggle={() => toggle(setOpenProc, proc.step)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: proc.color }}>
                        <Icon size={15} style={{ color: proc.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-[#b09e9c]">{proc.step}</span>
                          <span className="text-sm font-black text-[#6b5b58]">{proc.title}</span>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <BulletList items={proc.items} />
                </Accordion>
              );
            })}
          </div>
        )}

        {/* ── 法律效果 ──────────────────────────────────────────── */}
        {section === 'effects' && (
          <div className="space-y-3">
            <InfoBox
              title="對義務人之法律效果"
              text="空污費的法律效果聚焦於「對義務人個別規制關係」：費額核課→繳費義務成立→履行（消滅）或未履行（延滯金→強制執行）。"
            />

            {EFFECTS_DATA.map(ef => {
              const Icon = ef.icon;
              const isOpen = openEffect.has(ef.id);
              return (
                <Accordion
                  key={ef.id}
                  isOpen={isOpen}
                  onToggle={() => toggle(setOpenEffect, ef.id)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ef.color }}>
                        <Icon size={15} style={{ color: ef.textColor }} strokeWidth={2.2} />
                      </div>
                      <span className="text-sm font-black text-[#6b5b58]">{ef.title}</span>
                    </div>
                  }
                >
                  <BulletList items={ef.content} />
                </Accordion>
              );
            })}
          </div>
        )}

        {/* ── 逃漏 ──────────────────────────────────────────────── */}
        {section === 'evasion' && (
          <div className="space-y-3">
            <InfoBox
              title="逃漏特殊性"
              text="空污費之逃漏有別於一般稅捐逃漏——課徵基礎（排放量）本身難以直接觀察，業者掌握資訊優勢，主管機關高度依賴申報誠信與稽查能量。資訊不對稱是最大執行挑戰。"
            />

            {EVASION_DATA.map(ev => {
              const Icon = ev.icon;
              const isOpen = openEvasion.has(ev.id);
              return (
                <Accordion
                  key={ev.id}
                  isOpen={isOpen}
                  onToggle={() => toggle(setOpenEvasion, ev.id)}
                  header={
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ev.color }}>
                        <Icon size={15} style={{ color: ev.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#6b5b58]">{ev.title}</span>
                          <Tag color={ev.color} text={ev.badge} textColor={ev.textColor} />
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-2.5">
                    {ev.items.map(item => (
                      <div key={item.label} className="rounded-xl bg-[#f5eceb] px-4 py-3">
                        <p className="text-[11px] font-black text-[#6b5b58] mb-1">{item.label}</p>
                        <p className="text-[11px] text-[#8a7a78] leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
              );
            })}
          </div>
        )}

        {/* ── 制度沿革 ──────────────────────────────────────────── */}
        {section === 'history' && (
          <div className="space-y-3">
            <InfoBox
              title="制度流變"
              text="台灣空污費制度從 1975 年純行政管制出發，歷經 1992 年授權立法、1995 年首次開徵，到 2010 年引入累進費率與雙重係數誘因機制，逐步從命令管制走向經濟誘因並行的現代環境治理模式。"
            />

            {/* 時間軸 */}
            <div className="relative pl-6">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#e8d3d1]" />
              {HISTORY_TIMELINE.map((item, i) => (
                <div key={item.year} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-6 top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: item.color }} />
                  <div className="rounded-[1.25rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-4 py-3.5 shadow-sm">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-[11px] font-black" style={{ color: item.textColor }}>{item.year}</span>
                      <span className="text-[11px] font-black text-[#6b5b58]">{item.label}</span>
                    </div>
                    <p className="text-[11px] text-[#7a6a68] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ── 財政收支 ──────────────────────────────────────────── */}
        {section === 'finance' && (
          <div className="space-y-3">
            <InfoBox
              title="財政收支劃分特殊性"
              text="空污費不適用《財政收支劃分法》，費款不歸國庫統收統支，而是依義務人類型分流入「中央空污基金」或「地方空污基金」，形成平行的雙層基金結構，各有其徵收主體、管理機關與用途限制。"
            />

            {/* 中央地方徵收分工 */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-[#f5eceb]">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c]">收入來源 · 徵收主體</p>
              </div>
              <div className="divide-y divide-[#f8f4f3]">
                {FINANCE_DATA.revenue.map(item => (
                  <div key={item.label} className="px-5 py-3.5">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <p className="text-[12px] font-black text-[#6b5b58] flex-1">{item.label}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.collector === '中央' ? 'bg-[#d0dce8] text-[#3a5878]' : 'bg-[#d0e8d8] text-[#3a6848]'}`}>
                        {item.collector}徵收
                      </span>
                      <span className="text-[11px] font-black text-[#8a7a78]">~{item.pct}%</span>
                    </div>
                    <div className="ml-5">
                      <div className="h-1.5 rounded-full bg-[#f0e8e6] mb-1">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                      </div>
                      <p className="text-[10px] text-[#a09088]">{item.collectorNote}　→　存入 <span className="font-bold text-[#6b5b58]">{item.fund}</span></p>
                      <p className="text-[10px] text-[#b09e9c] mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-2.5 bg-[#faf6f5] border-t border-[#f0e8e6]">
                <p className="text-[10px] text-[#a09088]">累計徵收（1995–2008）：逾 <span className="font-black text-[#6b5b58]">355 億元</span>；費款全數入各級空污基金，不納入一般財政預算。</p>
              </div>
            </div>

            {/* 中央地方基金結構 */}
            <div className="grid grid-cols-2 gap-2">
              {FINANCE_DATA.centralLocal.map(fund => (
                <div key={fund.title} className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl px-4 py-4 shadow-sm">
                  <div className="w-7 h-7 rounded-xl mb-2 flex items-center justify-center" style={{ backgroundColor: fund.color }}>
                    <Landmark size={13} style={{ color: fund.textColor }} strokeWidth={2.2} />
                  </div>
                  <p className="text-[11px] font-black text-[#6b5b58] mb-2">{fund.title}</p>
                  <div className="space-y-1.5">
                    {fund.items.map((item, i) => (
                      <div key={i} className="flex gap-1.5">
                        <span className="shrink-0 w-1 h-1 rounded-full mt-1.5 bg-[#c5b4b2]" />
                        <p className="text-[10px] text-[#7a6a68] leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 基金支出結構 */}
            <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-[#f5eceb]">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c]">基金支出用途結構</p>
              </div>
              <div className="px-5 py-4">
                {FINANCE_DATA.expenditure.map(item => (
                  <div key={item.label} className="flex items-center gap-3 mb-2.5">
                    <p className="text-[11px] text-[#6b5b58] w-28 shrink-0">{item.label}</p>
                    <div className="flex-1 h-2 rounded-full bg-[#f0e8e6]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                    <p className="text-[11px] font-black text-[#8a7a78] w-10 text-right shrink-0">{item.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-[9px] font-bold text-[#c5b4b2] leading-relaxed">
          依據空污法第16條及相關費率附表（固定污染源）<br />
          僅供學術研究參考，實務請以環境部官方公告為準
        </p>
      </div>
    </div>
  );
}

// ─── Shared primitives ──────────────────────────────────────────────────────

function Accordion({ isOpen, onToggle, header, children }) {
  return (
    <div className="rounded-[1.5rem] border border-[#e8d3d1] bg-white/70 backdrop-blur-xl overflow-hidden shadow-sm shadow-rose-100/60 transition-all duration-200 hover:shadow-md hover:shadow-rose-100/80">
      <button className="w-full flex items-center gap-2 px-5 py-4" onClick={onToggle}>
        <div className="flex-1">{header}</div>
        <ChevronRight
          size={14}
          className="shrink-0 text-[#c5b4b2] transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 border-t border-[#f5eceb]">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

function BulletList({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map((line, i) => (
        <div key={i} className="flex gap-3">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-[5px] bg-[#c5b4b2]" />
          <p className="text-[12px] text-[#6b5b58] leading-relaxed">{line}</p>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ title, text, warn }) {
  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 ${warn
      ? 'bg-[#f8f0e8] border-[#e8d8c8]'
      : 'border-[#e8d3d1] bg-white/70 backdrop-blur-xl shadow-sm shadow-rose-100/60'}`}>
      {title && <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b09e9c] mb-1.5">{title}</p>}
      <div className="flex gap-2">
        {warn && <Info size={12} className="text-[#b08060] mt-0.5 shrink-0" />}
        <p className="text-[12px] text-[#7a6a68] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function Tag({ color, text, textColor }) {
  return (
    <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: color, color: textColor }}>
      {text}
    </span>
  );
}

function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div className="flex-1">
      <p className="text-[9px] font-bold text-[#b09e9c] uppercase tracking-wider mb-1.5 px-0.5">{label}</p>
      <div className="flex rounded-xl border border-[#e8d3d1] bg-white/50 p-0.5">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => onChange(v)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${value === v ? 'bg-[#6b5b58] text-white shadow-sm' : 'text-[#8a7a78]'}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
