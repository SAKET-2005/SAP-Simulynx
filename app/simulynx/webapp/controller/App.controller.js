sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/VBox",
  "sap/m/HBox",
  "sap/m/Text",
  "sap/m/Title",
  "sap/ui/layout/Grid",
  "sap/ui/core/BusyIndicator"
], function (Controller, MessageToast, MessageBox, Dialog, Button, VBox, HBox, Text, Title, Grid, BusyIndicator) {
  "use strict";

  return Controller.extend("sap.simulynx.controller.App", {
    onInit: function () {
      this.refreshAllData();
    },

    getBaseUrl: function () {
      return "/odata/v4/simulynx";
    },

    refreshAllData: function () {
      var oModel = this.getView().getModel("appState");
      var sBase = this.getBaseUrl();

      // 1. Dashboard Overview
      fetch(sBase + "/getDashboardOverview()")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data) {
            oModel.setProperty("/totalWorkforce", data.totalWorkforce || 300);
            oModel.setProperty("/scenariosSimulated", data.scenariosSimulated || 1);
            oModel.setProperty("/latestScenarioTitle", data.latestScenarioTitle || "5-Day Office Policy");
            oModel.setProperty("/latestScenarioId", data.latestScenarioId);
            oModel.setProperty("/latestSimulationId", data.latestSimulationId);
            oModel.setProperty("/overallImpact", data.overallImpact || 28.9);
            oModel.setProperty("/affectedPercentage", data.affectedPercentage || 21.0);
            oModel.setProperty("/topCohorts", data.topCohorts || []);
            oModel.setProperty("/sensitiveAttributes", data.sensitiveAttributes || []);
            oModel.setProperty("/recentSimulations", data.recentSimulations || []);
          }
        })
        .catch(function (err) {
          console.error("Dashboard overview fetch error:", err);
        });

      // 2. Personas (load 300)
      fetch(sBase + "/Personas?$top=300&$orderby=externalId asc")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.value) {
            oModel.setProperty("/personas", data.value);
            oModel.setProperty("/allPersonas", data.value);
          }
        })
        .catch(function (err) {
          console.error("Personas fetch error:", err);
        });

      // 3. Cohorts
      fetch(sBase + "/Cohorts?$top=50&$orderby=averageImpact desc")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.value) {
            oModel.setProperty("/cohorts", data.value);
          }
        })
        .catch(function (err) {
          console.error("Cohorts fetch error:", err);
        });

      // 4. Latest Simulation & Results
      fetch(sBase + "/Simulations?$top=1&$orderby=runAt desc&$expand=results,counterfactuals,cohorts")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.value && data.value.length > 0) {
            var sim = data.value[0];
            oModel.setProperty("/activeSimulation", {
              overallImpactScore: sim.overallImpactScore,
              affectedPercentage: sim.affectedPercentage,
              highImpactCount: sim.highImpactCount,
              mediumImpactCount: sim.mediumImpactCount,
              lowImpactCount: sim.lowImpactCount,
              avgFlexibility: sim.avgFlexibilityScore,
              avgAccessibility: sim.avgAccessibilityScore,
              avgWellbeing: sim.avgWellbeingScore,
              avgAdoption: sim.avgAdoptionScore,
              avgRetentionRisk: sim.avgRetentionRiskScore,
              executiveSummary: sim.aiExecutiveSummary,
              keyFindings: sim.aiKeyFindings,
              questionsForReview: sim.aiQuestionsForReview
            });

            if (sim.counterfactuals) {
              oModel.setProperty("/counterfactuals", sim.counterfactuals);
            }
          }
        })
        .catch(function (err) {
          console.error("Simulations fetch error:", err);
        });

      // 5. Individual Simulation Results
      fetch(sBase + "/SimulationResults?$top=300&$orderby=overallImpactScore desc")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.value) {
            oModel.setProperty("/simulationResults", data.value);
          }
        })
        .catch(function (err) {
          console.error("SimulationResults fetch error:", err);
        });
    },

    onTabSelect: function (oEvent) {
      var sKey = oEvent.getParameter("key");
      this.getView().getModel("appState").setProperty("/selectedKey", sKey);
    },

    onSeedData: function () {
      var that = this;
      BusyIndicator.show(0);
      fetch(this.getBaseUrl() + "/seedDemoData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          BusyIndicator.hide();
          MessageToast.show(data.message || "Seeded 300 synthetic personas and scenarios!");
          that.refreshAllData();
        })
        .catch(function (err) {
          BusyIndicator.hide();
          MessageBox.error("Seeding failed: " + err.message);
        });
    },

    onQuickDemo: function () {
      this.runSimulationForText("Our company is moving from 2 mandatory office days to 5.");
    },

    onSelectPresetScenario: function (oEvent) {
      var sText = oEvent.getSource().data("text");
      var oModel = this.getView().getModel("appState");
      oModel.setProperty("/activeScenario/rawText", sText);
      oModel.setProperty("/selectedKey", "create");
      this.onAnalyzeScenario();
    },

    onFillSampleScenario: function (oEvent) {
      var sPrompt = oEvent.getSource().data("prompt");
      this.getView().getModel("appState").setProperty("/activeScenario/rawText", sPrompt);
      this.onAnalyzeScenario();
    },

    onAnalyzeScenario: function () {
      var that = this;
      var oModel = this.getView().getModel("appState");
      var sText = oModel.getProperty("/activeScenario/rawText");
      if (!sText || !sText.trim()) {
        MessageToast.show("Please enter a scenario description.");
        return;
      }

      BusyIndicator.show(0);
      fetch(this.getBaseUrl() + "/analyzeScenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioText: sText })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          BusyIndicator.hide();
          oModel.setProperty("/activeScenario/scenarioId", data.scenarioId);
          oModel.setProperty("/activeScenario/title", data.title);
          oModel.setProperty("/activeScenario/description", data.description);
          oModel.setProperty("/activeScenario/scenarioType", data.scenarioType);
          oModel.setProperty("/activeScenario/changes", data.changes || []);
          oModel.setProperty("/activeScenario/dimensions", data.affectedDimensions || []);
          MessageToast.show("Scenario analyzed. Relevant dimensions activated.");
        })
        .catch(function (err) {
          BusyIndicator.hide();
          MessageBox.error("Analysis failed: " + err.message);
        });
    },

    onRunDirectSimulation: function () {
      var oModel = this.getView().getModel("appState");
      var sText = oModel.getProperty("/activeScenario/rawText") || "Our company is moving from 2 mandatory office days to 5.";
      this.runSimulationForText(sText);
    },

    runSimulationForText: function (sText) {
      var that = this;
      var oModel = this.getView().getModel("appState");

      BusyIndicator.show(0);
      fetch(this.getBaseUrl() + "/createAndSimulateScenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Workforce Policy Simulation",
          rawScenarioText: sText
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          BusyIndicator.hide();
          oModel.setProperty("/activeSimulation", data);
          oModel.setProperty("/latestScenarioTitle", data.scenarioTitle);
          oModel.setProperty("/overallImpact", data.overallImpactScore);
          oModel.setProperty("/affectedPercentage", data.affectedPercentage);
          oModel.setProperty("/selectedKey", "results");

          MessageBox.success(
            "Simulated across 300 universal personas successfully!\nOverall Impact: " +
              data.overallImpactScore +
              "%\nAffected Population: " +
              data.affectedPercentage +
              "%"
          );

          that.refreshAllData();
        })
        .catch(function (err) {
          BusyIndicator.hide();
          MessageBox.error("Simulation failed: " + err.message);
        });
    },

    onInspectPersona: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      var p = oContext.getObject();

      var oDialog = new Dialog({
        title: p.name + " (" + p.externalId + ") - Universal Digital Persona",
        contentWidth: "600px",
        content: new VBox({
          items: [
            new Title({ text: p.role + " | " + p.department + " (" + p.seniority + ")", level: "H4" }),
            new Text({ text: p.personalitySummary, class: "sapUiSmallMarginBottom" }),
            new Title({ text: "10-Dimensional Persona Model:", level: "H5" }),
            new Text({ text: "• Identity: Age " + p.age + ", " + p.education + " [" + p.lifeStage + "]" }),
            new Text({ text: "• Professional: " + p.experienceYears + "y exp, Employment: " + p.employmentType + ", Skills: " + p.skills }),
            new Text({ text: "• Work Style: Remote " + p.remotePreference + "%, Office " + p.officePreference + "%, Collab " + p.collaborationPreference + "%, Autonomy " + p.autonomyPreference + "%" }),
            new Text({ text: "• Life Context: Caregiver: " + (p.caregivingResponsibility ? "Yes (" + p.dependentsCount + " dep)" : "No") + ", Schedule Constraints: " + p.scheduleConstraints + "%" }),
            new Text({ text: "• Logistics: " + p.locationCity + ", Commute: " + p.commuteMinutes + "m (" + p.transportationMode + ", reliability " + p.transportReliability + "%)" }),
            new Text({ text: "• Priorities: Flexibility " + p.flexibilityImportance + "%, Work-Life " + p.workLifeBalanceImportance + "%, Growth " + p.careerGrowthImportance + "%" }),
            new Text({ text: "• Behavior: Tech Adoption " + p.technologyAdoption + "%, Tech Trust " + p.technologyTrust + "%, Change Tolerance " + p.changeTolerance + "%" }),
            new Text({ text: "• Financial: Band " + p.salaryBand + ", Sensitivity " + p.financialSensitivity + "%" }),
            new Text({ text: "• Collaboration: Team size " + p.teamSize + ", Global team: " + (p.globalTeamInvolvement ? "Yes" : "No") }),
            new Text({ text: "• Accessibility: Need score " + p.overallAccessibilityNeed + "%, Mobility: " + (p.mobilityRequirements ? "Yes" : "No") + ", Sensory: " + (p.sensoryRequirements ? "Yes" : "No") }),
            new Title({ text: "Primary Concerns:", level: "H5", class: "sapUiSmallMarginTop" }),
            new Text({ text: p.primaryConcerns })
          ]
        }).addStyleClass("sapUiSmallMargin"),
        beginButton: new Button({
          text: "Close",
          press: function () { oDialog.close(); }
        }),
        afterClose: function () { oDialog.destroy(); }
      });

      oDialog.open();
    },

    onInspectDrivers: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      var item = oContext.getObject();

      var drivers = [];
      try {
        drivers = JSON.parse(item.driversJson || "[]");
      } catch (e) {
        drivers = [];
      }

      var driverTexts = drivers.map(function (d) {
        return new VBox({
          items: [
            new Text({ text: "• " + d.attribute + " (Influence: " + d.influence + ")" }),
            new Text({ text: d.note, class: "simKpiSub sapUiTinyMarginBegin" })
          ]
        });
      });

      var oDialog = new Dialog({
        title: "Simulation Drivers: " + item.name,
        contentWidth: "500px",
        content: new VBox({
          items: [
            new Title({ text: "Simulated Thought:", level: "H5" }),
            new Text({ text: '"' + item.simulatedThought + '"', class: "sapUiSmallMarginBottom" }),
            new Title({ text: "Primary Quantitative Drivers:", level: "H5" }),
            new VBox({ items: driverTexts }),
            new Title({ text: "Transparent Explanation:", level: "H5", class: "sapUiSmallMarginTop" }),
            new Text({ text: item.explanationText })
          ]
        }).addStyleClass("sapUiSmallMargin"),
        beginButton: new Button({
          text: "Close",
          press: function () { oDialog.close(); }
        }),
        afterClose: function () { oDialog.destroy(); }
      });

      oDialog.open();
    },

    onWorkforceSearch: function (oEvent) {
      var sQuery = (oEvent.getParameter("newValue") || "").toLowerCase();
      var oModel = this.getView().getModel("appState");
      var all = oModel.getProperty("/allPersonas") || [];

      if (!sQuery) {
        oModel.setProperty("/personas", all);
        return;
      }

      var filtered = all.filter(function (p) {
        return (
          p.name.toLowerCase().includes(sQuery) ||
          p.role.toLowerCase().includes(sQuery) ||
          p.locationCity.toLowerCase().includes(sQuery) ||
          p.externalId.toLowerCase().includes(sQuery)
        );
      });
      oModel.setProperty("/personas", filtered);
    },

    onWorkforceFilter: function (oEvent) {
      var sKey = oEvent.getSource().getSelectedKey();
      var oModel = this.getView().getModel("appState");
      var all = oModel.getProperty("/allPersonas") || [];

      if (sKey === "ALL") {
        oModel.setProperty("/personas", all);
        return;
      }

      var filtered = all.filter(function (p) {
        return p.department === sKey;
      });
      oModel.setProperty("/personas", filtered);
    }
  });
});
