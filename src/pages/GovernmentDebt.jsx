import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark, Globe, BookOpen, AlertTriangle, Building2,
  ChevronDown, Scale, Network, ArrowDown, BarChart2,
  ExternalLink, Info, Layers, ArrowRight, Shield, Clock,
  DollarSign, Hash, FileText, TrendingDown,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// DATA — 全球概覽
// ═══════════════════════════════════════════════════════════════════

const COUNTRY_DEBT = [
  { country: '日本',           en: 'Japan',              debt: 252, color: '#b8a8d4', textColor: '#50388a' },
  { country: '希臘',           en: 'Greece',             debt: 163, color: '#d4b8a8', textColor: '#7a4030' },
  { country: '義大利',         en: 'Italy',              debt: 135, color: '#d4b8a8', textColor: '#7a4030' },
  { country: '中國（含LGFV）', en: 'China (incl.LGFV)',  debt: 116, color: '#d4a8a8', textColor: '#783030', highlight: true },
  { country: '美國',           en: 'USA',                debt: 122, color: '#a8b8d4', textColor: '#305878' },
  { country: '法國',           en: 'France',             debt: 113, color: '#d4b8a8', textColor: '#7a4030' },
  { country: '英國',           en: 'UK',                 debt: 100, color: '#c4b8d0', textColor: '#604880' },
  { country: '中國（官方）',   en: 'China (official)',   debt: 89,  color: '#f0d0d0', textColor: '#a05050', shadow: true },
  { country: '德國',           en: 'Germany',            debt: 64,  color: '#b8d4b8', textColor: '#386838' },
  { country: '澳洲',           en: 'Australia',          debt: 48,  color: '#b8d4b8', textColor: '#386838' },
  { country: '韓國',           en: 'South Korea',        debt: 46,  color: '#b8d4c8', textColor: '#307858' },
  { country: '台灣',           en: 'Taiwan',             debt: 28,  color: '#b8d4c8', textColor: '#307858' },
];

// Historical trend data (IMF General Government Gross Debt, % GDP)
const TREND_SERIES = [
  { name: '日本',        color: '#b8a8d4', pts: [[2010,207],[2014,236],[2016,238],[2018,236],[2020,259],[2022,260],[2024,252]] },
  { name: '義大利',      color: '#d4b8a8', pts: [[2010,116],[2014,132],[2016,135],[2018,134],[2020,155],[2022,144],[2024,135]] },
  { name: '美國',        color: '#a8b8d4', pts: [[2010,95],[2014,104],[2016,107],[2018,107],[2020,129],[2022,121],[2024,122]] },
  { name: '中國（官方）',color: '#d4a8a8', pts: [[2010,34],[2014,41],[2016,47],[2018,52],[2020,68],[2022,77],[2024,89]] },
  { name: '德國',        color: '#b8d4b8', pts: [[2010,82],[2014,74],[2016,69],[2018,61],[2020,68],[2022,66],[2024,64]] },
];

const DEBT_STRUCTURE = [
  { country: '美國',   central: 100, local: 22, note: '聯邦政府舉債占絕大比例，各州憲法通常要求平衡預算，地方舉債受嚴格限制。' },
  { country: '德國',   central: 42,  local: 22, note: '聯邦制：聯邦＋各邦各自舉債，《基本法》115 條設上限。2009 年加入債務刹車條款。' },
  { country: '日本',   central: 210, local: 42, note: '中央佔主體，地方（都道府縣）舉債須中央批准，地方債利率較低因隱含中央背書。' },
  { country: '中國',   central: 30,  local: 42, note: '官方數字中地方顯性債務約 42 兆。若含 LGFV 隱性估算，地方端實際負擔遠超中央。', lgfv: 65 },
];

// ═══════════════════════════════════════════════════════════════════
// DATA — 中國深度
// ═══════════════════════════════════════════════════════════════════

const LGFV_FLOW = [
  { label: '地方政府', sub: '省、市、縣級政府。依法不得直接舉債（2015 年前）', color: '#c8d8e8', textColor: '#305878' },
  { label: '成立 LGFV（城投公司）', sub: '注入土地使用權、國有資產作為資本金；公司獨立法人但政府實質控股', color: '#d8c8e8', textColor: '#503878' },
  { label: '發行城投債 ／ 銀行貸款', sub: '企業債形式，利率介於國債與一般企業債之間；市場默認政府不讓其違約', color: '#e8d8c8', textColor: '#785030' },
  { label: '投資基礎建設', sub: '道路、地鐵、工業園區、保障性住房、城市更新', color: '#d8e8c8', textColor: '#386838' },
  { label: '土地出讓收入償債', sub: '地方政府從土地拍賣抽成，注資 LGFV 用於還息或滾轉。2021 年後此鏈條斷裂', color: '#f0d0d0', textColor: '#783030' },
];

const PROVINCE_DATA = [
  { province: '貴州', tier: 3, ratio: '～110%', risk: '極高', note: '城投債/地方GDP全國最高，貴州茅台鎮城投首開先例出現再融資困難，引發市場關注' },
  { province: '青海', tier: 3, ratio: '～90%',  risk: '極高', note: '財政自給率僅約 20%，高度依賴中央轉移支付，隱性債務佔比極重' },
  { province: '雲南', tier: 3, ratio: '～80%',  risk: '高',   note: '雲投集團等大型城投出現流動性壓力，省政府公開表態協調處置' },
  { province: '甘肅', tier: 3, ratio: '～75%',  risk: '高',   note: '省會蘭州城投問題突出，財政收入增速低於債務增速' },
  { province: '內蒙古', tier: 2, ratio: '～48%', risk: '中高', note: '2019 年整頓後有所改善，但能源景氣波動仍影響財政穩定性' },
  { province: '遼寧', tier: 2, ratio: '～55%',  risk: '中高', note: '東北老工業基地轉型壓力疊加城投問題，人口持續流出壓縮稅基' },
  { province: '吉林', tier: 2, ratio: '～52%',  risk: '中',   note: '省內部分城投出現技術性延遲，人口外流加劇長期財政可持續壓力' },
  { province: '江蘇', tier: 1, ratio: '～30%',  risk: '中低', note: '城投債發行量全國最大，但地方 GDP 基數更大，相對比例可控' },
  { province: '廣東', tier: 1, ratio: '～18%',  risk: '低',   note: '全國財政實力最強省份，每年對中央轉移支付貢獻最大' },
  { province: '上海', tier: 1, ratio: '～15%',  risk: '低',   note: '直轄市財政透明度相對較高，城投管理較規範；主要風險來自隱形養老金缺口' },
];

const CHINA_TIMELINE = [
  { year: '1994', event: '分稅制改革', detail: '中央與地方稅收大幅重劃：增值稅改中央地方 75/25，所得稅後來也改為中央主導。地方財政缺口從此持續擴大，為 LGFV 的出現埋下制度根源。' },
  { year: '2008', event: '四兆刺激計畫', detail: '全球金融危機後，中央推出 4 兆元刺激計畫，地方需配套出資，但合法舉債渠道仍未開放。各地大規模設立城投公司，以企業債形式間接融資，LGFV 數量與規模急速膨脹。' },
  { year: '2010', event: '首次全面審計', detail: '審計署首次系統性披露，地方政府性債務餘額約 10.7 兆元。外界驚覺隱性債務規模遠超預期，地方融資平台的風險開始進入政策視野。' },
  { year: '2013', event: '史上最大規模審計', detail: '審計署動員四萬人普查，結果顯示廣義地方政府性債務達 17.9 兆元（含「或有債務」口徑達 30.3 兆）。此次審計確立了隱性債務問題的嚴峻性，成為後續政策改革的直接觸發點。' },
  { year: '2014', event: '預算法修訂、43 號文', detail: '修訂《預算法》允許省級政府以債券形式合法舉債；《國務院 43 號文》明確剝離地方政府與融資平台信用，要求城投不再承擔政府融資功能。但執行力度有限，LGFV 仍繼續大量發債。' },
  { year: '2015', event: '專項債元年、債務置換', detail: '地方政府債券大規模發行，尤其「專項債」作為基建融資的合法渠道正式確立。同時推出約 10 兆元的高息隱性債務置換計畫，以低息地方債取代城投存量債，緩解利息壓力。' },
  { year: '2018', event: '去槓桿、50 號文', detail: '中央收緊城投融資，出台嚴禁新增隱性債務的系列政策（含 50 號文）。LGFV 境外發債受限，部分城投發債成本驟升，市場開始認真計算政府隱性擔保的邊界。' },
  { year: '2020', event: '疫情擴張', detail: '抗疫特別國債與地方政府專項債額度大幅增加，專項債全年發行約 3.75 兆元創歷史新高。在「穩增長」壓力下，隱性債務管控實際放鬆，存量再次快速膨脹。' },
  { year: '2023', event: '化債元年、城投違約潮', detail: '多省啟動「一攬子化債」方案，以再融資債置換到期城投債；同時部分三四線城市城投出現「技術性違約」（延遲兌付）。市場開始重新定價城投信用利差，中央隱性擔保的可信度受到考驗。' },
  { year: '2024', event: '10 兆元化債方案', detail: '全國人大批准 6 兆元再融資置換＋4 兆元新增額度，合計 10 兆元，以低息地方債置換高息城投隱性債務。此為 2015 年置換後最大規模債務處置行動，暫緩流動性壓力，但未解決地方財政收支結構的根本矛盾。' },
];

// ═══════════════════════════════════════════════════════════════════
// DATA — 制度比較
// ═══════════════════════════════════════════════════════════════════

const FISCAL_RULES = [
  { country: '德國', rule: '債務刹車（Schuldenbremse）', basis: '憲法（基本法第115條）', limit: '聯邦結構性赤字 ≤ 0.35% GDP；各邦赤字為零', since: 2009, color: '#b8d4b8', textColor: '#386838', note: '全球最嚴格的憲法層級財政規則。2020年 COVID 暫停執行，2023年復行引發政治爭議；2024年財政法院裁定政府預算違憲。' },
  { country: '瑞士', rule: '債務刹車（Schuldenbremse）', basis: '憲法層級', limit: '聯邦支出受景氣調整後的收入上限約束', since: 2003, color: '#b8d4b8', textColor: '#386838', note: '實施後聯邦債務持續下降，被廣泛視為最成功的財政規則實踐，常被引用為改革藍本。' },
  { country: '歐盟', rule: '穩定與成長協議（SGP）', basis: '條約層級', limit: '赤字 ≤ 3% GDP；債務 ≤ 60% GDP', since: 1997, color: '#c8d8e8', textColor: '#305878', note: '違規國家理論上可被罰款，但實際執行機制弱（法德於 2003 年均超標卻未受罰）。2024 年改革後新增債務軌跡評估要求。' },
  { country: '美國', rule: '無聯邦財政規則', basis: '國會法定（非財政規則）', limit: '49 個州有憲法或法定平衡預算條款（各異）；聯邦「債務上限」形同虛設', since: null, color: '#e8e8d0', textColor: '#686820', note: '聯邦層級無硬性財政規則，债務上限每次觸頂均通過立法提高。各州平衡預算要求禁止資本支出以外的赤字，在實踐中大多有效。' },
  { country: '日本', rule: '財政健全化目標', basis: '政策目標（無法律強制力）', limit: '基礎財政盈餘（Primary Balance）目標，2025 年前達成', since: 2006, color: '#e8e0d0', textColor: '#786830', note: '歷次均未如期達成，2020年 COVID 後目標再度延後。無強制執行機制的財政規則的失敗範例。' },
  { country: '中國', rule: '預算法＋配額制度', basis: '法律層級（2015年修訂）', limit: '地方債發行額度由中央按省分配；地方赤字率另有管控', since: 2015, color: '#f0d0d0', textColor: '#783030', note: '核心漏洞：隱性債務（LGFV）不受正式限額約束。配額制度使中央獲得重要的政策工具，但同時形成「軟預算約束」的制度性來源。' },
];

const CASE_STUDIES = [
  {
    title: '希臘債務危機',
    year: '2010–2018',
    type: '主權債務危機',
    peak: '207% GDP（2020）',
    color: '#e8d8d0', textColor: '#784030',
    trigger: '2008 年全球金融危機揭露希臘長期財政統計造假（赤字被低報近一倍），市場信心崩潰，公債利率急升，引發流動性危機。',
    mechanism: '歐元區成員失去貨幣主權，無法透過貨幣貶值或央行購債緩解壓力。三輪紓困附帶嚴苛緊縮條件，導致 GDP 收縮逾 25%，失業率升至 27%，陷入「緊縮→衰退→稅收減少→更多緊縮」的死亡螺旋。',
    lesson: '財政統計透明度是市場信任的基礎。缺乏貨幣主權的成員在危機時失去最重要的政策工具。外部救助方的利益目標（維護歐元區穩定）不必然等同於債務國的最優路徑。',
    china: '中國地方政府同樣存在統計不透明（隱性債務），但有完整的貨幣主權，央行理論上可介入——這是兩者最大的制度差異，也是為何學界普遍認為中國不會發生希臘式危機。',
  },
  {
    title: '阿根廷主權違約',
    year: '2001, 2014, 2020',
    type: '連續違約',
    peak: '160%+ GDP（2002）',
    color: '#d8d0e8', textColor: '#503878',
    trigger: '貨幣局制度下披索與美元掛鉤，外幣債務占比過高。2001 年固定匯率崩潰，以美元計價的債務相對本幣急速膨脹，最終宣告違約。',
    mechanism: '「道德風險」與「救助預期」的典型案例：市場長期低估阿根廷風險，因預期 IMF 等國際機構會介入救助。違約後債務重組談判曠日廢時，NML Capital 等「禿鷹基金」長期阻礙重整。',
    lesson: '外幣計價債務在匯率危機時造成雙重衝擊（本幣貶值＋債務比率驟升）。連環違約強化對主權信用的長期折價，即使完成重整後融資成本仍長期偏高。',
    china: '中國地方債主要以人民幣計價、由國內機構持有，阿根廷式的外匯債務危機風險極低。但道德風險邏輯高度相似：預期中央救助→過度舉債。',
  },
  {
    title: '底特律市政破產',
    year: '2013',
    type: '市政破產（Chapter 9）',
    peak: '約 180 億美元債務',
    color: '#d0d8e8', textColor: '#304870',
    trigger: '汽車工業衰退→人口從 1950 年代 185 萬驟降至 70 萬→稅基流失→財政收支惡化→退休金未提撥缺口高達 35 億美元。長期借債彌補運營缺口最終無以為繼。',
    mechanism: '美國允許地方政府依《破產法》第 9 章申請市政破產。法院任命特別管理人（emergency manager）主持重整，最終以削減退休金、出售資產（包括藝術品）等方式解決部分債務。',
    lesson: '有正式破產制度的系統，市場可明確定價違約風險（底特律債券利率早已反映）。制度明確反而有助於風險定價和預算紀律的建立。',
    china: '中國沒有對應的地方政府正式破產制度，地方政府理論上不能破產——這是隱性債務能夠長期累積的重要制度原因。缺乏正式出口使風險最終集中於中央政府和銀行體系。',
  },
  {
    title: '日本：高債務低風險的例外',
    year: '1990 年代至今',
    type: '可持續高債務',
    peak: '252% GDP（2024）',
    color: '#d8e0d0', textColor: '#386038',
    trigger: '1990 年代資產泡沫破滅後，財政刺激與通縮壓力並行超過三十年，每次景氣下滑都以財政擴張應對，債務持續累積。',
    mechanism: '90%+ 國債由國內金融機構與個人持有（郵政儲蓄、年金、保險）；日本銀行大規模購債（YCC 殖利率曲線控制）；通縮環境中實質利率接近零，r≈g 使債務比率相對穩定。',
    lesson: '當 r（利率）遠低於 g（成長率）時，即使超高名目債務也可能維持穩定。但此條件高度依賴央行政策配合與市場對政府信用的持續信心，一旦通膨預期翻轉，債務動態可能急速惡化。',
    china: '若中國未來進入低成長低通膨環境，日本模式的分析框架高度適用。但中國地方債的分散化結構（由城投而非中央政府持有）使集中管理難度更高。',
  },
];

// ═══════════════════════════════════════════════════════════════════
// DATA — 學術架構
// ═══════════════════════════════════════════════════════════════════

const LITERATURE_DB = [
  // ── Layer 1: Public Finance ──
  { id: 'musgrave1959', title: 'The Theory of Public Finance', authors: 'Richard Musgrave', year: 1959, type: 'book', topics: ['public-finance'], importance: 'core', note: '現代公共財政學奠基之作。三功能框架（資源配置、所得重分配、總體穩定）至今仍為教學標準；舉債的規範理論源頭。' },
  { id: 'oates1972', title: 'Fiscal Federalism', authors: 'Wallace Oates', year: 1972, type: 'book', topics: ['public-finance', 'fiscal-fed'], importance: 'core', note: '地方政府財政分析的理論奠基。提出「對應原則」（Correspondence Principle）：誰受益，誰課稅，誰舉債。' },
  { id: 'buchanan1962', title: 'The Calculus of Consent', authors: 'James Buchanan & Gordon Tullock', year: 1962, type: 'book', topics: ['public-finance'], importance: 'core', note: '公共選擇理論奠基。用理性人假設解釋政府擴張與舉債的政治邏輯：好處當期兌現，成本遞延給未來選民。' },
  { id: 'samuelson1954', title: 'The Pure Theory of Public Expenditure', authors: 'Paul Samuelson', year: 1954, type: 'article', topics: ['public-finance'], journal: 'Review of Economics and Statistics', note: '公共財（非競爭性、非排他性）的奠基定義。為政府介入提供規範基礎，但未直接討論舉債；常作為分析何種支出應由政府負擔的起點。' },
  { id: 'blanchard2019', title: 'Public Debt and Low Interest Rates', authors: 'Olivier Blanchard', year: 2019, type: 'article', topics: ['public-finance', 'risk'], journal: 'American Economic Review', importance: 'high', note: 'AEA 主席演講。當 r < g 時，政府舉債的成本比傳統觀點低——此框架成為後 2010 年代財政論辯的核心參照，也是評估中國地方債永續性的關鍵工具。' },
  { id: 'reinhart2009', title: 'This Time Is Different: Eight Centuries of Financial Folly', authors: 'Carmen Reinhart & Kenneth Rogoff', year: 2009, type: 'book', topics: ['public-finance', 'risk'], importance: 'high', note: '跨越八百年的主權債務違約史。核心發現：債務/GDP 超過 90% 後成長顯著放緩（數字後來受到質疑，但框架影響深遠）。讀這本書有助於理解為何高債務引發政策焦慮。' },

  // ── Layer 2: Fiscal Federalism ──
  { id: 'oates1999', title: 'An Economic Theory of Fiscal Decentralization', authors: 'Wallace Oates', year: 1999, type: 'article', topics: ['fiscal-fed'], journal: 'Journal of Economic Perspectives', note: '財政分權理論集大成。提出分權效率的必要條件，並分析分權失敗（競底、溢出、軟預算約束）的成因。' },
  { id: 'tiebout1956', title: 'A Pure Theory of Local Expenditures', authors: 'Charles Tiebout', year: 1956, type: 'article', topics: ['fiscal-fed'], journal: 'Journal of Political Economy', note: '「用腳投票」的理論奠基。居民遷往偏好最匹配的地方政府轄區，迫使地方政府有效率地提供公共財。地方競爭理論的源頭。' },
  { id: 'weingast1995', title: 'Federalism, Chinese Style: The Political Basis for Economic Success in China', authors: 'Montinola, Qian & Weingast', year: 1995, type: 'article', topics: ['fiscal-fed', 'china-lgd'], journal: 'World Politics', importance: 'high', note: '中國改革研究最具影響力的論文之一。解釋地方財政競爭如何驅動高速成長。後續學者（如 Landry 2008）大量修正，指出中央仍高度集權；但原論文框架至今仍是討論起點。' },
  { id: 'qian1997', title: 'Federalism as a Commitment to Preserving Market Incentives', authors: 'Yingyi Qian & Barry Weingast', year: 1997, type: 'article', topics: ['fiscal-fed', 'china-lgd'], journal: 'Journal of Economic Perspectives', note: '延伸 1995 年論文。解釋財政聯邦主義如何透過硬化預算約束、限制中央介入能力，來維護市場誘因——中國後來的 LGFV 隱性擔保與此論點直接矛盾。' },
  { id: 'kornai1979', title: 'Resource-Constrained versus Demand-Constrained Systems', authors: 'János Kornai', year: 1979, type: 'article', topics: ['fiscal-fed', 'china-lgd'], journal: 'Econometrica', note: '軟預算約束（Soft Budget Constraint）概念的提出者。社會主義企業因預期國家救助而過度擴張——後來直接移植到解釋 LGFV 行為。' },

  // ── Layer 3: China Local Government Debt ──
  { id: 'shih2024', title: "The Political Economy of China's Local Government Debt", authors: 'Victor Shih et al.', year: 2024, type: 'article', topics: ['china-lgd', 'political-econ'], journal: 'The China Quarterly', importance: 'essential', note: '目前引用率最高的分析。核心貢獻：不把地方債視為單純財政問題，而是政治經濟研究——中央如何利用配額制度（Quota）控制地方，及中央—地方權力再集中過程。如果只能讀一篇，讀這篇。' },
  { id: 'wong2014', title: 'Local Government Debt and Municipal Bonds in China: Problems and a Framework of Analysis', authors: 'Christine Wong', year: 2014, type: 'article', topics: ['china-lgd'], journal: 'Copenhagen Journal of Asian Studies', importance: 'high', note: '法律與制度面奠基性分析：城投債法律地位模糊、地方民主不足、財政透明度缺失、軟預算約束形成機制。後續大量研究直接引用此框架。' },
  { id: 'huang2025', title: "China's Local Government Debt: Causes, Consequences, Characteristics, Governance and Suggestions", authors: 'Yiping Huang et al.', year: 2025, type: 'report', topics: ['china-lgd'], publisher: 'ANU Press', importance: 'high', note: '目前最新的系統性綜述。適合掌握完整歷史演變、形成原因、系統性金融風險與政策改革方向，視角較平衡。' },
  { id: 'mao2024', title: "A Geographical Approach to Understanding China's Local Government Debt", authors: 'Rui Mao & Yixuan Wang', year: 2024, type: 'article', topics: ['china-lgd'], journal: 'Urban Studies', note: '空間經濟學視角：哪些城市借最多？債務如何在空間上擴散？地方競爭如何驅動過度舉債？為地方債研究引入地理維度。' },
  { id: 'lu2013', title: 'Local Government Financing Platforms in China: A Fortune or Misfortune?', authors: 'Zheng Liu & Todd Xiong', year: 2013, type: 'article', topics: ['china-lgd', 'lgfv'], journal: 'Federal Reserve Bank of San Francisco Working Paper', note: '早期對 LGFV 制度的系統分析，評估其對地方發展的雙重效應。雖已較舊，仍是理解 2008–2013 年 LGFV 擴張期的重要參照。' },
  { id: 'li2018', title: 'Fiscal Decentralization and Intergovernmental Fiscal Relations in China', authors: 'Nan Li', year: 2018, type: 'article', topics: ['china-lgd', 'fiscal-fed'], note: '分析 1994 年分稅制如何形成財政缺口，以及該缺口如何成為地方舉債的結構性壓力。提供制度歷史的長時段視角。' },

  // ── Layer 4: LGFV ──
  { id: 'dong2023', title: 'Understanding Local Government Debt Financing of Infrastructure in China', authors: 'Lisheng Dong & Yingnan Joseph Hua', year: 2023, type: 'article', topics: ['lgfv', 'china-lgd'], journal: 'Journal of Public Administration Research and Theory', importance: 'high', note: '最完整的 LGFV 機制解析。清晰呈現「地方政府→融資平台→舉債→建設→土地收入還債」完整循環，並深入分析土地財政崩解後的連鎖效應。' },
  { id: 'fang2022', title: 'The Financial Value of Political Networks: Evidence from Local Government Financing Vehicles', authors: 'Hanming Fang, Zhe Li & Nianhang Xu', year: 2022, type: 'article', topics: ['lgfv', 'political-econ'], journal: 'Review of Finance', note: '政治連結如何影響城投債定價：關係強的 LGFV 發債利率顯著更低，揭示隱性擔保的政治傳遞機制。' },
  { id: 'chen2020', title: 'Municipal Bond Markets in China: Development, Institutional Design, and Challenges', authors: 'Zhuo Chen et al.', year: 2020, type: 'article', topics: ['lgfv', 'china-lgd'], journal: 'Pacific-Basin Finance Journal', note: '對中國地方債券市場制度設計的系統梳理，含城投債、地方政府債券的市場結構、投資者基礎與定價機制。' },
  { id: 'implicit2024', title: 'The Impact of Implicit Government Guarantee on LGFV Bond Credit Spreads', authors: 'Various', year: 2024, type: 'article', topics: ['lgfv', 'risk'], note: '量化「隱性擔保」市場定價效應：政策信號（如中央表態不救助）如何影響信用利差，以及市場對政府救助預期的敏感度。' },

  // ── Layer 5: Financial Risk ──
  { id: 'yang2006', title: 'Economic Development and Elite Violence', authors: 'Dali Yang', year: 2006, type: 'book', topics: ['risk', 'political-econ'], note: 'GDP 錦標賽概念的早期系統闡述：晉升激勵使官員過度追求投資與成長，不計成本舉債，把財務後果留給繼任者。' },
  { id: 'bai2016', title: "China's Rising Leveraged Economy", authors: 'Chong-En Bai et al.', year: 2016, type: 'article', topics: ['risk', 'china-lgd'], journal: 'Oxford Review of Economic Policy', note: '從宏觀視角分析中國整體槓桿率上升的結構原因，涵蓋地方政府、國有企業、房地產三個相互關聯的風險來源。' },
  { id: 'accountability2026', title: 'Political Accountability and Local Government Debt: Evidence from China', authors: 'Various', year: 2026, type: 'article', topics: ['risk', 'political-econ'], note: '最新研究（2026）：問責機制設計與債務擴張的因果關係。官員任期長短、晉升概率高低如何影響舉債行為的系統性證據。' },
  { id: 'paradox2025', title: 'The Policy Paradox: How Regulatory Tightening Amplifies LGFV Debt Risk', authors: 'Various', year: 2025, type: 'article', topics: ['risk', 'lgfv'], note: '政策悖論分析：監管收緊（限制城投新增融資）在短期內反而推高違約風險，因為城投被迫以更高成本滾轉債務。' },
  { id: 'networks2022', title: 'The Financial Value of Political Networks', authors: 'Fang, Li & Xu', year: 2022, type: 'article', topics: ['risk', 'political-econ', 'lgfv'], journal: 'Review of Finance', note: '定量研究官員政治背景與城投融資條件的關係，揭示政治網路如何轉化為隱性財務優勢。' },

  // ── Layer 6: International Organizations ──
  { id: 'imf2023', title: 'Article IV Consultation: China — Selected Issues: Local Government Bonds', authors: 'IMF', year: 2023, type: 'report', topics: ['intl-orgs', 'china-lgd'], importance: 'high', note: 'IMF 年度對中國財政評估的核心文件。從債券市場、永續性、風險管理角度提供完整分析，與新興市場做跨國比較。IMF 立場一般比國內學術界更重視市場紀律與透明度。' },
  { id: 'imf2024', title: 'Fiscal Monitor: Fiscal Policy in the New Normal', authors: 'IMF', year: 2024, type: 'report', topics: ['intl-orgs', 'public-finance'], note: '含主要國家最新債務/GDP 數據、永續性評估框架，以及各國財政整頓的成效比較。每年兩次發布，與 World Economic Outlook 配套閱讀。' },
  { id: 'wb2008', title: 'Public Finance in China: Reform and Growth for a Harmonious Society', authors: 'Lou & Wang (eds.)', year: 2008, type: 'book', topics: ['intl-orgs', 'china-lgd', 'fiscal-fed'], publisher: 'World Bank', note: '世界銀行對中國財政體制的系統分析，提供 1994 年分稅制改革後財政格局的完整基線，至今仍是歷史制度分析的重要參照。' },
  { id: 'imf-subnational', title: 'Managing Subnational Debt and Fiscal Risks', authors: 'IMF Fiscal Affairs Dept.', year: 2021, type: 'report', topics: ['intl-orgs', 'fiscal-fed'], note: '跨國比較地方政府債務管理框架：監管架構、透明度要求、中央—地方財政協調機制，對評估各國制度設計提供系統框架。' },
];

const RESEARCH_LAYERS = [
  { id: 'public-finance', no: '01', title: '公共財政理論', en: 'Public Finance Theory', color: '#d0dce8', textColor: '#3a5878', Icon: Scale,
    summary: '所有問題的理論底層。政府為何舉債？哪些支出適合借債融資？代際公平與黃金法則的規範依據。',
    concepts: [
      { term: '代際公平', def: '舉債建設讓未來世代承擔還款義務——若投資確實提升未來生產力，則合理；否則即為代際轉移負擔。' },
      { term: '黃金法則', def: '借債只用於資本支出（投資），不用於彌補經常性赤字（人事費、補貼）。歐盟 SGP 採用此原則。' },
      { term: '公共選擇理論', def: '政治人物有系統性偏好舉債：當期好處（基建落成、選票）可見，未來成本由後繼者承擔。' },
    ],
  },
  { id: 'fiscal-fed', no: '02', title: '財政聯邦主義', en: 'Fiscal Federalism', color: '#d0e8d8', textColor: '#3a6848', Icon: Network,
    summary: '中國地方債研究幾乎全部放在這個框架。中央與地方如何分工？財政自主權如何影響舉債行為？',
    concepts: [
      { term: '軟預算約束', def: '（Kornai 1980）地方預期中央救助而過度舉債。這是分析中國地方債最核心的概念。' },
      { term: 'Tiebout 競爭', def: '居民「用腳投票」遷往最佳轄區，形成地方政府間財政競爭；競爭過度可能導致競底（race to the bottom）。' },
      { term: '財政缺口', def: '地方支出責任遠超稅收來源（1994 年分稅制後尤為嚴重），逼迫地方依賴轉移支付或舉債。' },
    ],
  },
  { id: 'china-lgd', no: '03', title: '中國地方政府債務', en: 'China Local Government Debt', color: '#e8d8d0', textColor: '#784030', Icon: Building2,
    summary: '核心文獻區。從「城投隱性債務」到「專項債配額政治學」，進入中國研究的主要入口。',
    concepts: [
      { term: '顯性 vs 隱性債務', def: '顯性：政府名義發行的債券，計入官方統計。隱性：LGFV 舉借的債務，政府實質負有兜底責任但不計入統計。' },
      { term: '配額制度', def: '中央按省分配地方債發行額度（quota），作為控制地方財政行為、傳遞政策信號的核心工具。' },
      { term: '專項債', def: '理論上以特定項目收益自償，實際上大量項目缺乏真實收益，形成新一輪隱性負擔。' },
    ],
  },
  { id: 'lgfv', no: '04', title: '地方融資平台（城投）', en: 'Local Government Financing Vehicles', color: '#e0d0e8', textColor: '#683878', Icon: Landmark,
    summary: '近十年國際研究焦點已從地方債券轉向 LGFV。城投是理解中國隱性債務結構的核心機制。',
    concepts: [
      { term: 'LGFV 結構', def: '地方政府成立、政府信用背書、發行城投債或向銀行借款、投資基礎建設的國有企業平台。' },
      { term: '城投債', def: '城投公司發行的企業債，市場默認政府不讓其違約（隱性擔保），利率介於國債與一般企業債之間。' },
      { term: '土地財政', def: '以出讓土地使用權收入支撐 LGFV 債務償還能力。2021 年後房地產下行使此模式面臨根本挑戰。' },
    ],
  },
  { id: 'risk', no: '05', title: '金融風險與市場影響', en: 'Financial Risk', color: '#e8e0c8', textColor: '#686030', Icon: AlertTriangle,
    summary: '近兩年熱門研究方向：地方債如何傳染至銀行體系、信評、資產價格，以及官員問責機制的設計缺陷。',
    concepts: [
      { term: '再融資風險', def: '存量債務到期需借新還舊，若市場信心崩潰或利率驟升，地方或 LGFV 可能面臨流動性危機。' },
      { term: 'GDP 錦標賽', def: '晉升激勵使官員過度投資基建、不計成本舉債；政治誘因結構導致系統性過度借貸。' },
      { term: '銀行壞帳傳染', def: '城投違約→中小銀行壞帳上升→惜貸→基建停滯→財政收入進一步下滑的負向螺旋。' },
    ],
  },
  { id: 'intl-orgs', no: '06', title: 'IMF、世界銀行、OECD', en: 'International Organizations', color: '#c8d8e8', textColor: '#305878', Icon: Globe,
    summary: '國際組織從比較財政學、市場紀律、財政透明度角度分析中國，提供跨國基準與改革建議。',
    concepts: [
      { term: '財政空間', def: '（Fiscal Space）在不危害永續性前提下可動用的借債餘地，需考量債務/GDP 比、利率、成長率的互動。' },
      { term: 'r − g 差距', def: '當實質利率 r < 名目成長率 g，政府可持續舉債（Blanchard 2019）。中國地方借貸利率超過局部成長率是關鍵警訊。' },
      { term: '財政永續性', def: '長期債務/GDP 比率穩定或下降的條件：需滿足 Primary Surplus ≥ (r−g)×Debt/GDP。' },
    ],
  },
];

const GLOSSARY = [
  { term: '軟預算約束', en: 'Soft Budget Constraint', src: 'Kornai (1980)', def: '組織（地方政府、國有企業）預期外部主體（中央政府）會在危機時出手救援，因此缺乏嚴格的財務紀律誘因，系統性地過度擴張、過度舉債。' },
  { term: '財政聯邦主義', en: 'Fiscal Federalism', src: 'Oates (1972)', def: '研究政府職能與財政資源在不同層級（中央、州/省、地方）之間如何最優分配的學術領域。核心問題：哪些財政功能應集中、哪些應分權？' },
  { term: '代際公平', en: 'Intergenerational Equity', src: 'Musgrave', def: '政府舉債建設讓未來世代承擔還款義務；若投資提升未來生產力則合理，否則為代際剝削。公共財政的核心規範問題之一。' },
  { term: '黃金法則', en: 'Golden Rule', src: 'Public Finance', def: '政府借債只應用於資本支出（可創造未來收益的投資），不應用於彌補日常運營赤字。許多國家財政規則的設計原則。' },
  { term: '土地財政', en: 'Land Finance', src: 'China-specific', def: '中國地方政府以徵收農地、轉讓城市土地使用權收入作為核心財源，支撐 LGFV 的運作與債務還款。房地產市場下行後此模式面臨根本挑戰。' },
  { term: '城投債', en: 'Urban Investment Bond (Chengtou Bond)', src: 'China-specific', def: '城投公司（LGFV）發行的企業性質債券，享有隱含政府信用背書，利率介於國債與一般企業債之間。是中國隱性地方債的主要形式。' },
  { term: '專項債', en: 'Special Purpose Bond', src: 'China, post-2015', def: '2015 年後大規模擴張的地方政府債券。理論上與特定項目綁定、以項目收益自償；實際上大量項目缺乏真實收益，形成新的財政壓力。' },
  { term: '財政空間', en: 'Fiscal Space', src: 'IMF', def: '政府在不危害財政永續性前提下，可用於政策支出的借債餘裕。受債務水準、利率、成長率、市場信心等因素共同決定。' },
  { term: '配額制度', en: 'Quota System', src: 'China LGD', def: '中央政府每年按省分配地方債發行上限。是中央控制地方財政行為的核心機制，也是近年政治經濟學研究分析權力集中的重要切入點。' },
  { term: 'GDP 錦標賽', en: 'GDP Tournament', src: 'Yang (2006)', def: '官員晉升以 GDP 增速為重要考核指標，導致系統性過度投資基建、不計成本舉債。債務後果留給繼任者，促成地方債的跨任期累積。' },
  { term: '隱性政府擔保', en: 'Implicit Government Guarantee', src: 'LGFV Research', def: '政府未以法律承諾但市場默認其負有兜底責任的信用背書。城投債的核心支撐——一旦市場對此擔保的可信度動搖，城投債市場即面臨重定價壓力。' },
  { term: '再融資風險', en: 'Refinancing Risk', src: 'Risk Literature', def: '存量債務到期時需借新還舊（滾轉）的風險。若市場信心下降或利率驟升，城投或地方政府可能面臨無法以合理成本再融資的流動性危機。' },
  { term: '債務置換', en: 'Debt Swap', src: 'China Policy', def: '以低息政府債置換高息城投隱性債務，降低利息支出並延長還款期。2015 年首輪（10 兆）、2024 年二輪（10 兆），均為應急性流動性管理，而非結構性改革。' },
  { term: '分稅制', en: 'Tax Sharing System', src: 'China 1994', def: '1994 年財政改革：重劃中央與地方稅收分成，增值稅改為 75/25，企業所得稅後來也大幅向中央傾斜。財政缺口從此持續擴大，是 LGFV 出現的制度根源。' },
  { term: '道德風險', en: 'Moral Hazard', src: 'Economics', def: '被保護方因知道損失由他人承擔而採取過度風險行為。地方政府因預期中央救助而過度舉債，是中國地方債問題的核心道德風險機制。' },
  { term: 'r − g 差距', en: 'r minus g', src: 'Blanchard (2019)', def: '實質利率（r）與實質 GDP 成長率（g）的差距。當 r < g，政府可持續舉債而不使債務/GDP 比率惡化。當 r > g，債務動態自我強化，永續性受威脅。' },
  { term: '財政永續性', en: 'Fiscal Sustainability', src: 'IMF Framework', def: '長期來看政府能夠在不被迫採取激進政策調整下、持續履行財政義務的能力。衡量指標：初級餘額（Primary Balance）能否抵消利率—成長差距帶來的債務累積效應。' },
  { term: '市政破產', en: 'Municipal Bankruptcy', src: 'US Chapter 9', def: '美國允許地方政府依《破產法》第 9 章申請正式重整（如 2013 年底特律）。中國目前無此制度，缺乏正式出路使風險集中於中央與銀行體系。' },
  { term: '財政透明度', en: 'Fiscal Transparency', src: 'IMF Code', def: 'IMF 定義：政府財政資訊對公眾、議會、市場可及且完整。透明度不足是隱性債務累積的關鍵前提條件——市場若能準確定價風險，軟預算約束自然受限。' },
  { term: '初級餘額', en: 'Primary Balance', src: 'Fiscal Analysis', def: '政府收入減去非利息支出的差額。衡量不計算過去借款利息的財政立場。永續性分析的核心指標：Primary Surplus ≥ (r−g)×Debt/GDP 則債務比率不惡化。' },
];

// ═══════════════════════════════════════════════════════════════════
// DATA — 深度分析（六層次具體論述）
// ═══════════════════════════════════════════════════════════════════

const DEEP_ANALYSIS = [
  {
    id: 'public-finance',
    title: '公共財政理論的應用',
    color: '#d0dce8', textColor: '#3a5878',
    sections: [
      {
        heading: '黃金法則在中國的系統性扭曲',
        body: 'Musgrave 的「黃金法則」允許政府舉債投資基礎設施——前提是投資確實創造足以覆蓋資金成本的未來收益。中國「專項債」的制度設計名義上符合此原則：每個項目應綁定具體收益流（停車場收費、工業區租金、冷鏈倉儲使用費），以收益自償。但實際執行中，地方官員在 GDP 考核壓力下傾向批准所有可以啟動的項目，而非篩選真正具有自償能力的投資。審計結果顯示，大量「自償」項目的實際現金流不足設計值的 30%，需要財政兜底——此時「專項債」實質上已是一般政府借款，黃金法則的規範邏輯被架空。',
      },
      {
        heading: '公共選擇理論：政治時間貼現率與舉債',
        body: 'Buchanan（1962）的核心洞見是：政治人物的時間貼現率（discount rate）系統性地高於社會最優水準——他們偏好當期可見的利益（剪綵典禮、GDP 增速），而對未來還款義務低度重視。中國的 GDP 錦標賽制度將此傾向放大到極致：晉升與 GDP 直接掛鉤，任期通常 3–5 年，債務後果則留給繼任者。在此結構下，「舉債的激勵」與「還款的責任」被制度性地分配到不同人、不同時期——這是系統性過度舉債的根本制度來源，而非個別官員的道德失敗。',
      },
      {
        heading: 'Blanchard（2019）框架的反向適用',
        body: 'Blanchard 的 r<g 論文提供了一個反駁傳統債務恐慌的有力工具：當實質利率低於 GDP 成長率時，政府可以持續舉債而不使債務/GDP 比率惡化。這一框架在全球低利率環境（2010–2021 年）中受到廣泛引用。但對中國地方政府而言，問題恰好相反：城投融資利率（通常 5–8%）長期高於許多縣市的實際名目 GDP 成長率，尤其在東北、西部省份。r>g 的條件使債務動態自我強化：利息支出超過新增稅收，迫使更多借款，形成滾雪球效應。這是為何貴州、青海等省的城投問題在 2021 年後急速惡化的財務數學原因。',
      },
    ],
  },
  {
    id: 'fiscal-fed',
    title: '財政聯邦主義框架下的中國財政缺口',
    color: '#d0e8d8', textColor: '#3a6848',
    sections: [
      {
        heading: '1994 年分稅制：解決一個問題，製造另一個問題',
        body: '1994 年改革前，中央財政收入占全國財政的比例已降至 22%（1993 年），中央幾乎喪失宏觀調控能力。分稅制通過將增值稅改為 75% 歸中央、所得稅後來也大幅向中央傾斜，成功將中央財政份額提升至 50% 以上。然而改革未相應調整支出責任：教育、醫療、社會保障、基礎建設的主要執行責任仍落在地方。世界銀行（Lou & Wang 2008）的分析指出，改革在技術層面設計精良（解決了中央財政危機），但在制度邏輯上製造了地方的「曼德拉悖論」：責任最重的政府層級，財力最薄。',
      },
      {
        heading: 'Oates 「對應原則」的破壞與 LGFV 的必然性',
        body: 'Oates（1972）的「對應原則」要求：受益者、課稅對象、舉債主體與決策者在空間上對應。1994 年改革打破了此對應：決策在中央，支出在地方，稅收卻大量集中於中央。地方政府面對「必須建設」（來自上級考核）與「沒有錢建」（稅收不足）的制度矛盾，LGFV 是在現行法律框架下（禁止地方直接舉債）尋求的制度出口。從這個視角看，LGFV 不是財政腐敗，而是制度矛盾逼出的「第二最優解」——只是此解產生了嚴重的二階效應。若要從根本上解決問題，必須重新設計財政分權的責任-財力匹配，而非僅限於事後的債務置換。',
      },
      {
        heading: '軟預算約束在中國的特殊形態',
        body: 'Kornai（1979）的軟預算約束理論預測：若組織知道損失會被外部吸收，它將缺乏財務紀律。中國地方政府的軟預算約束有其特殊性：它不僅來自「預期中央救助」的主觀信念，更來自「中央不得不救助」的客觀制度約束——地方政府無破產制度，大規模城投違約的系統性衝擊（銀行壞帳、工程停工、社會穩定）使中央的選擇空間極為有限。這一「結構性軟預算約束」比主觀信念更難消除：即使中央公開聲明「不救助」，市場仍可計算出中央「不能不救助」的邊界條件，並據此繼續為城投的隱性擔保定價。',
      },
    ],
  },
  {
    id: 'china-lgd',
    title: '中國地方債的政治經濟學解析',
    color: '#e8d8d0', textColor: '#784030',
    sections: [
      {
        heading: 'Shih（2024）：地方債作為政治控制工具',
        body: 'The China Quarterly 的研究提出了理解中國地方債的關鍵重構：專項債的配額分配不只是資金安排，而是中央調配省際資源、傳遞政策信號、獎懲地方行為的政治工具。中央透過控制配額總量與省際分配，既限制了地方的融資能力，也建立了「表現好→獲得更多配額」的激勵連結。這一分析挑戰了兩種常見解讀：其一是「地方債是財政管理失敗」的技術官僚敘事；其二是「中央已失去對地方財政的控制」的分權敘事。實際上，配額制度表明中央不但沒有失控，反而透過制度設計強化了對地方的政治控制——代價是以債務風險換取政治集權。',
      },
      {
        heading: '制度性模糊：Wong（2014）的框架',
        body: 'Christine Wong 揭示了中國地方債制度最關鍵的結構特徵：「有目的的模糊性」（deliberate ambiguity）。城投的「企業之名、政府之實」讓地方政府在法律上可以否認債務責任（「這是城投公司的債，不是政府的債」），同時在政治上維持隱性擔保（「政府不會讓城投違約」）。這種模糊性不是制度設計失誤，而是精心設計的「兩面性」安排：它允許債務在法律上不計入政府資產負債表，同時允許政府維持對融資平台的實質控制與最終責任。此安排在房地產上行期高效運作，在下行期則形成最大的不確定性來源。',
      },
      {
        heading: '專項債的自欺機制',
        body: '2015 年後大規模擴張的「專項債」制度在設計上有一個根本問題：審批邏輯（這個項目有收益→可以發專項債）與執行邏輯（必須有足夠的專項債→找到可以包裝成有收益的項目）在地方政府的實際操作中被倒置。2021 年後的審計與研究普遍發現，大量專項債資金流入了無法自償的項目，靠財政一般收入彌補。這製造了一個系統性的「自欺」機制：地方政府知道項目無法自償，中央知道地方在包裝，市場知道這些數字不可靠——但只要房地產土地收入持續增長，系統就可以繼續運轉。2021 年後此平衡被打破，各方不得不正視已被廣泛知曉但被集體忽視的現實。',
      },
    ],
  },
  {
    id: 'lgfv',
    title: 'LGFV 的形成邏輯與風險結構',
    color: '#e0d0e8', textColor: '#683878',
    sections: [
      {
        heading: 'LGFV 作為制度出口：Dong & Hua（2023）的分析框架',
        body: 'LGFV 是「財政缺口→制度創新」邏輯下的理性制度回應。地方政府面對兩個剛性約束：一是法律上禁止直接舉債（2015 年前），二是上級考核要求完成大量基礎建設。LGFV 提供了在這兩個約束之間的制度出口——以「國有企業融資」的形式實現「政府融資」的實質。理解這一點的重要性在於：它說明 LGFV 的出現不是監管套利的偶然產物，而是制度矛盾的必然結果。這意味著，在不解決財政缺口根源（支出責任—財力匹配）的前提下，即使消滅現有 LGFV，也只會逼出新形式的「隱性融資」——制度矛盾的出口總會找到新通道。',
      },
      {
        heading: '政治連結的定價效應：Fang et al.（2022）的發現',
        body: 'Fang、Li 與 Xu 的實證研究揭示了隱性擔保的「選擇性」本質：政治背景強的 LGFV（如直屬省政府、黨委書記兼任董事長等）享有顯著更低的城投債利率，而政治關係較弱的城投則面臨明顯更高的融資成本。這一發現有深遠的政策意義：市場的隱性擔保評估是以政治連結為代理變數，而非財政基本面。這意味著市場定價的是「被救助的政治概率」，而非「項目的財務可持續性」。在此定價邏輯下，再強大的市場化改革（如推動信息披露、提高評級獨立性）也難以使城投債定價反映真實財務風險——因為決定利率的是政治判斷，而非財務分析。',
      },
      {
        heading: '土地財政崩解後的鏈條斷裂',
        body: 'LGFV 的完整商業模式依賴一條隱含假設鏈：舉債→建基礎設施→提升周邊土地吸引力→土地拍賣收入→還城投債息。2021 年以後，恒大危機引爆房地產下行，土地出讓收入在兩年內下跌逾 40%，使整個鏈條的「最後還款來源」枯竭。更關鍵的是，此衝擊具有結構性而非週期性特徵：城鎮化率已接近飽和、人口增速放緩、空置率在三四線城市已達臨界——「土地持續升值」的核心前提不會在此輪週期後自動恢復。這意味著 LGFV 模式不是暫時受挫，而是面臨商業邏輯的根本失效，需要從融資結構上重新思考地方基建的財務安排。',
      },
    ],
  },
  {
    id: 'risk',
    title: '金融風險的系統動力學',
    color: '#e8e0c8', textColor: '#686030',
    sections: [
      {
        heading: '「GDP 錦標賽」的集體行動陷阱',
        body: 'Yang（2006）的分析框架揭示了一個制度層面的集體行動問題：每一位地方官員在個人理性上選擇最大化任期內的 GDP 投資，以提升晉升概率；但所有官員同時做出此選擇的結果，是全國層面的系統性過度資本投資。更精確的問題是：這些投資的平均回報率（ICOR 持續上升）已系統性低於融資成本，意味著整體而言，每一單位新增債務帶來的邊際 GDP 增長正在遞減。而晉升考核制度因為無法等待長期收益、也無法跨任期歸因，對此遞減信號的響應存在結構性滯後——直到「明斯基時刻」（Minsky Moment，再融資需求超過可用信用）才強制調整。',
      },
      {
        heading: '主權—銀行負反饋螺旋的中國形態',
        body: '歐洲債務危機揭示了「主權—銀行死亡循環」：政府債務風險上升→銀行持有國債的資本受損→銀行信用收縮→實體經濟下滑→稅收下降→政府財政惡化。中國 LGFV 風險有其特殊的傳導形態：城投債違約或展期→持有城投債的地方中小銀行（農商行、城商行）壞帳上升→銀行惜貸→地方基建停滯→土地出讓收入進一步下跌→LGFV 再融資壓力進一步上升。此螺旋的特殊性在於，地方中小銀行通常高度依賴城投融資（部分農商行城投敞口超過貸款組合的 50%），使銀行體系與 LGFV 的命運高度捆綁——個別城投的違約可能觸發銀行系統性壓力，而非被市場消化。',
      },
      {
        heading: '政策悖論：緊縮監管的短期效應',
        body: '「政策悖論」（Paradox 2025）的分析指向一個重要的政策設計困境：當監管政策限制城投新增融資渠道（如 2018 年的 50 號文）時，存量債務的滾轉壓力在短期內不降反升。城投被迫以更高成本再融資、或折價出售資產，不僅沒有實現「去槓桿」，反而加速了信用事件的發生——每一個城投技術性違約都進一步壓縮整個資產類別的融資可能性。這一機制說明，不可能透過單一的「緊縮」或「放鬆」政策解決 LGFV 問題：緊縮引發短期危機，放鬆強化道德風險。正確的政策路徑需要在信用收縮和制度重構之間精確排序——而這種排序本身就是政治上高度敏感的任務。',
      },
    ],
  },
  {
    id: 'intl-orgs',
    title: '國際組織框架與中國的制度分歧',
    color: '#c8d8e8', textColor: '#305878',
    sections: [
      {
        heading: 'IMF 的三支柱建議與中國的回應模式',
        body: 'IMF（2023）對中國地方債的政策建議圍繞三個核心支柱：財政透明度（完整披露 LGFV 隱性債務）、市場紀律（允許部分城投有序違約以建立真實定價信號）、制度改革（重新設計中央—地方財政責任分配）。中國政策的回應模式則截然不同：傾向行政性化債（置換而非重組）、維持對 LGFV 的隱性擔保、以個案處理替代系統性規則。這一分歧的根源不在技術判斷，而在制度哲學：IMF 的框架預設市場紀律是長期穩定的基礎；中國的政策邏輯則認為，在轉型經濟中維持市場信心的工具是政治信用而非財務透明，允許市場定價風險可能引發非線性的信心崩潰。',
      },
      {
        heading: '世界銀行的歷史長視角：分稅制的未竟議程',
        body: '世界銀行（Lou & Wang 2008）的分析提供了一個重要視角：1994 年分稅制的設計者面對的是一個迫切的財政危機（中央份額跌破 22%），而非一個可以從容優化的制度工程。在此壓力下，改革優先解決了中央能力問題，而留下了地方責任—財力不匹配的「未竟議程」。從這個視角看，LGFV 和城投問題是 1994 年改革的內生後果，而非外部衝擊造成的偏差。世界銀行建議的「財政聯邦主義 2.0」改革路徑——重新分配稅基、建立更清晰的支出責任邊界、強化省級以下的財政自治——是技術上正確的方向，但在政治上涉及中央—地方權力重新分配，執行難度極高。',
      },
      {
        heading: '跨國比較的啟示：中國的獨特約束',
        body: '從跨國比較視角（OECD 2016）看，有效的地方債務管理需要三個機制的共同運作：法律清晰度（明確區分政府債務與商業債務）、財政透明度（及時、可驗證的資訊披露）、市場紀律（允許通過違約成本來約束過度借貸）。中國的困境是，這三個機制都面臨與其制度情境的結構性矛盾：法律清晰度的代價是取消 LGFV 的隱性擔保，可能引發即時的市場重定價衝擊；財政透明度需要地方政府如實披露可能危及其信用的信息；市場紀律需要接受部分城投的有序違約，而政治上「維穩」的首要目標與此相悖。這三個矛盾並非全部無解，但每一個都指向一個共同的前提：需要中央政府願意承受改革帶來的短期陣痛，以換取長期的制度穩定性。',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function SubNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
          style={{
            background: active === id ? '#2d4a6e' : 'white',
            color: active === id ? 'white' : '#718096',
            border: active === id ? 'none' : '1px solid #e2e8f0',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function TrendChart() {
  const W = 560, H = 210, L = 48, R = 8, T = 12, B = 32;
  const xRange = W - L - R, yRange = H - T - B;
  const maxVal = 280;
  const cx = (yr) => L + ((yr - 2010) / 14) * xRange;
  const cy = (v) => T + yRange - (v / maxVal) * yRange;
  const path = (pts) => pts.map(([y, v], i) => `${i ? 'L' : 'M'}${cx(y).toFixed(1)} ${cy(v).toFixed(1)}`).join(' ');
  const yLines = [0, 50, 100, 150, 200, 250];
  const xLabels = [2010, 2014, 2018, 2020, 2022, 2024];

  // Y-offsets to avoid label collisions at right edge (2024 values)
  const labelOffsets = { '日本': -4, '義大利': 4, '美國': -4, '中國（官方）': 10, '德國': -10 };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 210 }}>
      {yLines.map(v => (
        <g key={v}>
          <line x1={L} y1={cy(v)} x2={W - R} y2={cy(v)} stroke="#e2e8f0" strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={L - 4} y={cy(v) + 3.5} textAnchor="end" fontSize="9" fill="#a0aec0">{v}%</text>
        </g>
      ))}
      {xLabels.map(yr => (
        <text key={yr} x={cx(yr)} y={H - 4} textAnchor="middle" fontSize="9" fill="#a0aec0">{yr}</text>
      ))}
      {TREND_SERIES.map(s => (
        <path key={s.name} d={path(s.pts)} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {TREND_SERIES.map(s => {
        const [yr, v] = s.pts[s.pts.length - 1];
        return <circle key={s.name} cx={cx(yr)} cy={cy(v)} r="3" fill={s.color} stroke="white" strokeWidth="1.5" />;
      })}
      {TREND_SERIES.map(s => {
        const [yr, v] = s.pts[s.pts.length - 1];
        return (
          <text key={s.name} x={cx(yr) - 6} y={cy(v) + (labelOffsets[s.name] || 0)} fontSize="8.5" fill={s.color} fontWeight="700" textAnchor="end">
            {s.name} {v}%
          </text>
        );
      })}
    </svg>
  );
}

function LitCard({ paper }) {
  const typeColors = {
    book: { bg: '#dde8c8', text: '#386838', label: '書籍' },
    article: { bg: '#e8e0c8', text: '#686030', label: '期刊論文' },
    report: { bg: '#c8d8e8', text: '#305878', label: '報告' },
  };
  const tc = typeColors[paper.type] || typeColors.article;
  const impBorder = paper.importance === 'essential' ? '#d4a8a8' : paper.importance === 'core' ? '#b8c8d4' : paper.importance === 'high' ? '#d4c8a8' : '#e2e8f0';
  const impBg = paper.importance === 'essential' ? '#fff8f8' : 'white';

  return (
    <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: impBorder, background: impBg }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex gap-1.5 flex-wrap">
          {paper.importance === 'essential' && <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: '#d4a8a8', color: '#783030' }}>必讀</span>}
          {paper.importance === 'core' && <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: '#b8c8d4', color: '#305878' }}>奠基</span>}
          {paper.importance === 'high' && <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: '#d4c8a8', color: '#686030' }}>重要</span>}
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: tc.bg, color: tc.text }}>{tc.label}</span>
        </div>
        <span className="text-[10px] font-bold shrink-0" style={{ color: '#a0aec0' }}>{paper.year}</span>
      </div>
      <p className="text-[11px] font-black leading-snug mb-1" style={{ color: '#2d3748' }}>{paper.title}</p>
      <p className="text-[10px] mb-1.5" style={{ color: '#718096' }}>
        {paper.authors}{paper.journal ? ` — ${paper.journal}` : ''}{paper.publisher ? ` — ${paper.publisher}` : ''}
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{paper.note}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_SUBTABS = { overview: 'rank', china: 'summary', research: 'framework', compare: 'rules' };

export default function GovernmentDebt() {
  const [mainTab, setMainTab] = useState('overview');
  const [subTab, setSubTab] = useState('rank');
  const [openLayer, setOpenLayer] = useState(() => new Set(RESEARCH_LAYERS.map(l => l.id)));
  const [openTimeline, setOpenTimeline] = useState(() => new Set(CHINA_TIMELINE.map((_, i) => i)));
  const [openGlossary, setOpenGlossary] = useState(() => new Set(GLOSSARY.map((_, i) => i)));
  const [openCase, setOpenCase] = useState(() => new Set(CASE_STUDIES.map((_, i) => i)));
  const tog = (setFn, key) => setFn(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  const [litFilters, setLitFilters] = useState({ type: 'all', topic: 'all' });

  useEffect(() => { document.title = '政府債務研究 — Canvas Lab'; }, []);

  const handleMainTab = (tab) => { setMainTab(tab); setSubTab(DEFAULT_SUBTABS[tab]); };
  const maxDebt = Math.max(...COUNTRY_DEBT.map(d => d.debt));

  const filteredLit = useMemo(() => LITERATURE_DB.filter(p => {
    if (litFilters.type !== 'all' && p.type !== litFilters.type) return false;
    if (litFilters.topic !== 'all' && !p.topics.includes(litFilters.topic)) return false;
    return true;
  }), [litFilters]);

  const MAIN_TABS = [
    { id: 'overview',  label: '全球概覽',   Icon: BarChart2 },
    { id: 'china',     label: '中國深度',   Icon: Building2 },
    { id: 'research',  label: '學術架構',   Icon: BookOpen },
    { id: 'compare',   label: '制度比較',   Icon: Scale },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f0f4f8', paddingBottom: 60 }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #2d4a6e 0%, #3a5f8a 100%)', paddingTop: 48, paddingBottom: 28 }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Landmark size={20} color="white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.45)' }}>Government Debt Research</p>
              <h1 className="text-xl font-black text-white leading-tight">政府債務問題深度研究</h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            涵蓋全球主要國家現況、中國 LGFV 城投深度分析、35+ 篇文獻庫、概念辭典、制度比較與歷史案例。
          </p>
          <a href="https://www.yicai.com/news/103249639.html" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
            <ExternalLink size={11} /> 研究動機：第一財經報道
          </a>
        </div>
      </div>

      {/* ── Main tab nav ── */}
      <div style={{ background: '#2d4a6e' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex overflow-x-auto">
          {MAIN_TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => handleMainTab(id)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all border-b-2"
              style={{ color: mainTab === id ? 'white' : 'rgba(255,255,255,0.45)', borderBottomColor: mainTab === id ? 'white' : 'transparent' }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5">

        {/* ════════════════════════════════════════
            TAB: 全球概覽
        ════════════════════════════════════════ */}
        {mainTab === 'overview' && (<>
          <SubNav active={subTab} onChange={setSubTab} tabs={[
            { id: 'rank',   label: '排行比較' },
            { id: 'trend',  label: '歷史趨勢' },
            { id: 'struct', label: '中央 vs 地方' },
          ]} />

          {subTab === 'rank' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 size={14} style={{ color: '#4a6fa5' }} />
                  <h2 className="text-sm font-black" style={{ color: '#2d3748' }}>一般政府總債務 / GDP</h2>
                </div>
                <p className="text-[11px] mb-4" style={{ color: '#718096' }}>IMF《World Economic Outlook》2024 年估計值。中國另列含 LGFV 隱性債務的市場估算。</p>
                <div className="flex flex-col gap-2">
                  {[...COUNTRY_DEBT].sort((a, b) => b.debt - a.debt).map((item) => (
                    <div key={item.en} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold shrink-0 text-right" style={{ width: 108, color: item.highlight ? '#783030' : '#4a5568', fontWeight: item.highlight ? 900 : 700 }}>
                        {item.country}
                      </span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#edf2f7', height: 19 }}>
                        <div className="h-full flex items-center justify-end pr-2 rounded-full"
                          style={{ width: `${(item.debt / maxDebt) * 100}%`, background: item.color, minWidth: 32 }}>
                          <span className="text-[10px] font-black" style={{ color: item.textColor }}>{item.debt}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-3 flex-wrap">
                  {[['#d4a8a8', '中國（含LGFV）：市場估算，非 IMF 官方數字'],['#f0d0d0','中國（官方）：IMF 一般政府口徑']].map(([c,t])=>(
                    <div key={t} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#718096' }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: c }} />{t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><Info size={14} style={{ color: '#4a6fa5' }} /><h2 className="text-sm font-black" style={{ color: '#2d3748' }}>關鍵觀察</h2></div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: '日本之謎', color: '#b8a8d4', tC: '#50388a', text: '252% GDP 卻無違約風險：90%+ 由國內機構持有，日本央行大規模購債，通縮環境中實質利率接近零。此為「本國貨幣計價、本國人持有」的極端案例——但一旦通膨預期翻轉，此平衡可能劇烈震盪。' },
                    { label: '中國的兩個數字', color: '#d4a8a8', tC: '#783030', text: 'IMF 官方口徑約 89%，若含 LGFV 城投隱性債務，市場估算達 110–120%。這個「影子債務」的規模認定，是當前研究最核心的數字爭議——不同估算方法可差距逾 30 個百分點。' },
                    { label: '德國的刹車條款', color: '#b8d4b8', tC: '#386838', text: '《基本法》第 115 條規定聯邦結構性赤字不得超過 GDP 0.35%（Schuldenbremse），是全球最嚴格的憲法層級財政規則。2023–2024 年圍繞該條款的政治爭議，為憲法財政規則的極限提供了最新的現實驗證。' },
                    { label: '美國：規則的缺席', color: '#a8b8d4', tC: '#305878', text: '美國無聯邦層級財政規則，「債務上限」（debt ceiling）每次觸頂均通過立法提高，實質約束力弱。但各州幾乎均有憲法層級的平衡預算條款，地方財政紀律反而強於聯邦。' },
                  ].map((obs) => (
                    <div key={obs.label} className="rounded-xl p-3" style={{ background: obs.color + '22' }}>
                      <div className="text-[11px] font-black mb-1" style={{ color: obs.tC }}>{obs.label}</div>
                      <div className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{obs.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
                <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} style={{ color: '#305878' }} /><span className="text-xs font-black" style={{ color: '#305878' }}>財政永續性核心公式</span></div>
                <div className="rounded-lg px-4 py-2.5 font-mono text-sm font-bold text-center mb-2" style={{ background: 'white', color: '#305878' }}>
                  Δ(Debt/GDP) = Primary Deficit + (r − g) × Debt/GDP
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#4a6fa5' }}>
                  <strong>r</strong> = 實質利率，<strong>g</strong> = 實質 GDP 成長率。r &lt; g 時政府可持續舉債（Blanchard 2019）。
                  中國地方政府的困境：城投借貸利率長期高於許多地方的實際 GDP 成長率，r &gt; g 使債務動態自我強化。
                </p>
              </div>
            </div>
          )}

          {subTab === 'trend' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>一般政府總債務歷史趨勢（2010–2024）</h2>
                <p className="text-[11px] mb-3" style={{ color: '#718096' }}>IMF WEO 數據，% of GDP。三個重要節點：2008 金融危機後擴張、2015 歐洲財政緊縮、2020 COVID 衝擊。</p>
                <div className="rounded-xl overflow-hidden p-2" style={{ background: '#f8fafc' }}>
                  <TrendChart />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TREND_SERIES.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#4a5568' }}>
                      <div className="w-4 h-1.5 rounded-full" style={{ background: s.color }} />{s.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-3" style={{ color: '#2d3748' }}>三個轉折點</h2>
                {[
                  { yr: '2008–2010', label: '全球金融危機', color: '#d4b8a8', text: '各國大規模財政刺激。美國債務/GDP 從 68%（2008）飆升至 95%（2010）；中國「四兆計畫」雖未直接以中央借債體現，但催生了 LGFV 爆炸性擴張。' },
                  { yr: '2010–2015', label: '歐洲緊縮vs新興市場擴張', color: '#b8a8d4', text: '歐元區在 IMF/ECB/EC「三駕馬車」壓力下推行財政緊縮。同期中國、新興市場繼續擴張，成為全球成長主引擎，但債務基礎同步累積。' },
                  { yr: '2020', label: 'COVID 衝擊', color: '#a8b8d4', text: '全球各國最大規模同步財政擴張。日本 2020 年達到 259% 的峰值；美國跳升至 129%；中國官方口徑從 52% 升至 68%，實際含隱性債務的擴張更為顯著。' },
                ].map(t => (
                  <div key={t.yr} className="flex gap-3 mb-3 last:mb-0">
                    <div className="shrink-0 rounded-lg px-2 py-1 h-fit text-[9px] font-black" style={{ background: t.color + '44', color: '#4a5568' }}>{t.yr}</div>
                    <div>
                      <div className="text-xs font-black mb-0.5" style={{ color: '#2d3748' }}>{t.label}</div>
                      <div className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{t.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'struct' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>中央 vs 地方債務結構</h2>
                <p className="text-[11px] mb-4" style={{ color: '#718096' }}>各國「地方政府債務」定義與重要性差異極大。聯邦制國家地方借貸能力通常更強。</p>
                {DEBT_STRUCTURE.map((item) => (
                  <div key={item.country} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black" style={{ color: '#2d3748' }}>{item.country}</span>
                      <span className="text-[10px]" style={{ color: '#a0aec0' }}>% of GDP</span>
                    </div>
                    <div className="flex gap-1 items-center mb-1">
                      <div className="text-[9px] font-bold w-14 text-right shrink-0" style={{ color: '#305878' }}>中央</div>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#edf2f7', height: 14 }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(item.central / 3, 100)}%`, background: '#a8b8d4' }} />
                      </div>
                      <div className="text-[10px] font-black w-8 shrink-0" style={{ color: '#305878' }}>{item.central}%</div>
                    </div>
                    <div className="flex gap-1 items-center mb-1">
                      <div className="text-[9px] font-bold w-14 text-right shrink-0" style={{ color: '#783030' }}>地方</div>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#edf2f7', height: 14 }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(item.local / 3, 100)}%`, background: '#d4a8a8' }} />
                      </div>
                      <div className="text-[10px] font-black w-8 shrink-0" style={{ color: '#783030' }}>{item.local}%</div>
                    </div>
                    {item.lgfv && (
                      <div className="flex gap-1 items-center mb-1">
                        <div className="text-[9px] font-bold w-14 text-right shrink-0" style={{ color: '#683878' }}>LGFV（估）</div>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#edf2f7', height: 14 }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(item.lgfv / 3, 100)}%`, background: '#e0d0e8' }} />
                        </div>
                        <div className="text-[10px] font-black w-8 shrink-0" style={{ color: '#683878' }}>{item.lgfv}%</div>
                      </div>
                    )}
                    <p className="text-[10px] mt-1 pl-16" style={{ color: '#718096' }}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {/* ════════════════════════════════════════
            TAB: 中國深度
        ════════════════════════════════════════ */}
        {mainTab === 'china' && (<>
          <SubNav active={subTab} onChange={setSubTab} tabs={[
            { id: 'summary',  label: '總體分析' },
            { id: 'lgfv',     label: 'LGFV 機制' },
            { id: 'province', label: '省級分佈' },
            { id: 'timeline', label: '政策時間軸' },
          ]} />

          {subTab === 'summary' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>中國政府債務構成（2024 年估計）</h2>
                <p className="text-[11px] mb-4" style={{ color: '#718096' }}>官方口徑與市場估算之間存在巨大落差，「隱性債務」的認定是政策與學術爭議的核心。</p>
                {[
                  { label: '中央政府債務', amount: '約 30 兆元', pct: 23, color: '#a8b8d4', note: '國債及中央政府特別國債，計入 IMF 官方數字，透明度較高。' },
                  { label: '地方政府顯性債務', amount: '約 42 兆元', pct: 33, color: '#b8c8e0', note: '含一般債券（彌補收支缺口）＋專項債券（基建），2015 年後合法發行，納入官方統計。' },
                  { label: '城投 LGFV 隱性債務（市場估算）', amount: '約 55–70 兆元', pct: 45, color: '#d4a8a8', highlight: true, note: '不計入官方，但政府實質負有兜底責任。不同研究機構估算差距逾 15 兆元，為最大不確定因素。' },
                ].map(item => (
                  <div key={item.label} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold" style={{ color: item.highlight ? '#783030' : '#4a5568' }}>{item.label}</span>
                      <span className="text-[11px] font-black" style={{ color: item.highlight ? '#783030' : '#305878' }}>{item.amount}</span>
                    </div>
                    <div className="rounded-full overflow-hidden mb-1" style={{ background: '#edf2f7', height: 13 }}>
                      <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                    <p className="text-[10px]" style={{ color: '#a0aec0' }}>{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '地方顯性債務', value: '~42 兆元', sub: '2024 年末，含一般債＋專項債', color: '#a8b8d4' },
                  { label: 'LGFV 隱性（估）', value: '~65 兆元', sub: '城投債＋城投銀行貸款合計', color: '#d4a8a8' },
                  { label: '土地出讓跌幅', value: '↓ 40%+', sub: '2021 → 2023 年累計跌幅', color: '#e8d0c8' },
                  { label: '2024 化債規模', value: '10 兆元', sub: '全國人大批准再融資置換', color: '#b8d4b8' },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
                    <div className="text-[10px] font-bold mb-1" style={{ color: '#718096' }}>{kpi.label}</div>
                    <div className="text-lg font-black" style={{ color: '#2d3748' }}>{kpi.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#a0aec0' }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: '#f0d0d0', background: '#fff8f8' }}>
                <div className="text-xs font-black mb-2" style={{ color: '#783030' }}>2021 年後的結構性裂縫</div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#784030' }}>
                  房地產市場下行導致土地出讓收入崩跌（2021–2023 年下降逾 40%），LGFV 債務循環的最終還款來源大幅縮水。
                  城投再融資壓力上升，部分三四線城市城投出現技術性延遲兌付。2024 年底 10 兆元化債方案暫緩流動性壓力，
                  但地方財政收支的結構性缺口（支出責任 &gt;&gt; 稅收來源）仍未解決——根本矛盾指向 1994 年分稅制的重新設計。
                </p>
              </div>
            </div>
          )}

          {subTab === 'lgfv' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>LGFV 城投運作機制</h2>
                <p className="text-[11px] mb-4" style={{ color: '#718096' }}>地方政府繞過預算限制的融資結構——「表外財政」的核心迴路。</p>
                <div className="flex flex-col items-stretch gap-0">
                  {LGFV_FLOW.map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div className="rounded-xl px-4 py-3 border" style={{ background: step.color + '55', borderColor: step.color }}>
                        <div className="text-xs font-black" style={{ color: step.textColor }}>{step.label}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: step.textColor + 'aa' }}>{step.sub}</div>
                      </div>
                      {i < LGFV_FLOW.length - 1 && (
                        <div className="flex justify-center py-1"><ArrowDown size={14} style={{ color: '#a0aec0' }} /></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-3" style={{ color: '#2d3748' }}>城投債的特殊性質</h2>
                {[
                  { title: '法律地位模糊', color: '#d8d0e8', text: '城投公司法律上是獨立法人企業，發行的是「企業債」而非「政府債」。但地方政府透過股權、資產注入、隱性信用背書實際控制城投，形成「企業之名、政府之實」的灰色地帶。' },
                  { title: '隱性擔保機制', color: '#d0d8e8', text: '市場默認地方政府不會讓城投違約（至少對重要城投）。此預期使城投能以低於正常企業的利率借款，但也使隱性負擔無法透過市場定價顯現，形成系統性低估。' },
                  { title: '化債的困境', color: '#e8d8d0', text: '政府介入置換（化債）短期緩解流動性，但強化市場對政府兜底的信念，反而可能鼓勵更多城投過度舉債——這是系統性道德風險的自我強化螺旋。' },
                ].map(item => (
                  <div key={item.title} className="rounded-xl p-3 mb-2 last:mb-0" style={{ background: item.color + '44' }}>
                    <div className="text-[11px] font-black mb-1" style={{ color: '#2d3748' }}>{item.title}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'province' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>省級城投債務風險概況</h2>
                <p className="text-[11px] mb-4" style={{ color: '#718096' }}>
                  以「城投有息負債 / 地方 GDP」為主要指標，數字為市場機構估算值，各家研究差異約 ±10 個百分點。
                </p>
                {[3, 2, 1].map(tier => {
                  const tierConfig = { 3: { label: '高風險', color: '#d4a8a8', textColor: '#783030' }, 2: { label: '中等風險', color: '#d4c8a8', textColor: '#686030' }, 1: { label: '相對穩健', color: '#b8d4b8', textColor: '#386838' } };
                  const tc = tierConfig[tier];
                  const provinces = PROVINCE_DATA.filter(p => p.tier === tier);
                  return (
                    <div key={tier} className="mb-4 last:mb-0">
                      <div className="text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: tc.textColor }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: tc.color }} />{tc.label}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {provinces.map(p => (
                          <div key={p.province} className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: tc.color + '88', background: tc.color + '18' }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black" style={{ color: '#2d3748' }}>{p.province}</span>
                              <span className="text-xs font-black" style={{ color: tc.textColor }}>{p.ratio}</span>
                            </div>
                            <p className="text-[10px] leading-relaxed" style={{ color: '#4a5568' }}>{p.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] mt-2" style={{ color: '#a0aec0' }}>
                  數據來源：Wind 資訊、各省審計報告、IMF 估算綜合。因隱性債務定義差異，各機構數字出入較大，以上為研究引用範圍中點。
                </p>
              </div>
            </div>
          )}

          {subTab === 'timeline' && (
            <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
              <h2 className="text-sm font-black mb-4" style={{ color: '#2d3748' }}>中國地方政府債務政策演進</h2>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: '#c8d8e8' }} />
                {CHINA_TIMELINE.map((item, i) => (
                  <div key={item.year} className="relative mb-3 last:mb-0">
                    <div className="absolute left-[-20px] top-1 w-4 h-4 rounded-full border-2 border-white cursor-pointer"
                      style={{ background: openTimeline.has(i) ? '#305878' : '#a8c4d8' }}
                      onClick={() => tog(setOpenTimeline, i)} />
                    <button className="w-full text-left" onClick={() => tog(setOpenTimeline, i)}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black" style={{ color: '#305878', minWidth: 32 }}>{item.year}</span>
                        <span className="text-xs font-bold" style={{ color: '#2d3748' }}>{item.event}</span>
                        <ChevronDown size={12} style={{ color: '#a0aec0', transform: openTimeline.has(i) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto', flexShrink: 0 }} />
                      </div>
                      {openTimeline.has(i) && (
                        <p className="text-[11px] leading-relaxed mt-1.5 pl-9 pr-2" style={{ color: '#4a5568' }}>{item.detail}</p>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}

        {/* ════════════════════════════════════════
            TAB: 學術架構
        ════════════════════════════════════════ */}
        {mainTab === 'research' && (<>
          <SubNav active={subTab} onChange={setSubTab} tabs={[
            { id: 'framework',   label: '研究框架' },
            { id: 'deepanalysis',label: '深度分析' },
            { id: 'litdb',       label: `文獻庫（${LITERATURE_DB.length}篇）` },
            { id: 'glossary',    label: '概念辭典' },
          ]} />

          {subTab === 'framework' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
                <div className="flex items-center gap-2 mb-2"><Layers size={14} style={{ color: '#305878' }} /><span className="text-xs font-black" style={{ color: '#305878' }}>由大到小的閱讀架構</span></div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#4a6fa5' }}>
                  先掌握公共財政理論與財政聯邦主義的理論語言，再進入中國地方債與 LGFV 的具體文獻。
                  不從制度細節出發——先問「為什麼政府會舉債」，再問「中國地方政府為什麼特別舉債」。
                </p>
              </div>

              {RESEARCH_LAYERS.map(layer => {
                const isOpen = openLayer === layer.id;
                const layerPapers = LITERATURE_DB.filter(p => p.topics.includes(layer.id));
                return (
                  <div key={layer.id} className="rounded-2xl border border-white/60 bg-white/80 shadow-sm overflow-hidden">
                    <button className="w-full text-left px-5 py-4 flex items-center gap-3" onClick={() => setOpenLayer(isOpen ? null : layer.id)}>
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: layer.color }}>
                        <layer.Icon size={16} style={{ color: layer.textColor }} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black" style={{ color: layer.textColor + '88' }}>Layer {layer.no}</span>
                          <span className="text-sm font-black" style={{ color: '#2d3748' }}>{layer.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: layer.color + '66', color: layer.textColor }}>{layerPapers.length} 篇</span>
                        </div>
                        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#718096' }}>{layer.en}</p>
                      </div>
                      <ChevronDown size={15} style={{ color: '#a0aec0', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </button>
                    {isOpen && (
                      <div className="border-t px-5 py-4 flex flex-col gap-4" style={{ borderColor: '#f0f4f8' }}>
                        <p className="text-xs leading-relaxed" style={{ color: '#4a5568' }}>{layer.summary}</p>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#a0aec0' }}>核心概念</p>
                          <div className="flex flex-col gap-1.5">
                            {layer.concepts.map(c => (
                              <div key={c.term} className="rounded-lg px-3 py-2" style={{ background: layer.color + '33' }}>
                                <span className="text-[11px] font-black" style={{ color: layer.textColor }}>{c.term}　</span>
                                <span className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{c.def}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#a0aec0' }}>本層文獻</p>
                          <div className="flex flex-col gap-2.5">
                            {layerPapers.map(p => <LitCard key={p.id} paper={p} />)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {subTab === 'litdb' && (
            <div className="flex flex-col gap-4">
              {/* Filters */}
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#a0aec0' }}>類型</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[['all','全部'],['book','書籍'],['article','期刊論文'],['report','報告']].map(([v,l]) => (
                      <button key={v} onClick={() => setLitFilters(f => ({ ...f, type: v }))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                        style={{ background: litFilters.type === v ? '#2d4a6e' : '#f0f4f8', color: litFilters.type === v ? 'white' : '#718096' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#a0aec0' }}>研究層次</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[['all','全部'],['public-finance','公共財政'],['fiscal-fed','財政聯邦主義'],['china-lgd','中國地方債'],['lgfv','LGFV'],['risk','金融風險'],['political-econ','政治經濟'],['intl-orgs','國際組織']].map(([v,l]) => (
                      <button key={v} onClick={() => setLitFilters(f => ({ ...f, topic: v }))}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                        style={{ background: litFilters.topic === v ? '#2d4a6e' : '#f0f4f8', color: litFilters.topic === v ? 'white' : '#718096' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] mt-2" style={{ color: '#a0aec0' }}>顯示 {filteredLit.length} / {LITERATURE_DB.length} 篇</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {filteredLit.length === 0
                  ? <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-8 text-center text-sm" style={{ color: '#a0aec0' }}>此篩選條件下無文獻</div>
                  : filteredLit.sort((a, b) => b.year - a.year).map(p => <LitCard key={p.id} paper={p} />)
                }
              </div>
            </div>
          )}

          {subTab === 'glossary' && (
            <div className="flex flex-col gap-2">
              <div className="rounded-2xl border px-5 py-3 shadow-sm mb-1" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
                <p className="text-[11px]" style={{ color: '#4a6fa5' }}>
                  {GLOSSARY.length} 個核心概念，涵蓋公共財政、財政聯邦主義、中國制度、風險分析。點擊展開完整定義。
                </p>
              </div>
              {GLOSSARY.map((g, i) => (
                <div key={g.term} className="rounded-xl border border-white/60 bg-white/80 overflow-hidden">
                  <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => setOpenGlossary(openGlossary === i ? null : i)}>
                    <Hash size={12} style={{ color: '#a0aec0', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-black" style={{ color: '#2d3748' }}>{g.term}</span>
                      <span className="text-[10px] ml-2" style={{ color: '#a0aec0' }}>{g.en}</span>
                    </div>
                    {g.src && <span className="text-[9px] font-bold shrink-0" style={{ color: '#b0bec5' }}>{g.src}</span>}
                    <ChevronDown size={13} style={{ color: '#a0aec0', transform: openGlossary === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  {openGlossary === i && (
                    <div className="border-t px-4 py-3" style={{ borderColor: '#f0f4f8' }}>
                      <p className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{g.def}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>)}

          {subTab === 'deepanalysis' && (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} style={{ color: '#305878' }} />
                  <span className="text-xs font-black" style={{ color: '#305878' }}>分析方法</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: '#4a6fa5' }}>
                  以下依據六個研究層次，對中國政府債務問題展開實質性分析——不只是列舉文獻，而是從各理論框架的視角提出具體論點、揭示制度矛盾、指出研究爭議的核心。
                </p>
              </div>

              {DEEP_ANALYSIS.map((layer, li) => {
                const matchedLayer = RESEARCH_LAYERS.find(l => l.id === layer.id);
                return (
                  <div key={layer.id} className="rounded-2xl border border-white/60 bg-white/80 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center gap-3" style={{ background: layer.color + '33' }}>
                      {matchedLayer && <matchedLayer.Icon size={16} style={{ color: layer.textColor }} strokeWidth={2.2} />}
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: layer.textColor + '88' }}>
                          Layer {String(li + 1).padStart(2, '0')}
                        </div>
                        <div className="text-sm font-black" style={{ color: '#2d3748' }}>{layer.title}</div>
                      </div>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-5">
                      {layer.sections.map((sec, si) => (
                        <div key={si}>
                          <div className="flex items-start gap-2 mb-2">
                            <div className="shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[9px] font-black" style={{ background: layer.color, color: layer.textColor }}>
                              {si + 1}
                            </div>
                            <h3 className="text-xs font-black leading-snug" style={{ color: '#2d3748' }}>{sec.heading}</h3>
                          </div>
                          <p className="text-[11px] leading-[1.75] pl-7" style={{ color: '#4a5568' }}>{sec.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* ════════════════════════════════════════
            TAB: 制度比較
        ════════════════════════════════════════ */}
        {mainTab === 'compare' && (<>
          <SubNav active={subTab} onChange={setSubTab} tabs={[
            { id: 'rules', label: '財政規則比較' },
            { id: 'cases', label: '歷史案例' },
          ]} />

          {subTab === 'rules' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm">
                <h2 className="text-sm font-black mb-1" style={{ color: '#2d3748' }}>各國財政規則比較</h2>
                <p className="text-[11px] mb-4" style={{ color: '#718096' }}>財政規則的設計原則、法律基礎與實際執行成效差異巨大。強制力來源是分析的核心問題。</p>
                <div className="flex flex-col gap-3">
                  {FISCAL_RULES.map(rule => (
                    <div key={rule.country} className="rounded-xl border p-4" style={{ borderColor: rule.color + '88', background: rule.color + '18' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-black" style={{ color: '#2d3748' }}>{rule.country}</span>
                          <span className="text-[10px] ml-2 font-bold" style={{ color: rule.textColor }}>{rule.rule}</span>
                        </div>
                        {rule.since && <span className="text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded" style={{ background: rule.color, color: rule.textColor }}>since {rule.since}</span>}
                      </div>
                      <div className="flex gap-1.5 mb-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#e2e8f0', color: '#4a5568' }}>{rule.basis}</span>
                      </div>
                      <p className="text-[10px] font-bold mb-1" style={{ color: rule.textColor }}>限制：{rule.limit}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{rule.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border px-5 py-4 shadow-sm" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
                <div className="flex items-center gap-2 mb-2"><Info size={14} style={{ color: '#305878' }} /><span className="text-xs font-black" style={{ color: '#305878' }}>財政規則的設計邏輯</span></div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: '強制力基礎', text: '憲法層級（德國、瑞士）> 條約層級（歐盟）> 法律層級（中國）> 政策目標（日本）。強制力越高，規則越難靈活調整，但也越難被政治力量繞過。' },
                    { label: '景氣調整 vs 名目限制', text: '名目赤字上限（如歐盟 3%）在經濟衰退時反向緊縮，加劇景氣循環。景氣調整後的結構性餘額目標（德國、瑞士）在理論上更優，但計算複雜，政治可操縱空間更大。' },
                    { label: '豁免條款', text: '所有財政規則都需要「緊急豁免」條款（COVID 是最大壓力測試）。德國 2020 年豁免執行，2023 年恢復——違憲裁定的政治衝擊顯示，財政規則的政治合法性比其技術設計更重要。' },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg px-3 py-2" style={{ background: 'white' }}>
                      <span className="text-[11px] font-black" style={{ color: '#305878' }}>{item.label}　</span>
                      <span className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {subTab === 'cases' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border px-5 py-3 shadow-sm mb-1" style={{ borderColor: '#c8d8e8', background: '#e8f0f8' }}>
                <p className="text-[11px]" style={{ color: '#4a6fa5' }}>
                  四個案例橫跨主權違約、市政破產、可持續高債務。每個案例均標注「對中國研究的啟示」，協助建立跨國比較的分析框架。
                </p>
              </div>
              {CASE_STUDIES.map((cs, i) => (
                <div key={cs.title} className="rounded-2xl border border-white/60 bg-white/80 shadow-sm overflow-hidden">
                  <button className="w-full text-left px-5 py-4 flex items-center gap-3" onClick={() => setOpenCase(openCase === i ? null : i)}>
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cs.color }}>
                      <Clock size={16} style={{ color: cs.textColor }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black" style={{ color: '#2d3748' }}>{cs.title}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cs.color + '66', color: cs.textColor }}>{cs.type}</span>
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: '#718096' }}>{cs.year}　債務峰值：{cs.peak}</p>
                    </div>
                    <ChevronDown size={15} style={{ color: '#a0aec0', transform: openCase === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  {openCase === i && (
                    <div className="border-t px-5 py-4 flex flex-col gap-3" style={{ borderColor: '#f0f4f8' }}>
                      {[
                        { label: '觸發因素', text: cs.trigger },
                        { label: '傳導機制', text: cs.mechanism },
                        { label: '核心教訓', text: cs.lesson },
                      ].map(sec => (
                        <div key={sec.label}>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#a0aec0' }}>{sec.label}</p>
                          <p className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{sec.text}</p>
                        </div>
                      ))}
                      <div className="rounded-xl p-3 mt-1" style={{ background: cs.color + '33' }}>
                        <p className="text-[10px] font-black mb-1" style={{ color: cs.textColor }}>對中國研究的啟示</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: '#4a5568' }}>{cs.china}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
