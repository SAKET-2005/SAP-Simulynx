namespace sap.simulynx;

using { cuid, managed } from '@sap/cds/common';

/**
 * Universal Digital Persona Model
 * Reusable, scenario-agnostic synthetic digital workforce.
 */
entity Personas : cuid, managed {
  externalId                 : String(50);
  name                       : String(100);
  avatarGlyph                : String(50);

  // 1. IDENTITY
  age                        : Integer;
  location                   : String(100);
  locationCity               : String(100);
  education                  : String(100);
  lifeStage                  : String(50); // early-career, establishing, family-with-young-children, mature-family, empty-nester, senior

  // 2. PROFESSIONAL
  role                       : String(100);
  department                 : String(100);
  seniority                  : String(50); // associate, specialist, senior, lead, director, executive
  employmentType             : String(50); // full-time, part-time, contractor
  experienceYears            : Integer;
  skills                     : String(1000);

  // 3. WORK STYLE (0 - 100)
  remotePreference           : Integer;
  officePreference           : Integer;
  collaborationPreference    : Integer;
  autonomyPreference         : Integer;
  asyncPreference            : Integer;
  meetingTolerance           : Integer;

  // 4. LIFE CONTEXT
  caregivingResponsibility   : Boolean;
  caregivingIntensity        : Integer; // 0-100
  dependentsCount            : Integer;
  scheduleConstraints        : Integer; // 0-100
  familyObligations          : Integer; // 0-100

  // 5. LOGISTICS
  commuteMinutes             : Integer; // 10 - 120
  transportationMode         : String(50); // public_transit, car, cycling, walking, mixed
  transportReliability       : Integer; // 0-100
  relocationWillingness      : Integer; // 0-100

  // 6. PRIORITIES (0 - 100)
  compensationImportance     : Integer;
  careerGrowthImportance     : Integer;
  learningImportance         : Integer;
  jobSecurityImportance      : Integer;
  flexibilityImportance      : Integer;
  workLifeBalanceImportance  : Integer;
  recognitionImportance      : Integer;
  autonomyImportance         : Integer;

  // 7. BEHAVIOR (0 - 100)
  changeTolerance            : Integer;
  technologyAdoption         : Integer;
  learningOrientation        : Integer;
  riskTolerance              : Integer;
  technologyTrust            : Integer;

  // 8. FINANCIAL
  salaryBand                 : String(50); // entry, mid, senior, executive
  financialSensitivity       : Integer; // 0-100
  incomeDependency           : Integer; // 0-100

  // 9. COLLABORATION
  teamSize                   : Integer;
  globalTeamInvolvement      : Boolean;
  timezoneDependency         : Integer; // 0-100
  clientInteraction          : Integer; // 0-100
  crossFunctionalDependency  : Integer; // 0-100

  // 10. ACCESSIBILITY
  mobilityRequirements       : Boolean;
  sensoryRequirements        : Boolean;
  assistiveTechRequirements  : Boolean;
  environmentalRequirements  : Integer; // 0-100
  overallAccessibilityNeed   : Integer; // 0-100

  // Narrative summary
  personalitySummary         : String(1000);
  primaryConcerns            : String(1000);

  // Associations
  simulationResults          : Composition of many SimulationResults on simulationResults.persona = $self;
  cohortMembers              : Composition of many CohortMembers on cohortMembers.persona = $self;
}

/**
 * Organizational Scenarios
 */
entity Scenarios : cuid, managed {
  title                      : String(255);
  description                : LargeString;
  rawScenarioText            : LargeString;
  scenarioType               : String(100); // work_model_change, office_relocation, ai_tool_introduction, performance_monitoring, schedule_change
  changesJson                : LargeString; // structured changes: [{attribute, before, after}]
  status                     : String(50); // DRAFT, ANALYZED, SIMULATED
  isBaseline                 : Boolean default false;

  // Associations
  dimensions                 : Composition of many ScenarioDimensions on dimensions.scenario = $self;
  simulations                : Composition of many Simulations on simulations.scenario = $self;
  cohorts                    : Composition of many Cohorts on cohorts.scenario = $self;
}

/**
 * Scenario Dimensions activated by Ontology
 */
entity ScenarioDimensions : cuid {
  scenario                   : Association to Scenarios;
  dimensionKey               : String(100);
  dimensionName              : String(150);
  sensitivityWeight          : Decimal(5,2);
  rationale                  : String(500);
  mappedAttributes           : String(500);
}

/**
 * Dynamic Cohorts (scenario-activated, overlapping groups)
 */
entity Cohorts : cuid {
  scenario                   : Association to Scenarios;
  simulation                 : Association to Simulations;
  cohortKey                  : String(100);
  name                       : String(150);
  description                : String(500);
  criteriaDescription        : String(500);
  populationCount            : Integer;
  populationPercentage       : Decimal(5,2);
  averageImpact              : Decimal(5,2);
  riskLevel                  : String(50); // LOW, MEDIUM, HIGH, CRITICAL

  members                    : Composition of many CohortMembers on members.cohort = $self;
}

/**
 * Cohort Members (junction table linking Personas to Cohorts)
 */
entity CohortMembers : cuid {
  cohort                     : Association to Cohorts;
  persona                    : Association to Personas;
  matchScore                 : Decimal(5,2);
  contributingFactors        : String(500);
}

/**
 * Simulation Run Records
 */
entity Simulations : cuid, managed {
  scenario                   : Association to Scenarios;
  runAt                      : Timestamp;
  totalPersonas              : Integer;
  overallImpactScore         : Decimal(5,2);
  affectedPercentage         : Decimal(5,2);
  highImpactCount            : Integer;
  mediumImpactCount          : Integer;
  lowImpactCount             : Integer;
  avgFlexibilityScore        : Decimal(5,2);
  avgAccessibilityScore      : Decimal(5,2);
  avgWellbeingScore          : Decimal(5,2);
  avgAdoptionScore           : Decimal(5,2);
  avgRetentionRiskScore      : Decimal(5,2);
  status                     : String(50); // COMPLETED, FAILED
  aiExecutiveSummary         : LargeString;
  aiKeyFindings              : LargeString;
  aiQuestionsForReview       : LargeString;

  results                    : Composition of many SimulationResults on results.simulation = $self;
  counterfactuals            : Composition of many CounterfactualResults on counterfactuals.simulation = $self;
  cohorts                    : Composition of many Cohorts on cohorts.simulation = $self;
}

/**
 * Individual Simulation Results per Persona
 */
entity SimulationResults : cuid {
  simulation                 : Association to Simulations;
  persona                    : Association to Personas;
  overallImpactScore         : Decimal(5,2);
  flexibilityScore           : Decimal(5,2);
  accessibilityScore         : Decimal(5,2);
  wellbeingScore             : Decimal(5,2);
  adoptionScore              : Decimal(5,2);
  retentionRiskScore         : Decimal(5,2);
  reaction                   : String(50); // positive, neutral, concerned, critical
  primaryConcern             : String(500);
  simulatedThought           : String(500);
  explanationText            : LargeString;
  driversJson                : LargeString; // JSON array of top contributing drivers
}

/**
 * Counterfactual / Red-Team Engine Results
 */
entity CounterfactualResults : cuid {
  simulation                 : Association to Simulations;
  attributeKey               : String(100);
  attributeDisplayName       : String(150);
  originalAverageImpact      : Decimal(5,2);
  counterfactualAverageImpact: Decimal(5,2);
  difference                 : Decimal(5,2);
  status                     : String(100); // Material influence detected - Investigate, Moderate influence, Low influence
  requiresInvestigation      : Boolean;
  rationale                  : LargeString;
}
