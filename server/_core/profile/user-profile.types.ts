/**
 * User profile types for personalized trading advice.
 */

// Basic info
export interface BasicInfo {
  name?: string;
  nickname: string;
  ageRange: "18-30" | "30-45" | "45-60" | "60+";
  profession?: string;
  yearsTradingExperience: number;
  tradingStartDate?: string;
}

// Financial profile
export interface FinancialProfile {
  totalTradingCapital: number;
  monthlyAvailableAmount: number;
  dailyTradingTimeHours: number;
  tradingFrequency: "daily" | "3-5x_week" | "weekly" | "occasional";
  primaryMarkets: ("stocks" | "crypto" | "futures" | "forex")[];
}

// Risk profile
export interface RiskProfile {
  riskTolerance: "conservative" | "moderate" | "aggressive";
  singleTradeMaxLossPct: number;
  singleTradeMaxLossUsd?: number;
  dailyMaxLossPct: number;
  dailyMaxLossUsd?: number;
  monthlyMaxLossPct: number;
  annualRiskBudgetUsd?: number;
  maxPositionSizePct: number;
  portfolioConcentrationTolerance: "low" | "moderate" | "high";
}

// Trading goals
export interface TradingGoals {
  primaryObjective:
    | "wealth_growth"
    | "income_generation"
    | "retirement_savings"
    | "risk_hedge"
    | "learning";
  secondaryObjectives: string[];
  expectedHoldingPeriod:
    | "intraday"
    | "1-7days"
    | "1-4weeks"
    | "1-3months"
    | "6months+";
  profitTakingTimeframe:
    | "quick_scalp"
    | "fast_return"
    | "patient_investor"
    | "very_long_term";
  yearlyReturnTargetPct?: number;
}

// Psychological profile
export interface PastMistake {
  type:
    | "holding_too_long"
    | "selling_too_early"
    | "fomo_chasing"
    | "revenge_trading"
    | "over_leveraging";
  frequency: "rarely" | "sometimes" | "frequently" | "very_frequently";
  impact: "minor" | "moderate" | "significant";
  description?: string;
}

export interface PsychologicalProfile {
  decisionMakingStyle: "analytical" | "intuitive" | "mixed";
  executionStyle: "systematic" | "flexible" | "mixed";
  emotionalStability: "low" | "moderate" | "high";
  holdingTendency: "holds_too_long" | "sells_too_early" | "balanced";
  trendFollowingTendency: "strong_fomo" | "moderate_fomo" | "minimal_fomo";
  lossAversionScore: number;
  patienceScore: number;
  overthinkingScore: number;
  impulsivityScore: number;
  pastMajorMistakes: PastMistake[];
}

// Technical knowledge
export type KnowledgeLevel =
  | "not_familiar"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export interface TechnicalKnowledge {
  familiarityWithChanlun: KnowledgeLevel;
  familiarityWithFibonacci: KnowledgeLevel;
  familiarityWithMaSystem: KnowledgeLevel;
  familiarityWithMacd: KnowledgeLevel;
  familiarityWithRsi: KnowledgeLevel;
  preferredTechnicalFramework:
    | "chanlun"
    | "fibonacci"
    | "moving_average"
    | "combined"
    | "chart_reading";
  technicalAnalysisConfidence: number;
  fundamentalAnalysisUsage: "never" | "sometimes" | "often" | "primary_method";
}

// Trading constraints
export interface TradingHours {
  start: string;
  end: string;
  timezone: string;
}

export interface TradingConstraints {
  geographicRestrictions: string[];
  regulatoryConstraints: string[];
  timeZone: string;
  tradingHoursAvailable: {
    mondayToFriday: TradingHours;
    weekend: { available: boolean };
  };
  minimumHoldingPeriodHours: number;
  maximumConcurrentPositions: number;
}

// Full user profile
export interface UserProfileFull {
  userId: string;
  createdAt: string;
  updatedAt: string;
  profileVersion: number;

  basicInfo: BasicInfo;
  financialProfile: FinancialProfile;
  riskProfile: RiskProfile;
  tradingGoals: TradingGoals;
  psychologicalProfile: PsychologicalProfile;
  technicalKnowledge: TechnicalKnowledge;
  tradingConstraints: TradingConstraints;
}

// Behavior history
export interface TradingDecision {
  ticker: string;
  decision: "hold" | "sell_partial" | "sell_all" | "buy" | "add_position";
  reasonStated: string;
  confidenceLevel: number;
  emotionalStateDetected:
    | "fearful"
    | "greedy"
    | "anxious"
    | "confident"
    | "calm";
}

export interface AIRecommendation {
  recommendation: string;
  adopted: boolean;
  result?: "positive" | "neutral" | "negative";
}

export interface BehaviorHistoryEntry {
  behaviorHistoryId: string;
  userId: string;
  timestamp: string;
  sessionType:
    | "questionnaire"
    | "trading_analysis"
    | "decision_query"
    | "report_review"
    | "feedback";
  sessionData: {
    aiQuestionsAsked: string[];
    userResponses: string[];
    decisionsMade: TradingDecision[];
    aiRecommendations: AIRecommendation[];
  };
}

// Position management rules
export interface ProfitTakingStage {
  profitPct: number;
  sellPctOfPosition: number;
  action: string;
}

export interface PositionManagementRules {
  positionRuleId: string;
  userId: string;
  ticker: string;
  ruleType: "profit_taking" | "stop_loss" | "scaling";
  rules: {
    profitTaking: {
      enabled: boolean;
      stages: ProfitTakingStage[];
      trailingStop: {
        enabled: boolean;
        triggerProfitPct: number;
        trailingDistancePct: number;
      };
    };
    stopLoss: {
      enabled: boolean;
      fixedLossPct: number;
      technicalStopPrice?: number;
      enforceStrictly: boolean;
      exceptions: string[];
    };
    scaling: {
      allowed: boolean;
      maxAdditionalPositions: number;
      scalingPercentage: number;
      conditions: string[];
    };
  };
  createdAt: string;
  lastModified: string;
}

// Profile for AI use
export interface ProfileForAI {
  userId: string;
  nickname: string;

  riskTolerance: RiskProfile["riskTolerance"];
  singleTradeMaxLossPct: number;
  maxPositionSizePct: number;

  emotionalStability: PsychologicalProfile["emotionalStability"];
  holdingTendency: PsychologicalProfile["holdingTendency"];
  lossAversionScore: number;
  impulsivityScore: number;
  knownWeaknesses: string[];

  expectedHoldingPeriod: TradingGoals["expectedHoldingPeriod"];
  decisionMakingStyle: PsychologicalProfile["decisionMakingStyle"];

  preferredFramework: TechnicalKnowledge["preferredTechnicalFramework"];
  technicalConfidence: number;

  maxConcurrentPositions: number;

  stats: {
    totalDecisions: number;
    aiAdoptionRate: number;
    successRate: number;
    commonMistakePatterns: string[];
  };
}
