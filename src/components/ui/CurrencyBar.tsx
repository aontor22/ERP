import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  TrendingUp,
  Globe2,
  Calculator,
  ArrowRightLeft,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';
import {
  SUPPORTED_CURRENCIES,
  fetchExchangeRates,
  convertCurrency,
  formatMultiCurrency,
  ExchangeRatesData,
} from '../../lib/currency.js';

interface CurrencyBarProps {
  baseCurrency: string;
  onBaseCurrencyChange: (newBase: string) => void;
  onRatesLoaded?: (rates: ExchangeRatesData) => void;
  className?: string;
}

export const CurrencyBar: React.FC<CurrencyBarProps> = ({
  baseCurrency,
  onBaseCurrencyChange,
  onRatesLoaded,
  className = '',
}) => {
  const [ratesData, setRatesData] = useState<ExchangeRatesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Quick Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcFrom, setCalcFrom] = useState<string>('USD');
  const [calcTo, setCalcTo] = useState<string>(baseCurrency);

  const loadRates = async (base: string) => {
    try {
      setLoading(true);
      const data = await fetchExchangeRates(base);
      setRatesData(data);
      if (onRatesLoaded) {
        onRatesLoaded(data);
      }
    } catch (err) {
      console.error('Failed to load exchange rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates(baseCurrency);
  }, [baseCurrency]);

  useEffect(() => {
    // Keep calculator target in sync if base changes
    setCalcTo(baseCurrency);
  }, [baseCurrency]);

  // Currencies to highlight in the ticker strip
  const tickerCurrencies = ['USD', 'EUR', 'GBP', 'CNY', 'AED', 'INR'].filter(
    (c) => c !== baseCurrency
  );

  const calcResult = convertCurrency(calcAmount, calcFrom, calcTo, ratesData);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs transition-all ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Base Currency Selector & Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Globe2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Functional</span> Base:
          </div>

          <div className="relative inline-block">
            <select
              value={baseCurrency}
              onChange={(e) => onBaseCurrencyChange(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-3xs font-medium text-slate-600 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                ratesData?.isLive
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span className="hidden md:inline">
              {ratesData?.isLive ? 'Live Open Exchange Rates' : 'NBR Statutory Benchmark'}
            </span>
            <span className="md:hidden">
              {ratesData?.isLive ? 'Live FX' : 'Statutory'}
            </span>
          </div>

          <button
            onClick={() => loadRates(baseCurrency)}
            disabled={loading}
            title="Fetch real-time exchange rates"
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-3xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh Rates</span>
          </button>
        </div>

        {/* Right: Exchange Rate Ticker & Calculator Button */}
        <div className="flex items-center justify-between lg:justify-end gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-2xs overflow-x-auto py-0.5 scrollbar-thin">
            {tickerCurrencies.map((code) => {
              const cfg = SUPPORTED_CURRENCIES[code];
              // Rate: how many base currency units per 1 unit of this foreign currency
              const rateToBase = ratesData?.ratesToBase?.[code] || 
                (ratesData?.rates?.[code] ? 1 / ratesData.rates[code] : null);
              
              if (!rateToBase) return null;

              return (
                <div
                  key={code}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-md font-mono text-3xs shrink-0"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    1 {code}
                  </span>
                  <span className="text-slate-400">=</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {SUPPORTED_CURRENCIES[baseCurrency]?.symbol || ''}
                    {rateToBase < 1 ? rateToBase.toFixed(4) : rateToBase.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-2xs ${
              showCalculator
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FX Calc</span>
          </button>
        </div>
      </div>

      {/* Expandable Quick Currency Converter */}
      {showCalculator && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-blue-50/50 dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-slate-700/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick FX Converter:
              </span>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-right text-slate-900 dark:text-white"
                />

                <select
                  value={calcFrom}
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const temp = calcFrom;
                    setCalcFrom(calcTo);
                    setCalcTo(temp);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Swap currencies"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>

                <select
                  value={calcTo}
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Result Display */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
              <div className="text-left sm:text-right">
                <span className="text-3xs text-slate-500 dark:text-slate-400 block">
                  Converted Equivalent (@ {calcResult.rate.toFixed(4)}):
                </span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMultiCurrency(calcResult.convertedAmount, calcTo)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
