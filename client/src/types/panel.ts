/**
 * Panel Types - 面板类型定义
 *
 * 负责人: GLM
 * 参考: FRONTEND_REFACTOR_REVIEW.md 第 865-887 行
 */

import type { ReactNode, ComponentType } from "react";

/**
 * 面板 Props
 */
export interface PanelProps {
  symbol: string;
}

/**
 * 面板上下文（提供给 setup 函数）
 */
export interface PanelContext {
  symbol: string;
  // marketClient 和 queryClient 由使用方注入
}

/**
 * 面板能力声明
 */
export interface Panel {
  id: string;
  title: string;
  icon: ReactNode;

  /**
   * 声明式依赖
   */
  requires: {
    realtime?: ("tick" | "orderbook")[];
    queries?: ("kline" | "info" | "news")[];
  };

  /**
   * 统一生命周期（返回 cleanup 函数）
   */
  setup?: (ctx: PanelContext) => () => void;

  /**
   * 面板组件
   */
  component: ComponentType<PanelProps>;
}

/**
 * 面板 ID 类型
 */
export type PanelId =
  | "kline"
  | "intraday"
  | "orderbook"
  | "indicators"
  | "advice"
  | "news";
