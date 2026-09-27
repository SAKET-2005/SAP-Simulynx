import { test, describe } from "node:test";
import assert from "node:assert";
import { generateWorkforce } from "../lib/persona-generator/generator.js";

describe("Workforce Generator", () => {
  test("generates exactly 300 personas by default", () => {
    const workforce = generateWorkforce(300);
    assert.strictEqual(workforce.length, 300);
  });

  test("generates configurable populations (100, 500)", () => {
    const w100 = generateWorkforce(100);
    assert.strictEqual(w100.length, 100);

    const w500 = generateWorkforce(500);
    assert.strictEqual(w500.length, 500);
  });

  test("populates all 10 conceptual workforce dimensions", () => {
    const workforce = generateWorkforce(50);
    for (const p of workforce) {
      // 1. Identity
      assert.ok(p.age >= 18 && p.age <= 70);
      assert.ok(p.location.length > 0);
      assert.ok(p.lifeStage.length > 0);

      // 2. Professional
      assert.ok(p.role.length > 0);
      assert.ok(p.department.length > 0);
      assert.ok(p.seniority.length > 0);

      // 3. Work Style
      assert.ok(p.remotePreference >= 0 && p.remotePreference <= 100);
      assert.ok(p.officePreference >= 0 && p.officePreference <= 100);

      // 4. Life Context
      assert.strictEqual(typeof p.caregivingResponsibility, "boolean");
      assert.ok(p.scheduleConstraints >= 0 && p.scheduleConstraints <= 100);

      // 5. Logistics
      assert.ok(p.commuteMinutes >= 10 && p.commuteMinutes <= 150);
      assert.ok(p.transportationMode.length > 0);

      // 6. Priorities
      assert.ok(p.flexibilityImportance >= 0 && p.flexibilityImportance <= 100);
      assert.ok(p.workLifeBalanceImportance >= 0 && p.workLifeBalanceImportance <= 100);

      // 7. Behavior
      assert.ok(p.technologyAdoption >= 0 && p.technologyAdoption <= 100);
      assert.ok(p.technologyTrust >= 0 && p.technologyTrust <= 100);

      // 8. Financial
      assert.ok(["entry", "mid", "senior", "executive"].includes(p.salaryBand));

      // 9. Collaboration
      assert.ok(p.teamSize > 0);
      assert.strictEqual(typeof p.globalTeamInvolvement, "boolean");

      // 10. Accessibility
      assert.strictEqual(typeof p.mobilityRequirements, "boolean");
      assert.ok(p.overallAccessibilityNeed >= 0 && p.overallAccessibilityNeed <= 100);
    }
  });

  test("exhibits realistic attribute correlations (e.g. young children -> caregiving)", () => {
    const workforce = generateWorkforce(300, 1042);
    const families = workforce.filter((p) => p.lifeStage === "family-with-young-children");
    const caregivers = families.filter((p) => p.caregivingResponsibility);
    // Over 80% of family-with-young-children should have caregiving responsibilities
    assert.ok(caregivers.length / families.length > 0.8);
  });

  test("is strictly deterministic for identical seeds", () => {
    const run1 = generateWorkforce(50, 42);
    const run2 = generateWorkforce(50, 42);
    assert.deepStrictEqual(run1, run2);
  });
});
