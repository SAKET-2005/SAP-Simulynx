import { PersonaData } from "../persona-generator/types.js";
import { ActivatedDimension } from "../ontology/ontology.js";

export interface DynamicCohortDef {
  cohortKey: string;
  name: string;
  description: string;
  criteriaDescription: string;
  evaluator: (p: PersonaData) => { matches: boolean; score: number; factors: string };
  associatedDimension: string;
}

export interface GeneratedCohort {
  cohortKey: string;
  name: string;
  description: string;
  criteriaDescription: string;
  populationCount: number;
  populationPercentage: number;
  memberPersonas: {
    personaId?: string;
    externalId: string;
    name: string;
    matchScore: number;
    contributingFactors: string;
  }[];
}

const MASTER_COHORT_REGISTRY: DynamicCohortDef[] = [
  {
    cohortKey: "high_commute",
    name: "High Commute Burden",
    description: "Personas experiencing 50+ minutes of one-way transit or unreliable travel infrastructure.",
    criteriaDescription: "Commute >= 50 mins OR (Commute >= 40 mins AND Transit Reliability < 75%)",
    associatedDimension: "commute",
    evaluator: (p) => {
      const longCommute = p.commuteMinutes >= 50;
      const unreliableMid = p.commuteMinutes >= 40 && p.transportReliability < 75;
      const matches = longCommute || unreliableMid;
      const score = Math.min(100, Math.round((p.commuteMinutes / 90) * 80 + (100 - p.transportReliability) * 0.2));
      return {
        matches,
        score,
        factors: `Commute: ${p.commuteMinutes}m (${p.transportationMode}), Reliability: ${p.transportReliability}%`,
      };
    },
  },
  {
    cohortKey: "caregiving_constrained",
    name: "Caregiving Constrained",
    description: "Personas managing childcare, eldercare, or strict household dependent obligations.",
    criteriaDescription: "Caregiving Responsibility = TRUE OR Schedule Constraints >= 75%",
    associatedDimension: "caregiving",
    evaluator: (p) => {
      const matches = p.caregivingResponsibility || p.scheduleConstraints >= 75 || p.familyObligations >= 75;
      const score = Math.min(
        100,
        Math.round(
          (p.caregivingResponsibility ? 50 : 0) +
            p.caregivingIntensity * 0.3 +
            p.scheduleConstraints * 0.2
        )
      );
      return {
        matches,
        score,
        factors: `Caregiver: ${p.caregivingResponsibility ? "Yes" : "No"}, Dependents: ${p.dependentsCount}, Constraints: ${p.scheduleConstraints}%`,
      };
    },
  },
  {
    cohortKey: "high_flexibility_need",
    name: "High Flexibility Need",
    description: "Personas whose workflow and life routines rely heavily on schedule and location autonomy.",
    criteriaDescription: "Flexibility Importance >= 75% OR Autonomy Preference >= 75%",
    associatedDimension: "flexibility",
    evaluator: (p) => {
      const matches = p.flexibilityImportance >= 75 || p.autonomyPreference >= 75;
      const score = Math.round((p.flexibilityImportance + p.autonomyPreference) / 2);
      return {
        matches,
        score,
        factors: `Flexibility: ${p.flexibilityImportance}%, Autonomy: ${p.autonomyPreference}%`,
      };
    },
  },
  {
    cohortKey: "remote_oriented",
    name: "Remote-Oriented Profiles",
    description: "Personas configured for distributed async delivery with low relocation or campus willingness.",
    criteriaDescription: "Remote Preference >= 70% OR Relocation Willingness < 30%",
    associatedDimension: "commute",
    evaluator: (p) => {
      const matches = p.remotePreference >= 70 || p.relocationWillingness < 30;
      const score = Math.round(p.remotePreference * 0.7 + (100 - p.relocationWillingness) * 0.3);
      return {
        matches,
        score,
        factors: `Remote Preference: ${p.remotePreference}%, Relocation Willingness: ${p.relocationWillingness}%`,
      };
    },
  },
  {
    cohortKey: "accessibility_sensitive",
    name: "Accessibility-Sensitive Group",
    description: "Personas with mobility, sensory, assistive technology, or specialized environmental accommodations.",
    criteriaDescription: "Accessibility Need >= 60% OR Mobility/Sensory/Assistive Tech = TRUE",
    associatedDimension: "accessibility",
    evaluator: (p) => {
      const matches =
        p.overallAccessibilityNeed >= 60 ||
        p.mobilityRequirements ||
        p.sensoryRequirements ||
        p.assistiveTechRequirements;
      const score = p.overallAccessibilityNeed;
      const needs = [
        p.mobilityRequirements ? "Mobility" : null,
        p.sensoryRequirements ? "Sensory" : null,
        p.assistiveTechRequirements ? "Assistive Tech" : null,
      ]
        .filter(Boolean)
        .join(", ");
      return {
        matches,
        score,
        factors: `Accessibility Score: ${p.overallAccessibilityNeed}%, Accommodations: ${needs || "Environmental"}`,
      };
    },
  },
  {
    cohortKey: "sensory_acoustic_sensitive",
    name: "Sensory & Acoustic Sensitive",
    description: "Personas highly vulnerable to unassigned hot-desking, noise spikes, and unpredictable sensory environments.",
    criteriaDescription: "Sensory Requirements = TRUE OR Environmental Requirements >= 65%",
    associatedDimension: "accessibility",
    evaluator: (p) => {
      const matches = p.sensoryRequirements || p.environmentalRequirements >= 65;
      const score = Math.round((p.environmentalRequirements + (p.sensoryRequirements ? 30 : 0)) / 1.3);
      return {
        matches,
        score,
        factors: `Sensory Needs: ${p.sensoryRequirements ? "Yes" : "Standard"}, Environmental Need: ${p.environmentalRequirements}%`,
      };
    },
  },
  {
    cohortKey: "deep_work_focus",
    name: "Deep-Work & Autonomy Dependent",
    description: "Personas whose output relies on uninterrupted cognitive blocks and high asynchronous workflow.",
    criteriaDescription: "Autonomy Preference >= 75% AND Async Preference >= 70%",
    associatedDimension: "flexibility",
    evaluator: (p) => {
      const matches = p.autonomyPreference >= 75 && p.asyncPreference >= 70;
      const score = Math.round((p.autonomyPreference + p.asyncPreference) / 2);
      return {
        matches,
        score,
        factors: `Autonomy: ${p.autonomyPreference}%, Async Preference: ${p.asyncPreference}%`,
      };
    },
  },
  {
    cohortKey: "tech_change_cautious",
    name: "Technology & Change Cautious",
    description: "Personas with lower baseline change tolerance or higher job security concerns when tooling changes.",
    criteriaDescription: "Change Tolerance <= 45% OR Technology Trust <= 45% OR Job Security Importance >= 75%",
    associatedDimension: "technologyChange",
    evaluator: (p) => {
      const matches =
        p.changeTolerance <= 45 ||
        p.technologyTrust <= 45 ||
        (p.jobSecurityImportance >= 75 && p.technologyAdoption < 60);
      const score = Math.round(
        (100 - p.changeTolerance) * 0.4 +
          (100 - p.technologyTrust) * 0.3 +
          p.jobSecurityImportance * 0.3
      );
      return {
        matches,
        score,
        factors: `Change Tolerance: ${p.changeTolerance}%, Tech Trust: ${p.technologyTrust}%, Security: ${p.jobSecurityImportance}%`,
      };
    },
  },
  {
    cohortKey: "global_distributed",
    name: "Global & Cross-Timezone Dependent",
    description: "Personas whose primary collaboration takes place asynchronously across international timezones.",
    criteriaDescription: "Global Team Involvement = TRUE AND Timezone Dependency >= 60%",
    associatedDimension: "collaboration",
    evaluator: (p) => {
      const matches = p.globalTeamInvolvement && p.timezoneDependency >= 60;
      const score = p.timezoneDependency;
      return {
        matches,
        score,
        factors: `Global Team: Yes, Timezone Dependency: ${p.timezoneDependency}%`,
      };
    },
  },
  {
    cohortKey: "financial_sensitive",
    name: "Financial & Cost Sensitive",
    description: "Personas with higher sensitivity to unbudgeted transit, fuel, childcare, or location expenses.",
    criteriaDescription: "Financial Sensitivity >= 65% OR Salary Band = Entry",
    associatedDimension: "financialSensitivity",
    evaluator: (p) => {
      const matches = p.financialSensitivity >= 65 || p.salaryBand === "entry";
      const score = p.financialSensitivity;
      return {
        matches,
        score,
        factors: `Salary Band: ${p.salaryBand}, Financial Sensitivity: ${p.financialSensitivity}%`,
      };
    },
  },
];

/**
 * Dynamically builds cohorts for a scenario based on the activated dimensions
 */
export function generateDynamicCohorts(
  activatedDimensions: ActivatedDimension[],
  workforce: PersonaData[]
): GeneratedCohort[] {
  const activeKeys = new Set(activatedDimensions.map((d) => d.dimensionKey));

  // Filter cohort definitions whose dimension is active, or high-value baseline cohorts
  const candidateDefs = MASTER_COHORT_REGISTRY.filter(
    (def) => activeKeys.has(def.associatedDimension) || def.cohortKey === "high_flexibility_need"
  );

  const results: GeneratedCohort[] = [];
  const total = Math.max(1, workforce.length);

  for (const def of candidateDefs) {
    const matchingMembers: GeneratedCohort["memberPersonas"] = [];

    for (const persona of workforce) {
      const res = def.evaluator(persona);
      if (res.matches) {
        matchingMembers.push({
          personaId: persona.id,
          externalId: persona.externalId,
          name: persona.name,
          matchScore: res.score,
          contributingFactors: res.factors,
        });
      }
    }

    if (matchingMembers.length > 0) {
      results.push({
        cohortKey: def.cohortKey,
        name: def.name,
        description: def.description,
        criteriaDescription: def.criteriaDescription,
        populationCount: matchingMembers.length,
        populationPercentage: Math.round((matchingMembers.length / total) * 1000) / 10,
        memberPersonas: matchingMembers,
      });
    }
  }

  return results;
}
