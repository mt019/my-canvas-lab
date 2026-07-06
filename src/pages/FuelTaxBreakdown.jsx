import React, { useState, useEffect } from 'react';
import { Info, AlertCircle, Factory } from 'lucide-react';
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

  const fmt = (val) => val.toFixed(2);
  const pct = (val) => ((val / (totalPrice || 1)) * 100);

  const fuelBtnClass = (active) =>
    `px-3 py-1 rounded-token-sm text-token-sm font-bold transition-colors duration-fast ${
      active ? 'bg-surface-raised shadow-token-sm text-accent' : 'text-ink-faint hover:text-ink-muted'
    }`;

  // 一行一層，由上而下＝由外而內的課徵順序
  const rows = [
    {
      key: 'vat',
      layer: 'L4',
      name: '消費稅 (10%)',
      note: '隨油價浮動的最終轉嫁稅；課在含稅價之外',
      value: breakdown.consumptionTax,
    },
    {
      key: 'fuel',
      layer: 'L3',
      name: fuelType === 'gasoline' ? '汽油稅（定額）' : '輕油引取稅（定額）',
      note: fuelType === 'gasoline' ? '內含暫定稅率 ¥25.1；不隨油價變動' : '定額徵收；不隨油價變動',
      value: breakdown.gasTax,
    },
    {
      key: 'petroleum',
      layer: 'L2',
      name: '石油石炭稅＋溫暖化對策稅',
      note: '內含公害被害補償金提取（約 ¥0.5–0.7/L）',
      value: breakdown.petTax,
    },
    {
      key: 'base',
      layer: 'L1',
      name: '油價本體',
      note: '原油、物流、煉製與利潤；隨國際行情變動',
      value: breakdown.base,
    },
  ];

  return (
    <PageShell
      title="日本油價稅制拆解"
      eyebrow="Fuel Tax · Japan"
      width="wide"
    >
      <p className="-mt-4 mb-6 text-token-sm text-ink-muted">
        「稅上加稅」的結構與公害補償金：調整售價，看各層怎麼動。
      </p>

      {/* 工具列：油品＋售價滑桿＋二重課稅即時值，一列收完 */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-token-md border border-line bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-token-sm font-bold text-ink">油品</span>
          <div className="flex rounded-token-sm bg-surface-raised p-0.5 shadow-token-sm">
            <button onClick={() => setFuelType('gasoline')} className={fuelBtnClass(fuelType === 'gasoline')}>汽油</button>
            <button onClick={() => setFuelType('diesel')} className={fuelBtnClass(fuelType === 'diesel')}>柴油</button>
          </div>
        </div>
        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <span className="whitespace-nowrap text-token-xs text-ink-faint">零售價 ¥/L</span>
          <input
            type="range" min="140" max="220" value={totalPrice}
            onChange={(e) => setTotalPrice(parseInt(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-token-full bg-line-soft accent-[var(--c-accent)]"
          />
          <span className="min-w-[64px] text-right text-token-lg font-bold tabular-nums text-accent">¥{totalPrice}</span>
        </div>
        <div className="text-token-xs text-ink-muted">
          稅上加稅 <strong className="tabular-nums text-danger">¥{fmt(breakdown.doubleTaxAmount)}</strong>
          <span className="text-ink-faint">（占消費稅 {breakdown.doubleTaxRatio.toFixed(1)}%）</span>
        </div>
      </div>

      {/* 拆解表：一行一層＋行內占比條 */}
      <div className="overflow-x-auto rounded-token-md border border-line">
        <table className="w-full min-w-[640px] border-collapse bg-surface-raised text-left">
          <thead>
            <tr className="border-b border-line bg-surface text-token-xs uppercase tracking-wide text-ink-faint">
              <th className="px-3 py-2 font-bold">層</th>
              <th className="px-3 py-2 font-bold">項目</th>
              <th className="px-3 py-2 text-right font-bold">¥/L</th>
              <th className="px-3 py-2 text-right font-bold">占總價</th>
              <th className="w-[26%] px-3 py-2 font-bold">結構</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line-soft last:border-b-0">
                <td className="px-3 py-2 align-top text-token-xs font-bold text-ink-faint">{row.layer}</td>
                <td className="px-3 py-2">
                  <div className="text-token-sm font-bold text-ink">{row.name}</div>
                  <div className="text-token-xs text-ink-muted">{row.note}</div>
                </td>
                <td className="px-3 py-2 text-right align-top text-token-sm font-bold tabular-nums text-ink">{fmt(row.value)}</td>
                <td className="px-3 py-2 text-right align-top text-token-xs tabular-nums text-ink-muted">{pct(row.value).toFixed(1)}%</td>
                <td className="px-3 py-2 align-middle">
                  <div className="h-1.5 w-full overflow-hidden rounded-token-full bg-line-soft">
                    <div
                      className={`h-full transition-all duration-base ${row.key === 'base' ? 'bg-ink-muted' : 'bg-accent'}`}
                      style={{ width: `${Math.min(100, pct(row.value))}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            <tr className="border-t border-line bg-surface">
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-token-sm font-bold text-ink">合計（零售價）</td>
              <td className="px-3 py-2 text-right text-token-sm font-bold tabular-nums text-accent">{fmt(totalPrice)}</td>
              <td className="px-3 py-2 text-right text-token-xs tabular-nums text-ink-muted">100%</td>
              <td className="px-3 py-2" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* 兩行註記，不做卡片 */}
      <ul className="mt-4 space-y-1.5 text-token-xs leading-relaxed text-ink-muted">
        <li className="flex gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-warn" />
          <span><strong className="text-ink">二重課稅：</strong>日本將定額稅金視為成本，對「稅金」再課 10% 消費稅——上表 L4 中約 ¥{fmt(breakdown.doubleTaxAmount)} 是對 L2＋L3 的重複課徵。</span>
        </li>
        <li className="flex gap-2">
          <Factory size={14} className="mt-0.5 shrink-0 text-accent" />
          <span><strong className="text-ink">公害補償金：</strong>隱藏在石油稅（L2）中的環保支出，每公升約 ¥0.5–0.7，用於支援大氣污染導致的公害病患者。</span>
        </li>
        <li className="flex gap-2">
          <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
          <span><strong className="text-ink">觀察：</strong>調整售價時只有 L1 與 L4 跳動，L2/L3 定額不動——即使原油跌破零，「稅金地板」（約 ¥70 以上）依然存在。</span>
        </li>
      </ul>
    </PageShell>
  );
}
