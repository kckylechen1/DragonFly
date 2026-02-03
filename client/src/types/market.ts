/**
 * Market Types - 行情相关类型定义
 *
 * 负责人: GLM
 */

/**
 * 实时行情 Tick
 */
export interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

/**
 * K线数据
 */
export interface KLine {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 盘口数据（买五卖五）
 */
export interface OrderBook {
  /** 卖盘 [价格, 数量][] */
  asks: Array<[number, number]>;
  /** 买盘 [价格, 数量][] */
  bids: Array<[number, number]>;
  timestamp: number;
}

/**
 * 股票基本信息
 */
export interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  pe?: number;
  pb?: number;
  roe?: number;
  marketCap?: number;
  floatMarketCap?: number;
  turnoverRate?: number;
  volumeRatio?: number;
  dividendYield?: number;
}

/**
 * 资讯
 */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: number;
  url: string;
}
