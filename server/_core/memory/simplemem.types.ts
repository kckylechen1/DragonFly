/**
 * SimpleMem types for compressed trading memory.
 */

// Portfolio memory
export interface CompressedPortfolio {
  holdings: {
    code: string;
    symbol: string;
    quantity: number;
    avgCost: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    holdDays: number;
    timeframe: "short" | "medium" | "long";
  }[];

  stats: {
    totalValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    concentrationRatio: number;
    diversificationScore: number;
  };

  patterns: {
    avgHoldDays: number;
    winRate: number;
    profitFactor: number;
    maxConsecutiveLosses: number;
    chaseHighTendency: number;
    panicSellTendency: number;
  };
}

// Operation memory
export interface CompressedOperations {
  recentOps: {
    stock: string;
    action: "buy" | "sell";
    price: number;
    date: string;
    outcome: "profit" | "loss" | "pending";
    pnl: number;
  }[];

  weeklyPattern: {
    preferredBuyDay: string;
    preferredSellDay: string;
    bestTimeOfDay: string;
  };

  emotionalPattern: {
    hasLossAversion: boolean;
    chasingHighFrequency: number;
    overtradingRisk: boolean;
    lastLossDate: string | null;
    consecutiveLossCount: number;
  };
}

// User mindset
export interface UserMindset {
  confidence: number;
  riskTolerance: number;
  timeHorizon: "day" | "week" | "month" | "quarter" | "year";

  psychologicalState: {
    hasRecentLoss: boolean;
    isGreedyPhase: boolean;
    isFearPhase: boolean;
    overfitToRecentTrend: boolean;
  };

  decisionQuality: {
    analysisDepth: "quick" | "medium" | "deep";
    timeSpentAnalyzing: number;
    consultedSources: number;
  };
}

// User profile
export interface UserProfile {
  tradingExperience: "beginner" | "intermediate" | "advanced";
  preferredStrategy: "technical" | "fundamental" | "sentiment" | "mixed";

  learningHistory: {
    frequentMistakes: string[];
    improvementAreas: string[];
    successfulPatterns: string[];
  };

  preferences: {
    analysisDetailLevel: "brief" | "standard" | "detailed";
    questionStyle: "direct" | "socratic";
    dataVisualization: "text" | "table" | "chart";
    frequencyOfQuestions: "none" | "few" | "many";
  };

  marketView: {
    currentOutlook: "bullish" | "neutral" | "bearish";
    favoredSectors: string[];
    avoidedSectors: string[];
    lastUpdated: string;
  };
}

// Conversation context
export interface ConversationContext {
  currentSession: {
    startTime: string;
    focusStocks: string[];
    mainQueries: string[];
    decisionsMade: {
      decision: string;
      reasoning: string;
      timestamp: string;
    }[];
  };

  knownFacts: Record<string, string>;

  questioningState: {
    questionsAsked: string[];
    questionsNeedFollow: string[];
    informationGaps: string[];
  };
}

// Holding memory
export interface HoldingMemory {
  code: string;
  symbol: string;

  costBasis: {
    totalShares: number;
    avgPrice: number;
    totalCost: number;
    firstBuyDate: string;
    lastBuyDate: string;
  };

  transactionHistory: {
    date: string;
    action: "buy" | "sell" | "partial_sell";
    shares: number;
    price: number;
    reason: string;
  }[];

  psychologicalExpectation: {
    targetPrice: number;
    stopLossPrice: number;
    holdingDaysExpected: number;
    worstCaseLossAcceptable: number;
  };

  reviewResult?: {
    date: string;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    outcome: "achieved_target" | "hit_stoploss" | "pending" | "exited_early";
    lessonsLearned: string;
  };
}

// Operation pattern
export interface OperationPattern {
  operationType:
    | "chaseHigh"
    | "cuttingLoss"
    | "longTermHold"
    | "swingTrade"
    | "dayTrade";

  successMetrics: {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    avgReturnSuccess: number;
    avgReturnFailure: number;
    profitFactor: number;
  };

  triggerConditions: {
    marketCondition:
      | "strong_bull"
      | "bull"
      | "neutral"
      | "bear"
      | "strong_bear";
    volumePattern: "volume_breakout" | "volume_accumulation" | "volume_decline";
    sentiment: "extreme_greed" | "greed" | "neutral" | "fear" | "extreme_fear";
  };

  riskProfile: {
    maxDrawdown: number;
    volatility: number;
    recoveryTime: number;
    blackSwanRisk: string[];
  };

  personalReview: {
    whenUserSucceeds: string[];
    whenUserFails: string[];
    recommendation: string;
  };
}

// SimpleMem interface
export interface SimpleMemEntry {
  domain: string;
  key: string;
  content: string;
  timestamp: number;
  ttl?: number;
  importance: number;
}

export interface SimpleMemQuery {
  domain: string;
  query: string;
  limit?: number;
}

export interface ISimpleMem {
  remember(entry: SimpleMemEntry): Promise<void>;
  retrieve(query: SimpleMemQuery): Promise<SimpleMemEntry[]>;
  forget(domain: string, key: string): Promise<boolean>;
}
