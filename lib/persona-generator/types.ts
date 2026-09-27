export type LifeStage =
  | "early-career"
  | "establishing"
  | "family-with-young-children"
  | "mature-family"
  | "empty-nester"
  | "senior";

export type SeniorityLevel =
  | "associate"
  | "specialist"
  | "senior"
  | "lead"
  | "director"
  | "executive";

export type EmploymentType = "full-time" | "part-time" | "contractor";

export type TransportationMode =
  | "public_transit"
  | "car"
  | "cycling"
  | "walking"
  | "mixed";

export type SalaryBand = "entry" | "mid" | "senior" | "executive";

export interface PersonaData {
  id?: string;
  externalId: string;
  name: string;
  avatarGlyph: string;

  // 1. IDENTITY
  age: number;
  location: string;
  locationCity: string;
  education: string;
  lifeStage: LifeStage;

  // 2. PROFESSIONAL
  role: string;
  department: string;
  seniority: SeniorityLevel;
  employmentType: EmploymentType;
  experienceYears: number;
  skills: string;

  // 3. WORK STYLE (0 - 100)
  remotePreference: number;
  officePreference: number;
  collaborationPreference: number;
  autonomyPreference: number;
  asyncPreference: number;
  meetingTolerance: number;

  // 4. LIFE CONTEXT
  caregivingResponsibility: boolean;
  caregivingIntensity: number; // 0-100
  dependentsCount: number;
  scheduleConstraints: number; // 0-100
  familyObligations: number; // 0-100

  // 5. LOGISTICS
  commuteMinutes: number;
  transportationMode: TransportationMode;
  transportReliability: number; // 0-100
  relocationWillingness: number; // 0-100

  // 6. PRIORITIES (0 - 100)
  compensationImportance: number;
  careerGrowthImportance: number;
  learningImportance: number;
  jobSecurityImportance: number;
  flexibilityImportance: number;
  workLifeBalanceImportance: number;
  recognitionImportance: number;
  autonomyImportance: number;

  // 7. BEHAVIOR (0 - 100)
  changeTolerance: number;
  technologyAdoption: number;
  learningOrientation: number;
  riskTolerance: number;
  technologyTrust: number;

  // 8. FINANCIAL
  salaryBand: SalaryBand;
  financialSensitivity: number; // 0-100
  incomeDependency: number; // 0-100

  // 9. COLLABORATION
  teamSize: number;
  globalTeamInvolvement: boolean;
  timezoneDependency: number; // 0-100
  clientInteraction: number; // 0-100
  crossFunctionalDependency: number; // 0-100

  // 10. ACCESSIBILITY
  mobilityRequirements: boolean;
  sensoryRequirements: boolean;
  assistiveTechRequirements: boolean;
  environmentalRequirements: number; // 0-100
  overallAccessibilityNeed: number; // 0-100

  // Summaries
  personalitySummary: string;
  primaryConcerns: string;
}
