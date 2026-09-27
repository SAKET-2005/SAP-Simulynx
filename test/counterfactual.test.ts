import { test, describe } from "node:test";
import assert from "node:assert";
import { generateWorkforce } from "../lib/persona-generator/generator.js";
import { mapScenarioToOntology } from "../lib/ontology/ontology.js";
import { RedTeamEngine } from "../lib/counterfactual/redteam-engine.js";

describe("Counterfactual / Red-Team Engine", () => {
  const engine = new RedTeamEngine();
  const workforce = generateWorkforce(100, 42);

  const mapping = mapScenarioToOntology("work_model_change", [
    { attribute: "officeDays", beforeValue: 2, afterValue: 5 },
  ]);

  const context = {
    scenarioType: "work_model_change",
    changes: mapping.changes,
    activatedDimensions: mapping.activatedDimensions,
    rawScenarioText: "Our company is moving from 2 mandatory office days to 5.",
  };

  test("calculates counterfactual difference and detects material influence", () => {
    const results = engine.runCounterfactualAnalysis(workforce, context);
    assert.ok(results.length >= 3);

    for (const r of results) {
      assert.ok(r.difference >= 0);
      assert.strictEqual(
        r.difference,
        Math.round((r.originalAverageImpact - r.counterfactualAverageImpact) * 10) / 10
      );
      assert.ok(
        ["Material influence detected - Investigate", "Moderate influence detected", "Low influence"].includes(
          r.status
        )
      );
      assert.ok(r.rationale.includes("This attribute materially influences the simulated outcome"));
    }
  });
});
