/**
 * 可学习路由器
 * 基于历史查询相似度动态选择最优模型
 */

import { randomUUID } from "crypto";
import type { ModelId, QueryComplexity } from "./types";

export interface QueryRecord {
  id: string;
  query: string;
  stockCode: string;
  complexity: QueryComplexity;
  intent: string;
  usedModel: ModelId;
  latency: number; // 毫秒
  tokenCount: number;
  success: boolean;
  timestamp: number;
}

type SimilarRecord = QueryRecord & { similarity: number };

export class LearnableRouter {
  private history: QueryRecord[] = [];
  private storageFile = "query-history.json";

  constructor() {
    this.loadHistory();
  }

  async selectModel(
    query: string,
    stockCode: string,
    complexity: QueryComplexity
  ): Promise<ModelId> {
    // 1. 找相似历史查询
    const similar = this.findSimilar(query, stockCode, 5);

    if (similar.length < 3) {
      // 历史数据不足，用默认策略
      return this.defaultRoute(complexity);
    }

    // 2. 统计模型成功率
    const modelStats = new Map<
      string,
      { wins: number; total: number; avgLatency: number }
    >();

    for (const record of similar) {
      const model = record.usedModel;
      if (!modelStats.has(model)) {
        modelStats.set(model, { wins: 0, total: 0, avgLatency: 0 });
      }
      const stat = modelStats.get(model)!;
      stat.total += 1;
      if (record.success) stat.wins += 1;
      stat.avgLatency =
        (stat.avgLatency * (stat.total - 1) + record.latency) / stat.total;
    }

    // 3. 计算加权分数 (成功率 70% + 速度 30%)
    let bestModel: ModelId = "grok";
    let bestScore = -1;

    for (const [model, stat] of modelStats) {
      const winRate = stat.wins / stat.total;
      const speedScore = 1 - Math.min(stat.avgLatency / 60000, 1); // 60s 内归一化
      const score = winRate * 0.7 + speedScore * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestModel = model as ModelId;
      }
    }

    return bestModel;
  }

  recordResult(record: Omit<QueryRecord, "id" | "timestamp">): void {
    this.history.push({
      ...record,
      id: randomUUID(),
      timestamp: Date.now(),
    });
    this.saveHistory();
  }

  private findSimilar(
    query: string,
    stockCode: string,
    topK: number
  ): SimilarRecord[] {
    return this.history
      .filter(r => r.stockCode === stockCode)
      .map(r => ({
        ...r,
        similarity: this.computeSimilarity(query, r.query),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private computeSimilarity(s1: string, s2: string): number {
    // 简单实现：Jaccard 相似度
    const tokens1 = new Set(s1.split(""));
    const tokens2 = new Set(s2.split(""));
    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);
    return union.size ? intersection.size / union.size : 0;
  }

  private defaultRoute(
    complexity: QueryComplexity
  ): ModelId {
    switch (complexity) {
      case "simple":
        return "deepseek";
      case "medium":
        return "grok";
      case "complex":
        return "grok";
    }
  }

  // P1-5 修复：改用同步读取防止竞态
  private loadHistory(): void {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "data", this.storageFile);
      if (fs.existsSync(filePath)) {
        this.history = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e) {
      // Silently ignore on first run
    }
  }

  private saveHistory(): void {
    try {
      const fs = require("fs");
      const path = require("path");
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      // P1-4 修复：限制历史记录最多 2000 条
      if (this.history.length > 2000) {
        this.history = this.history.slice(-2000);
      }
      const filePath = path.join(dataDir, this.storageFile);
      fs.writeFileSync(filePath, JSON.stringify(this.history, null, 2));
    } catch (e) {
      // Silently ignore
    }
  }

  // 获取统计报告
  getStats(): {
    model: ModelId;
    totalQueries: number;
    successRate: number;
    avgLatency: number;
  }[] {
    const stats = new Map<string, { total: number; wins: number; latencySum: number }>();

    for (const record of this.history) {
      if (!stats.has(record.usedModel)) {
        stats.set(record.usedModel, { total: 0, wins: 0, latencySum: 0 });
      }
      const s = stats.get(record.usedModel)!;
      s.total += 1;
      if (record.success) s.wins += 1;
      s.latencySum += record.latency;
    }

    return [...stats.entries()].map(([model, s]) => ({
      model: model as ModelId,
      totalQueries: s.total,
      successRate: s.total ? s.wins / s.total : 0,
      avgLatency: s.total ? s.latencySum / s.total : 0,
    }));
  }
}

// 单例
export const learnableRouter = new LearnableRouter();
