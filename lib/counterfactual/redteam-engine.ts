import { PersonaData } from "../persona-generator/types.js";
import { UniversalDeterministicImpactModel } from "../simulation-engine/impact-model.js";
import {
  UniversalScenarioIR,
  CounterfactualAttributeResult,
} from "../universal-scenario/types.js";

export interface RedTeamConfig {
  significanceThreshold?: number; // default 10
  moderateThreshold?: number; // default 5
}

/**
 * Universal Counterfactual / Red-Team Engine
 * 
 * Isolates individual sensitive persona attributes, neutralizes them in isolation,
 * and measures the isolated delta (Δ) on simulated impact scores.
 * 
 * Strict adherence to non-stigmatizing, objective decision-support terminology.
 */
export class RedTeamEngine {
  private impactModel: UniversalDeterministicImpactModel;

  constructor(impactModel = new UniversalDeterministicImpactModel()) {
    this.impactModel = impactModel;
  }

  runCounterfactualAnalysis(
    workforce: PersonaData[],
    ir: UniversalScenarioIR,
    config: RedTeamConfig = {}
  ): CounterfactualAttributeResult[] {
    const materialThreshold = config.significanceThreshold ?? 10;
    const moderateThreshold = config.moderateThreshold ?? 5;

    // Identify candidate attributes to test from the IR pressures and activated dimensions
    const targetAttributeSet = new Set<string>();
    for (const pr of ir.attributePressures || []) {
      targetAttributeSet.add(pr.attributeName);
    }

    // Always include high-leverage human dimensions if their dimension is active
    const activeDimKeys = new Set((ir.affectedDimensions || []).map((d) => d.dimensionKey));
    if (activeDimKeys.has("caregiving")) targetAttributeSet.add("caregivingResponsibility");
    if (activeDimKeys.has("commute")) targetAttributeSet.add("commuteMinutes");
    if (activeDimKeys.has("accessibility")) targetAttributeSet.add("sensoryRequirements");
    if (activeDimKeys.has("flexibility")) targetAttributeSet.add("autonomyPreference");
    if (activeDimKeys.has("technologyChange")) targetAttributeSet.add("technologyTrust");
    if (activeDimKeys.has("financialSensitivity")) targetAttributeSet.add("financialSensitivity");

    const candidateAttributes = Array.from(targetAttributeSet);
    const results: CounterfactualAttributeResult[] = [];

    for (const attrKey of candidateAttributes) {
      const res = this.analyzeAttributeCounterfactual(
        attrKey,
        workforce,
        ir,
        materialThreshold,
        moderateThreshold
      );
      if (res) {
        results.push(res);
      }
    }

    // Sort by difference descending
    results.sort((a, b) => b.difference - a.difference);
    return results;
  }

  private analyzeAttributeCounterfactual(
    attrKey: string,
    workforce: PersonaData[],
    ir: UniversalScenarioIR,
    materialThreshold: number,
    moderateThreshold: number
  ): CounterfactualAttributeResult | null {
    let targetPersonas: PersonaData[] = [];
    let counterfactualTransform: (p: PersonaData) => PersonaData;
    let displayName = "";

    switch (attrKey) {
      case "caregivingResponsibility":
      case "caregivingIntensity":
      case "familyObligations":
        displayName = "Caregiving & Family Obligations";
        targetPersonas = workforce.filter((p) => p.caregivingResponsibility);
        if (targetPersonas.length === 0) return null;
        counterfactualTransform = (p) => ({
          ...p,
          caregivingResponsibility: false,
          caregivingIntensity: 0,
          dependentsCount: 0,
          scheduleConstraints: Math.min(30, p.scheduleConstraints),
        });
        break;

      case "commuteMinutes":
      case "transportationMode":
        displayName = "Commute & Transit Distance";
        targetPersonas = workforce.filter((p) => p.commuteMinutes >= 40);
        if (targetPersonas.length === 0) return null;
        counterfactualTransform = (p) => ({
          ...p,
          commuteMinutes: 15,
          transportReliability: 95,
        });
        break;

      case "overallAccessibilityNeed":
      case "sensoryRequirements":
      case "mobilityRequirements":
        displayName = "Accessibility & Sensory Accommodations";
        targetPersonas = workforce.filter((p) => p.overallAccessibilityNeed >= 40 || p.sensoryRequirements);
        if (targetPersonas.length === 0) return null;
        counterfactualTransform = (p) => ({
          ...p,
          overallAccessibilityNeed: 10,
          sensoryRequirements: false,
          mobilityRequirements: false,
        });
        break;

      case "autonomyPreference":
      case "flexibilityImportance":
        displayName = "Schedule & Calendar Autonomy Needs";
        targetPersonas = workforce.filter((p) => p.autonomyPreference >= 70 || p.flexibilityImportance >= 70);
        if (targetPersonas.length === 0) return null;
        counterfactualTransform = (p) => ({
          ...p,
          autonomyPreference: 40,
          flexibilityImportance: 40,
          scheduleConstraints: 30,
        });
        break;

      case "technologyTrust":
      case "technologyAdoption":
        displayName = "Technology & Algorithmic Trust";
        targetPersonas = workforce.filter((p) => p.technologyTrust <= 45 || p.technologyAdoption <= 45);
        if (targetPersonas.length === 0) return null;
        counterfactualTransform = (p) => ({
          ...p,
          technologyTrust: 80,
          technologyAdoption: 85,
        });
        break;

      case "financialSensitivity":
      case "incomeDependency":
        displayName = "Financial Sensitivity & Income Dependency";
        targetPersonas = workforce.filter((p) => p.financialSensitivity >= 65 || p.salaryBand === "entry");
        if (targetPersonas.length === 0) return null;
        counterfactualTransform = (p) => ({
          ...p,
          financialSensitivity: 30,
          incomeDependency: 40,
        });
        break;

      default:
        return null;
    }

    // 1. Calculate original impact on target group
    let origSum = 0;
    for (const p of targetPersonas) {
      const s = this.impactModel.calculatePersonaImpact(p, ir);
      origSum += s.overallImpactScore;
    }
    const originalAverageImpact = Math.round((origSum / targetPersonas.length) * 10) / 10;

    // 2. Calculate counterfactual impact on target group with isolated attribute neutralized
    let cfSum = 0;
    for (const p of targetPersonas) {
      const cfPersona = counterfactualTransform(p);
      const s = this.impactModel.calculatePersonaImpact(cfPersona, ir);
      cfSum += s.overallImpactScore;
    }
    const counterfactualAverageImpact = Math.round((cfSum / targetPersonas.length) * 10) / 10;

    const difference = Math.round(Math.max(0, originalAverageImpact - counterfactualAverageImpact) * 10) / 10;

    let status: CounterfactualAttributeResult["status"] = "Low influence";
    let requiresInvestigation = false;

    if (difference >= materialThreshold) {
      status = "Material influence detected - Investigate";
      requiresInvestigation = true;
    } else if (difference >= moderateThreshold) {
      status = "Moderate influence detected";
    }

    const rationale = requiresInvestigation
      ? `This attribute materially influences the simulated outcome (${displayName}: isolated delta of +${difference} points). Neutralizing this factor substantially reduces friction. Leaders should investigate targeted accommodation options.`
      : `Attribute sensitivity remains within standard operational variance (delta of +${difference} points).`;

    return {
      attributeKey: attrKey,
      attributeDisplayName: displayName,
      affectedPopulation: targetPersonas.length,
      originalAverageImpact,
      counterfactualAverageImpact,
      difference,
      status,
      requiresInvestigation,
      rationale,
    };
  }
}
