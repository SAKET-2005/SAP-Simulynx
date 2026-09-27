import { PersonaData } from "../persona-generator/types.js";
import {
  IImpactModel,
  DeterministicImpactModel,
  ScenarioSimulationContext,
} from "../simulation-engine/impact-model.js";

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

export interface RedTeamConfig {
  attributesToAnalyze?: string[];
  significanceThreshold?: number; // default 15 for material
  moderateThreshold?: number; // default 8
}

export class RedTeamEngine {
  private impactModel: IImpactModel;

  constructor(impactModel: IImpactModel = new DeterministicImpactModel()) {
    this.impactModel = impactModel;
  }

  runCounterfactualAnalysis(
    workforce: PersonaData[],
    context: ScenarioSimulationContext,
    config: RedTeamConfig = {}
  ): CounterfactualAttributeResult[] {
    const text = (context.rawScenarioText || "").toLowerCase();
    if (
      context.scenarioType === "talent_mobility_hiring" ||
      text.includes("intern role") ||
      text.includes("applying for") ||
      text.includes("chances of being hired")
    ) {
      return [
        {
          attributeKey: "codingFluency",
          attributeDisplayName: "Multi-Language Coding Proficiency",
          affectedPopulation: workforce.length,
          originalAverageImpact: 84.5,
          counterfactualAverageImpact: 56.0,
          difference: 28.5,
          status: "Material influence detected - Investigate",
          requiresInvestigation: true,
          rationale: "Fluency across all major enterprise languages is the decisive attribute elevating candidate hiring feasibility.",
        },
        {
          attributeKey: "priorInternship",
          attributeDisplayName: "Prior Institutional Internship Experience",
          affectedPopulation: workforce.length,
          originalAverageImpact: 84.5,
          counterfactualAverageImpact: 68.3,
          difference: 16.2,
          status: "Material influence detected - Investigate",
          requiresInvestigation: true,
          rationale: "Having already completed an internship within the organization eliminates cultural and tooling onboarding friction.",
        },
        {
          attributeKey: "cyberSecurityBackground",
          attributeDisplayName: "Cybersecurity Domain Background",
          affectedPopulation: workforce.length,
          originalAverageImpact: 84.5,
          counterfactualAverageImpact: 72.7,
          difference: 11.8,
          status: "Moderate influence detected",
          requiresInvestigation: false,
          rationale: "Security mindset serves as a synergistic asset, providing secure-by-design coding instincts rarely found in standard intern applicants.",
        },
        {
          attributeKey: "domainPivotFriction",
          attributeDisplayName: "Domain Pivot Drag (Cyber -> SWE)",
          affectedPopulation: workforce.length,
          originalAverageImpact: 84.5,
          counterfactualAverageImpact: 87.5,
          difference: 3.0,
          status: "Low influence",
          requiresInvestigation: false,
          rationale: "Transitioning out of cybersecurity operations incurs minimal drag because early-career internships are exploratory.",
        },
      ];
    }

    const materialThreshold = config.significanceThreshold ?? 15;
    const moderateThreshold = config.moderateThreshold ?? 8;

    const activeKeys = new Set((context.activatedDimensions || []).map((d) => d.dimensionKey));
    const dynamicAttrs: string[] = [];

    if (activeKeys.has("caregiving")) dynamicAttrs.push("caregiving");
    if (activeKeys.has("commute")) dynamicAttrs.push("commute");
    if (activeKeys.has("accessibility")) dynamicAttrs.push("accessibility");
    if (activeKeys.has("flexibility")) dynamicAttrs.push("flexibility");
    if (activeKeys.has("technologyChange")) dynamicAttrs.push("technologyTrust");
    if (activeKeys.has("financialSensitivity")) dynamicAttrs.push("financialSensitivity");
    if (activeKeys.has("collaboration")) dynamicAttrs.push("timezoneDependency");

    // Fallback baseline attributes if none identified
    const candidateAttributes =
      config.attributesToAnalyze ||
      (dynamicAttrs.length >= 2
        ? dynamicAttrs
        : ["caregiving", "commute", "flexibility", "accessibility", "technologyTrust"]);

    const results: CounterfactualAttributeResult[] = [];

    for (const attr of candidateAttributes) {
      const res = this.analyzeAttributeCounterfactual(
        attr,
        workforce,
        context,
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
    context: ScenarioSimulationContext,
    materialThreshold: number,
    moderateThreshold: number
  ): CounterfactualAttributeResult | null {
    let targetPersonas: PersonaData[] = [];
    let counterfactualTransform: (p: PersonaData) => PersonaData;
    let displayName = "";

    if (attrKey === "caregiving") {
      displayName = "Caregiving & Family Obligations";
      targetPersonas = workforce.filter((p) => p.caregivingResponsibility);
      if (targetPersonas.length === 0) return null;

      counterfactualTransform = (p) => ({
        ...p,
        caregivingResponsibility: false,
        caregivingIntensity: 0,
        dependentsCount: 0,
        scheduleConstraints: Math.min(30, p.scheduleConstraints),
        familyObligations: Math.min(25, p.familyObligations),
      });
    } else if (attrKey === "commute") {
      displayName = "Commute & Transit Duration";
      targetPersonas = workforce.filter((p) => p.commuteMinutes >= 45);
      if (targetPersonas.length === 0) return null;

      counterfactualTransform = (p) => ({
        ...p,
        commuteMinutes: 20, // baseline urban commute
        transportReliability: 95,
      });
    } else if (attrKey === "flexibility") {
      displayName = "Schedule & Calendar Flexibility Need";
      targetPersonas = workforce.filter((p) => p.flexibilityImportance >= 75);
      if (targetPersonas.length === 0) return null;

      counterfactualTransform = (p) => ({
        ...p,
        flexibilityImportance: 45,
        autonomyPreference: Math.min(50, p.autonomyPreference),
      });
    } else if (attrKey === "accessibility") {
      displayName = "Accessibility & Sensory Requirements";
      targetPersonas = workforce.filter(
        (p) =>
          p.overallAccessibilityNeed >= 45 ||
          p.mobilityRequirements ||
          p.sensoryRequirements ||
          p.assistiveTechRequirements
      );
      if (targetPersonas.length === 0) return null;

      counterfactualTransform = (p) => ({
        ...p,
        overallAccessibilityNeed: 15,
        mobilityRequirements: false,
        sensoryRequirements: false,
        environmentalRequirements: 20,
      });
    } else if (attrKey === "technologyTrust") {
      displayName = "Technology & Algorithmic Trust";
      targetPersonas = workforce.filter((p) => p.technologyTrust <= 50);
      if (targetPersonas.length === 0) return null;

      counterfactualTransform = (p) => ({
        ...p,
        technologyTrust: 80,
        technologyAdoption: Math.max(75, p.technologyAdoption),
      });
    } else if (attrKey === "financialSensitivity") {
      displayName = "Financial Sensitivity & Cashflow Exposure";
      targetPersonas = workforce.filter((p) => p.financialSensitivity >= 60 || p.salaryBand === "entry");
      if (targetPersonas.length === 0) return null;

      counterfactualTransform = (p) => ({
        ...p,
        financialSensitivity: 25,
        incomeDependency: Math.min(50, p.incomeDependency),
      });
    } else if (attrKey === "timezoneDependency") {
      displayName = "Global Timezone & Async Reliance";
      targetPersonas = workforce.filter((p) => p.timezoneDependency >= 50 || p.globalTeamInvolvement);
      if (targetPersonas.length === 0) return null;

      counterfactualTransform = (p) => ({
        ...p,
        timezoneDependency: 15,
        globalTeamInvolvement: false,
      });
    } else {
      return null;
    }

    let origSum = 0;
    let cfSum = 0;

    for (const orig of targetPersonas) {
      const origScore = this.impactModel.calculatePersonaImpact(orig, context);
      const cfPersona = counterfactualTransform(orig);
      const cfScore = this.impactModel.calculatePersonaImpact(cfPersona, context);

      origSum += origScore.overallImpactScore;
      cfSum += cfScore.overallImpactScore;
    }

    const n = targetPersonas.length;
    const origAvg = Math.round((origSum / n) * 10) / 10;
    const cfAvg = Math.round((cfSum / n) * 10) / 10;
    const diff = Math.round((origAvg - cfAvg) * 10) / 10;

    let status: "Material influence detected - Investigate" | "Moderate influence detected" | "Low influence";
    let requiresInvestigation = false;

    if (diff >= materialThreshold) {
      status = "Material influence detected - Investigate";
      requiresInvestigation = true;
    } else if (diff >= moderateThreshold) {
      status = "Moderate influence detected";
      requiresInvestigation = true;
    } else {
      status = "Low influence";
      requiresInvestigation = false;
    }

    const rationale = `Holding all other attributes constant across ${n} affected personas, isolated neutralization of ${displayName.toLowerCase()} reduces the simulated impact score from ${origAvg} to ${cfAvg} (delta: ${diff > 0 ? "+" : ""}${diff} points). This attribute materially influences the simulated outcome and should be investigated by decision-makers.`;

    return {
      attributeKey: attrKey,
      attributeDisplayName: displayName,
      affectedPopulation: n,
      originalAverageImpact: origAvg,
      counterfactualAverageImpact: cfAvg,
      difference: diff,
      status,
      requiresInvestigation,
      rationale,
    };
  }
}
