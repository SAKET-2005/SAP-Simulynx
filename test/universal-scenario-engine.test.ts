import { test, describe } from "node:test";
import assert from "node:assert";
import { generateWorkforce } from "../lib/persona-generator/generator.js";
import { parseScenarioToIR } from "../lib/universal-scenario/universal-parser.js";
import { generateDynamicCohorts } from "../lib/cohort-engine/dynamic-cohorts.js";
import { SimulationEngine } from "../lib/simulation-engine/simulation-engine.js";
import { RedTeamEngine } from "../lib/counterfactual/redteam-engine.js";
import { buildUniversalOutputContract } from "../lib/universal-scenario/decision-support.js";

describe("Universal Scenario & Workforce Simulation Engine", () => {
  const workforce = generateWorkforce(100, 42);
  const simulationEngine = new SimulationEngine();
  const redTeamEngine = new RedTeamEngine();

  // 7 Demo Scenarios requested in Requirement 12
  const demoScenarios = [
    {
      id: "A",
      prompt: "Our company is moving from 2 mandatory office days to 5.",
      expectedPrimaryDimensions: ["commute", "caregiving", "flexibility"],
      expectedIntent: "policy_evaluation",
    },
    {
      id: "B",
      prompt: "I don't agree with mandatory cameras during virtual meetings. What might be the impact?",
      expectedPrimaryDimensions: ["accessibility", "flexibility", "collaboration"],
      expectedIntent: "tradeoff_inquiry",
    },
    {
      id: "C",
      prompt: "We want to move our office 20 km farther from the city.",
      expectedPrimaryDimensions: ["commute", "financialSensitivity"],
      expectedIntent: "change_proposal",
    },
    {
      id: "D",
      prompt: "We want to introduce AI coding assistants across engineering.",
      expectedPrimaryDimensions: ["technologyChange", "professional"],
      expectedIntent: "change_proposal",
    },
    {
      id: "E",
      prompt: "We want continuous AI-assisted performance monitoring.",
      expectedPrimaryDimensions: ["flexibility", "technologyChange", "workLifeBalance"],
      expectedIntent: "change_proposal",
    },
    {
      id: "F",
      prompt: "Should we introduce a four-day workweek?",
      expectedPrimaryDimensions: ["flexibility", "caregiving", "workLifeBalance", "commute"],
      expectedIntent: "tradeoff_inquiry",
    },
    {
      id: "G",
      prompt: "How would changing our working hours affect employees?",
      expectedPrimaryDimensions: ["flexibility", "caregiving"],
      expectedIntent: "exploratory_question",
    },
  ];

  for (const demo of demoScenarios) {
    test(`Scenario ${demo.id}: "${demo.prompt.substring(0, 40)}..." flows through Universal Pipeline`, () => {
      // 1. Prompt -> Universal Semantic Intermediate Representation (IR)
      const ir = parseScenarioToIR(demo.prompt);
      assert.ok(ir, "IR must be defined");
      assert.strictEqual(ir.intent, demo.expectedIntent, `Intent should be ${demo.expectedIntent}`);
      assert.ok(ir.confidence >= 0.50, "Simulatable demo prompts should have high confidence");
      assert.strictEqual(ir.isSimulatable, true, "Should be simulatable");
      assert.ok(ir.argumentsFor.length > 0, "Must provide arguments for");
      assert.ok(ir.argumentsAgainst.length > 0, "Must provide arguments against");

      // Verify dynamic dimension activation
      const activeDimKeys = ir.affectedDimensions.map((d) => d.dimensionKey);
      for (const expectedDim of demo.expectedPrimaryDimensions) {
        assert.ok(
          activeDimKeys.includes(expectedDim),
          `Scenario ${demo.id} must activate dimension "${expectedDim}". Activated: ${activeDimKeys.join(", ")}`
        );
      }

      // 2. IR -> Cohorts
      const cohorts = generateDynamicCohorts(ir.affectedDimensions, workforce);
      assert.ok(cohorts.length > 0, "Must generate dynamic cohorts based on activated dimensions");

      // 3. Deterministic Simulation
      const simRun = simulationEngine.runSimulation(workforce, cohorts, ir);
      assert.strictEqual(simRun.totalPersonas, 100);
      assert.ok(simRun.overallImpactScore >= 0 && simRun.overallImpactScore <= 100);
      assert.ok(simRun.affectedPercentage >= 0 && simRun.affectedPercentage <= 100);
      assert.strictEqual(simRun.personaResults.length, 100);

      // Verify transparent drivers
      for (const pRes of simRun.personaResults.slice(0, 5)) {
        assert.ok(pRes.drivers !== undefined, "Drivers must be recorded");
        assert.ok(pRes.explanationText.length > 0, "Explanation text must be generated");
      }

      // 4. Counterfactual Red-Team
      const counterfactuals = redTeamEngine.runCounterfactualAnalysis(workforce, ir);
      assert.ok(counterfactuals.length > 0, "Counterfactual analysis must evaluate candidate attributes");
      for (const cf of counterfactuals) {
        assert.ok(cf.difference >= 0, "Difference must be non-negative");
        assert.ok(!cf.status.toLowerCase().includes("bias"), "Status must NOT be labeled as bias");
      }

      // 5. Universal Output Contract
      const contract = buildUniversalOutputContract(ir, simRun, counterfactuals);
      assert.ok(contract.scenario.rawText, "Scenario text must be preserved");
      assert.ok(contract.tradeoffs.length > 0, "Trade-offs must be populated");
      assert.ok(contract.decisionSupport.mitigationOptions.length > 0, "Mitigations must be present");
      assert.ok(contract.decisionSupport.questionsForHumanReview.length > 0, "Human review questions must be present");

      // Verify NO automated verdicts (Requirement 8)
      const verdictForbidden = ["verdict: yes", "verdict: no", "verdict yes", "verdict no", "implement this policy"];
      const summaryLower = contract.decisionSupport.summary.toLowerCase();
      for (const forbidden of verdictForbidden) {
        assert.ok(!summaryLower.includes(forbidden), `Decision support summary must not contain forbidden phrase "${forbidden}"`);
      }
      assert.ok(
        contract.decisionSupport.humanInTheLoopNotice.includes("human leadership"),
        "Must include human-in-the-loop notice"
      );
    });
  }

  // Requirement 2: Handling Vague / Abstract Inquiries Without Fabricating Consensus
  test("Scenario H: Vague Culture Prompt returns clarification request without fabricating numbers", () => {
    const vaguePrompt = "Would changing our culture improve productivity?";
    const ir = parseScenarioToIR(vaguePrompt);

    assert.strictEqual(ir.intent, "unclear_inquiry");
    assert.strictEqual(ir.isSimulatable, false, "Must NOT simulate vague abstract culture prompts");
    assert.ok(ir.confidence < 0.35, "Confidence should be low for abstract prompts");
    assert.ok(ir.unmappedConcepts.includes("organizational culture"), "Must report unmapped concept");
    assert.ok(ir.clarificationNeeded !== undefined && ir.clarificationNeeded.length > 0, "Must request clarification");
  });

  // Verify that distinct scenarios activate distinct dimensions (Requirement 13)
  test("Verifies that Camera Policy and Relocation Policy activate completely distinct primary dimensions", () => {
    const cameraIR = parseScenarioToIR("I don't agree with mandatory cameras during virtual meetings.");
    const relocationIR = parseScenarioToIR("We want to move our office 20 km farther from the city.");

    const cameraDims = cameraIR.affectedDimensions.map((d) => d.dimensionKey);
    const relocationDims = relocationIR.affectedDimensions.map((d) => d.dimensionKey);

    assert.ok(cameraDims.includes("accessibility"), "Cameras must activate accessibility");
    assert.ok(!cameraDims.includes("financialSensitivity"), "Cameras should not activate financialSensitivity");

    assert.ok(relocationDims.includes("financialSensitivity"), "Relocation must activate financialSensitivity");
    assert.ok(!relocationDims.includes("accessibility"), "Relocation should not activate accessibility as primary");
  });
});
