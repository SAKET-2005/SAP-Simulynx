import { WORKFORCE_DIMENSIONS, DimensionDefinition } from "./dimensions.js";

export interface ScenarioChangeDef {
  attribute: string;
  beforeValue: string | number;
  afterValue: string | number;
}

export interface ActivatedDimension {
  dimensionKey: string;
  dimensionName: string;
  sensitivityWeight: number;
  rationale: string;
  mappedAttributes: string[];
}

export interface AttributePressure {
  attributeName: string; // persona property name (e.g. commuteMinutes, caregivingResponsibility, etc.)
  dimensionKey: string;
  direction: "increase_friction" | "relieve_friction";
  intensity: number; // 0.0 to 1.0 (magnitude)
  sensitivityWeight: number; // 0.0 to 1.0
  rationale: string;
}

export interface ScenarioOntologyMapping {
  scenarioType: string;
  changes: ScenarioChangeDef[];
  activatedDimensions: ActivatedDimension[];
  attributePressures: AttributePressure[];
  allMappedAttributes: string[];
}

/**
 * Universal Attribute Ontology Engine
 * Maps ANY natural-language scenario into structured dimensional pressures
 */
export function mapScenarioToOntology(
  scenarioType: string,
  changes: ScenarioChangeDef[],
  scenarioText?: string
): ScenarioOntologyMapping {
  const activated: ActivatedDimension[] = [];
  const pressures: AttributePressure[] = [];
  const text = (scenarioText || "").toLowerCase();
  const type = scenarioType.toLowerCase();

  // 1. Office Relocation & Transit Expansion
  if (
    type === "office_relocation" ||
    (!type.includes("work_model") && (text.includes("relocat") || (text.includes("move") && (text.includes("location") || text.includes("commute")))))
  ) {
    activated.push(
      createActivatedDimension("commute", 0.98, "Geographic facility relocation alters travel corridors, extending average commute times and transit modes."),
      createActivatedDimension("financialSensitivity", 0.85, "Increased travel mileage, parking, and transit fares impose unbudgeted costs on employees."),
      createActivatedDimension("flexibility", 0.80, "Commute expansion tightens schedule constraints, elevating demand for hybrid flexibility."),
      createActivatedDimension("accessibility", 0.75, "Transit route alterations may affect accessible train stations and barrier-free access.")
    );
    pressures.push(
      { attributeName: "commuteMinutes", dimensionKey: "commute", direction: "increase_friction", intensity: 0.85, sensitivityWeight: 0.95, rationale: "Longer transit distance directly multiplies weekly travel hours." },
      { attributeName: "financialSensitivity", dimensionKey: "financialSensitivity", direction: "increase_friction", intensity: 0.70, sensitivityWeight: 0.85, rationale: "Unbudgeted fuel, transit ticket, and vehicle maintenance costs." },
      { attributeName: "relocationWillingness", dimensionKey: "commute", direction: "increase_friction", intensity: 0.75, sensitivityWeight: 0.80, rationale: "Employees unwilling or unable to relocate face severe transit drag." }
    );
  }
  // 2. Workspace Redesign & Hot-Desking
  else if (text.includes("hot-desk") || text.includes("hot desk") || text.includes("unassigned") || text.includes("desk-sharing") || text.includes("assigned seating")) {
    activated.push(
      createActivatedDimension("accessibility", 0.95, "Loss of assigned workstations eliminates personalized ergonomic setups and acoustic stability."),
      createActivatedDimension("flexibility", 0.85, "Daily desk reservation anxiety and unpredictable seating arrangements disrupt routine."),
      createActivatedDimension("collaboration", 0.75, "Cross-functional adjacency shifts dynamically, requiring new coordination habits.")
    );
    pressures.push(
      { attributeName: "overallAccessibilityNeed", dimensionKey: "accessibility", direction: "increase_friction", intensity: 0.90, sensitivityWeight: 0.95, rationale: "Sensory fatigue and ergonomic mismatch from varying daily seating." },
      { attributeName: "sensoryRequirements", dimensionKey: "accessibility", direction: "increase_friction", intensity: 0.85, sensitivityWeight: 0.90, rationale: "Open-floor noise levels cannot be modulated without designated quiet areas." },
      { attributeName: "autonomyPreference", dimensionKey: "flexibility", direction: "increase_friction", intensity: 0.75, sensitivityWeight: 0.80, rationale: "Lack of dedicated desk ownership creates organizational instability." }
    );
  }
  // 3. 4-Day Compressed Workweek (e.g. 4x10 hours)
  else if (text.includes("4-day") || text.includes("four-day") || text.includes("compressed") || text.includes("10-hour")) {
    activated.push(
      createActivatedDimension("caregiving", 0.95, "10-hour working days extend past standard school, kindergarten, and daycare hours."),
      createActivatedDimension("flexibility", 0.90, "Long daily shift durations tighten weekday evening schedule elasticity."),
      createActivatedDimension("commute", 0.75, "One less working day per week reduces total weekly transit frequency by 20%."),
      createActivatedDimension("workLifeBalance", 0.80, "Three-day weekends offer extended recovery, balancing extended daily fatigue.")
    );
    pressures.push(
      { attributeName: "caregivingResponsibility", dimensionKey: "caregiving", direction: "increase_friction", intensity: 0.90, sensitivityWeight: 0.95, rationale: "10-hour daily shifts conflict with morning/afternoon childcare pickup windows." },
      { attributeName: "scheduleConstraints", dimensionKey: "flexibility", direction: "increase_friction", intensity: 0.80, sensitivityWeight: 0.85, rationale: "Fixed 10-hour commitments reduce weekday personal elasticity." },
      { attributeName: "commuteMinutes", dimensionKey: "commute", direction: "relieve_friction", intensity: 0.20, sensitivityWeight: 0.75, rationale: "20% reduction in weekly round-trip commutes." }
    );
  }
  // 4. Timezone & Global Core Hours
  else if (text.includes("timezone") || text.includes("pacific time") || text.includes("pst") || text.includes("est") || text.includes("core hours") || text.includes("global time")) {
    activated.push(
      createActivatedDimension("collaboration", 0.95, "Mandated timezone alignment impacts asynchronous cross-regional workflows."),
      createActivatedDimension("workLifeBalance", 0.90, "Late night or early morning overlap windows erode domestic evening boundaries."),
      createActivatedDimension("caregiving", 0.85, "Global evening meetings collide with dinner, bedtime, and family routines.")
    );
    pressures.push(
      { attributeName: "timezoneDependency", dimensionKey: "collaboration", direction: "increase_friction", intensity: 0.90, sensitivityWeight: 0.95, rationale: "Non-local timezone alignment forces unnatural circadian working hours." },
      { attributeName: "globalTeamInvolvement", dimensionKey: "collaboration", direction: "increase_friction", intensity: 0.85, sensitivityWeight: 0.90, rationale: "Distributed members shoulder asymmetrical meeting burdens." },
      { attributeName: "familyObligations", dimensionKey: "caregiving", direction: "increase_friction", intensity: 0.80, sensitivityWeight: 0.85, rationale: "Evening call schedules clash with family dinner and parenting." }
    );
  }
  // 5. On-Call & Weekend Shifts
  else if (text.includes("on-call") || text.includes("on call") || text.includes("weekend") || text.includes("pager") || text.includes("shift rotation")) {
    activated.push(
      createActivatedDimension("workLifeBalance", 0.98, "Constant pager availability and weekend duty interrupt mental rest and social plans."),
      createActivatedDimension("flexibility", 0.90, "Mandatory on-call windows require proximity to high-speed internet and quiet workstations."),
      createActivatedDimension("caregiving", 0.85, "Weekend incidents disrupt family activities and dependent responsibilities.")
    );
    pressures.push(
      { attributeName: "workLifeBalanceImportance", dimensionKey: "workLifeBalance", direction: "increase_friction", intensity: 0.95, sensitivityWeight: 0.95, rationale: "Interrupted weekends elevate acute burnout and psychological load." },
      { attributeName: "scheduleConstraints", dimensionKey: "flexibility", direction: "increase_friction", intensity: 0.85, sensitivityWeight: 0.85, rationale: "Tethered to laptop and rapid response SLAs during off-hours." }
    );
  }
  // 6. Compensation Adjustments & Pay Cuts
  else if (text.includes("pay cut") || text.includes("salary cut") || text.includes("equity") || text.includes("compensation") || text.includes("salary freeze") || text.includes("bonus")) {
    activated.push(
      createActivatedDimension("financialSensitivity", 0.98, "Salary reductions or equity swaps directly impact household cash flow and fixed obligations."),
      createActivatedDimension("technologyChange", 0.80, "Perceived employer instability and risk tolerance vary widely by career stage."),
      createActivatedDimension("workLifeBalance", 0.75, "Reduced base compensation lowers discretionary margin for dependent care and transit conveniences.")
    );
    pressures.push(
      { attributeName: "financialSensitivity", dimensionKey: "financialSensitivity", direction: "increase_friction", intensity: 0.95, sensitivityWeight: 0.98, rationale: "Cash compensation adjustments directly pressure lower salary bands." },
      { attributeName: "incomeDependency", dimensionKey: "financialSensitivity", direction: "increase_friction", intensity: 0.90, sensitivityWeight: 0.90, rationale: "Sole earners cannot easily absorb variable equity trade-offs." }
    );
  }
  // 7. AI Tooling & Generative Assistants
  else if (type === "ai_tool_introduction" || text.includes("ai coding") || text.includes("copilot") || text.includes("assistant") || text.includes("generative")) {
    activated.push(
      createActivatedDimension("technologyChange", 0.95, "Introduction of generative AI tools triggers varying adoption rates, technology trust, and learning curves."),
      createActivatedDimension("collaboration", 0.75, "AI augmentation shifts peer review workflows, async code generation, and team coordination practices."),
      createActivatedDimension("workLifeBalance", 0.70, "Potential workload amplification and changed output expectations influence developer stress.")
    );
    pressures.push(
      { attributeName: "technologyTrust", dimensionKey: "technologyChange", direction: "increase_friction", intensity: 0.80, sensitivityWeight: 0.90, rationale: "Varying trust in automated synthesis and algorithmic accuracy." },
      { attributeName: "technologyAdoption", dimensionKey: "technologyChange", direction: "increase_friction", intensity: 0.75, sensitivityWeight: 0.85, rationale: "Adoption curve friction for teams accustomed to traditional coding cycles." },
      { attributeName: "jobSecurityImportance", dimensionKey: "technologyChange", direction: "increase_friction", intensity: 0.70, sensitivityWeight: 0.80, rationale: "Anxiety regarding skill obsolescence or automated evaluation." }
    );
  }
  // 8. Performance Monitoring & Telemetry
  else if (type === "performance_monitoring" || text.includes("surveillance") || text.includes("tracking") || (text.includes("performance") && text.includes("monitor"))) {
    activated.push(
      createActivatedDimension("technologyChange", 0.92, "Algorithmic performance metrics elevate surveillance anxiety, trust erosion, and job security concerns."),
      createActivatedDimension("flexibility", 0.88, "Automated activity monitoring restricts temporal autonomy and spontaneous work rhythms."),
      createActivatedDimension("workLifeBalance", 0.85, "Continuous tracking blurs offline rest boundaries and elevates burnout risks.")
    );
    pressures.push(
      { attributeName: "autonomyPreference", dimensionKey: "flexibility", direction: "increase_friction", intensity: 0.90, sensitivityWeight: 0.95, rationale: "Telemetry monitoring directly undermines perceived trust and task autonomy." },
      { attributeName: "jobSecurityImportance", dimensionKey: "technologyChange", direction: "increase_friction", intensity: 0.85, sensitivityWeight: 0.90, rationale: "Heightened concern over punitive algorithmic evaluations." }
    );
  }
  // 9. Standard Office Attendance / Work Model Changes (Default Enterprise Model)
  else {
    activated.push(
      createActivatedDimension("commute", 0.95, "Additional required office presence directly multiplies weekly commute transit time and logistics friction."),
      createActivatedDimension("flexibility", 0.92, "Fixed office day minimums reduce autonomy over daily start/end hours and location choice."),
      createActivatedDimension("caregiving", 0.90, "School runs, eldercare check-ins, and dependent duties conflict with rigid in-office schedules."),
      createActivatedDimension("accessibility", 0.88, "Daily transit and open-campus physical environments place elevated strain on sensory and mobility needs."),
      createActivatedDimension("workLifeBalance", 0.82, "Extended door-to-door workdays diminish personal recovery and family time."),
      createActivatedDimension("collaboration", 0.65, "In-person co-location increases spontaneous collaboration for local teams while challenging cross-timezone peers.")
    );
    pressures.push(
      { attributeName: "commuteMinutes", dimensionKey: "commute", direction: "increase_friction", intensity: 0.80, sensitivityWeight: 0.95, rationale: "Transit duration overhead multiplies across required attendance days." },
      { attributeName: "flexibilityImportance", dimensionKey: "flexibility", direction: "increase_friction", intensity: 0.85, sensitivityWeight: 0.92, rationale: "Inflexible physical presence restricts personalized scheduling autonomy." },
      { attributeName: "caregivingResponsibility", dimensionKey: "caregiving", direction: "increase_friction", intensity: 0.80, sensitivityWeight: 0.90, rationale: "Daytime dependent duties conflict with fixed physical campus hours." },
      { attributeName: "overallAccessibilityNeed", dimensionKey: "accessibility", direction: "increase_friction", intensity: 0.75, sensitivityWeight: 0.88, rationale: "Transit hurdles and campus sensory loads impact accessible performance." }
    );
  }

  // Deduplicate and aggregate all target attributes
  const attrSet = new Set<string>();
  for (const d of activated) {
    for (const a of d.mappedAttributes) {
      attrSet.add(a);
    }
  }
  for (const p of pressures) {
    attrSet.add(p.attributeName);
  }

  return {
    scenarioType,
    changes,
    activatedDimensions: activated,
    attributePressures: pressures,
    allMappedAttributes: Array.from(attrSet),
  };
}

function createActivatedDimension(key: string, sensitivityWeight: number, rationale: string): ActivatedDimension {
  const def = WORKFORCE_DIMENSIONS[key] || {
    dimensionKey: key,
    dimensionName: key,
    description: rationale,
    targetPersonaAttributes: [],
    defaultSensitivity: 0.7,
  };

  return {
    dimensionKey: def.dimensionKey,
    dimensionName: def.dimensionName,
    sensitivityWeight,
    rationale,
    mappedAttributes: def.targetPersonaAttributes,
  };
}
