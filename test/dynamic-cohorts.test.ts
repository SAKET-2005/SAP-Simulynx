import { test, describe } from "node:test";
import assert from "node:assert";
import { generateWorkforce } from "../lib/persona-generator/generator.js";
import { mapScenarioToOntology } from "../lib/ontology/ontology.js";
import { generateDynamicCohorts } from "../lib/cohort-engine/dynamic-cohorts.js";

describe("Dynamic Cohort Generation", () => {
  const workforce = generateWorkforce(100, 42);

  test("generates cohorts dynamically from activated dimensions", () => {
    const mapping = mapScenarioToOntology("work_model_change", [
      { attribute: "officeDays", beforeValue: 2, afterValue: 5 },
    ]);

    const cohorts = generateDynamicCohorts(mapping.activatedDimensions, workforce);
    assert.ok(cohorts.length >= 3);

    const keys = cohorts.map((c) => c.cohortKey);
    assert.ok(keys.includes("high_commute"));
    assert.ok(keys.includes("caregiving_constrained"));
    assert.ok(keys.includes("high_flexibility_need"));
  });

  test("supports overlapping memberships (same persona in multiple cohorts)", () => {
    const mapping = mapScenarioToOntology("work_model_change", [
      { attribute: "officeDays", beforeValue: 2, afterValue: 5 },
    ]);

    const cohorts = generateDynamicCohorts(mapping.activatedDimensions, workforce);

    // Find personas present in both High Commute and Caregiving
    const commuteMembers = new Set(
      cohorts.find((c) => c.cohortKey === "high_commute")?.memberPersonas.map((m) => m.externalId) || []
    );
    const caregiverMembers = new Set(
      cohorts.find((c) => c.cohortKey === "caregiving_constrained")?.memberPersonas.map((m) => m.externalId) || []
    );

    let overlapCount = 0;
    for (const id of commuteMembers) {
      if (caregiverMembers.has(id)) {
        overlapCount++;
      }
    }

    assert.ok(overlapCount > 0, "Expected at least one persona with overlapping cohort membership");
  });
});
