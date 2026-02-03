import { nanoid } from "nanoid";

import { streamGrokGLMAgent } from "./grok-glm-agent";
import { createSmartAgent } from "./smart-agent";
import type { StreamEvent as AgentStreamEvent } from "./types";
import { buildContextFromFrontend, type StockContextData } from "../smartStreamChat";
import type { StreamEvent, ToolResultMeta } from "@shared/stream";

export interface AgentRunOptions {
  message: string;
  sessionId?: string;
  stockCode?: string;
  stockContext?: StockContextData | null;
  thinkHard?: boolean;
  useGrokGLM?: boolean;
  signal?: AbortSignal;
}

function createEventFactory(runId: string) {
  let seq = 0;
  return <T extends StreamEvent["type"]>(type: T, data: StreamEvent["data"]) =>
    ({
      eventVersion: 1,
      id: `${runId}:${(seq += 1)}`,
      runId,
      type,
      timestamp: Date.now(),
      data,
    } as StreamEvent);
}

function parseToolArgs(
  args?: unknown
): Record<string, unknown> | undefined {
  if (!args) {
    return undefined;
  }

  if (typeof args === "string") {
    try {
      return JSON.parse(args) as Record<string, unknown>;
    } catch {
      return { raw: args };
    }
  }

  if (typeof args === "object") {
    return args as Record<string, unknown>;
  }

  return { value: args };
}

function normalizeMeta(meta?: ToolResultMeta): ToolResultMeta | undefined {
  if (!meta) {
    return undefined;
  }

  return {
    asOf: meta.asOf,
    source: meta.source,
    latencyMs: meta.latencyMs,
    truncated: meta.truncated,
  };
}

export async function* runAgentStream(
  options: AgentRunOptions
): AsyncGenerator<StreamEvent> {
  const {
    message,
    sessionId,
    stockCode,
    stockContext,
    thinkHard,
    useGrokGLM,
    signal,
  } = options;
  const runId = `run_${nanoid()}`;
  const messageId = `msg_${nanoid()}`;
  const makeEvent = createEventFactory(runId);
  const preloadedContext =
    stockCode && stockContext
      ? buildContextFromFrontend(stockCode, stockContext)
      : undefined;
  const isSwitchingToDetailMode =
    message.includes("切换到详细输出模式") ||
    message.includes("更详细输出版本");
  const effectiveThinkHard = Boolean(thinkHard) || isSwitchingToDetailMode;

  let status: "completed" | "error" | "cancelled" = "completed";
  let sessionIdForRun = sessionId;
  let textStarted = false;
  let thinkingStarted = false;
  const thinkingId = `thinking_${nanoid()}`;

  let stream: AsyncGenerator<AgentStreamEvent> | null = null;

  if (useGrokGLM) {
    sessionIdForRun = sessionIdForRun ?? "grok_glm";
    stream = streamGrokGLMAgent(
      message,
      stockCode,
      preloadedContext,
      effectiveThinkHard,
      true
    );
  } else {
    const agent = createSmartAgent({
      stockCode,
      sessionId,
      thinkHard: effectiveThinkHard,
      preloadedContext,
      useOrchestrator: false,
      verbose: false,
    });
    sessionIdForRun = agent.getSessionId();
    stream = agent.stream(message);
  }

  yield makeEvent("run_start", {
    messageId,
    message,
    sessionId: sessionIdForRun,
    stockCode,
  });

  try {
    for await (const event of stream) {
      if (signal?.aborted) {
        status = "cancelled";
        break;
      }

      if (event.type === "thinking") {
        const delta = typeof event.data === "string" ? event.data : "";
        if (delta) {
          if (!thinkingStarted) {
            thinkingStarted = true;
            yield makeEvent("thinking_start", { thinkingId, messageId });
          }
          yield makeEvent("thinking_delta", { thinkingId, messageId, delta });
        }
        continue;
      }

      if (event.type === "task_start") {
        const delta =
          typeof event.data === "string"
            ? `开始子任务: ${event.data}`
            : "开始子任务";
        if (!thinkingStarted) {
          thinkingStarted = true;
          yield makeEvent("thinking_start", { thinkingId, messageId });
        }
        yield makeEvent("thinking_delta", { thinkingId, messageId, delta });
        continue;
      }

      if (event.type === "task_complete") {
        const delta =
          typeof event.data === "string"
            ? `完成子任务: ${event.data}`
            : "完成子任务";
        if (!thinkingStarted) {
          thinkingStarted = true;
          yield makeEvent("thinking_start", { thinkingId, messageId });
        }
        yield makeEvent("thinking_delta", { thinkingId, messageId, delta });
        continue;
      }

      if (event.type === "tool_call") {
        const toolCallId = event.data?.toolCallId || event.data?.id;
        const name = event.data?.name || "unknown_tool";
        if (toolCallId) {
          yield makeEvent("tool_call_start", {
            toolCallId,
            name,
            messageId,
          });
          const args = parseToolArgs(event.data?.args);
          yield makeEvent("tool_call_args_complete", {
            toolCallId,
            messageId,
            args,
          });
        }
        continue;
      }

      if (event.type === "tool_result") {
        const toolCallId = event.data?.toolCallId || event.data?.id;
        const name = event.data?.name || "unknown_tool";
        const ok = Boolean(event.data?.ok);
        const skipped = Boolean(event.data?.skipped);
        const summary =
          typeof event.data?.summary === "string"
            ? event.data.summary
            : typeof event.data?.result === "string"
              ? event.data.result.slice(0, 160)
              : undefined;
        const meta = normalizeMeta(event.data?.meta);

        if (toolCallId) {
          if (!ok && !skipped) {
            yield makeEvent("tool_error", {
              toolCallId,
              messageId,
              name,
              error:
                typeof event.data?.error === "string"
                  ? event.data.error
                  : "工具执行失败",
              summary,
              meta,
            });
          } else {
            yield makeEvent("tool_result", {
              toolCallId,
              messageId,
              name,
              result:
                typeof event.data?.result === "string" ? event.data.result : "",
              summary,
              rawRef:
                typeof event.data?.rawRef === "string"
                  ? event.data.rawRef
                  : undefined,
              meta,
            });
          }
        }
        continue;
      }

      if (event.type === "content") {
        const delta = typeof event.data === "string" ? event.data : "";
        if (!textStarted) {
          textStarted = true;
          yield makeEvent("text_start", {
            messageId,
            role: "assistant",
          });
        }
        yield makeEvent("text_delta", { messageId, delta });
        continue;
      }

      if (event.type === "error") {
        status = "error";
        yield makeEvent("error", {
          message:
            typeof event.data === "string"
              ? event.data
              : "Agent error",
        });
        break;
      }

      if (event.type === "done") {
        status = "completed";
        break;
      }
    }
  } catch (error) {
    status = "error";
    const messageText = error instanceof Error ? error.message : String(error);
    yield makeEvent("error", { message: messageText });
  }

  if (thinkingStarted) {
    yield makeEvent("thinking_end", { thinkingId, messageId });
  }
  if (textStarted) {
    yield makeEvent("text_end", { messageId });
  }
  yield makeEvent("run_end", {
    sessionId: sessionIdForRun || "unknown",
    status,
    error: status === "error" ? "stream_error" : undefined,
  });
}
