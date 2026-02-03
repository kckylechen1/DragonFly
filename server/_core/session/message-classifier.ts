/**
 * 消息分类器
 *
 * 用于：
 * 1. 检测消息中提到的股票
 * 2. 分类消息应该归档到哪些股票
 * 3. 支持会话切换时的归档逻辑
 */

import { executeStockTool } from "../stockTools";

// ==================== 类型定义 ====================

export interface StockMention {
  code?: string; // 股票代码（如果能识别）
  name: string; // 股票名称或代码
  confidence: number; // 置信度 0-1
}

export interface MessageClassification {
  stockCodes: string[]; // 涉及的股票代码
  stockNames: string[]; // 涉及的股票名称（待搜索）
  isStockSwitch: boolean; // 是否是股票切换
  primaryStock?: string; // 主要讨论的股票
  shouldArchive: boolean; // 是否需要归档
}

// ==================== 股票检测模式 ====================

// 股票代码正则：沪市(60xxxx, 68xxxx), 深市(00xxxx, 30xxxx)
const STOCK_CODE_PATTERN = /\b([036]\d{5})\b/g;

// 股票切换模式
const STOCK_SWITCH_PATTERNS = [
  /换一只[，,]?\s*(?:我想)?(?:看看|分析|了解)?(.+?)(?:$|[，。,.])/,
  /(?:换个|换一个|另一只|其他股票)[，,]?\s*(.+?)(?:$|[，。,.])/,
  /(?:不看|不聊).+?了[，,]\s*(?:看看|聊聊|分析)?(.+?)(?:$|[，。,.])/,
];

// 股票名称提取模式
const STOCK_NAME_PATTERNS = [
  /看看(.+?)(?:的|怎么|能不能|走势|$)/,
  /分析(?:一下)?(.+?)(?:$|[，。,.])/,
  /(.+?)(?:走势|行情|股价|涨跌|怎么样)/,
  /聊聊(.+?)(?:$|[，。,.])/,
  /(.+?)能买吗/,
  /(.+?)能卖吗/,
];

// 需要过滤的干扰词
const FILTER_WORDS = [
  "一下",
  "帮我",
  "请",
  "你",
  "我",
  "的",
  "这只",
  "这个",
  "大盘",
  "市场",
  "行情",
  "今天",
  "明天",
  "最近",
];

// ==================== 消息分类器 ====================

export class MessageClassifier {
  /**
   * 检测消息中的股票代码
   */
  detectStockCodes(message: string): string[] {
    const codes: string[] = [];
    const matches = message.matchAll(STOCK_CODE_PATTERN);

    for (const match of matches) {
      const code = match[1];
      if (!codes.includes(code)) {
        codes.push(code);
      }
    }

    return codes;
  }

  /**
   * 检测消息中的股票名称（需要后续搜索确认）
   */
  detectStockNames(message: string): string[] {
    const names: string[] = [];

    // 先检测股票切换模式
    for (const pattern of STOCK_SWITCH_PATTERNS) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const name = this.cleanStockName(match[1]);
        if (name && !names.includes(name)) {
          names.push(name);
        }
      }
    }

    // 检测一般股票名称提取模式
    for (const pattern of STOCK_NAME_PATTERNS) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const name = this.cleanStockName(match[1]);
        if (name && !names.includes(name)) {
          names.push(name);
        }
      }
    }

    return names;
  }

  /**
   * 清理股票名称（去除干扰词）
   */
  private cleanStockName(raw: string): string {
    let name = raw.trim();

    // 去除干扰词
    for (const word of FILTER_WORDS) {
      name = name.replace(new RegExp(word, "g"), "");
    }

    // 去除标点和空白
    name = name.replace(/[，。,.\s]/g, "").trim();

    // 长度过滤：股票名称通常 2-8 个字符
    if (name.length < 2 || name.length > 8) {
      return "";
    }

    // 如果是纯数字，可能是股票代码
    if (/^\d{6}$/.test(name)) {
      return "";
    }

    return name;
  }

  /**
   * 检测是否是股票切换
   */
  isStockSwitchMessage(message: string): boolean {
    return STOCK_SWITCH_PATTERNS.some(pattern => pattern.test(message));
  }

  /**
   * 分类消息
   */
  async classifyMessage(
    message: string,
    response?: string
  ): Promise<MessageClassification> {
    // 检测代码
    const messageCodes = this.detectStockCodes(message);
    const responseCodes = response ? this.detectStockCodes(response) : [];

    // 检测名称
    const messageNames = this.detectStockNames(message);
    const responseNames = response ? this.detectStockNames(response) : [];

    // 合并
    const allCodes = [...new Set([...messageCodes, ...responseCodes])];
    const allNames = [...new Set([...messageNames, ...responseNames])];

    // 检测股票切换
    const isStockSwitch = this.isStockSwitchMessage(message);

    return {
      stockCodes: allCodes,
      stockNames: allNames,
      isStockSwitch,
      primaryStock: allCodes[0],
      shouldArchive: allCodes.length > 0 || allNames.length > 0,
    };
  }

  /**
   * 搜索股票名称获取代码
   */
  async resolveStockName(name: string): Promise<string | null> {
    try {
      const result = await executeStockTool("search_stock", { keyword: name });

      // 解析搜索结果
      if (typeof result === "string") {
        // 尝试从结果中提取第一个股票代码
        const codeMatch = result.match(/([036]\d{5})/);
        if (codeMatch) {
          return codeMatch[1];
        }
      }

      return null;
    } catch (error) {
      console.error(`[MessageClassifier] 搜索股票失败: ${name}`, error);
      return null;
    }
  }

  /**
   * 完整分类（包括名称解析）
   */
  async classifyAndResolve(
    message: string,
    response?: string
  ): Promise<MessageClassification> {
    const classification = await this.classifyMessage(message, response);

    // 解析股票名称
    for (const name of classification.stockNames) {
      const code = await this.resolveStockName(name);
      if (code && !classification.stockCodes.includes(code)) {
        classification.stockCodes.push(code);
      }
    }

    // 更新主要股票
    if (!classification.primaryStock && classification.stockCodes.length > 0) {
      classification.primaryStock = classification.stockCodes[0];
    }

    return classification;
  }
}

// 单例导出
export const messageClassifier = new MessageClassifier();

// ==================== 便捷函数 ====================

/**
 * 快速检测消息中是否提到新股票
 */
export function detectNewStockMention(
  message: string,
  currentStockCode?: string
): { hasNewStock: boolean; stockName?: string; isSwitch: boolean } {
  const classifier = new MessageClassifier();

  // 检测代码
  const codes = classifier.detectStockCodes(message);
  const hasNewCode = codes.some(code => code !== currentStockCode);

  if (hasNewCode) {
    return {
      hasNewStock: true,
      stockName: codes.find(code => code !== currentStockCode),
      isSwitch: classifier.isStockSwitchMessage(message),
    };
  }

  // 检测名称
  const names = classifier.detectStockNames(message);
  if (names.length > 0) {
    return {
      hasNewStock: true,
      stockName: names[0],
      isSwitch: classifier.isStockSwitchMessage(message),
    };
  }

  return {
    hasNewStock: false,
    isSwitch: false,
  };
}
