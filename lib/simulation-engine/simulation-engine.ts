import { PersonaData } from "../persona-generator/types.js";
import {
  IImpactModel,
  DeterministicImpactModel,
  PersonaSimulationScore,
  ScenarioSimulationContext,
} from "./impact-model.js";
import { GeneratedCohort } from "../cohort-engine/dynamic-cohorts.js";

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

export interface SimulationRunResult {
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
  cohortResults: SimulationCohortResult[];
  personaResults: PersonaSimulationScore[];
}

export class SimulationEngine {
  private impactModel: IImpactModel;

  constructor(impactModel: IImpactModel = new DeterministicImpactModel()) {
    this.impactModel = impactModel;
  }

  setImpactModel(model: IImpactModel) {
    this.impactModel = model;
  }

  runSimulation(
    workforce: PersonaData[],
    cohorts: GeneratedCohort[],
    context: ScenarioSimulationContext
  ): SimulationRunResult {
    const total = workforce.length;
    if (total === 0) {
      throw new Error("Cannot run simulation on empty workforce.");
    }

    // 1. Calculate impact for every persona deterministically
    const personaScores: PersonaSimulationScore[] = [];
    const scoreMap = new Map<string, PersonaSimulationScore>();

    for (const p of workforce) {
      const score = this.impactModel.calculatePersonaImpact(p, context);
      score.personaId = p.id;
      personaScores.push(score);
      scoreMap.set(p.externalId, score);
    }

    // 2. Aggregate overall metrics
    let sumImpact = 0;
    let sumFlex = 0;
    let sumAccess = 0;
    let sumWellbeing = 0;
    let sumAdoption = 0;
    let sumRetentionRisk = 0;

    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;
    let affectedCount = 0;

    for (const s of personaScores) {
      sumImpact += s.overallImpactScore;
      sumFlex += s.flexibilityScore;
      sumAccess += s.accessibilityScore;
      sumWellbeing += s.wellbeingScore;
      sumAdoption += s.adoptionScore;
      sumRetentionRisk += s.retentionRiskScore;

      if (s.overallImpactScore >= 65) {
        highCount++;
      } else if (s.overallImpactScore >= 40) {
        medCount++;
      } else {
        lowCount++;
      }

      if (s.overallImpactScore >= 40) {
        affectedCount++;
      }
    }

    const overallImpactScore = Math.round((sumImpact / total) * 10) / 10;
    const affectedPercentage = Math.round((affectedCount / total) * 1000) / 10;
    const avgFlexibilityScore = Math.round((sumFlex / total) * 10) / 10;
    const avgAccessibilityScore = Math.round((sumAccess / total) * 10) / 10;
    const avgWellbeingScore = Math.round((sumWellbeing / total) * 10) / 10;
    const avgAdoptionScore = Math.round((sumAdoption / total) * 10) / 10;
    const avgRetentionRiskScore = Math.round((sumRetentionRisk / total) * 10) / 10;

    // 3. Aggregate cohort metrics
    const cohortResults: SimulationCohortResult[] = [];

    for (const c of cohorts) {
      let cohortImpactSum = 0;
      const enrichedMembers = c.memberPersonas.map((m) => {
        const pScore = scoreMap.get(m.externalId);
        const impact = pScore ? pScore.overallImpactScore : 0;
        cohortImpactSum += impact;
        return {
          ...m,
          impactScore: impact,
        };
      });

      const avgImpact =
        c.populationCount > 0
          ? Math.round((cohortImpactSum / c.populationCount) * 10) / 10
          : 0;

      let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (avgImpact >= 65) riskLevel = "CRITICAL";
      else if (avgImpact >= 50) riskLevel = "HIGH";
      else if (avgImpact >= 35) riskLevel = "MEDIUM";

      cohortResults.push({
        cohortKey: c.cohortKey,
        name: c.name,
        description: c.description,
        criteriaDescription: c.criteriaDescription,
        populationCount: c.populationCount,
        populationPercentage: c.populationPercentage,
        averageImpact: avgImpact,
        riskLevel,
        members: enrichedMembers,
      });
    }

    // Sort cohorts by average impact descending
    cohortResults.sort((a, b) => b.averageImpact - a.averageImpact);

    return {
      totalPersonas: total,
      overallImpactScore,
      affectedPercentage,
      highImpactCount: highCount,
      mediumImpactCount: medCount,
      lowImpactCount: lowCount,
      avgFlexibilityScore,
      avgAccessibilityScore,
      avgWellbeingScore,
      avgAdoptionScore,
      avgRetentionRiskScore,
      cohortResults,
      personaResults: personaScores,
    };
  }
}
