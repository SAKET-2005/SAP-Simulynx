import { PersonaData } from "../persona-generator/types.js";
import { ScenarioChangeDef, ActivatedDimension, AttributePressure } from "../ontology/ontology.js";

export interface PersonaSimulationScore {
  personaId?: string;
  externalId: string;
  name: string;
  overallImpactScore: number; // 0 - 100
  flexibilityScore: number; // 0 - 100
  accessibilityScore: number; // 0 - 100
  wellbeingScore: number; // 0 - 100
  adoptionScore: number; // 0 - 100
  retentionRiskScore: number; // 0 - 100
  reaction: "positive" | "neutral" | "concerned" | "critical";
  primaryConcern: string;
  simulatedThought: string;
  explanationText: string;
  drivers: {
    attribute: string;
    influence: number;
    note: string;
  }[];
}

export interface ScenarioSimulationContext {
  scenarioType: string;
  changes: ScenarioChangeDef[];
  activatedDimensions: ActivatedDimension[];
  attributePressures?: AttributePressure[];
  rawScenarioText?: string;
}

export interface IImpactModel {
  name: string;
  version: string;
  calculatePersonaImpact(
    persona: PersonaData,
    context: ScenarioSimulationContext
  ): PersonaSimulationScore;
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

/**
 * Universal Deterministic Impact Model
 * Evaluates any scenario's attribute pressure vector against the 10-dimensional universal persona model.
 */
export class DeterministicImpactModel implements IImpactModel {
  name = "UniversalDeterministicSimulynxV2";
  version = "2.0.0";

  calculatePersonaImpact(
    p: PersonaData,
    context: ScenarioSimulationContext
  ): PersonaSimulationScore {
    const { scenarioType, changes, activatedDimensions, rawScenarioText } = context;
    const text = (rawScenarioText || "").toLowerCase();
    const activeDimKeys = new Set((activatedDimensions || []).map((d) => d.dimensionKey));

    // Extract potential office day parameters
    let oldOfficeDays = 2;
    let newOfficeDays = 5;
    let hasOfficeDayChange = false;

    for (const c of changes) {
      if (c.attribute.toLowerCase().includes("office") || c.attribute.toLowerCase().includes("day")) {
        oldOfficeDays = Number(c.beforeValue) || 2;
        newOfficeDays = Number(c.afterValue) || 5;
        hasOfficeDayChange = true;
      }
    }

    const deltaDays = Math.max(0, newOfficeDays - oldOfficeDays);
    const dayRatio = newOfficeDays / 5;
    const intensityCurve = Math.pow(dayRatio, 1.5);

    // Initialize dimensional friction components
    let commuteFriction = 0;
    let flexFriction = 0;
    let caregivingFriction = 0;
    let accessFriction = 0;
    let timezoneFriction = 0;
    let financialFriction = 0;
    let techFriction = 0;
    let collabLift = 0;

    const drivers: { attribute: string; influence: number; note: string }[] = [];

    // 1. Commute Friction
    if (activeDimKeys.has("commute")) {
      if (text.includes("4-day") || text.includes("four-day") || text.includes("compressed")) {
        // Commute is actually relieved by 20% under 4-day week
        commuteFriction = Math.max(0, (p.commuteMinutes / 90) * 25);
      } else if (text.includes("relocat") || text.includes("move")) {
        commuteFriction = clamp((p.commuteMinutes / 70) * 45 + (100 - p.transportReliability) * 0.25);
        if (p.commuteMinutes >= 45) {
          drivers.push({
            attribute: "Transit & Commute Duration",
            influence: Math.round(commuteFriction),
            note: `${p.commuteMinutes}m transit to relocated facility expands daily travel overhead.`,
          });
        }
      } else {
        const factor = (p.commuteMinutes / 90) * (hasOfficeDayChange ? deltaDays / 3 : 1.0);
        commuteFriction = clamp(factor * 45 + (100 - p.transportReliability) * 0.2);
        if (p.commuteMinutes >= 45 && commuteFriction >= 20) {
          drivers.push({
            attribute: "Commute Duration",
            influence: Math.round(commuteFriction),
            note: `${p.commuteMinutes}m transit time adds substantial travel overhead.`,
          });
        }
      }
    }

    // 2. Flexibility Friction
    if (activeDimKeys.has("flexibility")) {
      const flexWeight = (p.flexibilityImportance / 100) * 40;
      const schedWeight = (p.scheduleConstraints / 100) * 25;
      const autoWeight = (p.autonomyPreference / 100) * 20;
      flexFriction = clamp(flexWeight + schedWeight + autoWeight);

      if (p.flexibilityImportance >= 70 && flexFriction >= 25) {
        drivers.push({
          attribute: "Flexibility & Schedule Autonomy",
          influence: Math.round(flexFriction),
          note: `High reliance on calendar autonomy and personalized delivery windows.`,
        });
      }
    }

    // 3. Caregiving Friction
    if (activeDimKeys.has("caregiving")) {
      if (p.caregivingResponsibility) {
        const isTenHourShift = text.includes("10-hour") || text.includes("compressed") || text.includes("4-day");
        const shiftMultiplier = isTenHourShift ? 1.4 : 1.0;
        caregivingFriction = clamp(
          ((p.caregivingIntensity / 100) * 45 + (p.familyObligations / 100) * 25) * shiftMultiplier
        );

        drivers.push({
          attribute: "Caregiving & Family Obligations",
          influence: Math.round(caregivingFriction),
          note: isTenHourShift
            ? `10-hour daily shifts extend past standard daycare and school pickup hours.`
            : `Dependent obligations clash with fixed presence requirements.`,
        });
      }
    }

    // 4. Accessibility & Sensory Friction
    if (activeDimKeys.has("accessibility")) {
      const isHotDesking = text.includes("hot-desk") || text.includes("unassigned") || text.includes("desk-sharing");
      if (isHotDesking) {
        accessFriction = clamp(
          (p.overallAccessibilityNeed / 100) * 55 +
            (p.sensoryRequirements ? 25 : 0) +
            (p.environmentalRequirements / 100) * 20
        );
        if (p.overallAccessibilityNeed >= 40 || p.sensoryRequirements || p.mobilityRequirements) {
          drivers.push({
            attribute: "Ergonomic & Sensory Accommodation",
            influence: Math.round(accessFriction),
            note: `Unassigned hot-desking eliminates predictable ergonomic setups and acoustic quiet zones.`,
          });
        }
      } else {
        accessFriction = clamp(
          (p.overallAccessibilityNeed / 100) * intensityCurve * 45 +
            (p.environmentalRequirements / 100) * 20
        );
        if (p.overallAccessibilityNeed >= 50) {
          drivers.push({
            attribute: "Physical Campus & Sensory Load",
            influence: Math.round(accessFriction),
            note: `Daily physical transit and campus acoustics elevate fatigue.`,
          });
        }
      }
    }

    // 5. Timezone & Global Collaboration Friction
    if (activeDimKeys.has("collaboration") && (text.includes("timezone") || text.includes("pacific") || text.includes("core hours") || text.includes("global"))) {
      timezoneFriction = clamp(
        (p.timezoneDependency / 100) * (p.globalTeamInvolvement ? 50 : 20) +
          (p.familyObligations / 100) * 30
      );
      if (p.timezoneDependency >= 50) {
        drivers.push({
          attribute: "Timezone Alignment Strain",
          influence: Math.round(timezoneFriction),
          note: `Mandated non-local core hours conflict with local timezone rhythm and evening family time.`,
        });
      }
    }

    // 6. Financial Sensitivity Friction
    if (activeDimKeys.has("financialSensitivity")) {
      const bandFactor = p.salaryBand === "entry" ? 30 : p.salaryBand === "mid" ? 15 : 5;
      financialFriction = clamp((p.financialSensitivity / 100) * 55 + bandFactor);
      if (p.financialSensitivity >= 60) {
        drivers.push({
          attribute: "Financial Vulnerability",
          influence: Math.round(financialFriction),
          note: `Unbudgeted policy costs exert regressive pressure on cash flow.`,
        });
      }
    }

    // 7. Technology Adoption & Algorithmic Trust Friction
    if (activeDimKeys.has("technologyChange")) {
      const trustGap = 100 - p.technologyTrust;
      const adoptGap = 100 - p.technologyAdoption;
      const securityAnxiety = (p.jobSecurityImportance / 100) * 30;
      techFriction = clamp(trustGap * 0.35 + adoptGap * 0.35 + securityAnxiety);

      if (techFriction >= 25) {
        drivers.push({
          attribute: "Technology Trust & Change Drag",
          influence: Math.round(techFriction),
          note: `Concern over algorithmic reliability, surveillance, or task disruption.`,
        });
      }
    }

    // Collaboration Lift (Positive counterbalance for pro-office / pro-pairing staff)
    if (hasOfficeDayChange && deltaDays > 0) {
      collabLift = clamp((p.collaborationPreference / 100) * (p.officePreference / 100) * 25);
    }

    // Weighted Overall Impact
    const activeWeightsSum =
      (commuteFriction > 0 ? 0.3 : 0) +
      (flexFriction > 0 ? 0.3 : 0) +
      (caregivingFriction > 0 ? 0.3 : 0) +
      (accessFriction > 0 ? 0.3 : 0) +
      (timezoneFriction > 0 ? 0.35 : 0) +
      (financialFriction > 0 ? 0.35 : 0) +
      (techFriction > 0 ? 0.35 : 0) || 1.0;

    const rawImpact =
      commuteFriction * 0.3 +
      flexFriction * 0.28 +
      caregivingFriction * 0.28 +
      accessFriction * 0.25 +
      timezoneFriction * 0.3 +
      financialFriction * 0.3 +
      techFriction * 0.3 -
      collabLift * 0.15;

    const normalizedImpact = clamp((rawImpact / activeWeightsSum) * 1.05);

    // Sub-Indices
    const flexibilityScore = clamp(100 - flexFriction * 1.1 + (100 - p.remotePreference) * 0.1);
    const accessibilityScore = clamp(100 - accessFriction * 1.15);
    const wellbeingScore = clamp(
      95 -
        commuteFriction * 0.35 -
        flexFriction * 0.25 -
        caregivingFriction * 0.3 -
        timezoneFriction * 0.3 +
        collabLift * 0.15
    );
    const adoptionScore = clamp(
      flexibilityScore * 0.25 +
        wellbeingScore * 0.25 +
        accessibilityScore * 0.2 +
        (100 - normalizedImpact) * 0.2 +
        p.changeTolerance * 0.1
    );
    const retentionRiskScore = clamp(
      normalizedImpact * 0.65 +
        (100 - adoptionScore) * 0.35 +
        (financialFriction > 40 ? 15 : 0)
    );

    // Determine Persona Reaction
    let reaction: "positive" | "neutral" | "concerned" | "critical" = "neutral";
    if (normalizedImpact >= 65 || retentionRiskScore >= 65) {
      reaction = normalizedImpact >= 80 ? "critical" : "concerned";
    } else if (adoptionScore >= 70 && normalizedImpact < 35) {
      reaction = "positive";
    }

    // Synthesize human persona thought and explanation
    const simulatedThought = synthesizeThoughtUniversal(p, reaction, drivers, text);
    const primaryConcern = drivers.length > 0 ? drivers[0].note : "Balancing day-to-day workflow adaptation";
    const explanationText = `${p.name} (${p.seniority} ${p.role}, ${p.department}) shows a Simulated Impact score of ${normalizedImpact}/100 [${reaction.toUpperCase()}]. Key drivers include: ${drivers.map((d) => d.attribute).join(", ") || "baseline operational change"}.`;

    return {
      externalId: p.externalId,
      name: p.name,
      overallImpactScore: normalizedImpact,
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
}

function synthesizeThoughtUniversal(
  p: PersonaData,
  reaction: string,
  drivers: { attribute: string; influence: number; note: string }[],
  scenarioText: string
): string {
  if (reaction === "critical" || reaction === "concerned") {
    if (scenarioText.includes("hot-desk") && (p.overallAccessibilityNeed > 40 || p.sensoryRequirements)) {
      return `Losing a fixed desk makes managing sensory noise and ergonomic posture much harder every day.`;
    }
    if ((scenarioText.includes("10-hour") || scenarioText.includes("4-day")) && p.caregivingResponsibility) {
      return `A 10-hour daily shift makes nursery and school pickup virtually impossible without outside help.`;
    }
    if (scenarioText.includes("timezone") || scenarioText.includes("pacific")) {
      return `Late evening mandatory calls directly collide with family dinner and parenting routines.`;
    }
    if (p.caregivingResponsibility && p.commuteMinutes > 40) {
      return `Between ${p.commuteMinutes}m transit and picking up my ${p.dependentsCount} kids, this rigid schedule creates severe friction.`;
    }
    if (p.commuteMinutes > 55) {
      return `The transit hours required by this change add substantial weekly overhead without clear pairing benefit.`;
    }
    return `This policy conflicts directly with the autonomous scheduling I rely on for focused delivery.`;
  }
  if (reaction === "positive") {
    if (scenarioText.includes("4-day")) {
      return `A 3-day weekend gives me sustained recovery time, and I save on one weekly transit day!`;
    }
    if (p.collaborationPreference > 70) {
      return `Closer alignment and spontaneous co-location should accelerate team problem-solving.`;
    }
    return `I can adapt smoothly and look forward to greater operational alignment.`;
  }
  return `I want to understand what accommodations and flexibility windows will be available under this change.`;
}
