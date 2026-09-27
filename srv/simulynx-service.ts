import cds from "@sap/cds";
import { generateWorkforce } from "../lib/persona-generator/generator.js";
import { mapScenarioToOntology } from "../lib/ontology/ontology.js";
import { generateDynamicCohorts } from "../lib/cohort-engine/dynamic-cohorts.js";
import { SimulationEngine } from "../lib/simulation-engine/simulation-engine.js";
import { RedTeamEngine } from "../lib/counterfactual/redteam-engine.js";
import { PersonaData } from "../lib/persona-generator/types.js";
import { getAIProvider } from "../lib/ai/index.js";
import crypto from "node:crypto";

const { SELECT, INSERT, UPDATE, DELETE } = cds.ql;

export default class SimulynxService extends (cds.ApplicationService as any) {
  async init() {
    const {
      Personas,
      Scenarios,
      ScenarioDimensions,
      Cohorts,
      CohortMembers,
      Simulations,
      SimulationResults,
      CounterfactualResults,
    } = this.entities;

    const simulationEngine = new SimulationEngine();
    const redTeamEngine = new RedTeamEngine();
    const aiProvider = getAIProvider();

    /**
     * getDashboardOverview()
     */
    this.on("getDashboardOverview", async (req) => {
      const personaCountResult = await SELECT.from(Personas).columns("count(*) as total");
      const totalWorkforce = personaCountResult[0]?.total || 0;

      const simCountResult = await SELECT.from(Simulations).columns("count(*) as total");
      const scenariosSimulated = simCountResult[0]?.total || 0;

      // Get latest simulation
      const latestSimList = await SELECT.from(Simulations)
        .orderBy("runAt desc")
        .limit(1);

      const latestSim = latestSimList[0];

      let latestScenarioTitle = "No simulations yet";
      let latestScenarioId = null;
      let latestSimulationId = null;
      let overallImpact = 0;
      let affectedPercentage = 0;
      let topCohorts: any[] = [];
      let sensitiveAttributes: any[] = [];

      if (latestSim) {
        latestSimulationId = latestSim.ID;
        latestScenarioId = latestSim.scenario_ID;
        overallImpact = latestSim.overallImpactScore;
        affectedPercentage = latestSim.affectedPercentage;

        if (latestScenarioId) {
          const sc = await SELECT.one.from(Scenarios).where({ ID: latestScenarioId });
          if (sc) latestScenarioTitle = sc.title;
        }

        // Top cohorts for latest simulation
        const cohortsList = await SELECT.from(Cohorts)
          .where({ simulation_ID: latestSim.ID })
          .orderBy("averageImpact desc")
          .limit(5);

        topCohorts = cohortsList.map((c: any) => ({
          name: c.name,
          cohortKey: c.cohortKey,
          population: c.populationCount,
          averageImpact: c.averageImpact,
          riskLevel: c.riskLevel,
        }));

        // Sensitive attributes
        const cfList = await SELECT.from(CounterfactualResults)
          .where({ simulation_ID: latestSim.ID })
          .orderBy("difference desc")
          .limit(5);

        sensitiveAttributes = cfList.map((cf: any) => ({
          attribute: cf.attributeKey,
          displayName: cf.attributeDisplayName,
          difference: cf.difference,
          status: cf.status,
          requiresInvestigation: cf.requiresInvestigation,
        }));
      }

      // Recent 5 simulations
      const recentList = await SELECT.from(Simulations)
        .orderBy("runAt desc")
        .limit(5);

      const recentSimulations: any[] = [];
      for (const sim of recentList) {
        let scTitle = "Policy Scenario";
        let scType = "work_model_change";
        if (sim.scenario_ID) {
          const sc = await SELECT.one.from(Scenarios).where({ ID: sim.scenario_ID });
          if (sc) {
            scTitle = sc.title;
            scType = sc.scenarioType;
          }
        }
        recentSimulations.push({
          ID: sim.ID,
          scenarioTitle: scTitle,
          scenarioType: scType,
          runAt: sim.runAt,
          overallImpactScore: sim.overallImpactScore,
          affectedPercentage: sim.affectedPercentage,
        });
      }

      return {
        totalWorkforce,
        scenariosSimulated,
        latestScenarioTitle,
        latestScenarioId,
        latestSimulationId,
        overallImpact,
        affectedPercentage,
        topCohorts,
        sensitiveAttributes,
        recentSimulations,
      };
    });

    /**
     * analyzeScenario(scenarioText)
     */
    this.on("analyzeScenario", async (req) => {
      const { scenarioText } = req.data;
      if (!scenarioText || !scenarioText.trim()) {
        return req.error(400, "Scenario text cannot be empty.");
      }

      const analysis = await aiProvider.analyzeScenario(scenarioText);
      const scenarioId = crypto.randomUUID();

      // Save scenario
      await INSERT.into(Scenarios).entries({
        ID: scenarioId,
        title: analysis.title,
        description: analysis.description,
        rawScenarioText: scenarioText,
        scenarioType: analysis.scenarioType,
        changesJson: JSON.stringify(analysis.changes),
        status: "ANALYZED",
      });

      // Save dimensions
      const dimensionEntries = analysis.affectedDimensions.map((dim) => ({
        ID: crypto.randomUUID(),
        scenario_ID: scenarioId,
        dimensionKey: dim.dimensionKey,
        dimensionName: dim.dimensionName,
        sensitivityWeight: dim.sensitivityWeight,
        rationale: dim.rationale,
        mappedAttributes: dim.mappedAttributes.join(", "),
      }));

      if (dimensionEntries.length > 0) {
        await INSERT.into(ScenarioDimensions).entries(dimensionEntries);
      }

      return {
        scenarioId,
        scenarioType: analysis.scenarioType,
        title: analysis.title,
        description: analysis.description,
        rawScenarioText: scenarioText,
        changes: analysis.changes.map((c) => ({
          attribute: c.attribute,
          beforeValue: String(c.beforeValue),
          afterValue: String(c.afterValue),
        })),
        affectedDimensions: analysis.affectedDimensions.map((d) => ({
          dimensionKey: d.dimensionKey,
          dimensionName: d.dimensionName,
          sensitivityWeight: d.sensitivityWeight,
          rationale: d.rationale,
          mappedAttributes: d.mappedAttributes.join(", "),
        })),
      };
    });

    /**
     * createAndSimulateScenario(title, rawScenarioText)
     */
    this.on("createAndSimulateScenario", async (req) => {
      const { title, rawScenarioText } = req.data;
      const text = rawScenarioText || title;
      if (!text || !text.trim()) {
        return req.error(400, "Scenario text is required.");
      }

      const analysis = await aiProvider.analyzeScenario(text);
      const scenarioId = crypto.randomUUID();

      await INSERT.into(Scenarios).entries({
        ID: scenarioId,
        title: title || analysis.title,
        description: analysis.description,
        rawScenarioText: text,
        scenarioType: analysis.scenarioType,
        changesJson: JSON.stringify(analysis.changes),
        status: "ANALYZED",
      });

      const dimensionEntries = analysis.affectedDimensions.map((dim) => ({
        ID: crypto.randomUUID(),
        scenario_ID: scenarioId,
        dimensionKey: dim.dimensionKey,
        dimensionName: dim.dimensionName,
        sensitivityWeight: dim.sensitivityWeight,
        rationale: dim.rationale,
        mappedAttributes: dim.mappedAttributes.join(", "),
      }));

      if (dimensionEntries.length > 0) {
        await INSERT.into(ScenarioDimensions).entries(dimensionEntries);
      }

      // Run simulation directly
      return await executeSimulation(scenarioId, this);
    });

    /**
     * runSimulation(scenarioId)
     */
    this.on("runSimulation", async (req) => {
      const { scenarioId } = req.data;
      if (!scenarioId) {
        return req.error(400, "Scenario ID is required.");
      }

      return await executeSimulation(scenarioId, this);
    });

    /**
     * runCounterfactual(simulationId, attributes)
     */
    this.on("runCounterfactual", async (req) => {
      const { simulationId } = req.data;
      if (!simulationId) {
        return req.error(400, "Simulation ID is required.");
      }

      const list = await SELECT.from(CounterfactualResults)
        .where({ simulation_ID: simulationId })
        .orderBy("difference desc");

      return list.map((c: any) => ({
        attributeKey: c.attributeKey,
        attributeDisplayName: c.attributeDisplayName,
        originalAverageImpact: c.originalAverageImpact,
        counterfactualAverageImpact: c.counterfactualAverageImpact,
        difference: c.difference,
        status: c.status,
        requiresInvestigation: c.requiresInvestigation,
        rationale: c.rationale,
      }));
    });

    /**
     * generateSyntheticWorkforce(count)
     */
    this.on("generateSyntheticWorkforce", async (req) => {
      const count = req.data.count || 300;
      const workforce = generateWorkforce(count);

      // Clean existing personas and dependent tables
      await DELETE.from(CohortMembers);
      await DELETE.from(SimulationResults);
      await DELETE.from(Personas);

      // Bulk insert personas
      const batchSize = 100;
      for (let i = 0; i < workforce.length; i += batchSize) {
        const batch = workforce.slice(i, i + batchSize).map((p) => ({
          ID: crypto.randomUUID(),
          ...p,
        }));
        await INSERT.into(Personas).entries(batch);
      }

      return {
        count: workforce.length,
        message: `Successfully generated and persisted ${workforce.length} universal synthetic personas into SAP database.`,
      };
    });

    /**
     * seedDemoData()
     */
    this.on("seedDemoData", async (req) => {
      return await runDemoSeed(this);
    });

    /**
     * Helper to execute simulation logic
     */
    async function executeSimulation(scenarioId: string, srv: SimulynxService) {
      const scenario = await SELECT.one.from(Scenarios).where({ ID: scenarioId });
      if (!scenario) {
        throw new Error(`Scenario ${scenarioId} not found.`);
      }

      // Check if workforce exists, otherwise generate default 300
      let personas = await SELECT.from(Personas);
      if (!personas || personas.length === 0) {
        const generated = generateWorkforce(300);
        for (let i = 0; i < generated.length; i += 100) {
          const chunk = generated.slice(i, i + 100).map((p) => ({
            ID: crypto.randomUUID(),
            ...p,
          }));
          await INSERT.into(Personas).entries(chunk);
        }
        personas = await SELECT.from(Personas);
      }

      // Load dimensions
      const rawDimensions = await SELECT.from(ScenarioDimensions).where({ scenario_ID: scenarioId });
      const activatedDimensions = rawDimensions.map((d: any) => ({
        dimensionKey: d.dimensionKey,
        dimensionName: d.dimensionName,
        sensitivityWeight: Number(d.sensitivityWeight),
        rationale: d.rationale,
        mappedAttributes: (d.mappedAttributes || "").split(",").map((s: string) => s.trim()),
      }));

      // Parse changes
      let changes: any[] = [];
      try {
        changes = JSON.parse(scenario.changesJson || "[]");
      } catch {
        changes = [];
      }

      // Compute universal ontology mapping to obtain attributePressures
      const ontologyMapping = mapScenarioToOntology(
        scenario.scenarioType,
        changes,
        scenario.rawScenarioText || scenario.description
      );

      const simContext = {
        scenarioType: scenario.scenarioType,
        changes,
        activatedDimensions: activatedDimensions.length > 0 ? activatedDimensions : ontologyMapping.activatedDimensions,
        attributePressures: ontologyMapping.attributePressures,
        rawScenarioText: scenario.rawScenarioText || scenario.description,
      };

      // 1. Dynamic Cohorts
      const generatedCohorts = generateDynamicCohorts(
        activatedDimensions,
        personas as unknown as PersonaData[]
      );

      // 2. Simulation Engine
      const simRun = simulationEngine.runSimulation(
        personas as unknown as PersonaData[],
        generatedCohorts,
        simContext
      );

      // 3. Red Team Engine
      const redTeamResults = redTeamEngine.runCounterfactualAnalysis(
        personas as unknown as PersonaData[],
        simContext
      );

      // 4. AI Explanation
      const aiSummary = await aiProvider.explainSimulation({
        scenarioTitle: scenario.title,
        scenarioType: scenario.scenarioType,
        totalPersonas: simRun.totalPersonas,
        overallImpactScore: simRun.overallImpactScore,
        affectedPercentage: simRun.affectedPercentage,
        highImpactCount: simRun.highImpactCount,
        mediumImpactCount: simRun.mediumImpactCount,
        lowImpactCount: simRun.lowImpactCount,
        avgFlexibilityScore: simRun.avgFlexibilityScore,
        avgAccessibilityScore: simRun.avgAccessibilityScore,
        avgWellbeingScore: simRun.avgWellbeingScore,
        avgAdoptionScore: simRun.avgAdoptionScore,
        avgRetentionRiskScore: simRun.avgRetentionRiskScore,
        topCohorts: simRun.cohortResults.slice(0, 5).map((c) => ({
          name: c.name,
          population: c.populationCount,
          averageImpact: c.averageImpact,
          riskLevel: c.riskLevel,
        })),
        counterfactuals: redTeamResults,
      });

      const simulationId = crypto.randomUUID();
      const runAt = new Date().toISOString();

      // Persist simulation record
      await INSERT.into(Simulations).entries({
        ID: simulationId,
        scenario_ID: scenarioId,
        runAt,
        totalPersonas: simRun.totalPersonas,
        overallImpactScore: simRun.overallImpactScore,
        affectedPercentage: simRun.affectedPercentage,
        highImpactCount: simRun.highImpactCount,
        mediumImpactCount: simRun.mediumImpactCount,
        lowImpactCount: simRun.lowImpactCount,
        avgFlexibilityScore: simRun.avgFlexibilityScore,
        avgAccessibilityScore: simRun.avgAccessibilityScore,
        avgWellbeingScore: simRun.avgWellbeingScore,
        avgAdoptionScore: simRun.avgAdoptionScore,
        avgRetentionRiskScore: simRun.avgRetentionRiskScore,
        status: "COMPLETED",
        aiExecutiveSummary: aiSummary.executiveSummary,
        aiKeyFindings: aiSummary.keyFindings.join("\n• "),
        aiQuestionsForReview: aiSummary.questionsForReview.join("\n• "),
      });

      // Update scenario status
      await UPDATE(Scenarios).set({ status: "SIMULATED" }).where({ ID: scenarioId });

      // Persist Cohorts and Members
      for (const c of simRun.cohortResults) {
        const cohortId = crypto.randomUUID();
        await INSERT.into(Cohorts).entries({
          ID: cohortId,
          scenario_ID: scenarioId,
          simulation_ID: simulationId,
          cohortKey: c.cohortKey,
          name: c.name,
          description: c.description,
          criteriaDescription: c.criteriaDescription,
          populationCount: c.populationCount,
          populationPercentage: c.populationPercentage,
          averageImpact: c.averageImpact,
          riskLevel: c.riskLevel,
        });

        // Insert cohort members (up to 50 for storage efficiency per cohort)
        const memberEntries = c.members.slice(0, 50).map((m) => {
          const p = personas.find((x: any) => x.externalId === m.externalId);
          return {
            ID: crypto.randomUUID(),
            cohort_ID: cohortId,
            persona_ID: p?.ID,
            matchScore: m.matchScore,
            contributingFactors: m.contributingFactors,
          };
        });

        if (memberEntries.length > 0) {
          await INSERT.into(CohortMembers).entries(memberEntries);
        }
      }

      // Persist Individual Simulation Results
      const resBatch: any[] = [];
      for (const res of simRun.personaResults) {
        const p = personas.find((x: any) => x.externalId === res.externalId);
        resBatch.push({
          ID: crypto.randomUUID(),
          simulation_ID: simulationId,
          persona_ID: p?.ID,
          overallImpactScore: res.overallImpactScore,
          flexibilityScore: res.flexibilityScore,
          accessibilityScore: res.accessibilityScore,
          wellbeingScore: res.wellbeingScore,
          adoptionScore: res.adoptionScore,
          retentionRiskScore: res.retentionRiskScore,
          reaction: res.reaction,
          primaryConcern: res.primaryConcern,
          simulatedThought: res.simulatedThought,
          explanationText: res.explanationText,
          driversJson: JSON.stringify(res.drivers),
        });
      }

      for (let i = 0; i < resBatch.length; i += 100) {
        await INSERT.into(SimulationResults).entries(resBatch.slice(i, i + 100));
      }

      // Persist Counterfactual Results
      if (redTeamResults.length > 0) {
        const cfEntries = redTeamResults.map((cf) => ({
          ID: crypto.randomUUID(),
          simulation_ID: simulationId,
          attributeKey: cf.attributeKey,
          attributeDisplayName: cf.attributeDisplayName,
          originalAverageImpact: cf.originalAverageImpact,
          counterfactualAverageImpact: cf.counterfactualAverageImpact,
          difference: cf.difference,
          status: cf.status,
          requiresInvestigation: cf.requiresInvestigation,
          rationale: cf.rationale,
        }));
        await INSERT.into(CounterfactualResults).entries(cfEntries);
      }

      return {
        simulationId,
        scenarioId,
        scenarioTitle: scenario.title,
        scenarioType: scenario.scenarioType,
        runAt,
        totalPersonas: simRun.totalPersonas,
        overallImpactScore: simRun.overallImpactScore,
        affectedPercentage: simRun.affectedPercentage,
        highImpactCount: simRun.highImpactCount,
        mediumImpactCount: simRun.mediumImpactCount,
        lowImpactCount: simRun.lowImpactCount,
        avgFlexibility: simRun.avgFlexibilityScore,
        avgAccessibility: simRun.avgAccessibilityScore,
        avgWellbeing: simRun.avgWellbeingScore,
        avgAdoption: simRun.avgAdoptionScore,
        avgRetentionRisk: simRun.avgRetentionRiskScore,
        executiveSummary: aiSummary.executiveSummary,
        keyFindings: aiSummary.keyFindings.join("\n• "),
        questionsForReview: aiSummary.questionsForReview.join("\n• "),
      };
    }

    /**
     * Helper to run initial demo seed
     */
    async function runDemoSeed(srv: SimulynxService) {
      // 1. Generate 300 personas
      const workforce = generateWorkforce(300);
      await DELETE.from(CohortMembers);
      await DELETE.from(SimulationResults);
      await DELETE.from(CounterfactualResults);
      await DELETE.from(Cohorts);
      await DELETE.from(Simulations);
      await DELETE.from(ScenarioDimensions);
      await DELETE.from(Scenarios);
      await DELETE.from(Personas);

      for (let i = 0; i < workforce.length; i += 100) {
        const chunk = workforce.slice(i, i + 100).map((p) => ({
          ID: crypto.randomUUID(),
          ...p,
        }));
        await INSERT.into(Personas).entries(chunk);
      }

      // 2. Seed the 5 standard demo scenarios
      const sampleScenarios = [
        {
          text: "Our company is moving from 2 mandatory office days to 5.",
          title: "5-Day Office Policy",
          isPrimary: true,
        },
        {
          text: "Move the company office to a new location that increases average commute time.",
          title: "Suburban Campus Relocation",
          isPrimary: false,
        },
        {
          text: "Introduce an AI coding assistant across engineering teams.",
          title: "Enterprise AI Coding Assistant Rollout",
          isPrimary: false,
        },
        {
          text: "Introduce continuous AI-assisted performance monitoring.",
          title: "Continuous AI Performance Monitoring",
          isPrimary: false,
        },
        {
          text: "Make Friday a mandatory office day.",
          title: "Mandatory Friday In-Office Policy",
          isPrimary: false,
        },
      ];

      let primaryScenarioId = "";

      for (const sc of sampleScenarios) {
        const analysis = await aiProvider.analyzeScenario(sc.text);
        const scenarioId = crypto.randomUUID();
        if (sc.isPrimary) primaryScenarioId = scenarioId;

        await INSERT.into(Scenarios).entries({
          ID: scenarioId,
          title: sc.title,
          description: analysis.description,
          rawScenarioText: sc.text,
          scenarioType: analysis.scenarioType,
          changesJson: JSON.stringify(analysis.changes),
          status: "DRAFT",
          isBaseline: sc.isPrimary,
        });

        const dimensionEntries = analysis.affectedDimensions.map((dim) => ({
          ID: crypto.randomUUID(),
          scenario_ID: scenarioId,
          dimensionKey: dim.dimensionKey,
          dimensionName: dim.dimensionName,
          sensitivityWeight: dim.sensitivityWeight,
          rationale: dim.rationale,
          mappedAttributes: dim.mappedAttributes.join(", "),
        }));

        if (dimensionEntries.length > 0) {
          await INSERT.into(ScenarioDimensions).entries(dimensionEntries);
        }
      }

      // 3. Pre-run simulation for the primary demo scenario so dashboard is active immediately
      if (primaryScenarioId) {
        await executeSimulation(primaryScenarioId, srv);
      }

      return {
        message: "Successfully seeded Simulynx with 300 synthetic personas and 5 benchmark scenarios.",
        personaCount: 300,
        scenarioCount: sampleScenarios.length,
        simulationCount: 1,
      };
    }

    await super.init();

    // Auto-seed if database is empty on server startup
    setImmediate(async () => {
      try {
        let countRes: any;
        try {
          countRes = await SELECT.from(Personas).columns("count(*) as total");
        } catch (tableErr: any) {
          if (tableErr.message?.includes("no such table")) {
            console.log("[Simulynx] Database tables not found. Deploying CDS schema automatically...");
            const db = await cds.connect.to("db");
            const model = await cds.load("*");
            await cds.deploy(model).to(db);
            console.log("[Simulynx] Schema deployed successfully.");
            countRes = [{ total: 0 }];
          } else {
            throw tableErr;
          }
        }

        if (!countRes || !countRes[0]?.total || countRes[0]?.total === 0) {
          console.log("[Simulynx] Empty database detected on startup - auto-seeding 300 universal personas...");
          await runDemoSeed(this);
          console.log("[Simulynx] Auto-seeding completed successfully.");
        }
      } catch (e: any) {
        console.error("[Simulynx] Startup auto-seed check notice:", e.message || e);
      }
    });
  }
}
