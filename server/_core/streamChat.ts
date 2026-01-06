import { ENV } from "./env";
import * as eastmoney from "../eastmoney";

export type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};

export interface StreamChatParams {
    messages: Message[];
    stockCode?: string;
    useThinking?: boolean;
}

const resolveApiUrl = () =>
    ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
        ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
        : "https://api.siliconflow.cn/v1/chat/completions";

// 构建股票上下文
async function buildStockContext(stockCode: string): Promise<string> {
    try {
        const quote = await eastmoney.getStockQuote(stockCode);
        const klines = await eastmoney.getKlineData(stockCode, 'day');
        const recentKlines = klines.slice(-10);

        const prices = recentKlines.map((k: any) => k.close);
        const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        return `
【当前股票数据】
股票名称：${quote.name}
股票代码：${stockCode}
当前价格：${quote.price}元
涨跌幅：${quote.changePercent?.toFixed(2)}%
涨跌额：${quote.change?.toFixed(2)}元
今开：${quote.open}元
最高：${quote.high}元
最低：${quote.low}元
昨收：${quote.preClose}元
成交量：${(quote.volume / 10000).toFixed(2)}万手
成交额：${(quote.amount / 100000000).toFixed(2)}亿元
换手率：${quote.turnoverRate?.toFixed(2)}%
市盈率：${quote.pe?.toFixed(2)}
市净率：${quote.pb?.toFixed(2)}
总市值：${(quote.marketCap / 100000000).toFixed(2)}亿元

【近10日走势】
${recentKlines.map((k: any) => `${k.date}: 开${k.open} 高${k.high} 低${k.low} 收${k.close}`).join('\n')}

【统计数据】
10日均价：${avgPrice.toFixed(2)}元
10日最高：${maxPrice.toFixed(2)}元
10日最低：${minPrice.toFixed(2)}元
`;
    } catch (error) {
        console.error('获取股票数据失败:', error);
        return `【注意】无法获取股票 ${stockCode} 的实时数据`;
    }
}

// 流式聊天函数
export async function* streamChat(params: StreamChatParams): AsyncGenerator<string, void, unknown> {
    const { messages, stockCode, useThinking } = params;

    if (!ENV.forgeApiKey) {
        yield "错误：AI API Key 未配置";
        return;
    }

    // 构建股票上下文
    let stockContext = '';
    if (stockCode) {
        stockContext = await buildStockContext(stockCode);
    }

    // 构建系统提示词
    const systemPrompt = `你是一个专业的A股分析师助手。你的任务是帮助用户分析股票、解读技术指标、提供投资建议。

请注意：
1. 用简洁专业的语言回答问题
2. 分析要客观，结合技术面和基本面
3. 给出清晰的观点，但提醒用户自行决策
4. 不要过度乐观或悲观
${stockContext}`;

    // 替换系统消息
    const messagesWithContext = messages.map((msg, index) => {
        if (index === 0 && msg.role === 'system') {
            return { ...msg, content: systemPrompt };
        }
        return msg;
    });

    if (messagesWithContext[0]?.role !== 'system') {
        messagesWithContext.unshift({ role: 'system' as const, content: systemPrompt });
    }

    // 选择模型
    const model = useThinking
        ? "deepseek-ai/DeepSeek-R1"
        : "deepseek-ai/DeepSeek-V3";

    const payload = {
        model,
        messages: messagesWithContext,
        max_tokens: 4096,
        stream: true,
    };

    try {
        const response = await fetch(resolveApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ENV.forgeApiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            yield `错误：${response.status} - ${errorText}`;
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            yield "错误：无法读取响应流";
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch {
                        // 忽略解析错误
                    }
                }
            }
        }
    } catch (error) {
        console.error('Stream chat error:', error);
        yield `错误：网络请求失败`;
    }
}
