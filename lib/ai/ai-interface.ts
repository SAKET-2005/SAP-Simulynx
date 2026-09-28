import { UniversalScenarioIR, ScenarioChangeDef, ActivatedDimension, CounterfactualAttributeResult } from "../universal-scenario/types.js";

export interface ScenarioAnalysisResult {
  scenarioType: string;
  title: string;
  description: string;
  changes: ScenarioChangeDef[];
  affectedDimensions: ActivatedDimension[];
  ir: UniversalScenarioIR;
}

export interface AggregateSimulationSummary {
  scenarioTitle: string;
  scenarioType: string;
  totalPersonas: number;
  overallImpactScore: number;
  affectedPercentage: number;
  highImpactCount: number;
  mediumImpactCount: number;
  lowImpactCount: number;
  avgFlexibilityScore: number;
  avgAccessibilityScore: number;
  avgWellbeingScore: number;
  avgAdoptionScore: number;
  avgRetentionRiskScore: number;
  topCohorts: {
    name: string;
    population: number;
    averageImpact: number;
    riskLevel: string;
  }[];
  counterfactuals?: CounterfactualAttributeResult[];
  ir?: UniversalScenarioIR;
}

export interface AIExplanationResult {
  executiveSummary: string;
  keyFindings: string[];
  questionsForReview: string[];
}

export interface AIConnectionTestResult {
  success: boolean;
  activeProvider: string;
  isConfigured: boolean;
  mode: "LIVE_JOULE" | "FALLBACK_DETERMINISTIC" | "OPENAI_DIRECT";
  authType: "OAUTH_CLIENT_CREDENTIALS" | "DIRECT_API_KEY" | "OPENAI_KEY" | "NONE";
  apiEndpoint?: string;
  deploymentId?: string;
  resourceGroup?: string;
  missingVariables: string[];
  latencyMs?: number;
  message: string;
  errorDetail?: string;
}

export interface IAIProvider {
  name: string;
  parseScenario(text: string): Promise<UniversalScenarioIR>;
  analyzeScenario(text: string): Promise<ScenarioAnalysisResult>;
  explainSimulation(summary: AggregateSimulationSummary): Promise<AIExplanationResult>;
  analyzeRedTeam(counterfactuals: CounterfactualAttributeResult[]): Promise<string>;
  getStatus?(): AIConnectionTestResult;
  testConnection?(): Promise<AIConnectionTestResult>;
}

