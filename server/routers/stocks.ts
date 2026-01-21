/**
 * Stocks Router
 * 股票相关路由：搜索、行情、K线、评分等
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as eastmoney from "../eastmoney";
import * as ifind from "../ifind";
import * as fundflow from "../fundflow";
import { getQuoteWithFallback, getCachedRankData } from "./_utils";

export const stocksRouter = router({
  // 搜索股票
  search: publicProcedure
    .input(z.object({ keyword: z.string() }))
    .query(async ({ input }) => {
      try {
        // 使用东方财富API搜索股票
        return await eastmoney.searchStock(input.keyword);
      } catch (error) {
        console.error("Search failed:", error);
        // 返回空数组而不是抛出错误
        return [];
      }
    }),

  // 获取股票实时行情（轻量）
  getQuote: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      try {
        return await getQuoteWithFallback(input.code);
      } catch (error: any) {
        console.error(
          `[Quote] Failed to get quote for ${input.code}:`,
          error?.message
        );
        return null;
      }
    }),

  // 获取股票扩展数据（非实时）
  getExtras: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      try {
        const akshare = await import("../akshare");
        const [rankData, stockInfo, capitalFlowData] = await Promise.all([
          getCachedRankData(input.code),
          akshare.getStockInfo(input.code),
          fundflow.getStockFundFlow(input.code),
        ]);

        return {
          stock: stockInfo,
          capitalFlow: capitalFlowData,
          hotRank: rankData?.hotRank || null,
          xueqiuRank: rankData?.xueqiuRank || null,
        };
      } catch (error) {
        console.error("Get extras failed:", error);
        return {
          stock: null,
          capitalFlow: null,
          hotRank: null,
          xueqiuRank: null,
        };
      }
    }),

  // 获取股票详情（包含行情、资金流、排名）
  getDetail: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "code" in val) {
        return val as { code: string };
      }
      throw new Error("Invalid input");
    })
    .query(async ({ input }) => {
      // 并行获取数据
      const akshare = await import("../akshare");
      const quote = await getQuoteWithFallback(input.code);
      const rankData = await getCachedRankData(input.code);
      const stockInfo = await akshare.getStockInfo(input.code);

      // 获取资金流向
      const capitalFlowData = await fundflow.getStockFundFlow(input.code);

      return {
        stock: stockInfo,
        quote: quote,
        basic: null,
        capitalFlow: capitalFlowData,
        hotRank: rankData?.hotRank || null,
        xueqiuRank: rankData?.xueqiuRank || null,
      };
    }),

  // 获取单只股票的人气排名（保留接口以备不时之需，但主要通过 getDetail 获取）
  getHotRank: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "code" in val) {
        return val as { code: string };
      }
      throw new Error("Invalid input");
    })
    .query(async ({ input }) => {
      // 不捕获错误，让 TRPC 抛出异常，触发前端重试机制
      const akshare = await import("../akshare");
      const [hotRank, xueqiuRank] = await Promise.all([
        akshare.getHotRankLatestBySymbolEM(input.code),
        akshare.getXueqiuRankBySymbol(input.code),
      ]);
      return { hotRank, xueqiuRank };
    }),

  // 获取分时数据
  getTimeline: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "code" in val) {
        return val as { code: string; days?: number };
      }
      throw new Error("Invalid input");
    })
    .query(async ({ input }) => {
      const days = input.days || 1;

      // 数据源1：Eastmoney（主数据源，免费无配额限制）
      try {
        const eastmoneyData = await eastmoney.getTimelineData(input.code, days);
        if (eastmoneyData && eastmoneyData.timeline && eastmoneyData.timeline.length > 0) {
          console.log(`[getTimeline] Eastmoney returned ${eastmoneyData.timeline.length} points`);
          return eastmoneyData;
        }
      } catch (eastmoneyError: any) {
        console.warn("[getTimeline] Eastmoney failed:", eastmoneyError?.message);
      }

      // 数据源2：iFinD（备选，配额有限，暂时禁用以保护配额）
      // try {
      //   const ifindData = await ifind.getTimelineData(input.code, days);
      //   if (ifindData && ifindData.timeline && ifindData.timeline.length > 0) {
      //     console.log(`[getTimeline] iFinD returned ${ifindData.timeline.length} points`);
      //     return ifindData;
      //   }
      // } catch (ifindError: any) {
      //   console.warn("[getTimeline] iFinD failed:", ifindError?.message);
      // }

      console.error("[getTimeline] All data sources failed");
      return { preClose: 0, timeline: [] };
    }),


  // 获取K线数据
  getKline: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "code" in val) {
        return val as { code: string; period?: string; limit?: number };
      }
      throw new Error("Invalid input");
    })
    .query(async ({ input }) => {
      try {
        const period = (input.period || "day") as
          | "day"
          | "week"
          | "month"
          | "minute";
        const limit = input.limit || 60;

        if (period === "minute") {
          const days = Math.max(1, Math.ceil(limit / 240));
          let timeline: any[] = [];

          // 数据源1：Eastmoney 分时（主数据源，免费无配额限制）
          try {
            const eastmoneyTimeline = await eastmoney.getTimelineData(
              input.code,
              days
            );
            if (eastmoneyTimeline?.timeline?.length) {
              timeline = eastmoneyTimeline.timeline;
              console.log(`[getKline] Eastmoney minute returned ${timeline.length} points`);
            }
          } catch (eastmoneyError: any) {
            console.warn(
              "[getKline] Eastmoney minute failed:",
              eastmoneyError?.message
            );
          }

          // iFinD 分时已禁用以保护配额
          // if (!timeline.length) { try { ... } }

          if (!timeline.length) {
            return [];
          }

          return timeline.slice(-limit).map((item: any) => {
            const price = item.price ?? item.avgPrice ?? 0;
            return {
              time: item.time,
              open: price,
              high: price,
              low: price,
              close: price,
              volume: item.volume ?? 0,
            };
          });
        }

        let klines: any[] = [];

        // 数据源1：Eastmoney（主数据源，免费无配额限制）
        try {
          const eastmoneyKlines = await eastmoney.getKlineData(input.code, period);
          if (eastmoneyKlines && eastmoneyKlines.length > 0) {
            klines = eastmoneyKlines.slice(-limit);
            console.log(`[getKline] Eastmoney returned ${klines.length} bars`);
          }
        } catch (eastmoneyError: any) {
          console.warn("[getKline] Eastmoney failed:", eastmoneyError?.message);
        }

        // 数据源2：AKShare（免费备选）
        if (!klines.length) {
          try {
            const akshare = await import("../akshare");
            const akPeriod = period === "day" ? "daily" : period === "week" ? "weekly" : "monthly";
            const akshareKlines = await akshare.getStockHistory(input.code, akPeriod, limit);
            if (akshareKlines && akshareKlines.length > 0) {
              // 转换 AKShare 格式
              klines = akshareKlines.map((item: any) => ({
                time: item.date,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
              }));
              console.log(`[getKline] AKShare returned ${klines.length} bars`);
            }
          } catch (akshareError: any) {
            console.error("[getKline] AKShare failed:", akshareError?.message);
          }
        }

        // iFinD K线已禁用以保护配额

        if (!klines || klines.length === 0) {
          return [];
        }

        // 限制返回数量
        const limitedKlines = klines.slice(-limit);

        // 转换为前端需要的格式
        return limitedKlines.map((item: any) => ({
          time: item.time || item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }));
      } catch (error) {
        console.error("Get kline failed:", error);
        return [];
      }
    }),

  // 获取 Gauge 技术评分
  getGaugeScore: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "code" in val) {
        return val as { code: string };
      }
      throw new Error("Invalid input");
    })
    .query(async ({ input }) => {
      try {
        const { calculateGaugeScore } = await import("../gauge/indicators");

        // 获取 K 线数据（需要至少 60 条）
        const klines = await eastmoney.getKlineData(input.code, "day");
        const recentKlines = klines.slice(-80);

        if (recentKlines.length < 30) {
          return null;
        }

        // 转换格式
        const formattedKlines = recentKlines.map((item: any) => ({
          time: item.time || item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }));

        // 计算 Gauge 评分
        return calculateGaugeScore(formattedKlines);
      } catch (error) {
        console.error("Get gauge score failed:", error);
        return null;
      }
    }),

  // 获取热门股票排行榜（基于Gauge评分）
  getTopStocks: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        sortBy: z
          .enum(["score", "change", "volume"])
          .optional()
          .default("score"),
      })
    )
    .query(async ({ input }) => {
      try {
        const { getWatchlist } = await import("../db");
        const { calculateGaugeScore } = await import("../gauge/indicators");

        // 获取观察池股票
        const watchlist = await getWatchlist();

        // 并发获取每只股票的评分和行情
        const stocksWithScores = await Promise.all(
          watchlist.map(async stock => {
            try {
              // 获取K线数据
              const klines = await eastmoney.getKlineData(
                stock.stockCode,
                "day"
              );
              const recentKlines = klines.slice(-80);

              if (recentKlines.length < 30) {
                return null;
              }

              // 转换格式
              const formattedKlines = recentKlines.map((item: any) => ({
                time: item.time || item.date,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
              }));

              // 计算Gauge评分
              const gaugeScore = calculateGaugeScore(formattedKlines);

              // 获取实时行情
              const quote = await eastmoney.getStockQuote(stock.stockCode);

              return {
                code: stock.stockCode,
                name: quote.name,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
                volume: quote.volume,
                amount: quote.amount,
                turnoverRate: quote.turnoverRate,
                gaugeScore: gaugeScore.score,
                signal: gaugeScore.signal,
                confidence: gaugeScore.confidence,
              };
            } catch (error) {
              console.error(
                `Failed to get score for ${stock.stockCode}:`,
                error
              );
              return null;
            }
          })
        );

        // 过滤空值并排序
        const validStocks = stocksWithScores.filter(s => s !== null);

        // 根据排序方式排序
        validStocks.sort((a, b) => {
          if (input.sortBy === "score") {
            return b.gaugeScore - a.gaugeScore;
          } else if (input.sortBy === "change") {
            return b.changePercent - a.changePercent;
          } else {
            return b.volume - a.volume;
          }
        });

        return validStocks.slice(0, input.limit);
      } catch (error) {
        console.error("Get top stocks failed:", error);
        return [];
      }
    }),
});
