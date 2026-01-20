import type { Time } from "lightweight-charts";

export interface CandlestickPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumePoint {
  time: Time;
  value: number;
  color?: string;
}

export interface LinePoint {
  time: Time;
  value: number;
}

export interface ChartDataPoint {
  time: number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export type ChartPeriod =
  | "1D"
  | "5D"
  | "1M"
  | "6M"
  | "YTD"
  | "1Y"
  | "5Y"
  | "MAX";

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  mainFlow: number;
  turnoverRate: number;
  amplitude: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
}
