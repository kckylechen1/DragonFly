import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createSmartAgent } from "./agent";
import type { StreamEvent } from "@shared/stream";
import type { Response } from "express";

// CORS 安全配置 - 动态端口支持
const CORS_ENV_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

function isLocalOrigin(origin: string): boolean {
  // 允许所有 localhost 和 127.0.0.1 的端口
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function setSecureCorsHeaders(req: express.Request, res: Response): void {
  const origin = req.headers.origin;
  if (!origin) return;

  // 1. 检查环境变量白名单
  if (CORS_ENV_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // 2. 开发环境允许所有本地端口
  else if (process.env.NODE_ENV !== "production" && isLocalOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // 3. 生产环境必须在白名单中

  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // SSE AI stream endpoint (GET)
  app.get("/api/ai/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    setSecureCorsHeaders(req, res);
    res.flushHeaders();

    const getQueryString = (value: unknown): string | undefined => {
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === "string" ? first : undefined;
      }
      return undefined;
    };

    const message = getQueryString(req.query.message);
    const sessionId = getQueryString(req.query.sessionId);
    const stockCode = getQueryString(req.query.stockCode);
    const useThinkingValue = getQueryString(req.query.useThinking);
    const useThinking = useThinkingValue === "true";

    const sendEvent = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    if (!message || typeof message !== "string") {
      sendEvent({ type: "error", data: "Missing message parameter" });
      res.end();
      return;
    }

    const keepAlive = setInterval(() => {
      res.write(": ping\n\n");
    }, 15000);

    let closed = false;
    req.on("close", () => {
      closed = true;
    });

    const agent = createSmartAgent({
      sessionId,
      stockCode,
      thinkHard: useThinking,
    });

    const normalizeToolArgs = (args: unknown) => {
      if (!args) return undefined;
      if (typeof args === "object") return args as Record<string, unknown>;
      if (typeof args !== "string") return undefined;
      try {
        return JSON.parse(args) as Record<string, unknown>;
      } catch {
        return undefined;
      }
    };

    try {
      for await (const event of agent.stream(message)) {
        if (closed) break;

        if (
          event.type === "thinking" ||
          event.type === "content" ||
          event.type === "error"
        ) {
          sendEvent({ type: event.type, data: event.data as string });
          continue;
        }

        if (event.type === "tool_call") {
          const toolCallId = event.data?.toolCallId ?? event.data?.id;
          const name = event.data?.name;
          if (toolCallId && name) {
            sendEvent({
              type: "tool_call",
              data: {
                toolCallId,
                name,
                args: normalizeToolArgs(event.data?.args),
              },
            });
          }
          continue;
        }

        if (event.type === "tool_result") {
          const toolCallId = event.data?.toolCallId ?? event.data?.id;
          const name = event.data?.name;
          if (toolCallId && name) {
            sendEvent({
              type: "tool_result",
              data: {
                toolCallId,
                name,
                ok: Boolean(event.data?.ok),
                result:
                  typeof event.data?.result === "string"
                    ? event.data.result
                    : undefined,
                error:
                  typeof event.data?.error === "string"
                    ? event.data.error
                    : undefined,
                skipped: Boolean(event.data?.skipped),
              },
            });
          }
          continue;
        }
      }

      if (!closed) {
        sendEvent({
          type: "done",
          data: { sessionId: agent.getSessionId() },
        });
      }
    } catch (error) {
      if (!closed) {
        sendEvent({
          type: "error",
          data: error instanceof Error ? error.message : "Stream failed",
        });
      }
    } finally {
      clearInterval(keepAlive);
      agent.cleanup();
      res.end();
    }
  });

  // 流式 AI 聊天端点 - 使用 SmartAgent 新架构
  app.post("/api/ai/stream", async (req, res) => {
    const { hybridStreamChat } = await import("./smartStreamChat");
    const { getSessionStore } = await import("./session");

    // 设置 SSE 头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    setSecureCorsHeaders(req, res);
    res.setHeader("Access-Control-Expose-Headers", "X-Session-Id");

    const {
      messages,
      stockCode,
      stockContext,
      useSmartAgent = true,
      sessionId,
      thinkHard,
    } = req.body;

    try {
      const sessionStore = getSessionStore();
      const session = sessionStore.getOrCreateSession(sessionId, stockCode);
      res.setHeader("X-Session-Id", session.id);

      // 使用 hybridStreamChat，默认使用新架构
      for await (const chunk of hybridStreamChat({
        messages,
        stockCode,
        stockContext,
        useSmartAgent,
        sessionId: session.id,
        thinkHard,
      })) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write(`data: [DONE]\n\n`);
    } catch (error) {
      console.error("Stream error:", error);
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    }

    res.end();
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
