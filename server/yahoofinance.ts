/**
 * Yahoo Finance API 集成服务
 * 提供美股和港股行情数据
 *
 * 使用方式：
 * - 美股代码: AAPL, NVDA, TSLA, MSFT, AMZN, META, GOOGL
 * - 港股代码: 0700.HK, 9988.HK, 3690.HK
 */

import YahooFinance from "yahoo-finance2";

// Yahoo Finance v3 需要实例化
const yahooFinance = new YahooFinance();

// 设置缓存防止请求过于频繁
const CACHE_TTL = 5000; // 5秒
const cache = new Map<string, { data: any; timestamp: number }>();

function getCacheKey(symbol: string, type: string): string {
  return `${symbol}:${type}`;
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return cached.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface YahooQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  market: "US" | "HK";
  currency: string;
  timestamp: number;
}

export interface KlineData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 获取美股实时报价
 */
export async function getUSStockQuote(
  symbol: string
): Promise<YahooQuote | null> {
  const cacheKey = getCacheKey(symbol, "quote");
  const cached = getCached<YahooQuote>(cacheKey);
  if (cached) return cached;

  try {
    // 确保代码是大写
    const cleanSymbol = symbol.toUpperCase().replace(/\.(US|NYSE|NASDAQ)/i, "");

    const quote: any = await yahooFinance.quote(cleanSymbol);

    if (!quote || !quote.regularMarketPrice) {
      return null;
    }

    const result: YahooQuote = {
      symbol: cleanSymbol,
      name: quote.longName || quote.shortName || cleanSymbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap,
      pe: quote.trailingPE,
      open: quote.regularMarketOpen || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      market: "US",
      currency: quote.currency || "USD",
      timestamp: Date.now(),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(
      `[YahooFinance] Failed to get US quote for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * 获取港股实时报价
 */
export async function getHKStockQuote(
  symbol: string
): Promise<YahooQuote | null> {
  const cacheKey = getCacheKey(symbol, "quote");
  const cached = getCached<YahooQuote>(cacheKey);
  if (cached) return cached;

  try {
    // 港股代码格式: 0700.HK
    let cleanSymbol = symbol.toUpperCase();
    if (!cleanSymbol.includes(".HK")) {
      // 添加 .HK 后缀
      cleanSymbol = `${cleanSymbol}.HK`;
    }

    const quote: any = await yahooFinance.quote(cleanSymbol);

    if (!quote || !quote.regularMarketPrice) {
      return null;
    }

    const result: YahooQuote = {
      symbol: cleanSymbol,
      name: quote.longName || quote.shortName || cleanSymbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap,
      pe: quote.trailingPE,
      open: quote.regularMarketOpen || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      market: "HK",
      currency: quote.currency || "HKD",
      timestamp: Date.now(),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(
      `[YahooFinance] Failed to get HK quote for ${symbol}:`,
      error
    );
    return null;
  }
}

/**
 * 获取K线数据（美股/港股通用）
 */
export async function getKlineData(
  symbol: string,
  period: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" = "1mo",
  interval: "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "1d" = "1d"
): Promise<KlineData[] | null> {
  const cacheKey = getCacheKey(symbol, `kline:${period}:${interval}`);
  const cached = getCached<KlineData[]>(cacheKey);
  if (cached) return cached;

  try {
    const cleanSymbol = symbol.toUpperCase();
    const fullSymbol = cleanSymbol.includes(".HK")
      ? cleanSymbol
      : cleanSymbol.replace(/\.(US|NYSE|NASDAQ)/i, "");

    const endDate = new Date();
    let startDate = new Date();

    // 根据周期设置起始日期
    switch (period) {
      case "1d":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "5d":
        startDate.setDate(startDate.getDate() - 5);
        break;
      case "1mo":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3mo":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6mo":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // v3 API: historical(symbol, { period1, period2 })
    const history: any[] = await yahooFinance.historical(fullSymbol, {
      period1: startDate,
      period2: endDate,
    });

    if (!history || history.length === 0) {
      return null;
    }

    const result: KlineData[] = history.map((item: any) => ({
      timestamp: item.date.toISOString().split("T")[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[YahooFinance] Failed to get kline for ${symbol}:`, error);
    return null;
  }
}

/**
 * 获取美股大盘状态
 */
export async function getUSMarketStatus(): Promise<{
  nasdaq: { price: number; change: number; changePercent: number } | null;
  sp500: { price: number; change: number; changePercent: number } | null;
  dow: { price: number; change: number; changePercent: number } | null;
  isOpen: boolean;
}> {
  try {
    const [nasdaqRaw, sp500Raw, dowRaw] = await Promise.all([
      (async () => {
        try {
          return await yahooFinance.quote("^IXIC");
        } catch {
          return null;
        }
      })(),
      (async () => {
        try {
          return await yahooFinance.quote("^GSPC");
        } catch {
          return null;
        }
      })(),
      (async () => {
        try {
          return await yahooFinance.quote("^DJI");
        } catch {
          return null;
        }
      })(),
    ]);
    const nasdaq: any = nasdaqRaw;
    const sp500: any = sp500Raw;
    const dow: any = dowRaw;

    // 判断是否开盘 (美股交易时间: 9:30-16:00 ET)
    const now = new Date();
    const etTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const hour = etTime.getHours();
    const minute = etTime.getMinutes();
    const isOpen = hour >= 9 && hour < 16;

    return {
      nasdaq: nasdaq
        ? {
          price: nasdaq.regularMarketPrice || 0,
          change: nasdaq.regularMarketChange || 0,
          changePercent: nasdaq.regularMarketChangePercent || 0,
        }
        : null,
      sp500: sp500
        ? {
          price: sp500.regularMarketPrice || 0,
          change: sp500.regularMarketChange || 0,
          changePercent: sp500.regularMarketChangePercent || 0,
        }
        : null,
      dow: dow
        ? {
          price: dow.regularMarketPrice || 0,
          change: dow.regularMarketChange || 0,
          changePercent: dow.regularMarketChangePercent || 0,
        }
        : null,
      isOpen,
    };
  } catch (error) {
    console.error("[YahooFinance] Failed to get US market status:", error);
    return { nasdaq: null, sp500: null, dow: null, isOpen: false };
  }
}

/**
 * 获取港股大盘状态
 */
export async function getHKMarketStatus(): Promise<{
  hangSeng: { price: number; change: number; changePercent: number } | null;
  isOpen: boolean;
}> {
  try {
    const hangSengRaw = await (async () => {
      try {
        return await yahooFinance.quote("^HSI");
      } catch {
        return null;
      }
    })();
    const hangSeng: any = hangSengRaw;

    // 判断港股是否开盘 (港股交易时间: 9:30-12:00, 13:00-16:00 HKT)
    const now = new Date();
    const hkTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Hong_Kong" })
    );
    const hour = hkTime.getHours();
    const minute = hkTime.getMinutes();
    const isOpen =
      (hour === 9 && minute >= 30) ||
      (hour >= 10 && hour < 12) ||
      (hour >= 13 && hour < 16);

    return {
      hangSeng: hangSeng
        ? {
          price: hangSeng.regularMarketPrice || 0,
          change: hangSeng.regularMarketChange || 0,
          changePercent: hangSeng.regularMarketChangePercent || 0,
        }
        : null,
      isOpen,
    };
  } catch (error) {
    console.error("[YahooFinance] Failed to get HK market status:", error);
    return { hangSeng: null, isOpen: false };
  }
}

/**
 * 搜索美股/港股代码
 */
export async function searchStock(query: string): Promise<
  Array<{
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }>
> {
  try {
    const results: any = await yahooFinance.search(query, { newsCount: 0 });

    return (results.quotes || [])
      .filter((q: any) => q.symbol && q.longname)
      .slice(0, 5)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchange || "Unknown",
        type: q.quoteType || "EQUITY",
      }));
  } catch (error) {
    console.error(`[YahooFinance] Search failed for ${query}:`, error);
    return [];
  }
}
