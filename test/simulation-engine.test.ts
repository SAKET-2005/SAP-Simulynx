import { test, describe } from "node:test";
import assert from "node:assert";
import { generateWorkforce } from "../lib/persona-generator/generator.js";
import { mapScenarioToOntology } from "../lib/ontology/ontology.js";
import { generateDynamicCohorts } from "../lib/cohort-engine/dynamic-cohorts.js";
import { SimulationEngine } from "../lib/simulation-engine/simulation-engine.js";

describe("Simulation Engine", () => {
  const engine = new SimulationEngine();
  const workforce = generateWorkforce(100, 42);

  const mapping = mapScenarioToOntology("work_model_change", [
    { attribute: "officeDays", beforeValue: 2, afterValue: 5 },
  ]);

  const cohorts = generateDynamicCohorts(mapping.activatedDimensions, workforce);

  const context = {
    scenarioType: "work_model_change",
    changes: mapping.changes,
    activatedDimensions: mapping.activatedDimensions,
    rawScenarioText: "Our company is moving from 2 mandatory office days to 5.",
  };

  test("runs simulation and produces individual and cohort metrics", () => {
    const result = engine.runSimulation(workforce, cohorts, context);

    assert.strictEqual(result.totalPersonas, 100);
    assert.ok(result.overallImpactScore >= 0 && result.overallImpactScore <= 100);
    assert.ok(result.affectedPercentage >= 0 && result.affectedPercentage <= 100);
    assert.strictEqual(result.personaResults.length, 100);
    assert.ok(result.cohortResults.length > 0);

    for (const c of result.cohortResults) {
      assert.ok(c.averageImpact >= 0 && c.averageImpact <= 100);
      assert.ok(["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(c.riskLevel));
    }
  });

  test("guarantees 100% strict determinism across multiple runs", () => {
    const run1 = engine.runSimulation(workforce, cohorts, context);
    const run2 = engine.runSimulation(workforce, cohorts, context);

    assert.strictEqual(run1.overallImpactScore, run2.overallImpactScore);
    assert.strictEqual(run1.affectedPercentage, run2.affectedPercentage);
    assert.deepStrictEqual(run1.personaResults, run2.personaResults);
  });
});
