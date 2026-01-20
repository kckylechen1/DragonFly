import { lazy } from "react";

export const NewsTab = lazy(() => import("./NewsTab"));
export const FundamentalTab = lazy(() => import("./FundamentalTab"));
export const SentimentTab = lazy(() => import("./SentimentTab"));
export const TechnicalTab = lazy(() => import("./TechnicalTab"));
