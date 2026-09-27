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

  test("parses talent mobility and candidate hiring scenario (Cyber Security -> SWE Intern)", async () => {
    const text = "I am applying for a Software Engineering Intern role after completing my internship as a Cyber Security Intern. After completing this internship I realised that I am not a good fit for this domain as I enjoy coding more and I would be a better fit for the Software Engineering role. What are my chances of being hired if I have the required skills and am able to code in all the major langueages required by the company.";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.scenarioType, "talent_mobility_hiring");
    assert.strictEqual(result.changes.length, 4);
    assert.strictEqual(result.changes[0].attribute, "targetRole");
    assert.strictEqual(result.changes[0].afterValue, "Software Engineering Intern");

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("professional"));
    assert.ok(dimKeys.includes("technologyChange"));
    assert.ok(dimKeys.includes("collaboration"));
    assert.ok(dimKeys.includes("workLifeBalance"));
  });
});
