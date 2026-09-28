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

      // App state model for Universal Scenario Engine
      var oAppState = new JSONModel({
        selectedKey: "overview",
        busy: false,
        aiBadgeText: "AI: Checking...",
        aiBadgeState: "None",
        aiBadgeIcon: "sap-icon://synchronize",
        aiStatus: null,
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
          scenarioType: "policy_evaluation",
          changes: [{ attribute: "inOfficeDaysPerWeek", beforeValue: "2", afterValue: "5" }],
          dimensions: [],
          confidence: 0.95,
          unmappedConcepts: "",
          clarificationNeeded: "",
          isSimulatable: true,
          argumentsFor: "• Enables spontaneous hallway interactions, whiteboard ideation, and rapid cross-functional alignment.\n• Strengthens organizational culture and informal apprenticeship for junior talent.",
          argumentsAgainst: "• Significantly increases weekly unpaid commuting time and transit fatigue.\n• Creates acute schedule friction for primary caregivers bound to strict daycare hours."
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
          executiveSummary: "The simulated impact across 300 synthetic profiles averages 28.9%, with 21% of the workforce registering material scheduling or operational friction.",
          keyFindings: "• Overall workforce simulated impact: 28.9%\n• Concentration among Long-Distance Commuters and Caregiver cohorts.",
          questionsForReview: "• What specific organizational outcome is this policy primarily intended to drive?\n• How will the organization provide formal accommodations for the most sensitive cohorts?",
          mitigationOptions: "• Provide flexible core arrival/departure hours (10:00-15:30) to bypass peak transit congestion.\n• Establish structured family-care scheduling buffers and asynchronous check-in alternatives.",
          argumentsFor: "• Enhances spontaneous collaboration and team bonding.\n• Accelerates onboarding immersion for junior employees.",
          argumentsAgainst: "• Disproportionately strains primary caregivers.\n• Compounds commuting fatigue on long transit corridors.",
          confidence: 0.95,
          unmappedConcepts: "",
          clarificationNeeded: ""
        }
      });

      this.setModel(oAppState, "appState");
    }
  });
});
