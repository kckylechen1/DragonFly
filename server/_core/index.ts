import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runAgentStream } from "./agent/runner";
import { writeStreamEvent } from "./agent/stream-handler";
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
      writeStreamEvent(res, event);
    };

    const sendErrorAndClose = (errorMessage: string) => {
      const runId = `run_${Date.now()}`;
      const timestamp = Date.now();
      sendEvent({
        eventVersion: 1,
        id: `${runId}:1`,
        runId,
        type: "error",
        timestamp,
        data: { message: errorMessage },
      });
      sendEvent({
        eventVersion: 1,
        id: `${runId}:2`,
        runId,
        type: "run_end",
        timestamp: timestamp + 1,
        data: {
          sessionId: sessionId ?? "unknown",
          status: "error",
          error: errorMessage,
        },
      });
      res.end();
    };

    if (!message || typeof message !== "string") {
      sendErrorAndClose("Missing message parameter");
      return;
    }

    const keepAlive = setInterval(() => {
      res.write(": ping\n\n");
    }, 15000);

    let closed = false;
    const abortController = new AbortController();
    req.on("close", () => {
      closed = true;
      abortController.abort();
    });

    try {
      const stream = runAgentStream({
        message,
        sessionId,
        stockCode,
        thinkHard: useThinking,
        signal: abortController.signal,
      });

      for await (const event of stream) {
        if (closed) break;
        sendEvent(event);
      }
    } catch (error) {
      sendErrorAndClose(
        error instanceof Error ? error.message : "Unknown stream error"
      );
    } finally {
      clearInterval(keepAlive);
      res.end();
    }
  });

  // 流式 AI 聊天端点 - 使用 SmartAgent 新架构
  app.post("/api/ai/stream", async (req, res) => {
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
      sessionId,
      thinkHard,
    } = req.body;

    const sendEvent = (event: StreamEvent) => {
      writeStreamEvent(res, event);
    };

    const sendErrorAndClose = (errorMessage: string, sessionIdValue: string) => {
      const runId = `run_${Date.now()}`;
      const timestamp = Date.now();
      sendEvent({
        eventVersion: 1,
        id: `${runId}:1`,
        runId,
        type: "error",
        timestamp,
        data: { message: errorMessage },
      });
      sendEvent({
        eventVersion: 1,
        id: `${runId}:2`,
        runId,
        type: "run_end",
        timestamp: timestamp + 1,
        data: {
          sessionId: sessionIdValue,
          status: "error",
          error: errorMessage,
        },
      });
      res.end();
    };

    try {
      const sessionStore = getSessionStore();
      const session = sessionStore.getOrCreateSession(sessionId, stockCode);
      res.setHeader("X-Session-Id", session.id);

      if (Array.isArray(messages) && messages.length > 0) {
        sessionStore.setMessages(session.id, messages);
      }

      const userMessages = Array.isArray(messages)
        ? messages.filter((m: { role: string }) => m.role === "user")
        : [];
      const lastUserMessage =
        userMessages[userMessages.length - 1]?.content || "";

      if (!lastUserMessage) {
        sendErrorAndClose("Missing user message", session.id);
        return;
      }

      const stream = runAgentStream({
        message: lastUserMessage,
        sessionId: session.id,
        stockCode,
        stockContext,
        thinkHard,
      });

      for await (const event of stream) {
        sendEvent(event);
      }
    } catch (error) {
      console.error("Stream error:", error);
      sendErrorAndClose("Stream failed", sessionId ?? "unknown");
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
