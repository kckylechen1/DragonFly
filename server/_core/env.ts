import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // 硅基流动 AI API
  forgeApiUrl:
    process.env.BUILT_IN_FORGE_API_URL ?? "https://api.siliconflow.cn",
  forgeApiKey:
    process.env.BUILT_IN_FORGE_API_KEY ??
    "REDACTED_FORGE_KEY",
  // xAI Grok API
  grokApiUrl: process.env.GROK_API_URL ?? "https://api.x.ai/v1",
  grokApiKey: process.env.XAI_API_KEY ?? process.env.GROK_API_KEY ?? "",
  grokModel: process.env.GROK_MODEL ?? "grok-4-1-fast-reasoning",
  // 智谱AI GLM API
  glmApiUrl: process.env.GLM_API_URL ?? "https://open.bigmodel.cn/api/paas/v4",
  glmApiKey: process.env.GLM_API_KEY ?? "",
  glmModel: process.env.GLM_MODEL ?? "glm-4.7",
  // 同花顺 iFinD API
  ifindRefreshToken:
    process.env.IFIND_REFRESH_TOKEN ??
    "REDACTED_IFIND_REFRESH_TOKEN",
  ifindAccessToken:
    process.env.IFIND_ACCESS_TOKEN ??
    "REDACTED_IFIND_ACCESS_TOKEN",
  // Tavily API (网络搜索)
  tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
  // E2B API (代码执行)
  e2bApiKey: process.env.E2B_API_KEY ?? "",
};
