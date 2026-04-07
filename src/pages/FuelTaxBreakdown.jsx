import React, { useState, useEffect } from 'react';
import { 
  Info, 
  AlertCircle, 
  Droplets, 
  Car, 
  Calculator, 
  HelpCircle, 
  ShieldCheck, 
  Factory, 
  TrendingUp, 
  Percent 
} from 'lucide-react';

export default function FuelTaxBreakdown() {
  const [fuelType, setFuelType] = useState('gasoline');
  const [totalPrice, setTotalPrice] = useState(175);
  const [breakdown, setBreakdown] = useState({
    base: 0,
    gasTax: 0,
    petTax: 2.8,
    consumptionTax: 0,
    doubleTaxAmount: 0,
    doubleTaxRatio: 0
  });

  // 常量定義 (2026年參考值)
  const GAS_TAX_TOTAL = 53.8; 
  const DIESEL_TAX = 32.1; 
  const PET_TAX_TOTAL = 2.8;
  const VAT_RATE = 0.1;

  useEffect(() => {
    let base = 0;
    let consTax = 0;
    let fuelSpecificTax = 0;
    let doubleTax = 0;

    if (fuelType === 'gasoline') {
      // 總價 = (本體 + 汽油稅 + 石油稅) * 1.1
      const preVat = totalPrice / (1 + VAT_RATE);
      consTax = totalPrice - preVat;
      fuelSpecificTax = GAS_TAX_TOTAL;
      base = preVat - GAS_TAX_TOTAL - PET_TAX_TOTAL;
      // 二重課稅金額 = (定額稅) * 10%
      doubleTax = (GAS_TAX_TOTAL + PET_TAX_TOTAL) * VAT_RATE;
    } else {
      // 柴油計算 (僅石油稅部分涉及二重課稅)
      const taxableAmount = totalPrice - DIESEL_TAX;
      const preVat = taxableAmount / (1 + VAT_RATE);
      consTax = taxableAmount - preVat;
      fuelSpecificTax = DIESEL_TAX;
      base = preVat - PET_TAX_TOTAL;
      doubleTax = PET_TAX_TOTAL * VAT_RATE;
    }

    setBreakdown({
      base: Math.max(0, base),
      gasTax: fuelSpecificTax,
      petTax: PET_TAX_TOTAL,
      consumptionTax: consTax,
      doubleTaxAmount: doubleTax,
      doubleTaxRatio: consTax > 0 ? (doubleTax / consTax) * 100 : 0
    });
  }, [fuelType, totalPrice]);

  const formatCurrency = (val) => val.toFixed(2);

  // 動態樣式計算
  const gasolineBtnClass = `px-6 py-2 rounded-xl text-sm font-bold transition-all ${
    fuelType === 'gasoline' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'
  }`;
  
  const dieselBtnClass = `px-6 py-2 rounded-xl text-sm font-bold transition-all ${
    fuelType === 'diesel' ? 'bg-white shadow-md text-green-600' : 'text-gray-400 hover:text-gray-600'
  }`;

  const progressBarStyle = {
    width: `${(breakdown.base / (totalPrice || 1)) * 100}%`
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
            日本油價 <span className="text-blue-600">深度層級</span> 拆解
          </h1>
          <p className="text-gray-500 font-medium italic">解析「稅上加稅」的秘密與公害補償金結構</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls & Analytics */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-700">選擇油品</span>
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  <button onClick={() => setFuelType('gasoline')} className={gasolineBtnClass}>
                    汽油
                  </button>
                  <button onClick={() => setFuelType('diesel')} className={dieselBtnClass}>
                    柴油
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">調整當前零售單價 (¥/L)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="140" max="220" value={totalPrice} 
                    onChange={(e) => setTotalPrice(parseInt(e.target.value))}
                    className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="text-4xl font-black text-blue-600 min-w-[110px] text-right tabular-nums">
                    ¥{totalPrice}
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Cards */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <h3 className="flex items-center gap-2 font-bold text-lg text-indigo-100">
                  <ShieldCheck size={20} /> 二重課稅解析
                </h3>
                <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-bold uppercase">Live</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <div className="text-[10px] font-bold text-blue-200 uppercase mb-1">總計消費稅</div>
                  <div className="text-2xl font-black tabular-nums">¥{formatCurrency(breakdown.consumptionTax)}</div>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <div className="text-[10px] font-bold text-blue-200 uppercase mb-1">二重課稅佔比</div>
                  <div className="text-2xl font-black tabular-nums">{breakdown.doubleTaxRatio.toFixed(1)}%</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-400/20 rounded-2xl border border-amber-400/30">
                <p className="text-xs text-amber-100 leading-relaxed">
                  <AlertCircle size={14} className="inline mr-1 mb-1" />
                  <strong>二重課稅：</strong>日本將定額稅金視為成本，因此會對「稅金」再次課徵 10% 消費稅。
                </p>
              </div>
            </div>

            <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg">
              <h3 className="flex items-center gap-2 font-bold mb-3 text-lg">
                <Factory size={20} /> 公害補償金
              </h3>
              <p className="text-emerald-100 text-sm leading-relaxed">
                隱藏在石油稅中的環保支出，每公升約 ¥0.5~0.7，用於支援大氣污染導致的公害病患者。
              </p>
            </div>
          </div>

          {/* Right Column: Visual Layers */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Layer 4: Consumption Tax */}
            <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase mb-2 inline-block">Layer 4: 消費稅 (VAT)</span>
                  <h4 className="text-xl font-bold">消費稅 (10%)</h4>
                  <p className="text-gray-500 text-sm mt-1">隨油價浮動的最終轉嫁稅</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-indigo-600 tabular-nums">¥{formatCurrency(breakdown.consumptionTax)}</div>
                  <div className="text-xs font-bold text-gray-400">占總價 {((breakdown.consumptionTax/totalPrice)*100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Layer 3: Fuel Specific Tax */}
            <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-sm hover:border-orange-300 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black uppercase mb-2 inline-block">Layer 3: 燃料專項稅 (定額)</span>
                  <h4 className="text-xl font-bold">{fuelType === 'gasoline' ? '汽油稅' : '輕油引取稅'}</h4>
                  <div className="mt-2">
                    {fuelType === 'gasoline' && (
                      <span className="text-[10px] bg-rose-50 px-2 py-1 rounded text-rose-600 font-bold uppercase tracking-tighter">內含暫定稅率 ¥25.1</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-orange-500 tabular-nums">¥{formatCurrency(breakdown.gasTax)}</div>
                  <div className="text-xs font-bold text-gray-400">固定金額</div>
                </div>
              </div>
            </div>

            {/* Layer 2: Petroleum Tax */}
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 shadow-sm hover:border-emerald-300 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase mb-2 inline-block">Layer 2: 石油石炭稅</span>
                  <h4 className="text-xl font-bold">地球溫暖化對策稅</h4>
                  <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Percent size={12} /> 內含公害被害補償金提取
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-600 tabular-nums">¥{formatCurrency(breakdown.petTax)}</div>
                  <div className="text-xs font-bold text-gray-400">定額徵收</div>
                </div>
              </div>
            </div>

            {/* Layer 1: Base Price */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase mb-2 inline-block">Layer 1: 基礎成本</span>
                  <h4 className="text-2xl font-bold italic flex items-center gap-2 text-blue-300">
                    <TrendingUp size={24} /> 油價本體
                  </h4>
                  <p className="text-gray-400 text-xs mt-2">包含原油、物流、煉製與利潤</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white tabular-nums">¥{formatCurrency(breakdown.base)}</div>
                  <div className="text-xs font-bold text-blue-400">隨國際行情變動</div>
                </div>
              </div>
              <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={progressBarStyle}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Diagnostic Footer */}
        <div className="mt-12 p-8 bg-white rounded-3xl border border-gray-100 text-sm text-gray-500 leading-relaxed shadow-sm">
          <h5 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Info size={16} /> 互動解析報告：
          </h5>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>滑桿聯動：</strong> 你會發現調整售價時，中間的「定額稅金」層級不會變動，只有本體和最上層的消費稅在跳動。</li>
            <li><strong>隱形成本：</strong> 日本油價存在「稅金地板」，即使原油價格跌破零，稅金部分（約 ¥70 以上）依然存在。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
