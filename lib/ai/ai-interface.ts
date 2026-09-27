import { ScenarioChangeDef, ActivatedDimension } from "../ontology/ontology.js";
import { CounterfactualAttributeResult } from "../counterfactual/redteam-engine.js";

export interface ScenarioAnalysisResult {
  scenarioType: string;
  title: string;
  description: string;
  changes: ScenarioChangeDef[];
  affectedDimensions: ActivatedDimension[];
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
}

export interface AIExplanationResult {
  executiveSummary: string;
  keyFindings: string[];
  questionsForReview: string[];
}

export interface IAIProvider {
  name: string;
  analyzeScenario(text: string): Promise<ScenarioAnalysisResult>;
  explainSimulation(summary: AggregateSimulationSummary): Promise<AIExplanationResult>;
  analyzeRedTeam(counterfactuals: CounterfactualAttributeResult[]): Promise<string>;
}
