import { Sparkles } from "lucide-react";

interface PresetPrompt {
  id: string;
  displayText: string;
  fullPrompt: string;
}

interface PresetPromptsProps {
  onSend: (message: string) => void;
  className?: string;
}

const presetPrompts: PresetPrompt[] = [
  {
    id: "financial-analysis",
    displayText: "详细财务分析示例",
    fullPrompt:
      "给我展示一个详细的财务分析示例，包括近3年财报关键数据、行业对比和风险点",
  },
  {
    id: "similar-products",
    displayText: "类似AI交易助手产品",
    fullPrompt: "推荐几个类似AI交易助手的成熟产品，包括他们的核心功能和优缺点",
  },
  {
    id: "detailed-mode",
    displayText: "更详细输出版本",
    fullPrompt:
      "切换到详细输出模式，接下来的分析请提供完整深度版本，包括财报、技术面历史、资金明细、相似案例等",
  },
  {
    id: "can-buy",
    displayText: "能买吗？",
    fullPrompt:
      "请分析这只股票是否值得买入，包括技术面、基本面和资金面的综合评估",
  },
  {
    id: "technical-analysis",
    displayText: "技术面深度分析",
    fullPrompt:
      "请提供这只股票的技术面深度分析，包括K线形态、均线系统、MACD、RSI等技术指标，以及支撑阻力位分析",
  },
  {
    id: "fundamental-analysis",
    displayText: "基本面深度分析",
    fullPrompt:
      "请提供这只股票的基本面深度分析，包括公司财务状况、行业地位、竞争优势、成长前景和估值水平",
  },
  {
    id: "capital-flow",
    displayText: "资金面深度分析",
    fullPrompt:
      "请分析这只股票的资金流向情况，包括主力资金动向、北向资金变化、龙虎榜数据和大户持仓变化",
  },
];

export function PresetPrompts({ onSend, className }: PresetPromptsProps) {
  return (
    <div
      className={`w-full border-b border-[var(--panel-border)] ${className || ""}`}
    >
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {presetPrompts.map(prompt => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSend(prompt.fullPrompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            {prompt.displayText}
          </button>
        ))}
      </div>
    </div>
  );
}
