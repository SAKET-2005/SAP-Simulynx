import { test, describe } from "node:test";
import assert from "node:assert";
import { DeterministicAIProvider } from "../lib/ai/deterministic-provider.js";
import { parseScenarioToIR } from "../lib/universal-scenario/universal-parser.js";

describe("Scenario Analyzer & Universal Ontology", () => {
  const provider = new DeterministicAIProvider();

  test("parses office attendance increase (2 -> 5 days)", async () => {
    const text = "Our company is moving from 2 mandatory office days to 5.";
    const result = await provider.analyzeScenario(text);

    assert.ok(result.changes.length >= 1);
    assert.strictEqual(result.changes[0].attribute, "inOfficeDaysPerWeek");
    assert.strictEqual(result.changes[0].beforeValue, 2);
    assert.strictEqual(result.changes[0].afterValue, 5);

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("commute"));
    assert.ok(dimKeys.includes("flexibility"));
    assert.ok(dimKeys.includes("caregiving"));
  });

  test("parses office relocation scenario", async () => {
    const text = "Move the company office 20 km farther from the city center.";
    const result = await provider.analyzeScenario(text);

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("commute"));
    assert.ok(dimKeys.includes("financialSensitivity"));
  });

  test("parses AI tool rollout scenario", async () => {
    const text = "Introduce an AI coding assistant across engineering teams.";
    const result = await provider.analyzeScenario(text);

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("technologyChange"));
  });

  test("parses unassigned hot-desking policy scenario", async () => {
    const text = "We are eliminating assigned seating and moving to 100% hot-desking.";
    const result = await provider.analyzeScenario(text);

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("accessibility"));
    assert.ok(dimKeys.includes("flexibility"));
  });

  test("parses 4-day 10-hour compressed workweek scenario", async () => {
    const text = "We are transitioning all teams to a 4-day 10-hour compressed workweek.";
    const result = await provider.analyzeScenario(text);

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("caregiving"));
    assert.ok(dimKeys.includes("flexibility"));
    assert.ok(dimKeys.includes("commute"));
  });

  test("parses global timezone alignment scenario", async () => {
    const text = "Mandate core Pacific Time hours from 10am to 4pm for all global team members.";
    const result = await provider.analyzeScenario(text);

    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("collaboration"));
    assert.ok(dimKeys.includes("workLifeBalance"));
  });

  test("parses virtual camera engagement scenario", async () => {
    const text = "I don't agree with mandatory cameras during virtual meetings. What might be the impact?";
    const result = await provider.analyzeScenario(text);

    assert.strictEqual(result.ir.intent, "tradeoff_inquiry");
    const dimKeys = result.affectedDimensions.map((d) => d.dimensionKey);
    assert.ok(dimKeys.includes("accessibility"));
    assert.ok(dimKeys.includes("flexibility"));
    assert.ok(dimKeys.includes("collaboration"));
  });
});
