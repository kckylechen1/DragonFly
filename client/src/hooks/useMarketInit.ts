/**
 * useMarketInit - 初始化市场数据
 *
 * 在应用启动或 symbol 变化时:
 * 1. 连接 WebSocket
 * 2. 获取股票基本信息
 * 3. 获取 K 线历史数据
 */

import { useEffect } from "react";
import { useUIStore } from "../stores/ui.store";
import { useMarketStore } from "../stores/market.store";
import { marketClient } from "../realtime/marketClient";

export function useMarketInit() {
    const currentSymbol = useUIStore((s) => s.currentSymbol);
    const setKlineHistory = useMarketStore((s) => s.setKlineHistory);
    const setStockInfo = useMarketStore((s) => s.setStockInfo);

    // 连接 WebSocket
    useEffect(() => {
        marketClient.connect();
        return () => {
            marketClient.disconnect();
        };
    }, []);

    // 获取股票数据
    useEffect(() => {
        if (!currentSymbol) return;

        // 订阅实时行情
        marketClient.subscribe(currentSymbol);

        // 获取股票基本信息
        const fetchStockInfo = async () => {
            try {
                console.log("[useMarketInit] Fetching stock info for:", currentSymbol);

                // 市场检测生成正确的 secid
                let secid: string;
                if (/^[A-Za-z]+$/.test(currentSymbol)) {
                    // 美股：纯字母，使用 105 前缀（股票信息用105，K线用106）
                    secid = `105.${currentSymbol.toUpperCase()}`;
                } else if (/^\d{5}$/.test(currentSymbol) || /\.HK$/i.test(currentSymbol)) {
                    // 港股：5位数字或 .HK 后缀，使用 116 前缀
                    const code = currentSymbol.replace(/\.HK$/i, "").padStart(5, "0");
                    secid = `116.${code}`;
                } else {
                    // A股：上海6开头用1，其他用0
                    secid = currentSymbol.startsWith("6")
                        ? `1.${currentSymbol}`
                        : `0.${currentSymbol}`;
                }

                const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f44,f45,f46,f47,f48,f58,f60,f116,f117,f162,f167,f168,f169,f170,f173,f135,f37`;

                const res = await fetch(url);
                const data = await res.json();

                if (data?.data) {
                    const stock = data.data;
                    console.log("[useMarketInit] Stock info loaded:", stock.f58);
                    setStockInfo(currentSymbol, {
                        symbol: currentSymbol,
                        name: stock.f58 || currentSymbol,
                        exchange: currentSymbol.startsWith("6") ? "SH" : "SZ",
                        industry: "",
                        pe: stock.f162 ? stock.f162 / 100 : undefined,
                        pb: stock.f167 ? stock.f167 / 100 : undefined,
                        roe: stock.f37 ? stock.f37 / 100 : undefined,
                        marketCap: stock.f116 || undefined,
                        floatMarketCap: stock.f117 || undefined,
                        turnoverRate: stock.f168 ? stock.f168 / 100 : undefined,
                        volumeRatio: stock.f170 ? stock.f170 / 100 : undefined,
                        dividendYield: stock.f173 ? stock.f173 / 100 : undefined,
                    });
                }
            } catch (error) {
                console.error("[useMarketInit] Failed to fetch stock info:", error);
                // 设置默认值
                setStockInfo(currentSymbol, {
                    symbol: currentSymbol,
                    name: currentSymbol,
                    exchange: currentSymbol.startsWith("6") ? "SH" : "SZ",
                    industry: "",
                });
            }
        };

        // 获取 K 线历史数据
        const fetchKlineHistory = async () => {
            try {
                console.log("[useMarketInit] Fetching kline for:", currentSymbol);

                // 市场检测生成正确的 secid
                let secid: string;
                if (/^[A-Za-z]+$/.test(currentSymbol)) {
                    // 美股：纯字母，使用 106 前缀
                    secid = `106.${currentSymbol.toUpperCase()}`;
                } else if (/^\d{5}$/.test(currentSymbol) || /\.HK$/i.test(currentSymbol)) {
                    // 港股：5位数字或 .HK 后缀，使用 116 前缀
                    const code = currentSymbol.replace(/\.HK$/i, "").padStart(5, "0");
                    secid = `116.${code}`;
                } else {
                    // A股：上海6开头用1，其他用0
                    secid = currentSymbol.startsWith("6")
                        ? `1.${currentSymbol}`
                        : `0.${currentSymbol}`;
                }

                const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=101&fqt=1&beg=0&end=20500000&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61`;
                console.log("[useMarketInit] Kline URL:", url);

                const res = await fetch(url);
                const data = await res.json();
                console.log("[useMarketInit] Kline response:", data?.data ? "has data" : "no data");

                if (data?.data?.klines) {
                    const klines = data.data.klines.slice(-100).map((line: string) => {
                        const parts = line.split(",");
                        return {
                            time: new Date(parts[0]).getTime(),
                            open: parseFloat(parts[1]),
                            close: parseFloat(parts[2]),
                            high: parseFloat(parts[3]),
                            low: parseFloat(parts[4]),
                            volume: parseInt(parts[5]),
                        };
                    });
                    console.log("[useMarketInit] Parsed klines:", klines.length);
                    setKlineHistory(currentSymbol, klines);
                } else {
                    console.warn("[useMarketInit] No klines in response");
                }
            } catch (error) {
                console.error("[useMarketInit] Failed to fetch kline history:", error);
            }
        };

        fetchStockInfo();
        fetchKlineHistory();

        return () => {
            marketClient.unsubscribe(currentSymbol);
        };
    }, [currentSymbol, setKlineHistory, setStockInfo]);
}
