/**
 * Multi-Currency & Exchange Rate Utility for ApexERP
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  country: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  BDT: { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'BD', decimals: 2 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', country: 'US', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', country: 'EU', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', country: 'GB', decimals: 2 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'CN', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'JP', decimals: 0 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'AE', decimals: 2 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'IN', decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'SG', decimals: 2 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'SA', decimals: 2 },
};

// Default benchmark exchange rates: How many BDT per 1 unit of foreign currency
export const DEFAULT_BENCHMARK_RATES_TO_BDT: Record<string, number> = {
  BDT: 1.0,
  USD: 121.5,
  EUR: 132.8,
  GBP: 158.4,
  CNY: 17.1,
  JPY: 0.81,
  AED: 33.08,
  INR: 1.45,
  SGD: 93.4,
  SAR: 32.38,
};

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>; // How many units of other currency per 1 base unit
  ratesToBase: Record<string, number>; // How many units of base currency per 1 other currency unit
  lastUpdated: string;
  source: string;
  isLive: boolean;
}

const STORAGE_KEY_RATES = 'apex_exchange_rates';
const STORAGE_KEY_BASE_CURRENCY = 'apex_base_currency';

export function getStoredBaseCurrency(): string {
  try {
    const val = localStorage.getItem(STORAGE_KEY_BASE_CURRENCY);
    if (val && SUPPORTED_CURRENCIES[val]) return val;
  } catch {
    // fallback
  }
  return 'BDT';
}

export function saveStoredBaseCurrency(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY_BASE_CURRENCY, code);
  } catch {
    // ignore
  }
}

/**
 * Fetch real-time exchange rates.
 * Tries server endpoint first, then public API, then local benchmarks.
 */
export async function fetchExchangeRates(baseCurrency: string = 'BDT'): Promise<ExchangeRatesData> {
  const now = new Date();

  // Try Server API first
  try {
    const serverRes = await fetch(`/api/v1/exchange-rates?base=${encodeURIComponent(baseCurrency)}`);
    if (serverRes.ok) {
      const json = await serverRes.json();
      if (json.success && json.data) {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch {
    // Server fetch failed, try direct public fallback
  }

  // Direct public fallback
  try {
    const pubRes = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`);
    if (pubRes.ok) {
      const pubData = await pubRes.json();
      if (pubData.result === 'success' && pubData.rates) {
        const rates: Record<string, number> = pubData.rates;
        const ratesToBase: Record<string, number> = {};

        Object.keys(SUPPORTED_CURRENCIES).forEach((curr) => {
          if (rates[curr]) {
            ratesToBase[curr] = 1 / rates[curr];
          }
        });

        const resultData: ExchangeRatesData = {
          base: baseCurrency,
          rates,
          ratesToBase,
          lastUpdated: now.toISOString(),
          source: 'Open Exchange Rates (Live Web API)',
          isLive: true,
        };

        try {
          localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(resultData));
        } catch {
          // ignore
        }

        return resultData;
      }
    }
  } catch {
    // Fallback to offline / benchmark rates
  }

  // Offline / Reference fallback (calculated relative to requested base)
  const bdtRateOfBase = DEFAULT_BENCHMARK_RATES_TO_BDT[baseCurrency] || 1;
  const rates: Record<string, number> = {};
  const ratesToBase: Record<string, number> = {};

  Object.entries(DEFAULT_BENCHMARK_RATES_TO_BDT).forEach(([code, bdtPerUnit]) => {
    // How many units of 'code' per 1 unit of 'base'
    const unitsOfCodePerBase = bdtRateOfBase / bdtPerUnit;
    rates[code] = unitsOfCodePerBase;
    ratesToBase[code] = bdtPerUnit / bdtRateOfBase;
  });

  const fallbackData: ExchangeRatesData = {
    base: baseCurrency,
    rates,
    ratesToBase,
    lastUpdated: now.toISOString(),
    source: 'Bangladesh Bank / NBR Statutory FX Benchmarks',
    isLive: false,
  };

  return fallbackData;
}

/**
 * Convert an amount between two currencies using the provided rates data
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesData?: ExchangeRatesData | null
): { convertedAmount: number; rate: number } {
  if (fromCurrency === toCurrency || amount === 0) {
    return { convertedAmount: amount, rate: 1.0 };
  }

  // If we have ratesData with matching base
  if (ratesData) {
    const base = ratesData.base;
    if (fromCurrency === base && ratesData.rates[toCurrency]) {
      const rate = ratesData.rates[toCurrency];
      return { convertedAmount: amount * rate, rate };
    }
    if (toCurrency === base && ratesData.ratesToBase[fromCurrency]) {
      const rate = ratesData.ratesToBase[fromCurrency];
      return { convertedAmount: amount * rate, rate };
    }
    // Cross currency via base
    const fromToBaseRate = ratesData.ratesToBase[fromCurrency] || (1 / (ratesData.rates[fromCurrency] || 1));
    const toFromBaseRate = ratesData.rates[toCurrency] || (1 / (ratesData.ratesToBase[toCurrency] || 1));
    const crossRate = fromToBaseRate * toFromBaseRate;
    return { convertedAmount: amount * crossRate, rate: crossRate };
  }

  // Benchmark calculation
  const bdtPerFrom = DEFAULT_BENCHMARK_RATES_TO_BDT[fromCurrency] || 1;
  const bdtPerTo = DEFAULT_BENCHMARK_RATES_TO_BDT[toCurrency] || 1;
  const rate = bdtPerFrom / bdtPerTo;
  return { convertedAmount: amount * rate, rate };
}

/**
 * Format currency with international symbols
 */
export function formatMultiCurrency(
  amount: number,
  currencyCode: string = 'BDT'
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    const cfg = SUPPORTED_CURRENCIES[currencyCode];
    return `${cfg?.symbol || currencyCode} 0.00`;
  }

  const cfg = SUPPORTED_CURRENCIES[currencyCode];
  const symbol = cfg?.symbol || currencyCode;
  const decimals = cfg?.decimals !== undefined ? cfg.decimals : 2;

  const formattedNum = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol} ${formattedNum}`;
}
