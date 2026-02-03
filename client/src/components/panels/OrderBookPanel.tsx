/**
 * L-015: OrderBookPanel - 盘口面板
 * 开始时间: 2026-01-30 00:45:00
 *
 * 功能:
 * - 三栏布局: 卖五到卖一 | 中间价格 | 买一到买五
 * - 委托量进度条
 * - 价格变化脉冲动画
 * - A股规则: 红涨绿跌
 */

import React, { useRef, useEffect, useMemo } from "react";
import type { PanelProps } from "../../types/panel";
import { useMarketStore } from "../../stores/market.store";
import "./OrderBookPanel.css";

interface OrderRowProps {
  label: string;
  price: number;
  volume: number;
  maxVolume: number;
  type: "ask" | "bid";
  isPulse: boolean;
}

const OrderRow: React.FC<OrderRowProps> = ({
  label,
  price,
  volume,
  maxVolume,
  type,
  isPulse,
}) => {
  const percentage = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;
  const colorClass = type === "ask" ? "orderbook-ask" : "orderbook-bid";

  return (
    <div
      className={`orderbook-row ${colorClass} ${isPulse ? "orderbook-pulse" : ""}`}
    >
      <div
        className="orderbook-bar"
        style={{ width: `${percentage}%` }}
      />
      <span className="orderbook-label">{label}</span>
      <span className="orderbook-price">{price.toFixed(2)}</span>
      <span className="orderbook-volume">{volume.toLocaleString()}</span>
    </div>
  );
};

const OrderBookPanel: React.FC<PanelProps> = ({ symbol }) => {
  const orderbook = useMarketStore((s) => s.orderbook[symbol]);
  const tick = useMarketStore((s) => s.data[symbol]);

  const prevPriceRef = useRef<number | null>(null);
  const prevOrderbookRef = useRef<string | null>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPulse, setIsPulse] = React.useState(false);

  const maxVolume = useMemo(() => {
    if (!orderbook) return 0;
    const allVolumes = [
      ...(orderbook.asks?.map(([, v]) => v) || []),
      ...(orderbook.bids?.map(([, v]) => v) || []),
    ];
    return Math.max(...allVolumes, 1);
  }, [orderbook]);

  useEffect(() => {
    const orderbookKey = JSON.stringify(orderbook);
    if (prevOrderbookRef.current !== null && prevOrderbookRef.current !== orderbookKey) {
      setIsPulse(true);
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      pulseTimeoutRef.current = setTimeout(() => {
        setIsPulse(false);
      }, 200);
    }
    prevOrderbookRef.current = orderbookKey;

    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, [orderbook]);

  useEffect(() => {
    if (tick?.price) {
      prevPriceRef.current = tick.price;
    }
  }, [tick?.price]);

  const currentPrice = tick?.price ?? 0;
  const changePercent = tick?.changePercent ?? 0;
  const priceColorClass =
    changePercent > 0
      ? "orderbook-price-up"
      : changePercent < 0
        ? "orderbook-price-down"
        : "orderbook-price-neutral";

  const asks = orderbook?.asks?.slice(0, 5) || [];
  const bids = orderbook?.bids?.slice(0, 5) || [];

  const asksReversed = [...asks].reverse();

  return (
    <div className="orderbook-panel">
      <div className="orderbook-header">LEVEL 2 QUOTES</div>

      <div className="orderbook-section orderbook-asks">
        {asksReversed.map(([p, v], i) => (
          <OrderRow
            key={`ask-${i}`}
            label={`卖${5 - i}`}
            price={p}
            volume={v}
            maxVolume={maxVolume}
            type="ask"
            isPulse={isPulse}
          />
        ))}
      </div>

      <div className="orderbook-center">
        <div className={`orderbook-current-price ${priceColorClass}`}>
          <span className="orderbook-price-value">{currentPrice.toFixed(2)}</span>
          <span className="orderbook-change">
            {changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="orderbook-section orderbook-bids">
        {bids.map(([p, v], i) => (
          <OrderRow
            key={`bid-${i}`}
            label={`买${i + 1}`}
            price={p}
            volume={v}
            maxVolume={maxVolume}
            type="bid"
            isPulse={isPulse}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderBookPanel;
