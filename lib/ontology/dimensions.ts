export interface DimensionDefinition {
  dimensionKey: string;
  dimensionName: string;
  description: string;
  targetPersonaAttributes: string[];
  defaultSensitivity: number;
}

export const WORKFORCE_DIMENSIONS: Record<string, DimensionDefinition> = {
  commute: {
    dimensionKey: "commute",
    dimensionName: "Commute & Transit Burden",
    description: "Evaluates physical transit time, travel reliability, and geographic distance to office facilities.",
    targetPersonaAttributes: [
      "commuteMinutes",
      "transportReliability",
      "relocationWillingness",
      "transportationMode"
    ],
    defaultSensitivity: 0.85,
  },
  flexibility: {
    dimensionKey: "flexibility",
    dimensionName: "Schedule & Location Flexibility",
    description: "Evaluates the degree to which personas rely on calendar and location autonomy to deliver work.",
    targetPersonaAttributes: [
      "flexibilityImportance",
      "autonomyPreference",
      "asyncPreference",
      "scheduleConstraints"
    ],
    defaultSensitivity: 0.90,
  },
  caregiving: {
    dimensionKey: "caregiving",
    dimensionName: "Caregiving & Family Context",
    description: "Evaluates commitments to children, elderly relatives, and household dependencies that require daytime schedule elasticity.",
    targetPersonaAttributes: [
      "caregivingResponsibility",
      "caregivingIntensity",
      "dependentsCount",
      "scheduleConstraints",
      "familyObligations"
    ],
    defaultSensitivity: 0.95,
  },
  accessibility: {
    dimensionKey: "accessibility",
    dimensionName: "Accessibility & Ergonomic Accommodation",
    description: "Evaluates mobility, sensory thresholds, assistive technology reliance, and workplace physical environment accommodations.",
    targetPersonaAttributes: [
      "mobilityRequirements",
      "sensoryRequirements",
      "assistiveTechRequirements",
      "environmentalRequirements",
      "overallAccessibilityNeed"
    ],
    defaultSensitivity: 0.92,
  },
  workLifeBalance: {
    dimensionKey: "workLifeBalance",
    dimensionName: "Work-Life Integration & Wellbeing",
    description: "Evaluates recovery time, burnout vulnerability, and personal boundaries outside corporate obligations.",
    targetPersonaAttributes: [
      "workLifeBalanceImportance",
      "scheduleConstraints",
      "meetingTolerance"
    ],
    defaultSensitivity: 0.80,
  },
  technologyChange: {
    dimensionKey: "technologyChange",
    dimensionName: "Technology Adoption & Automation Trust",
    description: "Evaluates openness to automated tooling, trust in algorithmic systems, and fears regarding job security.",
    targetPersonaAttributes: [
      "technologyAdoption",
      "technologyTrust",
      "learningOrientation",
      "changeTolerance",
      "jobSecurityImportance"
    ],
    defaultSensitivity: 0.75,
  },
  collaboration: {
    dimensionKey: "collaboration",
    dimensionName: "Collaboration & Team Density",
    description: "Evaluates interaction frequency, in-person pairing utility, and friction with distributed or global cross-timezone teams.",
    targetPersonaAttributes: [
      "collaborationPreference",
      "crossFunctionalDependency",
      "meetingTolerance",
      "globalTeamInvolvement",
      "timezoneDependency"
    ],
    defaultSensitivity: 0.70,
  },
  financialSensitivity: {
    dimensionKey: "financialSensitivity",
    dimensionName: "Financial Sensitivity & Commute Cost",
    description: "Evaluates financial vulnerability, transport costs, and salary band exposure to uncompensated workplace changes.",
    targetPersonaAttributes: [
      "financialSensitivity",
      "salaryBand",
      "incomeDependency",
      "compensationImportance"
    ],
    defaultSensitivity: 0.65,
  }
};
