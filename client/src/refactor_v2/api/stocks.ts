import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

// 获取股票实时行情
export function useStockQuote(code: string) {
  return useQuery({
    queryKey: ["stock", "quote", code],
    queryFn: () => api.stocks.getQuote.query({ code }),
    enabled: !!code,
    staleTime: 5000,
    refetchInterval: 10000,
  });
}

// 获取股票扩展数据（资金流向、排名等）
export function useStockExtras(code: string) {
  return useQuery({
    queryKey: ["stock", "extras", code],
    queryFn: () => api.stocks.getExtras.query({ code }),
    enabled: !!code,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// 获取K线数据
export function useKlineData(
  code: string,
  period: string = "day",
  limit: number = 60
) {
  return useQuery({
    queryKey: ["stock", "kline", code, period, limit],
    queryFn: () => api.stocks.getKline.query({ code, period, limit }),
    enabled: !!code,
    staleTime: 60000,
  });
}

// 获取分时数据
export function useTimelineData(code: string) {
  return useQuery({
    queryKey: ["stock", "timeline", code],
    queryFn: () => api.stocks.getTimeline.query({ code }),
    enabled: !!code,
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

// 获取 Gauge 评分
export function useGaugeScore(code: string) {
  return useQuery({
    queryKey: ["stock", "gauge", code],
    queryFn: () => api.stocks.getGaugeScore.query({ code }),
    enabled: !!code,
    staleTime: 300000,
  });
}

// 搜索股票
export function useStockSearch(keyword: string) {
  return useQuery({
    queryKey: ["stock", "search", keyword],
    queryFn: () => api.stocks.search.query({ keyword }),
    enabled: keyword.length >= 1,
    staleTime: 60000,
  });
}
