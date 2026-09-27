import {
  UniversalScenarioIR,
  DecisionSupportSummary,
  TradeoffItem,
  UniversalOutputContract,
  CounterfactualAttributeResult,
} from "./types.js";
import { SimulationRunResult } from "../simulation-engine/simulation-engine.js";

/**
 * Universal Decision Support Builder
 * Synthesizes neutral, balanced decision-support outputs based strictly
 * on deterministic simulation outcomes and the UniversalScenarioIR.
 * 
 * Adheres strictly to the Human-in-the-Loop principle:
 * Zero automated executive verdicts. Both sides represented neutrally.
 */
export function buildUniversalOutputContract(
  ir: UniversalScenarioIR,
  simResult: SimulationRunResult,
  counterfactuals: CounterfactualAttributeResult[]
): UniversalOutputContract {
  // 1. Build Trade-offs (Requirement 9: Represent both sides neutrally)
  const tradeoffs: TradeoffItem[] = [];
  const maxPairs = Math.max(ir.argumentsFor.length, ir.argumentsAgainst.length);

  for (let i = 0; i < maxPairs; i++) {
    const benefit = ir.argumentsFor[i] || "Organizational alignment and operational predictability.";
    const friction = ir.argumentsAgainst[i] || "Schedule constraints and workflow adaptation drag.";
    const stakeholder = ir.stakeholders[i % Math.max(1, ir.stakeholders.length)] || "Affected workforce segments";

    tradeoffs.push({
      benefit,
      friction,
      affectedStakeholder: stakeholder,
    });
  }

  // 2. Synthesize Decision Support Summary (Requirement 8: No automatic verdicts)
  const topCohorts = simResult.cohortResults.slice(0, 2);
  const topCohortText =
    topCohorts.length > 0
      ? topCohorts.map((c) => `${c.name} (${c.averageImpact}% impact)`).join(" and ")
      : "identified workforce segments";

  const materialAttributes = counterfactuals.filter((cf) => cf.requiresInvestigation);
  const materialAttrsText =
    materialAttributes.length > 0
      ? materialAttributes.map((cf) => `${cf.attributeDisplayName} (+${cf.difference}pts)`).join(", ")
      : "distributed baseline factors";

  let summaryText = `The simulated impact across 300 synthetic profiles averages ${simResult.overallImpactScore}%, with ${simResult.affectedPercentage}% of the workforce registering material scheduling or operational friction. Impact is most pronounced among ${topCohortText}. Counterfactual analysis indicates that ${materialAttrsText} materially influence outcomes.`;

  if (ir.intent === "tradeoff_inquiry") {
    summaryText += ` Evaluation indicates that while the proposal offers legitimate organizational benefits, it generates concentrated friction for staff with specific constraints. Leadership should evaluate whether an inflexible mandate can be replaced with structured contextual guidelines.`;
  }

  const keyFindings: string[] = [
    `Workforce Simulated Impact stands at ${simResult.overallImpactScore}/100, affecting ${simResult.affectedPercentage}% of profiles.`,
    `Flexibility Index registers at ${simResult.avgFlexibilityScore}/100, while Wellbeing Index stands at ${simResult.avgWellbeingScore}/100.`,
    `Most sensitive cohorts: ${topCohortText}.`,
  ];

  if (materialAttributes.length > 0) {
    keyFindings.push(`Counterfactual testing confirms that ${materialAttributes[0].attributeDisplayName} contributes an isolated delta of +${materialAttributes[0].difference} points to friction.`);
  }

  // Generate actionable mitigation options
  const mitigationOptions: string[] = [];
  const activeDimKeys = new Set(ir.affectedDimensions.map((d) => d.dimensionKey));

  if (activeDimKeys.has("commute")) {
    mitigationOptions.push("Provide flexible core arrival/departure hours (e.g. 10:00-15:30) to allow commuters to avoid peak transit congestion.");
    mitigationOptions.push("Establish corporate transit stipends or localized shuttle connections for relocated facilities.");
  }
  if (activeDimKeys.has("accessibility")) {
    mitigationOptions.push("Preserve quiet focus zones, permanent ergonomic workstations, and camera-optional norms for sensory-sensitive staff.");
  }
  if (activeDimKeys.has("caregiving")) {
    mitigationOptions.push("Introduce family-care scheduling buffers and asynchronous check-in alternatives that accommodate school and childcare hours.");
  }
  if (activeDimKeys.has("technologyChange")) {
    mitigationOptions.push("Pair automated tooling deployments with dedicated peer-mentorship pods and opt-in transition periods to build technology trust.");
  }
  if (activeDimKeys.has("flexibility")) {
    mitigationOptions.push("Delegate team-level discretion to line managers to structure contextual norms rather than enforcing an organization-wide mandate.");
  }

  if (mitigationOptions.length === 0) {
    mitigationOptions.push("Offer structured pilot periods with feedback checkpoints before permanent policy codification.");
    mitigationOptions.push("Establish opt-in accommodation processes for employees facing documented unique constraints.");
  }

  // Questions for Human Review (Requirement 8 & 15)
  const questionsForHumanReview: string[] = [
    "What specific organizational outcome is this policy primarily intended to drive, and can that outcome be achieved with greater flexibility?",
    "How will the organization provide formal, non-penalizing accommodations for employees belonging to the most sensitive cohorts?",
    "Does the proposed timeline allow managers and teams sufficient time to adapt their coordination rhythms?",
  ];

  if (ir.intent === "tradeoff_inquiry") {
    questionsForHumanReview.push("Can the proposed policy be implemented as an intentional team guideline rather than an inflexible organizational rule?");
  }

  const decisionSupport: DecisionSupportSummary = {
    summary: summaryText,
    keyFindings,
    mitigationOptions: mitigationOptions.slice(0, 3),
    questionsForHumanReview: questionsForHumanReview.slice(0, 3),
    humanInTheLoopNotice: "Simulynx is a digital workforce wind tunnel for decision support. It does not dictate organizational decisions. Final policy choices remain exclusively with human leadership.",
  };

  // 3. Document Uncertainty & Limitations (Requirement 2 & 11)
  const uncertainty: string[] = [
    "Simulated outcomes are directional estimates based on 300 synthetic personas spanning 10 human dimensions, not empirical employee tracking.",
  ];

  if (ir.clarificationNeeded) {
    uncertainty.push(ir.clarificationNeeded);
  }

  if (ir.unmappedConcepts.length > 0) {
    uncertainty.push(`Unmapped concepts detected: ${ir.unmappedConcepts.join(", ")}. These concepts could not be fully represented in the simulation.`);
  }

  return {
    scenario: {
      title: ir.proposal.length > 60 ? `${ir.proposal.substring(0, 57)}...` : ir.proposal,
      rawText: ir.proposal,
      intent: ir.intent,
      proposal: ir.proposal,
      baseline: ir.baseline,
    },
    interpretation: {
      confidence: ir.confidence,
      argumentsFor: ir.argumentsFor,
      argumentsAgainst: ir.argumentsAgainst,
      stakeholders: ir.stakeholders,
      unmappedConcepts: ir.unmappedConcepts,
      clarificationNeeded: ir.clarificationNeeded,
      isSimulatable: ir.isSimulatable,
    },
    activatedDimensions: ir.affectedDimensions,
    simulation: {
      population: simResult.totalPersonas,
      overallImpact: simResult.overallImpactScore,
      distribution: {
        highImpactCount: simResult.highImpactCount,
        mediumImpactCount: simResult.mediumImpactCount,
        lowImpactCount: simResult.lowImpactCount,
        affectedPercentage: simResult.affectedPercentage,
      },
      subIndices: {
        avgFlexibility: simResult.avgFlexibilityScore,
        avgAccessibility: simResult.avgAccessibilityScore,
        avgWellbeing: simResult.avgWellbeingScore,
        avgAdoption: simResult.avgAdoptionScore,
        avgRetentionRisk: simResult.avgRetentionRiskScore,
      },
      cohorts: simResult.cohortResults,
    },
    counterfactuals,
    tradeoffs,
    uncertainty,
    decisionSupport,
  };
}
