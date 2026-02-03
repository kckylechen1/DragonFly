/**
 * 智能数据获取服务
 * 整合 Eastmoney API 和 AKShare/AKTools，提供自动降级和重试机制
 *
 * 优先级策略：
 * 1. Eastmoney API - 主要数据源（免费、实时、无需额外服务）
 * 2. AKTools - 补充数据源（龙虎榜、融资融券等专业数据）
 * 3. 本地缓存 - 降级方案（当外部服务不可用时）
 *
 * 改进点：
 * - 自动服务发现和降级
 * - 指数退避重试机制
 * - 请求去重和缓存
 * - 更好的错误处理
 */

import axios, { AxiosError } from "axios";
import {
  getStockQuote as getEastmoneyQuote,
  getKlineData,
  searchStock,
} from "./eastmoney";

// ==================== 配置 ====================

const AKTOOLS_BASE_URL = process.env.AKTOOLS_URL || "http://127.0.0.1:8098";

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffMultiplier: 2,
};

// 缓存配置
const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 500,
};

// ==================== 类型定义 ====================

export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  preClose: number;
  volume: number;
  amount: number;
  turnoverRate: number | null;
  pe: number | null;
  pb: number | null;
  marketCap: number;
  circulationMarketCap: number;
  volumeRatio: number | null;
}

export interface ServiceStatus {
  eastmoney: boolean;
  aktools: boolean;
  lastCheck: number;
  error?: string;
}

// ==================== 缓存系统 ====================

class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_CONFIG.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    // LRU: 如果缓存满了，删除最旧的
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      const oldestKey = this.cache.keys().next().value as string;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

const globalCache = new RequestCache();

// ==================== 服务状态管理 ====================

let serviceStatus: ServiceStatus = {
  eastmoney: true,
  aktools: false,
  lastCheck: 0,
};

let statusCheckPromise: Promise<ServiceStatus> | null = null;

/**
 * 检查所有服务状态
 */
export async function checkServices(): Promise<ServiceStatus> {
  // 使用缓存（30秒内不重复检查）
  if (Date.now() - serviceStatus.lastCheck < 30000) {
    return serviceStatus;
  }

  // 防止并发检查
  if (statusCheckPromise) {
    return statusCheckPromise;
  }

  statusCheckPromise = (async () => {
    const status: ServiceStatus = {
      eastmoney: false,
      aktools: false,
      lastCheck: Date.now(),
    };

    // 检查 Eastmoney
    try {
      await axios.get(
        "https://push2.eastmoney.com/api/qt/stock/get?secid=1.600000&fields=f43",
        {
          timeout: 5000,
        }
      );
      status.eastmoney = true;
    } catch (error) {
      console.warn("[SmartData] Eastmoney API 检查失败");
    }

    // 检查 AKTools
    try {
      await axios.get(`${AKTOOLS_BASE_URL}/version`, { timeout: 3000 });
      status.aktools = true;
    } catch (error) {
      console.warn("[SmartData] AKTools 服务未运行");
    }

    serviceStatus = status;
    statusCheckPromise = null;
    return status;
  })();

  return statusCheckPromise;
}

// ==================== 重试机制 ====================

async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // 如果是 4xx 错误，不重试（客户端错误）
      if (error instanceof AxiosError && error.response?.status) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }

      // 计算退避延迟（指数退避 + 随机抖动）
      if (attempt < RETRY_CONFIG.maxRetries - 1) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay *
            Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        );
        const jitter = Math.random() * 1000; // 0-1秒随机抖动

        console.log(
          `[SmartData] ${context} 失败，${delay + jitter}ms 后重试 (${attempt + 1}/${RETRY_CONFIG.maxRetries})...`
        );
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }

  throw (
    lastError ||
    new Error(`${context} 在 ${RETRY_CONFIG.maxRetries} 次尝试后仍然失败`)
  );
}

// ==================== 智能股票行情获取 ====================

/**
 * 获取股票实时行情（智能降级）
 * 优先级: Eastmoney → 缓存 → null
 */
export async function getSmartStockQuote(
  symbol: string
): Promise<StockQuote | null> {
  const cacheKey = `quote:${symbol}`;

  // 1. 检查缓存
  const cached = globalCache.get(cacheKey);
  if (cached) {
    console.log(`[SmartData] 使用缓存行情: ${symbol}`);
    return cached;
  }

  // 2. 尝试 Eastmoney API
  try {
    const quote = await withRetry(
      () => getEastmoneyQuote(symbol),
      `Eastmoney行情获取(${symbol})`
    );

    if (quote) {
      globalCache.set(cacheKey, quote);
      return quote;
    }
  } catch (error) {
    console.error(`[SmartData] Eastmoney 获取失败:`, error);
  }

  // 3. 返回 null（上层可以处理降级）
  return null;
}

/**
 * 批量获取股票行情
 */
export async function getSmartStockQuotes(
  symbols: string[]
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  // 并行获取所有行情
  const promises = symbols.map(async symbol => {
    const quote = await getSmartStockQuote(symbol);
    if (quote) {
      results.set(symbol, quote);
    }
  });

  await Promise.all(promises);
  return results;
}

// ==================== 智能K线数据获取 ====================

export interface KlineData {
  time: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
}

/**
 * 获取K线数据（智能降级）
 * 优先级: Eastmoney → 缓存 → null
 */
export async function getSmartKlineData(
  symbol: string,
  period: "day" | "week" | "month" = "day",
  limit: number = 120
): Promise<KlineData[]> {
  const cacheKey = `kline:${symbol}:${period}:${limit}`;

  // 1. 检查缓存
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. 尝试 Eastmoney API
  try {
    const data = await withRetry(
      () => getKlineData(symbol, period),
      `EastmoneyK线获取(${symbol})`
    );

    if (data && data.length > 0) {
      globalCache.set(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.error(`[SmartData] Eastmoney K线获取失败:`, error);
  }

  return [];
}

// ==================== 智能搜索 ====================

export interface StockSearchResult {
  code: string;
  symbol: string;
  name: string;
  market: "SH" | "SZ";
  type: string;
}

/**
 * 搜索股票（智能降级）
 */
export async function smartSearchStock(
  keyword: string
): Promise<StockSearchResult[]> {
  if (!keyword || keyword.length < 2) {
    return [];
  }

  const cacheKey = `search:${keyword}`;

  // 1. 检查缓存
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. 尝试 Eastmoney API
  try {
    const results = await withRetry(
      () => searchStock(keyword),
      `Eastmoney搜索(${keyword})`
    );

    if (results && results.length > 0) {
      globalCache.set(cacheKey, results);
      return results;
    }
  } catch (error) {
    console.error(`[SmartData] Eastmoney 搜索失败:`, error);
  }

  return [];
}

// ==================== AKTools 专用接口（保留） ====================

/**
 * 调用 AKTools（带重试和降级）
 */
export async function callAKTools<T>(
  endpoint: string,
  params: Record<string, any> = {},
  timeout: number = 30000
): Promise<T | null> {
  // 先检查服务状态
  const status = await checkServices();
  if (!status.aktools) {
    console.warn(`[SmartData] AKTools 不可用，跳过 ${endpoint}`);
    return null;
  }

  try {
    return await withRetry(async () => {
      const url = `${AKTOOLS_BASE_URL}/api/public/${endpoint}`;
      const response = await axios.get(url, { params, timeout });
      return response.data;
    }, `AKTools调用(${endpoint})`);
  } catch (error) {
    console.error(`[SmartData] AKTools ${endpoint} 最终失败:`, error);
    return null;
  }
}

// ==================== 专用数据接口 ====================

/**
 * 获取龙虎榜数据（AKTools 专用）
 */
export async function getLongHuBangData(date?: string): Promise<any[] | null> {
  if (date) {
    return callAKTools("stock_lhb_detail_daily_sina", { date });
  }
  return callAKTools("stock_lhb_stock_statistic_em");
}

/**
 * 获取资金流向排行（AKTools 专用）
 */
export async function getFundFlowRank(
  indicator: "today" | "3day" | "5day" | "10day" = "today"
): Promise<any[] | null> {
  const indicatorMap: Record<string, string> = {
    today: "今日",
    "3day": "3日",
    "5day": "5日",
    "10day": "10日",
  };

  return callAKTools("stock_individual_fund_flow_rank", {
    indicator: indicatorMap[indicator],
  });
}

/**
 * 获取融资融券数据（AKTools 专用）
 */
export async function getMarginTradingData(
  symbol: string
): Promise<any[] | null> {
  return callAKTools("stock_margin_detail_em", { symbol });
}

// ==================== 工具函数 ====================

/**
 * 清除缓存
 */
export function clearSmartDataCache(): void {
  globalCache.clear();
  console.log("[SmartData] 缓存已清除");
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  ttl: number;
} {
  return {
    size: globalCache.size,
    maxSize: CACHE_CONFIG.maxSize,
    ttl: CACHE_CONFIG.ttl,
  };
}

/**
 * 健康检查报告
 */
export async function getHealthReport(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  services: ServiceStatus;
  cache: { size: number; maxSize: number; ttl: number };
  message: string;
}> {
  const status = await checkServices();

  let healthStatus: "healthy" | "degraded" | "unhealthy" = "unhealthy";
  let message = "";

  if (status.eastmoney && status.aktools) {
    healthStatus = "healthy";
    message = "所有服务正常运行";
  } else if (status.eastmoney) {
    healthStatus = "degraded";
    message = "Eastmoney 正常，AKTools 不可用（部分专业数据无法获取）";
  } else {
    healthStatus = "unhealthy";
    message = "Eastmoney 不可用，系统将依赖缓存";
  }

  return {
    status: healthStatus,
    services: status,
    cache: getCacheStats(),
    message,
  };
}
