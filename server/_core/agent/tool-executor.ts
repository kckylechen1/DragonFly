import { executeStockTool } from "../stockTools";
import type { ToolExecutionOutput, ToolExecutor, ToolResultMeta } from "./types";

const MAX_TOOL_RESULT_CHARS = 2000;
const MAX_SUMMARY_CHARS = 240;

const TOOL_SOURCE_MAP: Record<string, string> = {
  search_stock: "eastmoney",
  get_stock_quote: "eastmoney",
  get_kline_data: "eastmoney",
  get_fund_flow: "eastmoney",
  get_fund_flow_history: "eastmoney",
  get_fund_flow_rank: "eastmoney",
  get_market_fund_flow: "eastmoney",
  get_market_status: "eastmoney",
  get_guba_hot_rank: "eastmoney",
  get_market_news: "akshare",
  get_longhu_bang: "akshare",
  get_zt_pool: "akshare",
  get_dt_pool: "akshare",
  get_concept_board: "akshare",
  get_industry_board: "akshare",
  get_telegraph: "akshare",
  search_akshare_endpoint: "akshare",
  get_akshare_endpoint_info: "akshare",
  call_akshare: "akshare",
  smart_akshare_query: "akshare",
  analyze_stock_technical: "analysis",
  analyze_minute_patterns: "analysis",
  get_us_stock_quote: "yahoo",
  get_us_kline: "yahoo",
  get_us_market_status: "yahoo",
  get_hk_stock_quote: "yahoo",
  get_hk_kline: "yahoo",
  get_hk_market_status: "yahoo",
  get_current_datetime: "system",
  get_trading_memory: "memory",
};

function truncateText(text: string, maxLen: number): { text: string; truncated: boolean } {
  if (text.length <= maxLen) {
    return { text, truncated: false };
  }

  return { text: `${text.slice(0, maxLen)}...`, truncated: true };
}

function buildSummary(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const { text: summary } = truncateText(normalized, MAX_SUMMARY_CHARS);
  return summary;
}

function buildMeta(
  toolName: string,
  latencyMs: number,
  truncated: boolean
): ToolResultMeta {
  return {
    asOf: new Date().toISOString(),
    source: TOOL_SOURCE_MAP[toolName],
    latencyMs,
    truncated: truncated || undefined,
  };
}

export async function executeStockToolWithMeta(
  toolName: string,
  args: Record<string, any>
): Promise<ToolExecutionOutput> {
  const startTime = Date.now();
  const result = await executeStockTool(toolName, args);
  const outputText = typeof result === "string" ? result : String(result ?? "");
  const trimmed = outputText.trim();
  const { text: content, truncated } = truncateText(
    trimmed,
    MAX_TOOL_RESULT_CHARS
  );
  const meta = buildMeta(toolName, Date.now() - startTime, truncated);

  return {
    content,
    summary: buildSummary(trimmed || content),
    meta,
  };
}

export function createStockToolExecutor(toolName: string): ToolExecutor {
  return async args => executeStockToolWithMeta(toolName, args);
}
