/**
 * Universal Scenario Engine - Type Definitions
 * 
 * Formal contracts for the scenario-agnostic Intermediate Representation (IR),
 * deterministic simulation model, and decision-support output contract.
 */

export interface ScenarioChangeDef {
  attribute: string;
  beforeValue: string | number;
  afterValue: string | number;
}

export interface ActivatedDimension {
  dimensionKey: string;
  dimensionName: string;
  sensitivityWeight: number; // 0.0 - 1.0
  rationale: string;
  mappedAttributes: string[];
}

export interface AttributePressure {
  attributeName: string; // Target persona attribute
  dimensionKey: string;
  direction: "increase_friction" | "relieve_friction";
  intensity: number; // 0.0 - 1.0 magnitude
  sensitivityWeight: number; // 0.0 - 1.0
  rationale: string;
}

/**
 * Universal Intermediate Representation (IR)
 * Every natural-language prompt is normalized into this structure
 * before entering the deterministic simulation core.
 */
export interface UniversalScenarioIR {
  intent: "policy_evaluation" | "tradeoff_inquiry" | "change_proposal" | "exploratory_question" | "unclear_inquiry";
  proposal: string;                   // What is being proposed or inquired about
  baseline: string;                   // Current or assumed baseline state
  changes: ScenarioChangeDef[];       // Specific extracted or inferred parameter changes
  stakeholders: string[];             // Employee groups or personas directly implicated
  affectedDimensions: ActivatedDimension[]; // Dimensions activated from the ontology
  attributePressures: AttributePressure[];  // Mathematical vectors for the simulation engine
  potentialEffects: string[];         // Identified prospective impacts
  argumentsFor: string[];             // Arguments/rationale in favor (benefits)
  argumentsAgainst: string[];         // Arguments/concerns against (risks/friction)
  constraints: string[];              // Stated or inferred constraints
  confidence: number;                 // 0.0 - 1.0 parsing confidence
  unmappedConcepts: string[];         // Concepts that could not be mapped cleanly
  clarificationNeeded?: string;       // Guidance if prompt is too vague or lacks actionable details
  isSimulatable: boolean;             // True if confidence >= 0.35 and at least one dimension mapped
}

export interface PersonaImpactDriver {
  attribute: string;
  influence: number; // Raw mathematical contribution
  note: string;
}

export interface PersonaSimulationScore {
  personaId?: string;
  externalId: string;
  name: string;
  overallImpactScore: number; // 0 - 100
  flexibilityScore: number;
  accessibilityScore: number;
  wellbeingScore: number;
  adoptionScore: number;
  retentionRiskScore: number;
  reaction: "positive" | "neutral" | "concerned" | "critical";
  primaryConcern: string;
  simulatedThought: string;
  explanationText: string;
  drivers: PersonaImpactDriver[];
}

export interface SimulationCohortResult {
  cohortKey: string;
  name: string;
  description: string;
  criteriaDescription: string;
  populationCount: number;
  populationPercentage: number;
  averageImpact: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  members: {
    personaId?: string;
    externalId: string;
    name: string;
    matchScore: number;
    contributingFactors: string;
    impactScore?: number;
  }[];
}

export interface CounterfactualAttributeResult {
  attributeKey: string;
  attributeDisplayName: string;
  affectedPopulation: number;
  originalAverageImpact: number;
  counterfactualAverageImpact: number;
  difference: number;
  status: "Material influence detected - Investigate" | "Moderate influence detected" | "Low influence";
  requiresInvestigation: boolean;
  rationale: string;
}

export interface TradeoffItem {
  benefit: string;
  friction: string;
  affectedStakeholder: string;
}

export interface DecisionSupportSummary {
  summary: string;
  keyFindings: string[];
  mitigationOptions: string[];
  questionsForHumanReview: string[];
  humanInTheLoopNotice: string;
}

/**
 * Universal Output Contract
 * The standardized structure returned to consumers and the SAP Fiori UI.
 */
export interface UniversalOutputContract {
  scenario: {
    title: string;
    rawText: string;
    intent: string;
    proposal: string;
    baseline: string;
  };
  interpretation: {
    confidence: number;
    argumentsFor: string[];
    argumentsAgainst: string[];
    stakeholders: string[];
    unmappedConcepts: string[];
    clarificationNeeded?: string;
    isSimulatable: boolean;
  };
  activatedDimensions: ActivatedDimension[];
  simulation: {
    population: number;
    overallImpact: number;
    distribution: {
      highImpactCount: number;
      mediumImpactCount: number;
      lowImpactCount: number;
      affectedPercentage: number;
    };
    subIndices: {
      avgFlexibility: number;
      avgAccessibility: number;
      avgWellbeing: number;
      avgAdoption: number;
      avgRetentionRisk: number;
    };
    cohorts: SimulationCohortResult[];
  };
  counterfactuals: CounterfactualAttributeResult[];
  tradeoffs: TradeoffItem[];
  uncertainty: string[];
  decisionSupport: DecisionSupportSummary;
}
