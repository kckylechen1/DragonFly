import type {
  UserProfile,
  UserMindset,
  ConversationContext,
  HoldingMemory,
  OperationPattern,
} from "../memory/simplemem.types";

export interface ParsedInput {
  stocks: string[];
  queryType: "quote" | "analysis" | "advice" | "comparison" | "general";
  userSentiment: "bullish" | "bearish" | "neutral" | "anxious" | "greedy";
  isFollowUp: boolean;
  newInformation: Record<string, string>;
}

export interface MarketReview {
  currentPrices: Record<string, number>;
  priceChanges: {
    code: string;
    change1d: number;
    change5d: number;
    change20d: number;
  }[];
  technicalLevels: {
    code: string;
    support: number[];
    resistance: number[];
    trend: "up" | "down" | "sideways";
  }[];
  userCostBasis: {
    code: string;
    costPrice: number;
    currentPrice: number;
    profitLevel: number;
  }[];
}

export interface AnalysisResult {
  technical: {
    code: string;
    macdSignal: "buy" | "sell" | "hold";
    rsiLevel: number;
    volumeTrend: "increasing" | "decreasing" | "stable";
    summary: string;
  }[];
  funding: {
    code: string;
    mainForceFlow: "inflow" | "outflow" | "neutral";
    retailFlow: "inflow" | "outflow" | "neutral";
    summary: string;
  }[];
  fundamental: {
    code: string;
    peRatio: number;
    pbRatio: number;
    revenueGrowth: number;
    summary: string;
  }[];
  sentiment: {
    code: string;
    newsScore: number;
    socialScore: number;
    analystRating: string;
    summary: string;
  }[];
  relevantPatterns: OperationPattern[];
}

export interface RiskAssessment {
  stockRisks: {
    code: string;
    riskLevel: "low" | "medium" | "high" | "extreme";
    riskFactors: string[];
    potentialDownside: number;
    stopLossRecommendation: number;
  }[];
  portfolioRisk: {
    concentrationRisk: "low" | "medium" | "high";
    sectorExposure: Record<string, number>;
    correlationRisk: number;
  };
  userSpecificRisk: {
    matchesRiskTolerance: boolean;
    emotionalRiskFlag: boolean;
    warningMessages: string[];
  };
}

export interface OperationalAdvice {
  [stockCode: string]: {
    shortTerm: {
      action: "buy" | "sell" | "hold" | "reduce" | "add";
      confidence: number;
      reasoning: string;
      targetPrice?: number;
      stopLoss?: number;
    };
    mediumTerm: {
      action: "buy" | "sell" | "hold" | "reduce" | "add";
      confidence: number;
      reasoning: string;
      targetPrice?: number;
    };
    longTerm: {
      outlook: "bullish" | "bearish" | "neutral";
      reasoning: string;
    };
  };
}

export interface PersonalizedOutput {
  baseAdvice: OperationalAdvice;
  personalizedEvaluation: {
    currentMindsetAssessment: string;
    historicalPatternMatch: string[];
    adjustedRecommendation: string;
  };
  questionsForClarification: string[];
  warningFlags: {
    type: "emotional" | "pattern" | "risk";
    description: string;
    suggestion: string;
  }[];
}

export class StockAnalysisFramework {
  async step1_parseUserInput(
    userMessage: string,
    context: ConversationContext
  ): Promise<ParsedInput> {
    console.log("[Framework] Step 1: 解析用户输入");

    return {
      stocks: this.extractStockCodes(userMessage),
      queryType: "analysis",
      userSentiment: "neutral",
      isFollowUp: false,
      newInformation: {},
    };
  }

  async step2_reviewMarketStatus(
    stocks: string[],
    portfolio: HoldingMemory[]
  ): Promise<MarketReview> {
    console.log("[Framework] Step 2: 行情复盘", stocks);

    return {
      currentPrices: {},
      priceChanges: [],
      technicalLevels: [],
      userCostBasis: [],
    };
  }

  async step3_multidimensionalAnalysis(
    stocks: string[],
    review: MarketReview,
    userProfile: UserProfile
  ): Promise<AnalysisResult> {
    console.log("[Framework] Step 3: 多维度分析", stocks);

    return {
      technical: [],
      funding: [],
      fundamental: [],
      sentiment: [],
      relevantPatterns: [],
    };
  }

  async step4_riskRewardAssessment(
    stocks: string[],
    analysis: AnalysisResult,
    portfolio: HoldingMemory[],
    mindset: UserMindset
  ): Promise<RiskAssessment> {
    console.log("[Framework] Step 4: 风险评估", stocks);

    return {
      stockRisks: [],
      portfolioRisk: {
        concentrationRisk: "medium",
        sectorExposure: {},
        correlationRisk: 0,
      },
      userSpecificRisk: {
        matchesRiskTolerance: true,
        emotionalRiskFlag: false,
        warningMessages: [],
      },
    };
  }

  async step5_generateOperationalAdvice(
    stocks: string[],
    risk: RiskAssessment,
    portfolio: HoldingMemory[],
    analysis: AnalysisResult,
    userProfile: UserProfile
  ): Promise<OperationalAdvice> {
    console.log("[Framework] Step 5: 生成建议", stocks);

    return {};
  }

  async step6_personalizedQAAndAdjustment(
    userMessage: string,
    advice: OperationalAdvice,
    portfolio: HoldingMemory[],
    mindset: UserMindset,
    userProfile: UserProfile,
    analysis: AnalysisResult,
    context: ConversationContext
  ): Promise<PersonalizedOutput> {
    console.log("[Framework] Step 6: 个性化调整");

    return {
      baseAdvice: advice,
      personalizedEvaluation: {
        currentMindsetAssessment: "",
        historicalPatternMatch: [],
        adjustedRecommendation: "",
      },
      questionsForClarification: [],
      warningFlags: [],
    };
  }

  async analyze(
    userMessage: string,
    context: ConversationContext,
    portfolio: HoldingMemory[],
    mindset: UserMindset,
    userProfile: UserProfile
  ): Promise<PersonalizedOutput> {
    const step1 = await this.step1_parseUserInput(userMessage, context);
    const step2 = await this.step2_reviewMarketStatus(step1.stocks, portfolio);
    const step3 = await this.step3_multidimensionalAnalysis(
      step1.stocks,
      step2,
      userProfile
    );
    const step4 = await this.step4_riskRewardAssessment(
      step1.stocks,
      step3,
      portfolio,
      mindset
    );
    const step5 = await this.step5_generateOperationalAdvice(
      step1.stocks,
      step4,
      portfolio,
      step3,
      userProfile
    );
    const step6 = await this.step6_personalizedQAAndAdjustment(
      userMessage,
      step5,
      portfolio,
      mindset,
      userProfile,
      step3,
      context
    );

    return step6;
  }

  private extractStockCodes(text: string): string[] {
    const patterns = [
      /\b(\d{6})\b/g,
      /\b([A-Z]{1,5})\b/g,
      /\b(\d{6}\.[A-Z]{2})\b/g,
    ];

    const codes: string[] = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        codes.push(...matches);
      }
    }

    return [...new Set(codes)];
  }
}

export function createStockAnalysisFramework(): StockAnalysisFramework {
  return new StockAnalysisFramework();
}
