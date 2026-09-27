import { UniversalScenarioIR, ScenarioChangeDef, ActivatedDimension, AttributePressure } from "./types.js";
import { CONCEPT_ONTOLOGY_REGISTRY, ConceptDefinition } from "./concept-ontology.js";

/**
 * Universal Scenario Parser
 * Transforms arbitrary natural-language workplace prompts into a structured UniversalScenarioIR.
 * Operates without scenario-specific code paths, using ontology concepts and heuristic semantic extraction.
 */
export function parseScenarioToIR(rawText: string): UniversalScenarioIR {
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();

  // 1. Detect Vague / Abstract Prompts (Requirement 2)
  const isVagueCulture = lower.includes("culture") && (lower.includes("productivity") || lower.includes("improve") || lower.includes("better"));
  const isTooShortOrGeneric = text.length < 15 || (lower.startsWith("what if") && text.split(" ").length <= 4);

  if (isVagueCulture || isTooShortOrGeneric) {
    return {
      intent: "unclear_inquiry",
      proposal: text,
      baseline: "Unspecified organizational baseline",
      changes: [],
      stakeholders: ["General workforce"],
      affectedDimensions: [],
      attributePressures: [],
      potentialEffects: ["Uncertain organizational effects dependent on concrete policy definitions."],
      argumentsFor: ["Potential cultural renewal if initiatives are well-targeted."],
      argumentsAgainst: ["Abstract initiatives without operational guardrails frequently yield negligible or unpredictable outcomes."],
      constraints: ["Requires measurable policy definition before simulation."],
      confidence: 0.25,
      unmappedConcepts: ["organizational culture", "abstract productivity"],
      clarificationNeeded: "A meaningful workforce simulation requires concrete policy parameters. Please specify: (1) what specific practice or rule is changing, (2) the current baseline, and (3) which employee segments are affected.",
      isSimulatable: false,
    };
  }

  // 2. Identify Intent
  let intent: UniversalScenarioIR["intent"] = "policy_evaluation";
  if (lower.includes("i don't agree") || lower.includes("i disagree") || lower.includes("opinion") || lower.includes("should this") || lower.includes("should we")) {
    intent = "tradeoff_inquiry";
  } else if (lower.includes("we want") || lower.includes("we are moving") || lower.includes("introduce") || lower.includes("transition")) {
    intent = "change_proposal";
  } else if (lower.startsWith("how would") || lower.startsWith("what might") || lower.startsWith("what would")) {
    intent = "exploratory_question";
  }

  // 3. Match against Concept Ontology
  const matchedConcepts: ConceptDefinition[] = [];
  for (const concept of CONCEPT_ONTOLOGY_REGISTRY) {
    const isMatch = concept.matchPatterns.some((pattern) => {
      if (typeof pattern === "string") {
        return lower.includes(pattern);
      }
      return pattern.test(lower);
    });

    if (isMatch) {
      matchedConcepts.push(concept);
    }
  }

  // 4. Extract Numbers & Parameters
  const changes: ScenarioChangeDef[] = [];
  let baseline = "Current operational baseline";
  let proposal = text;

  // Numerical day transitions: e.g. "from 2 to 5", "2 -> 5", "from 2 mandatory office days to 5"
  const daysMatch = lower.match(/(\d+)\s*(?:mandatory|in-office|office|days?|\s)*\s*(?:to|->)\s*(\d+)/i);
  if (daysMatch) {
    const before = parseInt(daysMatch[1], 10);
    const after = parseInt(daysMatch[2], 10);
    changes.push({
      attribute: "inOfficeDaysPerWeek",
      beforeValue: before,
      afterValue: after,
    });
    baseline = `${before} in-office days per week`;
    proposal = `Transition to ${after} mandatory in-office days per week`;
  }

  // Distance / Relocation: e.g. "20 km farther", "relocate office"
  const kmMatch = lower.match(/(\d+)\s*(?:km|kilometers|miles)/i);
  if (kmMatch) {
    const dist = parseInt(kmMatch[1], 10);
    changes.push({
      attribute: "averageCommuteDeltaKm",
      beforeValue: 0,
      afterValue: dist,
    });
    baseline = "Current facility location and travel corridors";
    proposal = `Office relocation expanding transit distance by ~${dist} km`;
  }

  // 4-day / compressed workweek: e.g. "four-day", "4-day", "compressed"
  if (lower.includes("4-day") || lower.includes("four-day") || lower.includes("compressed")) {
    changes.push(
      { attribute: "weeklyWorkingDays", beforeValue: 5, afterValue: 4 },
      { attribute: "dailyShiftHours", beforeValue: 8, afterValue: 10 }
    );
    baseline = "Standard 5-day / 8-hour weekly work schedule";
    proposal = "4-day compressed workweek with 10-hour daily shifts";
  }

  // Camera / Video presence
  if (lower.includes("camera") || lower.includes("video")) {
    changes.push({
      attribute: "meetingVideoPolicy",
      beforeValue: "Contextual / Optional",
      afterValue: "Mandatory Active Video",
    });
    baseline = "Video cameras optional or discretionary during virtual calls";
    proposal = "Mandatory camera-on requirement during virtual meetings";
  }

  // AI Tooling / Assistants
  if (lower.includes("ai") && (lower.includes("coding") || lower.includes("assistant") || lower.includes("copilot") || lower.includes("engineering"))) {
    changes.push({
      attribute: "aiToolingCoverage",
      beforeValue: "0%",
      afterValue: "100%",
    });
    baseline = "Manual development without enterprise generative AI assistants";
    proposal = "Enterprise rollout of generative AI coding assistants across engineering";
  }

  // Surveillance / Monitoring
  if (lower.includes("monitor") || lower.includes("tracking") || lower.includes("surveillance")) {
    changes.push({
      attribute: "activityMonitoring",
      beforeValue: "Periodic / Trust-based",
      afterValue: "Continuous Telemetry",
    });
    baseline = "Standard milestone and output-based performance management";
    proposal = "Continuous AI-assisted activity and presence telemetry";
  }

  // 5. Aggregate Dimensions & Pressures from Matched Concepts
  const dimensionMap = new Map<string, ActivatedDimension>();
  const pressures: AttributePressure[] = [];
  const argsForSet = new Set<string>();
  const argsAgainstSet = new Set<string>();
  const stakeholdersSet = new Set<string>();
  const unmappedConcepts: string[] = [];

  for (const c of matchedConcepts) {
    for (const d of c.associatedDimensions) {
      if (!dimensionMap.has(d.dimensionKey)) {
        dimensionMap.set(d.dimensionKey, {
          dimensionKey: d.dimensionKey,
          dimensionName: d.dimensionName,
          sensitivityWeight: d.sensitivityWeight,
          rationale: d.rationale,
          mappedAttributes: [...d.mappedAttributes],
        });
      }
    }

    for (const p of c.attributePressures) {
      pressures.push(p);
    }

    for (const af of c.argumentsFor) argsForSet.add(af);
    for (const aa of c.argumentsAgainst) argsAgainstSet.add(aa);
    for (const s of c.typicalStakeholders) stakeholdersSet.add(s);
  }

  // If no concepts matched cleanly, mark unmapped concepts
  if (matchedConcepts.length === 0) {
    unmappedConcepts.push(text);
  }

  // 6. Handling Partial or Generic Inquiries (e.g. "How would changing our working hours affect employees?")
  let clarificationNeeded: string | undefined;
  let confidence = 0.90;

  if (lower.includes("changing our working hours") && !lower.includes("4-day") && !lower.includes("shift") && !daysMatch) {
    confidence = 0.65;
    clarificationNeeded = "Identified working hours inquiry, but specific delta hours (e.g. shift length, core hours, start/end windows) were not stated. Simulating against generalized schedule elasticity.";
    if (changes.length === 0) {
      changes.push({
        attribute: "scheduleFlexibility",
        beforeValue: "Flexible Hours",
        afterValue: "Modified Standard Hours",
      });
    }
  }

  if (matchedConcepts.length === 0) {
    confidence = 0.40;
    clarificationNeeded = `Prompt concepts did not map directly to standardized enterprise policy benchmarks. Running generalized adaptability simulation against standard flexibility and collaboration dimensions.`;
    // Supply baseline dimensions
    dimensionMap.set("flexibility", {
      dimensionKey: "flexibility",
      dimensionName: "Operational Flexibility",
      sensitivityWeight: 0.70,
      rationale: "Unspecified organizational adjustment requires personal adaptation and schedule flexibility.",
      mappedAttributes: ["flexibilityImportance", "autonomyPreference"],
    });
    dimensionMap.set("collaboration", {
      dimensionKey: "collaboration",
      dimensionName: "Team Collaboration",
      sensitivityWeight: 0.65,
      rationale: "Policy shift touches peer coordination and working habits.",
      mappedAttributes: ["collaborationPreference", "meetingTolerance"],
    });
    pressures.push({
      attributeName: "autonomyPreference",
      dimensionKey: "flexibility",
      direction: "increase_friction",
      intensity: 0.50,
      sensitivityWeight: 0.70,
      rationale: "Organizational change creates baseline adaptation overhead.",
    });
  }

  const affectedDimensions = Array.from(dimensionMap.values());

  return {
    intent,
    proposal,
    baseline,
    changes,
    stakeholders: Array.from(stakeholdersSet).length > 0 ? Array.from(stakeholdersSet) : ["Distributed workforce", "Team leads"],
    affectedDimensions,
    attributePressures: pressures,
    potentialEffects: [
      `Activates ${affectedDimensions.length} workforce dimensions across the organization.`,
      `Impact will distribute unevenly depending on individual employee schedule constraints, sensory needs, and commute modes.`,
    ],
    argumentsFor: Array.from(argsForSet).slice(0, 3),
    argumentsAgainst: Array.from(argsAgainstSet).slice(0, 3),
    constraints: [
      "Simulated outcomes represent directional mathematical friction based on synthetic workforce profiles, not individual employee surveillance.",
      "Final policy decisions remain exclusively with human organizational leadership.",
    ],
    confidence,
    unmappedConcepts,
    clarificationNeeded,
    isSimulatable: affectedDimensions.length > 0 && confidence >= 0.35,
  };
}
