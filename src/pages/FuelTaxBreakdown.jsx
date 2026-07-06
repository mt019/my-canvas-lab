import React, { useState, useEffect } from 'react';
import {
  Info,
  AlertCircle,
  Calculator,
  ShieldCheck,
  Factory,
  TrendingUp,
  Percent,
} from 'lucide-react';
import PageShell from '../components/PageShell';

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

  const fuelBtnClass = (active) =>
    `px-6 py-2 rounded-token-md text-token-sm font-bold transition-colors duration-fast ${
      active ? 'bg-surface-raised shadow-token-sm text-accent' : 'text-ink-faint hover:text-ink-muted'
    }`;

  const progressBarStyle = {
    width: `${(breakdown.base / (totalPrice || 1)) * 100}%`
  };

  // 四個層級的角色色都來自全域 token；本頁沒有自己的色票。
  const layers = {
    vat: 'var(--c-info)',
    fuel: 'var(--c-warn)',
    petroleum: 'var(--c-accent)',
  };

  return (
    <PageShell
      title="日本油價稅制拆解"
      eyebrow="Fuel Tax · Japan"
      width="wide"
    >
      <p className="-mt-4 mb-8 text-token-sm text-ink-muted">
        解析「稅上加稅」的秘密與公害補償金結構
      </p>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">

        {/* Left Column: Controls & Analytics */}
        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-token-lg border border-line bg-surface-raised p-6 shadow-token-sm">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-bold text-ink">選擇油品</span>
              <div className="flex rounded-token-md bg-surface p-1">
                <button onClick={() => setFuelType('gasoline')} className={fuelBtnClass(fuelType === 'gasoline')}>
                  汽油
                </button>
                <button onClick={() => setFuelType('diesel')} className={fuelBtnClass(fuelType === 'diesel')}>
                  柴油
                </button>
              </div>
            </div>

            <div className="mb-2">
              <label className="mb-2 block text-token-xs font-bold uppercase tracking-widest text-ink-faint">調整當前零售單價 (¥/L)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="140" max="220" value={totalPrice}
                  onChange={(e) => setTotalPrice(parseInt(e.target.value))}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-token-full bg-surface accent-[var(--c-accent)]"
                />
                <div className="min-w-[110px] text-right text-3xl font-bold tabular-nums text-accent">
                  ¥{totalPrice}
                </div>
              </div>
            </div>
          </div>

          {/* 二重課稅 */}
          <div className="rounded-token-lg border border-line bg-surface p-6">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="flex items-center gap-2 text-token-lg font-bold text-ink">
                <ShieldCheck size={18} className="text-accent" /> 二重課稅解析
              </h3>
              <span className="rounded-token-full border border-line bg-surface-raised px-2 py-1 text-[10px] font-bold uppercase text-ink-faint">Live</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-token-md border border-line-soft bg-surface-raised p-4">
                <div className="mb-1 text-[10px] font-bold uppercase text-ink-faint">總計消費稅</div>
                <div className="text-2xl font-bold tabular-nums text-ink">¥{formatCurrency(breakdown.consumptionTax)}</div>
              </div>
              <div className="rounded-token-md border border-line-soft bg-surface-raised p-4">
                <div className="mb-1 text-[10px] font-bold uppercase text-ink-faint">二重課稅佔比</div>
                <div className="text-2xl font-bold tabular-nums text-ink">{breakdown.doubleTaxRatio.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-4 rounded-token-md border-l-4 border-warn bg-surface-raised p-4">
              <p className="text-token-xs leading-relaxed text-ink-muted">
                <AlertCircle size={14} className="mb-1 mr-1 inline text-warn" />
                <strong className="text-ink">二重課稅：</strong>日本將定額稅金視為成本，因此會對「稅金」再次課徵 10% 消費稅。
              </p>
            </div>
          </div>

          {/* 公害補償金 */}
          <div className="rounded-token-lg border border-line bg-accent-soft p-6">
            <h3 className="mb-2 flex items-center gap-2 text-token-lg font-bold text-ink">
              <Factory size={18} className="text-accent" /> 公害補償金
            </h3>
            <p className="text-token-sm leading-relaxed text-ink-muted">
              隱藏在石油稅中的環保支出，每公升約 ¥0.5~0.7，用於支援大氣污染導致的公害病患者。
            </p>
          </div>
        </div>

        {/* Right Column: Visual Layers */}
        <div className="space-y-4 lg:col-span-7">

          {/* Layer 4: Consumption Tax */}
          <div className="rounded-token-lg border border-line bg-surface-raised p-6 shadow-token-sm" style={{ borderLeft: `4px solid ${layers.vat}` }}>
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest" style={{ color: layers.vat }}>Layer 4 · 消費稅 (VAT)</span>
                <h4 className="text-token-lg font-bold text-ink">消費稅 (10%)</h4>
                <p className="mt-1 text-token-sm text-ink-muted">隨油價浮動的最終轉嫁稅</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums" style={{ color: layers.vat }}>¥{formatCurrency(breakdown.consumptionTax)}</div>
                <div className="text-token-xs font-bold text-ink-faint">占總價 {((breakdown.consumptionTax/totalPrice)*100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Layer 3: Fuel Specific Tax */}
          <div className="rounded-token-lg border border-line bg-surface-raised p-6 shadow-token-sm" style={{ borderLeft: `4px solid ${layers.fuel}` }}>
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest" style={{ color: layers.fuel }}>Layer 3 · 燃料專項稅（定額）</span>
                <h4 className="text-token-lg font-bold text-ink">{fuelType === 'gasoline' ? '汽油稅' : '輕油引取稅'}</h4>
                {fuelType === 'gasoline' && (
                  <div className="mt-2">
                    <span className="rounded-token-sm border border-line bg-surface px-2 py-1 text-[10px] font-bold uppercase text-warn">內含暫定稅率 ¥25.1</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums" style={{ color: layers.fuel }}>¥{formatCurrency(breakdown.gasTax)}</div>
                <div className="text-token-xs font-bold text-ink-faint">固定金額</div>
              </div>
            </div>
          </div>

          {/* Layer 2: Petroleum Tax */}
          <div className="rounded-token-lg border border-line bg-surface-raised p-6 shadow-token-sm" style={{ borderLeft: `4px solid ${layers.petroleum}` }}>
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest" style={{ color: layers.petroleum }}>Layer 2 · 石油石炭稅</span>
                <h4 className="text-token-lg font-bold text-ink">地球溫暖化對策稅</h4>
                <div className="mt-2 flex items-center gap-1 text-token-xs font-bold text-accent">
                  <Percent size={12} /> 內含公害被害補償金提取
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums" style={{ color: layers.petroleum }}>¥{formatCurrency(breakdown.petTax)}</div>
                <div className="text-token-xs font-bold text-ink-faint">定額徵收</div>
              </div>
            </div>
          </div>

          {/* Layer 1: Base Price */}
          <div className="relative overflow-hidden rounded-token-lg bg-ink p-8 text-paper shadow-token-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="mb-2 inline-block rounded-token-full border border-ink-muted px-3 py-1 text-[10px] font-bold uppercase text-line">Layer 1 · 基礎成本</span>
                <h4 className="flex items-center gap-2 text-2xl font-bold">
                  <TrendingUp size={22} /> 油價本體
                </h4>
                <p className="mt-2 text-token-xs text-line">包含原油、物流、煉製與利潤</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold tabular-nums">¥{formatCurrency(breakdown.base)}</div>
                <div className="text-token-xs font-bold text-line">隨國際行情變動</div>
              </div>
            </div>
            <div className="mt-6 h-1 w-full overflow-hidden rounded-token-full bg-ink-muted">
              <div className="h-full bg-accent transition-all duration-slow" style={progressBarStyle}></div>
            </div>
          </div>

        </div>
      </div>

      {/* Diagnostic Footer */}
      <div className="mt-12 rounded-token-lg border border-line bg-surface p-8 text-token-sm leading-relaxed text-ink-muted">
        <h5 className="mb-2 flex items-center gap-2 font-bold text-ink">
          <Info size={16} className="text-accent" /> 互動解析報告：
        </h5>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-ink">滑桿聯動：</strong> 你會發現調整售價時，中間的「定額稅金」層級不會變動，只有本體和最上層的消費稅在跳動。</li>
          <li><strong className="text-ink">隱形成本：</strong> 日本油價存在「稅金地板」，即使原油價格跌破零，稅金部分（約 ¥70 以上）依然存在。</li>
        </ul>
      </div>
    </PageShell>
  );
}
