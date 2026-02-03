/**
 * L-015: AdvicePanel - AI 建议面板
 * 从 AI 对话中提取最新建议，显示评级、目标价、风险提示
 */

import React, { useMemo } from "react";
import type { PanelProps } from "../../types/panel";
import { useAIChatStore } from "../../stores/aiChat.store";

interface AIAdvice {
  rating: "买入" | "持有" | "卖出";
  confidence: number;
  support: number | null;
  current: number | null;
  resistance: number | null;
  risks: string[];
  suggestion: string;
}

const parseAdviceFromMessages = (
  messages: { role: string; content: string }[]
): AIAdvice | null => {
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  if (assistantMessages.length === 0) return null;

  const lastMessage = assistantMessages[assistantMessages.length - 1].content;

  let rating: AIAdvice["rating"] = "持有";
  if (/买入|看涨|建仓|加仓/i.test(lastMessage)) rating = "买入";
  else if (/卖出|看跌|减仓|清仓/i.test(lastMessage)) rating = "卖出";

  let confidence = 70;
  const confMatch = lastMessage.match(/置信度[：:]\s*(\d+)/);
  if (confMatch) confidence = parseInt(confMatch[1], 10);
  else if (/强烈|非常|高度/i.test(lastMessage)) confidence = 90;
  else if (/谨慎|观望|不确定/i.test(lastMessage)) confidence = 50;

  const pricePattern = /(\d+\.?\d*)/g;
  const prices = lastMessage.match(pricePattern)?.map(Number).filter(p => p > 1 && p < 10000) || [];
  const sortedPrices = [...new Set(prices)].sort((a, b) => a - b);

  let support: number | null = null;
  let current: number | null = null;
  let resistance: number | null = null;

  if (sortedPrices.length >= 3) {
    support = sortedPrices[0];
    current = sortedPrices[Math.floor(sortedPrices.length / 2)];
    resistance = sortedPrices[sortedPrices.length - 1];
  } else if (sortedPrices.length === 2) {
    support = sortedPrices[0];
    resistance = sortedPrices[1];
  }

  const risks: string[] = [];
  if (/风险|注意|警惕|小心/i.test(lastMessage)) {
    const riskPatterns = [
      /大盘[^\n。，]*[弱跌调整]/,
      /板块[^\n。，]*[轮动调整]/,
      /止损/,
      /波动[^\n。，]*大/,
      /成交[^\n。，]*[缩萎]/,
      /压力[^\n。，]*大/,
    ];
    riskPatterns.forEach((p) => {
      const match = lastMessage.match(p);
      if (match) risks.push(match[0]);
    });
  }
  if (risks.length === 0 && lastMessage.length > 50) {
    risks.push("注意控制仓位");
    risks.push("设置合理止损");
  }

  const suggestionMatch = lastMessage.match(/建议[：:][^\n]+|操作[：:][^\n]+/);
  const suggestion =
    suggestionMatch?.[0] ||
    (lastMessage.length > 100 ? lastMessage.slice(0, 100) + "..." : lastMessage);

  return { rating, confidence, support, current, resistance, risks, suggestion };
};

const RatingBadge: React.FC<{ rating: AIAdvice["rating"] }> = ({ rating }) => {
  const config = {
    买入: { bg: "bg-green-500/20", text: "text-green-400", icon: "🟢" },
    持有: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "🟡" },
    卖出: { bg: "bg-red-500/20", text: "text-red-400", icon: "🔴" },
  };
  const c = config[rating];
  return (
    <span className={`${c.bg} ${c.text} px-3 py-1 rounded-full text-sm font-medium`}>
      {c.icon} {rating}
    </span>
  );
};

const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => {
  const filled = Math.round(value / 10);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-3 rounded-sm ${
              i < filled ? "bg-blue-500" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">{value}%</span>
    </div>
  );
};

const PriceGrid: React.FC<{
  support: number | null;
  current: number | null;
  resistance: number | null;
}> = ({ support, current, resistance }) => (
  <div className="grid grid-cols-3 gap-2 text-center">
    <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
      <div className="text-[10px] text-gray-500 uppercase">支撑位</div>
      <div className="text-sm font-bold text-red-400">
        {support?.toFixed(2) || "--"}
      </div>
    </div>
    <div className="bg-gray-500/10 p-2 rounded-lg border border-gray-500/20">
      <div className="text-[10px] text-gray-500 uppercase">现价</div>
      <div className="text-sm font-bold text-gray-200">
        {current?.toFixed(2) || "--"}
      </div>
    </div>
    <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/20">
      <div className="text-[10px] text-gray-500 uppercase">阻力位</div>
      <div className="text-sm font-bold text-green-400">
        {resistance?.toFixed(2) || "--"}
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ symbol: string }> = ({ symbol }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6">
    <div className="text-4xl mb-4">💬</div>
    <div className="text-gray-400 text-sm mb-2">暂无 AI 分析建议</div>
    <div className="text-gray-500 text-xs">
      试试问 AI："{symbol} 现在可以买入吗？"
    </div>
  </div>
);

const AdvicePanel: React.FC<PanelProps> = ({ symbol }) => {
  const messages = useAIChatStore((s) => s.messages);

  const advice = useMemo(() => parseAdviceFromMessages(messages), [messages]);

  if (!advice) {
    return <EmptyState symbol={symbol} />;
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">📊 AI 分析建议</h3>
      </div>

      <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">建议</span>
          <RatingBadge rating={advice.rating} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">置信度</span>
          <ConfidenceBar value={advice.confidence} />
        </div>
      </div>

      <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 space-y-3">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          📈 目标价位
        </div>
        <PriceGrid
          support={advice.support}
          current={advice.current}
          resistance={advice.resistance}
        />
      </div>

      {advice.risks.length > 0 && (
        <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 space-y-2">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            ⚠️ 风险提示
          </div>
          <ul className="space-y-1">
            {advice.risks.map((risk, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-gray-600">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 space-y-2">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          💡 操作建议
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          {advice.suggestion}
        </p>
      </div>
    </div>
  );
};

export default AdvicePanel;
