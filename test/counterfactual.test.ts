import { test, describe } from "node:test";
import assert from "node:assert";
import { generateWorkforce } from "../lib/persona-generator/generator.js";
import { parseScenarioToIR } from "../lib/universal-scenario/universal-parser.js";
import { RedTeamEngine } from "../lib/counterfactual/redteam-engine.js";

describe("Counterfactual / Red-Team Engine", () => {
  const engine = new RedTeamEngine();
  const workforce = generateWorkforce(100, 42);
  const ir = parseScenarioToIR("Our company is moving from 2 mandatory office days to 5.");

  test("calculates counterfactual difference and detects material influence", () => {
    const results = engine.runCounterfactualAnalysis(workforce, ir);
    assert.ok(results.length >= 2, "Must evaluate sensitive attributes");

    const materialResults = results.filter((r) => r.requiresInvestigation);
    assert.ok(materialResults.length > 0, "Must detect at least one materially influential attribute");

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
      assert.ok(!r.status.toLowerCase().includes("bias"), "Status must NOT use bias label");
    }

    assert.ok(
      materialResults[0].rationale.includes("materially influences the simulated outcome"),
      "Material attribute must use objective decision-support terminology"
    );
  });
});
