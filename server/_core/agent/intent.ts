/**
 * 意图识别与响应控制系统
 *
 * 参考 OpenClaw 的理念：
 * - 意图分层 (greeting/quick/deep)
 * - 渐进式披露
 * - 响应长度控制
 */

// ==================== 意图类型 ====================

export type IntentType = "greeting" | "quick" | "deep";

export interface IntentConfig {
  type: IntentType;
  maxChars: number;
  maxTools: number;
  allowChartMarkers: boolean;
  responseStyle: "casual" | "concise" | "detailed";
  askBeforeExpanding: boolean; // 是否先询问再展开
}

export const INTENT_CONFIGS: Record<IntentType, IntentConfig> = {
  greeting: {
    type: "greeting",
    maxChars: 100,
    maxTools: 0,
    allowChartMarkers: false,
    responseStyle: "casual",
    askBeforeExpanding: false,
  },
  quick: {
    type: "quick",
    maxChars: 800, // 允许更完整的回复
    maxTools: 8, // 增加到8个工具，足够完成一次完整分析
    allowChartMarkers: false,
    responseStyle: "concise",
    askBeforeExpanding: false, // true → false，直接分析而不是先问
  },
  deep: {
    type: "deep",
    maxChars: 2000,
    maxTools: 10,
    allowChartMarkers: true,
    responseStyle: "detailed",
    askBeforeExpanding: false,
  },
};

// ==================== 意图识别 ====================

const GREETING_KEYWORDS = [
  "hi",
  "hello",
  "hey",
  "你好",
  "嗨",
  "在吗",
  "在不在",
  "早上好",
  "晚上好",
  "上午好",
  "下午好",
  "早安",
  "晚安",
];

const DEEP_KEYWORDS = [
  "分析",
  "详细",
  "深度",
  "技术面",
  "基本面",
  "全面",
  "帮我看看",
  "研究一下",
  "仔细",
  "完整",
  // 新增：用户想看某只股票的各种表达
  "看看",
  "想看",
  "聊聊",
  "说说",
  // 新增：切换股票的表达
  "换一只",
  "换个",
  "换股票",
  "另一只",
  "其他股票",
];

const QUICK_KEYWORDS = [
  "怎么办",
  "建议",
  "能买吗",
  "能卖吗",
  "怎么看",
  "为什么",
  "咋回事",
  "怎么了",
  "啥情况",
];

/**
 * 识别用户意图
 */
export function detectIntent(query: string): IntentType {
  const q = query.toLowerCase().trim();

  // Greeting: 短问候
  if (q.length < 15 && GREETING_KEYWORDS.some(k => q.includes(k))) {
    return "greeting";
  }

  // Deep: 明确要求深度分析，或提到新股票名称
  if (DEEP_KEYWORDS.some(k => q.includes(k))) {
    return "deep";
  }

  // Quick: 快速问题
  if (QUICK_KEYWORDS.some(k => q.includes(k))) {
    return "quick";
  }

  // 检测是否包含股票名称或代码（需要调用工具）
  const hasStockCode = /\b[036]\d{5}\b/.test(q);
  const hasStockNamePattern = /看看|分析|怎么样|走势|行情/.test(q);
  if (hasStockCode || hasStockNamePattern) {
    return "deep";
  }

  // 默认：根据问题长度判断，放宽阈值
  if (q.length < 30) {
    // 20 → 30
    return "quick";
  }

  return "deep";
}

// ==================== 响应塑形 ====================

export interface ResponseShapingOptions {
  intent: IntentType;
  content: string;
  hasToolCalls: boolean;
  toolCount: number;
}

/**
 * 检查响应是否超出意图限制
 */
export function checkResponseLimits(options: ResponseShapingOptions): {
  withinLimits: boolean;
  issues: string[];
} {
  const config = INTENT_CONFIGS[options.intent];
  const issues: string[] = [];

  if (options.content.length > config.maxChars) {
    issues.push(`响应过长 (${options.content.length}/${config.maxChars} 字符)`);
  }

  if (options.toolCount > config.maxTools) {
    issues.push(`工具调用过多 (${options.toolCount}/${config.maxTools})`);
  }

  return {
    withinLimits: issues.length === 0,
    issues,
  };
}

// ==================== 渐进式选项生成 ====================

export interface ProgressiveOption {
  id: string;
  label: string;
  action: "expand" | "chart" | "skip";
}

/**
 * 为 quick 模式生成后续选项
 */
export function generateProgressiveOptions(context: {
  hasStockData: boolean;
  hasTechnicalAnalysis: boolean;
  hasFundFlow: boolean;
}): ProgressiveOption[] {
  const options: ProgressiveOption[] = [];

  if (context.hasTechnicalAnalysis) {
    options.push({
      id: "tech",
      label: "详细技术指标分析",
      action: "expand",
    });
  }

  if (context.hasFundFlow) {
    options.push({
      id: "fund",
      label: "资金流向深度解析",
      action: "expand",
    });
  }

  if (context.hasStockData) {
    options.push({
      id: "chart",
      label: "在图表上标出关键点位",
      action: "chart",
    });
  }

  return options;
}

/**
 * 格式化选项为文本
 */
export function formatOptionsAsText(options: ProgressiveOption[]): string {
  if (options.length === 0) return "";

  const lines = options.map((opt, i) => `${i + 1}. ${opt.label}`);
  return `\n\n你想了解：\n${lines.join("\n")}`;
}

// ==================== 语气控制 ====================

export type ToneStyle = "professional" | "friendly" | "casual";

export interface ToneConfig {
  style: ToneStyle;
  useEmoji: boolean;
  useSlang: boolean; // 使用口语化表达
  honorific: string; // 称呼
}

export const TONE_PRESETS: Record<string, ToneConfig> = {
  // 专业分析师风格
  professional: {
    style: "professional",
    useEmoji: false,
    useSlang: false,
    honorific: "您",
  },
  // 友好助手风格
  friendly: {
    style: "friendly",
    useEmoji: true,
    useSlang: false,
    honorific: "你",
  },
  // 轻松闲聊风格（仅用于 greeting）
  casual: {
    style: "casual",
    useEmoji: true,
    useSlang: true,
    honorific: "你",
  },
};

/**
 * 根据意图选择语气
 */
export function getToneForIntent(intent: IntentType): ToneConfig {
  switch (intent) {
    case "greeting":
      return TONE_PRESETS.casual;
    case "quick":
      return TONE_PRESETS.friendly;
    case "deep":
      return TONE_PRESETS.professional;
    default:
      return TONE_PRESETS.friendly;
  }
}
