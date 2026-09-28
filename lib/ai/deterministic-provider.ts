import {
  IAIProvider,
  ScenarioAnalysisResult,
  AggregateSimulationSummary,
  AIExplanationResult,
} from "./ai-interface.js";
import { UniversalScenarioIR, CounterfactualAttributeResult } from "../universal-scenario/types.js";
import { parseScenarioToIR } from "../universal-scenario/universal-parser.js";

/**
 * Universal Fallback AI Provider
 * 
 * Provides resilient, deterministic semantic parsing into the UniversalScenarioIR
 * when SAP AI Core / Generative AI Hub is offline or not bound.
 * 
 * Zero scenario-specific branching. Uses the universal concept ontology.
 */
export class DeterministicAIProvider implements IAIProvider {
  name = "UniversalScenarioEngineFallback";

  async parseScenario(text: string): Promise<UniversalScenarioIR> {
    return parseScenarioToIR(text);
  }

  async analyzeScenario(text: string): Promise<ScenarioAnalysisResult> {
    const ir = parseScenarioToIR(text);

    return {
      scenarioType: ir.intent,
      title: ir.proposal.length > 55 ? `${ir.proposal.substring(0, 52)}...` : ir.proposal,
      description: ir.proposal,
      changes: ir.changes,
      affectedDimensions: ir.affectedDimensions,
      ir,
    };
  }

  async explainSimulation(summary: AggregateSimulationSummary): Promise<AIExplanationResult> {
    const topCohortNames = summary.topCohorts.slice(0, 2).map((c) => `${c.name} (${c.averageImpact}% impact)`).join(" and ");

    // Handle unclear / non-simulatable scenarios gracefully (Requirement 2)
    if (summary.ir && !summary.ir.isSimulatable) {
      return {
        executiveSummary: `This inquiry cannot be simulated reliably in its current form. ${summary.ir.clarificationNeeded || "A meaningful workforce simulation requires concrete policy definitions and affected employee segments."}`,
        keyFindings: [
          `Detected concepts: ${summary.ir.unmappedConcepts.join(", ") || "Abstract organizational ideas"}.`,
          `Simulation confidence is low (${Math.round(summary.ir.confidence * 100)}%) due to unspecified baseline and operational parameters.`,
          `No synthetic persona scoring was fabricated.`,
        ],
        questionsForReview: [
          "What specific policy, tooling, or schedule change is under active consideration?",
          "What is the current organizational baseline against which this change would be measured?",
          "Simulynx provides decision support; concrete parameters are required before running workforce simulation.",
        ],
      };
    }

    // Standard Universal Decision Support Explanation (Requirement 8 & 9)
    let executiveSummary = `Workforce simulation across 300 synthetic profiles yields an aggregate impact score of ${summary.overallImpactScore}%, with ${summary.affectedPercentage}% of employees experiencing material schedule or operational friction. Impact is most concentrated among ${topCohortNames || "vulnerable workforce segments"}.`;

    if (summary.ir && summary.ir.intent === "tradeoff_inquiry") {
      executiveSummary += ` While the proposed policy offers recognizable organizational benefits (${summary.ir.argumentsFor[0] || "alignment"}), it generates disproportionate friction for cohorts facing specific structural constraints (${summary.ir.argumentsAgainst[0] || "flexibility drag"}). Rather than an absolute mandate, leadership should deliberate contextual guidelines.`;
    }

    const keyFindings: string[] = [
      `Overall workforce simulated impact registers at ${summary.overallImpactScore}/100, with ${summary.affectedPercentage}% of profiles experiencing material friction.`,
      `Flexibility Index stands at ${summary.avgFlexibilityScore}/100; Wellbeing Index registers at ${summary.avgWellbeingScore}/100.`,
      `Most sensitive employee segments: ${topCohortNames || "Identified cohorts"}.`,
    ];

    if (summary.counterfactuals && summary.counterfactuals.length > 0) {
      const topCf = summary.counterfactuals[0];
      if (topCf.difference >= 8) {
        keyFindings.push(`Counterfactual sensitivity confirms that ${topCf.attributeDisplayName} materially influences outcomes (+${topCf.difference} points friction delta).`);
      }
    }

    const questionsForReview: string[] = [
      "What core organizational objective is this policy designed to achieve, and can that goal be met with contextual team autonomy rather than a strict mandate?",
      "What formal, non-stigmatizing accommodation processes will be established for staff belonging to the most sensitive cohorts?",
      "Simulynx is a digital workforce wind tunnel for decision support. Final organizational decisions remain exclusively with human leadership.",
    ];

    return {
      executiveSummary,
      keyFindings,
      questionsForReview,
    };
  }

  async analyzeRedTeam(counterfactuals: CounterfactualAttributeResult[]): Promise<string> {
    const material = counterfactuals.filter((c) => c.difference >= 15);
    if (material.length === 0) {
      return "Red-team counterfactual testing indicates relatively distributed sensitivity across attributes, with no single factor overwhelmingly dominating simulated outcomes.";
    }

    const attrs = material.map((m) => `${m.attributeDisplayName} (isolated delta: +${m.difference} points)`).join(", ");
    return `Counterfactual sensitivity analysis confirms that ${attrs} materially influence simulated outcomes. Neutralizing these specific constraints in isolation creates substantial friction reduction. Leaders should investigate targeted accommodation options prior to rollout.`;
  }

  getStatus() {
    return {
      success: false,
      activeProvider: this.name,
      isConfigured: false,
      mode: "FALLBACK_DETERMINISTIC" as const,
      authType: "NONE" as const,
      missingVariables: [
        "AICORE_BASE_URL (or SAP_AI_API_URL)",
        "AICORE_AUTH_URL",
        "AICORE_CLIENT_ID",
        "AICORE_CLIENT_SECRET",
      ],
      message: "Running in Offline Fallback Mode. SAP AI Core / Joule credentials not found in environment or .env.",
    };
  }

  async testConnection() {
    return this.getStatus();
  }
}

