using { sap.simulynx as db } from '../db/schema';

service SimulynxService @(path: '/odata/v4/simulynx') {

  @readonly entity Personas as projection on db.Personas;
  entity Scenarios as projection on db.Scenarios;
  entity ScenarioDimensions as projection on db.ScenarioDimensions;
  entity Cohorts as projection on db.Cohorts;
  entity CohortMembers as projection on db.CohortMembers;
  entity Simulations as projection on db.Simulations;
  entity SimulationResults as projection on db.SimulationResults;
  entity CounterfactualResults as projection on db.CounterfactualResults;

  // Custom complex types
  type CohortSummary {
    name                 : String;
    cohortKey            : String;
    population           : Integer;
    averageImpact        : Decimal(5,2);
    riskLevel            : String;
  }

  type SensitiveAttributeSummary {
    attribute            : String;
    displayName          : String;
    difference           : Decimal(5,2);
    status               : String;
    requiresInvestigation: Boolean;
  }

  type RecentSimulationItem {
    ID                   : UUID;
    scenarioTitle        : String;
    scenarioType         : String;
    runAt                : Timestamp;
    overallImpactScore   : Decimal(5,2);
    affectedPercentage   : Decimal(5,2);
  }

  type DashboardOverview {
    totalWorkforce       : Integer;
    scenariosSimulated   : Integer;
    latestScenarioTitle  : String;
    latestScenarioId     : UUID;
    latestSimulationId   : UUID;
    overallImpact        : Decimal(5,2);
    affectedPercentage   : Decimal(5,2);
    topCohorts           : array of CohortSummary;
    sensitiveAttributes  : array of SensitiveAttributeSummary;
    recentSimulations    : array of RecentSimulationItem;
  }

  type ScenarioChange {
    attribute            : String;
    beforeValue          : String;
    afterValue           : String;
  }

  type DimensionSummary {
    dimensionKey         : String;
    dimensionName        : String;
    sensitivityWeight    : Decimal(5,2);
    rationale            : String;
    mappedAttributes     : String;
  }

  type ScenarioAnalysisResponse {
    scenarioId           : UUID;
    scenarioType         : String;
    title                : String;
    description          : String;
    rawScenarioText      : LargeString;
    changes              : array of ScenarioChange;
    affectedDimensions   : array of DimensionSummary;
  }

  type SimulationSummary {
    simulationId         : UUID;
    scenarioId           : UUID;
    scenarioTitle        : String;
    scenarioType         : String;
    runAt                : Timestamp;
    totalPersonas        : Integer;
    overallImpactScore   : Decimal(5,2);
    affectedPercentage   : Decimal(5,2);
    highImpactCount      : Integer;
    mediumImpactCount    : Integer;
    lowImpactCount       : Integer;
    avgFlexibility       : Decimal(5,2);
    avgAccessibility     : Decimal(5,2);
    avgWellbeing         : Decimal(5,2);
    avgAdoption          : Decimal(5,2);
    avgRetentionRisk     : Decimal(5,2);
    executiveSummary     : LargeString;
    keyFindings          : LargeString;
    questionsForReview   : LargeString;
  }

  type CounterfactualResultItem {
    attributeKey         : String;
    attributeDisplayName : String;
    originalAverageImpact: Decimal(5,2);
    counterfactualAverageImpact: Decimal(5,2);
    difference           : Decimal(5,2);
    status               : String;
    requiresInvestigation: Boolean;
    rationale            : LargeString;
  }

  type WorkforceGenResponse {
    count                : Integer;
    message              : String;
  }

  type SeedResponse {
    message              : String;
    personaCount         : Integer;
    scenarioCount        : Integer;
    simulationCount      : Integer;
  }

  // Functions & Actions
  function getDashboardOverview() returns DashboardOverview;
  
  action analyzeScenario(
    scenarioText: LargeString
  ) returns ScenarioAnalysisResponse;

  action createAndSimulateScenario(
    title: String,
    rawScenarioText: LargeString
  ) returns SimulationSummary;

  action runSimulation(
    scenarioId: UUID
  ) returns SimulationSummary;

  action runCounterfactual(
    simulationId: UUID,
    attributes: array of String
  ) returns array of CounterfactualResultItem;

  action generateSyntheticWorkforce(
    count: Integer
  ) returns WorkforceGenResponse;

  action seedDemoData() returns SeedResponse;
}
