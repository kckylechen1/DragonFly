import React, { useMemo, useState } from "react";
import { useKlineData, useStockExtras, useStockQuote } from "@/api";
import { StockChart } from "@/components/StockChart";
import { useChartHistoryStore } from "@/stores/chartHistory.store";
import { useWatchlistStore } from "@/stores/watchlist.store";
import type {
  ChartPeriod,
  StockQuote,
} from "@/types";
import { BadgeCloud, generateBadges } from "./BadgeCloud";
import { StockHeader } from "./StockHeader";
import { StockInfoPanel } from "./StockInfoPanel";

const PERIOD_MAP: Record<ChartPeriod, { period: string; limit: number }> = {
  "1D": { period: "minute", limit: 240 },
  "5D": { period: "minute", limit: 1200 },
  "1M": { period: "day", limit: 22 },
  "6M": { period: "day", limit: 132 },
  "YTD": { period: "day", limit: 250 },
  "1Y": { period: "day", limit: 250 },
  "5Y": { period: "week", limit: 260 },
  "MAX": { period: "month", limit: 999 },
};

export const CenterTop: React.FC = () => {
  const { currentSymbol, watchlist } = useWatchlistStore();
  const history = useChartHistoryStore(state => state.history);
  const [activePeriod, setActivePeriod] = useState<ChartPeriod>("1D");
  const {
    data: quoteData,
    isLoading: quoteLoading,
    isError: quoteError,
  } = useStockQuote(currentSymbol);
  const { data: extrasData } = useStockExtras(currentSymbol);
  const { period: apiPeriod, limit } = PERIOD_MAP[activePeriod];
  const {
    data: klineData,
    isLoading: klineLoading,
    isError: klineError,
  } = useKlineData(currentSymbol, apiPeriod, limit);

  // 从本地 watchlist / history 获取股票名称作为备用
  const localName = useMemo(() => {
    const watchItem = watchlist.find(w => w.symbol === currentSymbol);
    if (watchItem?.name) return watchItem.name;

    const historyItem = history.find(h => h.symbol === currentSymbol);
    if (historyItem?.name) return historyItem.name;

    return currentSymbol;
  }, [watchlist, history, currentSymbol]);

  const quote = useMemo<StockQuote>(() => {
    if (!quoteData) {
      return {
        symbol: currentSymbol,
        name: localName,
        price: 0,
        change: 0,
        changePercent: 0,
        mainFlow: 0,
        turnoverRate: 0,
        amplitude: 0,
        amount: 0,
        volumeRatio: undefined,
        pe: null,
        pb: null,
        marketCap: null,
        circulationMarketCap: null,
      };
    }

    const price = quoteData.price ?? 0;
    const preClose = quoteData.preClose ?? price;
    const high = quoteData.high ?? price;
    const low = quoteData.low ?? price;
    const amplitude = preClose
      ? ((high - low) / preClose) * 100
      : 0;

    return {
      symbol: quoteData.code ?? currentSymbol,
      // 优先使用 API 返回的名称，其次是本地 watchlist，最后是代码
      name: quoteData.name || localName,
      price: price ?? 0,
      change: quoteData.change ?? 0,
      changePercent: quoteData.changePercent ?? 0,
      mainFlow:
        extrasData?.capitalFlow?.mainNetInflow ??
        quoteData.mainNetInflow ??
        0,
      turnoverRate: quoteData.turnoverRate ?? 0,
      amplitude,
      volume: quoteData.volume ?? undefined,
      high: quoteData.high ?? undefined,
      low: quoteData.low ?? undefined,
      open: quoteData.open ?? undefined,
      prevClose: quoteData.preClose ?? undefined,
      amount: quoteData.amount ?? undefined,
      volumeRatio: quoteData.volumeRatio ?? undefined,
      pe: quoteData.pe ?? null,
      pb: quoteData.pb ?? null,
      marketCap: quoteData.marketCap ?? null,
      circulationMarketCap: quoteData.circulationMarketCap ?? null,
    };
  }, [currentSymbol, quoteData, localName, extrasData]);

  const badges = useMemo(() => generateBadges(quote), [quote]);
  const chartData = useMemo(() => {
    if (!klineData) return [];
    return klineData
      .map(kline => {
        const rawTime =
          typeof kline.time === "string"
            ? kline.time.replace(" ", "T")
            : kline.time;
        const timeValue =
          typeof rawTime === "number" ? rawTime : new Date(rawTime).getTime();
        if (!timeValue) return null;
        return {
          time: Math.floor(timeValue / 1000),
          value: kline.close,
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume,
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> => item !== null
      );
  }, [klineData]);

  const statusMessage = quoteLoading || klineLoading
    ? "加载中..."
    : quoteError || klineError
      ? "数据加载失败"
      : "";

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] p-4 gap-3 overflow-auto">
      <div className="shrink-0">
        <StockHeader quote={quote} />
      </div>

      <div className="shrink-0">
        <BadgeCloud badges={badges} />
      </div>

      <div className="shrink-0">
        <StockInfoPanel
          quote={quote}
          capitalFlow={extrasData?.capitalFlow ?? null}
        />
      </div>

      <div className="flex-1 min-h-[300px] bg-[var(--bg-secondary)] rounded border border-[var(--panel-border)] overflow-hidden">
        {statusMessage ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            {statusMessage}
          </div>
        ) : (
          <StockChart
            data={chartData}
            height={520}
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
          />
        )}
      </div>
    </div>
  );
};

export default CenterTop;
