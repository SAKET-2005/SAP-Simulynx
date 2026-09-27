import { PersonaData } from "../persona-generator/types.js";
import { UniversalScenarioIR, PersonaSimulationScore, PersonaImpactDriver } from "../universal-scenario/types.js";

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

/**
 * Universal Deterministic Impact Model
 * 
 * Scenario-agnostic mathematical scoring engine.
 * Computes individual simulated impact, friction components, sub-indices,
 * and transparent driver contributions directly from the UniversalScenarioIR attribute pressures.
 * 
 * ZERO scenario-specific code paths.
 */
export class UniversalDeterministicImpactModel {
  name = "UniversalDeterministicImpactModelV3";
  version = "3.0.0";

  calculatePersonaImpact(
    p: PersonaData,
    ir: UniversalScenarioIR
  ): PersonaSimulationScore {
    const drivers: PersonaImpactDriver[] = [];
    const pressures = ir.attributePressures || [];
    const activeDimensions = ir.affectedDimensions || [];

    let totalFriction = 0;
    let totalRelief = 0;
    let frictionCount = 0;

    let flexFriction = 0;
    let accessFriction = 0;
    let commuteFriction = 0;
    let techFriction = 0;

    // Evaluate each attribute pressure against the persona's 10 dimensions
    for (const pr of pressures) {
      const personaFactor = this.resolvePersonaFactor(p, pr.attributeName);
      const componentScore = clamp(pr.intensity * pr.sensitivityWeight * personaFactor * 100);

      if (pr.direction === "increase_friction") {
        totalFriction += componentScore;
        frictionCount++;

        // Track dimension-specific friction for sub-indices
        if (pr.dimensionKey === "flexibility") flexFriction = Math.max(flexFriction, componentScore);
        if (pr.dimensionKey === "accessibility") accessFriction = Math.max(accessFriction, componentScore);
        if (pr.dimensionKey === "commute") commuteFriction = Math.max(commuteFriction, componentScore);
        if (pr.dimensionKey === "technologyChange") techFriction = Math.max(techFriction, componentScore);

        if (componentScore >= 20) {
          drivers.push({
            attribute: this.formatAttributeName(pr.attributeName),
            influence: componentScore,
            note: pr.rationale,
          });
        }
      } else {
        totalRelief += componentScore;
        if (componentScore >= 20) {
          drivers.push({
            attribute: `${this.formatAttributeName(pr.attributeName)} (Relief)`,
            influence: -componentScore,
            note: pr.rationale,
          });
        }
      }
    }

    // Mathematical aggregation across active dimensions
    const divisor = Math.max(1, activeDimensions.length);
    const rawFriction = totalFriction / divisor;
    const netImpact = Math.max(0, rawFriction - (totalRelief / divisor) * 0.4);
    const overallImpactScore = clamp(netImpact);

    // Transparent Sub-indices
    const flexibilityScore = clamp(100 - flexFriction * 1.1 + (100 - p.remotePreference) * 0.05);
    const accessibilityScore = clamp(100 - accessFriction * 1.2);
    const wellbeingScore = clamp(95 - overallImpactScore * 0.45 - (commuteFriction > 40 ? 10 : 0));
    const adoptionScore = clamp(
      (100 - overallImpactScore) * 0.5 +
        p.changeTolerance * 0.25 +
        p.technologyAdoption * 0.25
    );
    const retentionRiskScore = clamp(
      overallImpactScore * 0.65 +
        (100 - adoptionScore) * 0.35 +
        (p.jobSecurityImportance > 75 ? 10 : 0)
    );

    // Determine Persona Reaction Status based strictly on deterministic thresholds
    let reaction: "positive" | "neutral" | "concerned" | "critical" = "neutral";
    if (overallImpactScore >= 70 || retentionRiskScore >= 70) {
      reaction = overallImpactScore >= 80 ? "critical" : "concerned";
    } else if (overallImpactScore < 30 && adoptionScore >= 70) {
      reaction = "positive";
    }

    // Sort drivers by descending mathematical influence
    drivers.sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence));

    const primaryConcern = drivers.length > 0 ? drivers[0].note : "General baseline workflow adaptation";
    const simulatedThought = this.synthesizePersonaThought(p, reaction, drivers);
    const explanationText = `${p.name} (${p.seniority} ${p.role}, ${p.department}): Simulated Impact ${overallImpactScore}/100 [${reaction.toUpperCase()}]. Top drivers: ${drivers.slice(0, 2).map((d) => `${d.attribute} (+${d.influence}pts)`).join(", ") || "baseline operational change"}.`;

    return {
      externalId: p.externalId,
      name: p.name,
      overallImpactScore,
      flexibilityScore,
      accessibilityScore,
      wellbeingScore,
      adoptionScore,
      retentionRiskScore,
      reaction,
      primaryConcern,
      simulatedThought,
      explanationText,
      drivers,
    };
  }

  /**
   * Resolves the quantitative magnitude (0.0 to 1.0) of a persona's attribute.
   */
  private resolvePersonaFactor(p: PersonaData, attrName: string): number {
    switch (attrName) {
      case "commuteMinutes":
        return Math.min(1.0, p.commuteMinutes / 90);
      case "transportReliability":
        return (100 - p.transportReliability) / 100;
      case "relocationWillingness":
        return (100 - p.relocationWillingness) / 100;
      case "caregivingResponsibility":
        return p.caregivingResponsibility ? Math.max(0.6, p.caregivingIntensity / 100) : 0.05;
      case "caregivingIntensity":
        return p.caregivingIntensity / 100;
      case "familyObligations":
        return p.familyObligations / 100;
      case "flexibilityImportance":
        return p.flexibilityImportance / 100;
      case "autonomyPreference":
        return p.autonomyPreference / 100;
      case "asyncPreference":
        return p.asyncPreference / 100;
      case "scheduleConstraints":
        return p.scheduleConstraints / 100;
      case "overallAccessibilityNeed":
        return p.overallAccessibilityNeed / 100;
      case "sensoryRequirements":
        return p.sensoryRequirements ? 0.95 : 0.05;
      case "mobilityRequirements":
        return p.mobilityRequirements ? 0.95 : 0.05;
      case "financialSensitivity":
        return p.financialSensitivity / 100;
      case "incomeDependency":
        return p.incomeDependency / 100;
      case "technologyTrust":
        return (100 - p.technologyTrust) / 100;
      case "technologyAdoption":
        return (100 - p.technologyAdoption) / 100;
      case "learningOrientation":
        return p.learningOrientation / 100;
      case "changeTolerance":
        return (100 - p.changeTolerance) / 100;
      case "jobSecurityImportance":
        return p.jobSecurityImportance / 100;
      case "timezoneDependency":
        return p.timezoneDependency / 100;
      case "meetingTolerance":
        return (100 - p.meetingTolerance) / 100;
      case "collaborationPreference":
        return p.collaborationPreference / 100;
      default:
        return 0.5;
    }
  }

  private formatAttributeName(attrName: string): string {
    return attrName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private synthesizePersonaThought(
    p: PersonaData,
    reaction: string,
    drivers: PersonaImpactDriver[]
  ): string {
    if (reaction === "critical" || reaction === "concerned") {
      if (drivers.length > 0) {
        return `This change conflicts with my ${drivers[0].attribute.toLowerCase()}, creating noticeable day-to-day friction.`;
      }
      return `This policy introduces structural constraints that conflict with my existing work-life arrangement.`;
    }
    if (reaction === "positive") {
      return `This change aligns well with my workflow preferences and should support effective collaboration.`;
    }
    return `I am monitoring how practical flexibility accommodations will be implemented before forming a view.`;
  }
}
