import { test, describe } from "node:test";
import assert from "node:assert";
import { DeterministicAIProvider } from "../lib/ai/deterministic-provider.js";
import { mapScenarioToOntology } from "../lib/ontology/ontology.js";

describe("Scenario Analyzer & Workforce Ontology", () => {
  const provider = new DeterministicAIProvider();

  test("parses office attendance increase (2 -> 5 days)", async () => {
    const text = "Our company is moving from 2 mandatory office days to 5.";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.scenarioType, "work_model_change");
    assert.strictEqual(result.changes.length, 1);
    assert.strictEqual(result.changes[0].attribute, "officeDays");
    assert.strictEqual(result.changes[0].beforeValue, 2);
    assert.strictEqual(result.changes[0].afterValue, 5);

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("commute"));
    assert.ok(dimKeys.includes("flexibility"));
    assert.ok(dimKeys.includes("caregiving"));
    assert.ok(dimKeys.includes("accessibility"));
  });

  test("parses office relocation scenario", async () => {
    const text = "Move the company office to a new location that increases average commute time.";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.scenarioType, "office_relocation");
    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("commute"));
    assert.ok(dimKeys.includes("financialSensitivity"));
  });

  test("parses AI tool rollout scenario", async () => {
    const text = "Introduce an AI coding assistant across engineering teams.";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.scenarioType, "ai_tool_introduction");
    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("technologyChange"));
  });

  test("parses unassigned hot-desking policy scenario", async () => {
    const text = "We are eliminating assigned seating and moving to 100% hot-desking.";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.scenarioType, "workspace_redesign");
    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("accessibility"));
    assert.ok(dimKeys.includes("flexibility"));
  });

  test("parses 4-day 10-hour compressed workweek scenario", async () => {
    const text = "We are transitioning all teams to a 4-day 10-hour compressed workweek.";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.scenarioType, "schedule_compression");
    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("caregiving"));
    assert.ok(dimKeys.includes("flexibility"));
    assert.ok(dimKeys.includes("commute"));
  });

  test("parses global timezone alignment scenario", async () => {
    const text = "Mandate core Pacific Time hours from 10am to 4pm for all global team members.";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.scenarioType, "timezone_alignment");
    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("collaboration"));
    assert.ok(dimKeys.includes("workLifeBalance"));
  });

  test("ontology maps dimensions to persona attributes", () => {
    const mapping = mapScenarioToOntology("work_model_change", [
      { attribute: "officeDays", beforeValue: 2, afterValue: 5 },
    ]);

    assert.ok(mapping.allMappedAttributes.includes("commuteMinutes"));
    assert.ok(mapping.allMappedAttributes.includes("flexibilityImportance"));
    assert.ok(mapping.allMappedAttributes.includes("caregivingResponsibility"));
    assert.ok(mapping.allMappedAttributes.includes("overallAccessibilityNeed"));
    assert.ok(mapping.attributePressures.length > 0);
  });
});
