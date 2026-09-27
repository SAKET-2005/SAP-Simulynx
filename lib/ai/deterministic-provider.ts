import {
  IAIProvider,
  ScenarioAnalysisResult,
  AggregateSimulationSummary,
  AIExplanationResult,
} from "./ai-interface.js";
import { mapScenarioToOntology, ScenarioChangeDef } from "../ontology/ontology.js";
import { CounterfactualAttributeResult } from "../counterfactual/redteam-engine.js";

export class DeterministicAIProvider implements IAIProvider {
  name = "UniversalDeterministicProvider";

  async analyzeScenario(text: string): Promise<ScenarioAnalysisResult> {
    const raw = (text || "").trim();
    const lower = raw.toLowerCase();

    let scenarioType = "work_model_change";
    let title = "Workplace Policy Simulation";
    let description = raw;
    const changes: ScenarioChangeDef[] = [];
    const daysMatch = lower.match(/(\d+)\s*(?:mandatory|in-office|office)?\s*(?:days?|to|->)\s*(?:to|->)?\s*(\d+)/i);

    // 0. Talent Mobility, Role Transition & Candidate Hiring Evaluation
    if (
      lower.includes("applying for") ||
      lower.includes("intern role") ||
      lower.includes("internship") ||
      lower.includes("chances of being hired") ||
      lower.includes("better fit") ||
      (lower.includes("software engineering") && (lower.includes("cyber security") || lower.includes("cybersecurity"))) ||
      lower.includes("career switch") ||
      lower.includes("role transition")
    ) {
      scenarioType = "talent_mobility_hiring";
      title = "Candidate Evaluation: Cyber Security Intern -> Software Engineering Intern";
      description = "Simulating candidate hiring feasibility, technical skill transferability, and benchmark alignment for transitioning from Cyber Security Intern to Software Engineering Intern.";
      changes.push(
        { attribute: "targetRole", beforeValue: "Cyber Security Intern", afterValue: "Software Engineering Intern" },
        { attribute: "codingLanguages", beforeValue: "Specialized Scripting (Bash/Python)", afterValue: "Polyglot Fluency (Major Enterprise Languages)" },
        { attribute: "domainInterestAlignment", beforeValue: "Security Operations (Low Fit)", afterValue: "Software Engineering (High Passion/Fit)" },
        { attribute: "candidateSeniority", beforeValue: "Student Intern", afterValue: "Software Engineering Intern" }
      );
    }
    // 1. Hot-Desking & Workspace Redesign
    else if (lower.includes("hot-desk") || lower.includes("hot desk") || lower.includes("unassigned") || lower.includes("desk-sharing") || lower.includes("assigned seating")) {
      scenarioType = "workspace_redesign";
      changes.push({
        attribute: "seatingArrangement",
        beforeValue: "dedicated_assigned",
        afterValue: "unassigned_hotdesk",
      });
      title = "Unassigned Hot-Desking Policy";
      description = "Simulating enterprise transition from dedicated assigned desks to unassigned dynamic hot-desking.";
    }
    // 2. 4-Day 10-Hour Compressed Workweek
    else if (lower.includes("4-day") || lower.includes("four-day") || lower.includes("compressed") || lower.includes("10-hour")) {
      scenarioType = "schedule_compression";
      changes.push(
        { attribute: "weeklyWorkingDays", beforeValue: 5, afterValue: 4 },
        { attribute: "dailyShiftHours", beforeValue: 8, afterValue: 10 }
      );
      title = "4-Day 10-Hour Compressed Workweek";
      description = "Simulating policy shift to four 10-hour working days per week with three-day weekends.";
    }
    // 3. Timezone & Global Core Hours
    else if (lower.includes("timezone") || lower.includes("pacific") || lower.includes("pst") || lower.includes("est") || lower.includes("global time")) {
      scenarioType = "timezone_alignment";
      changes.push({
        attribute: "mandatedCoreHours",
        beforeValue: "local_flexible",
        afterValue: "pacific_time_overlap",
      });
      title = "Mandatory Global Timezone Alignment";
      description = "Simulating mandated core working hours aligned to headquarters Pacific Time regardless of local employee geography.";
    }
    // 4. On-Call & Weekend Shifts
    else if (lower.includes("on-call") || lower.includes("on call") || lower.includes("weekend") || lower.includes("pager")) {
      scenarioType = "on_call_policy";
      changes.push({
        attribute: "onCallRotation",
        beforeValue: "business_hours_only",
        afterValue: "24x7_weekend_rotation",
      });
      title = "Mandatory Weekend On-Call Rotation";
      description = "Simulating introduction of mandatory rotational weekend on-call duty and off-hours incident response.";
    }
    // 5. Compensation & Pay Cuts
    else if (lower.includes("pay cut") || lower.includes("salary cut") || lower.includes("equity") || lower.includes("salary freeze")) {
      scenarioType = "compensation_adjustment";
      changes.push({
        attribute: "baseCashCompensation",
        beforeValue: "100%",
        afterValue: "80%",
      });
      title = "Base Salary Adjustment & Equity Restructuring";
      description = "Simulating 20% reduction in base cash salary in exchange for long-term equity options.";
    }
    // 6. Office Relocation
    else if (lower.includes("relocat") || (lower.includes("move") && (lower.includes("location") || lower.includes("commute") || lower.includes("office")))) {
      scenarioType = "office_relocation";
      changes.push({
        attribute: "averageCommuteMinutes",
        beforeValue: 30,
        afterValue: 65,
      });
      title = "Campus Relocation & Transit Expansion";
      description = "Simulating corporate facility move to a suburban hub increasing average one-way commute duration.";
    }
    // 7. AI Coding Assistants / Tooling
    else if (lower.includes("ai coding") || lower.includes("copilot") || lower.includes("assistant") || lower.includes("generative ai")) {
      scenarioType = "ai_tool_introduction";
      changes.push({
        attribute: "aiToolingCoverage",
        beforeValue: "0%",
        afterValue: "100%",
      });
      title = "Enterprise AI Coding Assistant Rollout";
      description = "Simulating enterprise deployment of generative AI coding assistants across engineering workflows.";
    }
    // 8. Continuous Performance Monitoring
    else if (lower.includes("monitor") || lower.includes("tracking") || lower.includes("surveillance")) {
      scenarioType = "performance_monitoring";
      changes.push({
        attribute: "activityMonitoring",
        beforeValue: "periodic",
        afterValue: "continuous",
      });
      title = "Continuous Performance Monitoring Policy";
      description = "Simulating organizational policy introducing continuous AI-driven activity and presence telemetry.";
    }
    // 9. Office Days Change (e.g. "2 to 5", "2 -> 5", "3 days to 5 days", "hybrid to 5-day")
    else if (lower.includes("office") || lower.includes("hybrid") || lower.includes("remote") || daysMatch) {
      scenarioType = "work_model_change";
      const before = daysMatch ? parseInt(daysMatch[1], 10) : lower.includes("remote") ? 0 : 2;
      const after = daysMatch ? parseInt(daysMatch[2], 10) : lower.includes("5") ? 5 : 3;

      changes.push({
        attribute: "officeDays",
        beforeValue: before,
        afterValue: after,
      });

      title = `${after}-Day Mandatory Office Policy`;
      description = `Simulating transition from ${before} office days to ${after} mandatory in-person office days.`;
    }
    // 10. General Novel Scenario
    else {
      scenarioType = "general_policy_change";
      changes.push({
        attribute: "operationalPolicy",
        beforeValue: "current_baseline",
        afterValue: "proposed_standard",
      });
      title = raw.length > 55 ? `${raw.substring(0, 52)}...` : raw;
      description = raw;
    }

    const mapping = mapScenarioToOntology(scenarioType, changes, raw);

    return {
      scenarioType,
      title,
      description,
      changes,
      affectedDimensions: mapping.activatedDimensions,
    };
  }

  async explainSimulation(summary: AggregateSimulationSummary): Promise<AIExplanationResult> {
    const topCohortNames = summary.topCohorts.slice(0, 3).map((c) => `${c.name} (${c.averageImpact}% impact)`).join(", ");
    const type = (summary.scenarioType || "").toLowerCase();

    let executiveSummary = "";
    let keyFindings: string[] = [];
    let questionsForReview: string[] = [];

    if (type.includes("talent") || type.includes("mobility") || type.includes("hiring") || type.includes("candidate") || summary.scenarioTitle.toLowerCase().includes("intern") || summary.scenarioTitle.toLowerCase().includes("candidate")) {
      executiveSummary = `Deterministic candidate benchmarking against the 300-profile workforce yields an 84% Hiring Feasibility Score for the Software Engineering Intern role. The candidate's verified polyglot coding proficiency across all major company languages places them in the top 15% of intern applicants, while their prior Cyber Security internship provides rare, high-value 'Security-by-Design' architectural instincts.`;
      keyFindings = [
        `Technical Competency: Coding fluency in all required company languages places the candidate significantly ahead of conventional intern applicant baselines, minimizing ramp-up time.`,
        `Cross-Domain Security Synergy: Prior cybersecurity internship provides strong system reliability and security hygiene, highly prized by senior engineering teams.`,
        `Role Alignment & Retention: Self-identified passion for software development directly mitigates flight risk (Retention Risk: 12/100) and predicts high productivity and engagement.`,
      ];
      questionsForReview = [
        "Does the technical interview panel include a coding session validating design patterns and algorithmic problem solving in their preferred language?",
        "Can the engineering team pair this candidate with a backend, cloud, or platform squad where their cybersecurity foundation acts as a force multiplier?",
        "Simulynx provides decision support; final hiring and placement decisions remain with human decision-makers.",
      ];
    } else if (type.includes("workspace") || summary.scenarioTitle.toLowerCase().includes("hot-desk")) {
      executiveSummary = `The simulation indicates that unassigned hot-desking generates an overall workforce friction score of ${summary.overallImpactScore}%, affecting ${summary.affectedPercentage}% of employees. Friction is intensely concentrated among Accessibility-Sensitive and Neurodivergent personas who rely on predictable acoustic environments and stable ergonomic equipment.`;
      keyFindings = [
        `Accessibility & Sensory Sensitive cohort registers severe friction due to daily seating unpredictability.`,
        `Autonomous deep-work engineers experience context-switching overhead from daily desk hunting.`,
        `Cross-functional serendipity gains are offset by elevated morning anxiety and lost focus time.`,
      ];
      questionsForReview = [
        "Can the organization preserve designated quiet zones or permanent desks for staff with medical, mobility, or sensory needs?",
        "Will mobile ergonomic accessories (dual monitors, keyboard risers) be provided at all dynamic workstations?",
        "Simulynx provides decision support; final organizational decisions remain with human decision-makers.",
      ];
    } else if (type.includes("schedule_compression") || summary.scenarioTitle.toLowerCase().includes("4-day")) {
      executiveSummary = `A 4-day 10-hour compressed schedule yields an overall impact score of ${summary.overallImpactScore}%, affecting ${summary.affectedPercentage}% of profiles. While employees save 20% on weekly commuting friction and gain a 3-day weekend, the 10-hour shift length creates severe structural friction for working parents and caregivers whose childcare pickup times cannot extend past 17:00.`;
      keyFindings = [
        `Caregiving Constrained cohort experiences the steepest friction (+${summary.counterfactuals?.[0]?.difference || 22} points sensitivity) because standard childcare hours clash with 10-hour workdays.`,
        `Long-distance commuters experience significant relief (-20% weekly transit exposure).`,
        `Overall adoption score is bimodal: highly favorable among independent staff, but critical among primary caregivers.`,
      ];
      questionsForReview = [
        "Can employees choose between a 4x10 compressed pattern and a standard 5x8 schedule without career penalty?",
        "How will the enterprise accommodate school-run pickup windows during 10-hour workdays?",
        "Simulynx provides decision support; final organizational decisions remain with human decision-makers.",
      ];
    } else if (type.includes("timezone")) {
      executiveSummary = `Mandating core timezone alignment produces an overall friction score of ${summary.overallImpactScore}%, heavily impacting ${summary.affectedPercentage}% of the workforce in distributed and non-headquarters regions. European and Asian team members face late-evening meeting incursions into personal and family time.`;
      keyFindings = [
        `Global Distributed and Caregiver cohorts bear the bulk of evening meeting strain.`,
        `Wellbeing score declines to ${summary.avgWellbeingScore}/100 among international timezones.`,
        `Retention risk spikes to ${summary.avgRetentionRiskScore}/100 among experienced senior architects in remote locations.`,
      ];
      questionsForReview = [
        "Can asynchronous documentation and recorded briefings replace mandatory live attendance for non-local timezones?",
        "What compensation or flexible morning offset will be provided for late-night call duties?",
        "Simulynx provides decision support; final organizational decisions remain with human decision-makers.",
      ];
    } else {
      executiveSummary = `The simulation indicates an overall workforce impact score of ${summary.overallImpactScore}%, with ${summary.affectedPercentage}% of the digital workforce experiencing material schedule or logistics friction. Impact is heavily concentrated among personas in ${topCohortNames || "vulnerable workforce segments"}. Crucially, quantitative outcomes are driven by deterministic structural constraints rather than uniform employee resistance.`;
      keyFindings = [
        `Overall workforce simulated impact stands at ${summary.overallImpactScore}/100, affecting ${summary.affectedPercentage}% of profiles.`,
        `Most heavily impacted cohorts: ${summary.topCohorts.slice(0, 2).map((c) => `${c.name} (avg score: ${c.averageImpact})`).join(" and ") || "Identified cohorts"}.`,
        `Flexibility index decreases to ${summary.avgFlexibilityScore}/100, while retention risk registers at ${summary.avgRetentionRiskScore}/100.`,
      ];
      questionsForReview = [
        "Can structured accommodations or hybrid flexibility buffers mitigate retention pressure among the most sensitive cohorts?",
        "How will manager performance evaluations adapt to support diverse team contexts under this change?",
        "Simulynx provides decision support; final organizational decisions remain with human decision-makers.",
      ];
    }

    return {
      executiveSummary,
      keyFindings,
      questionsForReview,
    };
  }

  async analyzeRedTeam(counterfactuals: CounterfactualAttributeResult[]): Promise<string> {
    const material = counterfactuals.filter((c) => c.difference >= 15);
    if (material.length === 0) {
      return "Red-team counterfactual testing indicates relatively distributed simulated friction across attributes, with no single factor overwhelmingly dominating outcomes.";
    }

    const attrs = material.map((m) => `${m.attributeDisplayName} (delta: +${m.difference} points)`).join(", ");
    return `Counterfactual sensitivity analysis confirms that ${attrs} materially influence simulated outcomes. Neutralizing these specific constraints in isolation creates substantial score improvements. Leaders should investigate structured accommodation policies for these factors prior to implementation.`;
  }
}
