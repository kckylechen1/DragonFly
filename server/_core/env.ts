export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // 硅基流动 AI API
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "https://api.siliconflow.cn",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "REDACTED_FORGE_KEY",
  // 同花顺 iFinD API
  ifindRefreshToken: process.env.IFIND_REFRESH_TOKEN ?? "REDACTED_IFIND_REFRESH_TOKEN",
  ifindAccessToken: process.env.IFIND_ACCESS_TOKEN ?? "REDACTED_IFIND_ACCESS_TOKEN",
};
