sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("sap.simulynx.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);

      // App state model
      var oAppState = new JSONModel({
        selectedKey: "overview",
        busy: false,
        totalWorkforce: 300,
        scenariosSimulated: 1,
        latestScenarioTitle: "5-Day Office Policy",
        latestSimulationId: "",
        latestScenarioId: "",
        overallImpact: 28.9,
        affectedPercentage: 21.0,
        topCohorts: [],
        sensitiveAttributes: [],
        recentSimulations: [],
        personas: [],
        cohorts: [],
        simulationResults: [],
        counterfactuals: [],
        activeScenario: {
          title: "5-Day Office Policy",
          rawText: "Our company is moving from 2 mandatory office days to 5.",
          scenarioType: "work_model_change",
          changes: [{ attribute: "officeDays", beforeValue: "2", afterValue: "5" }],
          dimensions: []
        },
        activeSimulation: {
          overallImpactScore: 28.9,
          affectedPercentage: 21.0,
          highImpactCount: 0,
          mediumImpactCount: 63,
          lowImpactCount: 237,
          avgFlexibility: 52.1,
          avgAccessibility: 92.8,
          avgWellbeing: 61.4,
          avgAdoption: 60.6,
          avgRetentionRisk: 38.1,
          executiveSummary: "The simulation indicates an overall workforce impact score of 28.9%, with 21% of the digital workforce experiencing material schedule or logistics friction.",
          keyFindings: "• Overall workforce simulated impact: 28.9%\n• Concentration among Accessibility-Sensitive and Caregiver cohorts.",
          questionsForReview: "• Can a 3-day anchor balance collaboration and retention?\n• Are facilities equipped with adequate quiet focus zones?"
        }
      });

      this.setModel(oAppState, "appState");
    }
  });
});
