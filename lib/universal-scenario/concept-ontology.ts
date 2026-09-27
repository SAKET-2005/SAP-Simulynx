import { ActivatedDimension, AttributePressure } from "./types.js";

export interface ConceptDefinition {
  conceptKey: string;
  matchPatterns: (string | RegExp)[];
  description: string;
  associatedDimensions: {
    dimensionKey: string;
    dimensionName: string;
    sensitivityWeight: number;
    rationale: string;
    mappedAttributes: string[];
  }[];
  attributePressures: {
    attributeName: string;
    dimensionKey: string;
    direction: "increase_friction" | "relieve_friction";
    intensity: number;
    sensitivityWeight: number;
    rationale: string;
  }[];
  argumentsFor: string[];
  argumentsAgainst: string[];
  typicalStakeholders: string[];
}

/**
 * Universal Concept Ontology Registry
 * Maps conceptual themes to dimensions, attribute pressures, and neutral arguments.
 */
export const CONCEPT_ONTOLOGY_REGISTRY: ConceptDefinition[] = [
  // 1. Video Cameras & Meeting Presence
  {
    conceptKey: "virtual_camera_presence",
    matchPatterns: ["camera", "video", "webcam", "camera-on", "cameras on", "camera on", "zoom fatigue", "virtual meeting"],
    description: "Policies or practices mandating video camera engagement during virtual collaboration.",
    associatedDimensions: [
      {
        dimensionKey: "accessibility",
        dimensionName: "Accessibility & Sensory Load",
        sensitivityWeight: 0.92,
        rationale: "Continuous camera self-monitoring elevates cognitive load and visual sensory strain, particularly for neurodivergent employees.",
        mappedAttributes: ["sensoryRequirements", "overallAccessibilityNeed", "environmentalRequirements"],
      },
      {
        dimensionKey: "flexibility",
        dimensionName: "Autonomy & Personal Workspace Privacy",
        sensitivityWeight: 0.88,
        rationale: "Mandatory video reveals private home environments, restricting personal boundary control.",
        mappedAttributes: ["autonomyPreference", "scheduleConstraints"],
      },
      {
        dimensionKey: "collaboration",
        dimensionName: "Collaboration & Team Connection",
        sensitivityWeight: 0.78,
        rationale: "Visual presence influences non-verbal communication, social rapport, and meeting engagement.",
        mappedAttributes: ["collaborationPreference", "meetingTolerance"],
      },
      {
        dimensionKey: "workLifeBalance",
        dimensionName: "Work-Life Integration & Fatigue",
        sensitivityWeight: 0.80,
        rationale: "Continuous video calls accelerate cognitive fatigue and exhaustion across back-to-back schedules.",
        mappedAttributes: ["workLifeBalanceImportance", "meetingTolerance"],
      },
    ],
    attributePressures: [
      {
        attributeName: "sensoryRequirements",
        dimensionKey: "accessibility",
        direction: "increase_friction",
        intensity: 0.85,
        sensitivityWeight: 0.90,
        rationale: "Continuous video monitoring compounds sensory overload for neurodivergent staff.",
      },
      {
        attributeName: "overallAccessibilityNeed",
        dimensionKey: "accessibility",
        direction: "increase_friction",
        intensity: 0.75,
        sensitivityWeight: 0.85,
        rationale: "Visual demands restrict energy conservation strategies for staff with health or sensory conditions.",
      },
      {
        attributeName: "autonomyPreference",
        dimensionKey: "flexibility",
        direction: "increase_friction",
        intensity: 0.80,
        sensitivityWeight: 0.85,
        rationale: "Prescriptive camera mandates reduce personal control over working styles.",
      },
      {
        attributeName: "meetingTolerance",
        dimensionKey: "collaboration",
        direction: "increase_friction",
        intensity: 0.75,
        sensitivityWeight: 0.80,
        rationale: "Camera-on mandates compound meeting fatigue on dense calendar days.",
      },
    ],
    argumentsFor: [
      "Provides non-verbal feedback, facial cues, and eye contact that enrich live team collaboration.",
      "Helps meeting facilitators gauge audience comprehension, engagement, and emotional alignment.",
      "Fosters interpersonal bonding and shared presence across distributed and remote teams.",
    ],
    argumentsAgainst: [
      "Induces measurable 'Zoom fatigue' from continuous mirror-anxiety and gaze-monitoring.",
      "Intrudes on home environment privacy for employees in shared or constrained living spaces.",
      "Imposes disproportionate cognitive and sensory load on neurodivergent and introverted team members.",
    ],
    typicalStakeholders: ["Neurodivergent staff", "Remote workers in shared homes", "Meeting facilitators & managers", "Introverted individual contributors"],
  },

  // 2. Physical Attendance & In-Office Presence
  {
    conceptKey: "office_attendance_mandate",
    matchPatterns: ["office days", "in-office", "in-person", "return to office", "rto", "onsite", "mandatory office", "mandatory days", "office attendance", "attendance mandate"],
    description: "Policies prescribing mandatory in-person presence at corporate office facilities.",
    associatedDimensions: [
      {
        dimensionKey: "commute",
        dimensionName: "Commute & Transit Burden",
        sensitivityWeight: 0.95,
        rationale: "Mandatory office attendance directly multiplies weekly door-to-door transit time.",
        mappedAttributes: ["commuteMinutes", "transportationMode", "transportReliability"],
      },
      {
        dimensionKey: "flexibility",
        dimensionName: "Location & Schedule Flexibility",
        sensitivityWeight: 0.92,
        rationale: "Fixed office minimums restrict autonomy over start/end hours and geographic presence.",
        mappedAttributes: ["flexibilityImportance", "autonomyPreference", "asyncPreference"],
      },
      {
        dimensionKey: "caregiving",
        dimensionName: "Caregiving & Family Integration",
        sensitivityWeight: 0.90,
        rationale: "Rigid physical presence conflicts with school pickups, eldercare check-ins, and dependent emergencies.",
        mappedAttributes: ["caregivingResponsibility", "caregivingIntensity", "familyObligations"],
      },
      {
        dimensionKey: "accessibility",
        dimensionName: "Accessibility & Campus Environmental Load",
        sensitivityWeight: 0.85,
        rationale: "Transit navigation and open-office sensory load affect employees with mobility or sensory needs.",
        mappedAttributes: ["overallAccessibilityNeed", "mobilityRequirements", "sensoryRequirements"],
      },
      {
        dimensionKey: "workLifeBalance",
        dimensionName: "Work-Life Integration",
        sensitivityWeight: 0.82,
        rationale: "Longer transit days compress personal and family recovery time.",
        mappedAttributes: ["workLifeBalanceImportance", "scheduleConstraints"],
      },
    ],
    attributePressures: [
      {
        attributeName: "commuteMinutes",
        dimensionKey: "commute",
        direction: "increase_friction",
        intensity: 0.85,
        sensitivityWeight: 0.95,
        rationale: "Weekly transit hours scale directly with required physical office days.",
      },
      {
        attributeName: "caregivingResponsibility",
        dimensionKey: "caregiving",
        direction: "increase_friction",
        intensity: 0.82,
        sensitivityWeight: 0.90,
        rationale: "Fixed in-office presence collides with fixed dependent care and school windows.",
      },
      {
        attributeName: "flexibilityImportance",
        dimensionKey: "flexibility",
        direction: "increase_friction",
        intensity: 0.85,
        sensitivityWeight: 0.92,
        rationale: "Loss of location flexibility restricts personalized productivity cadences.",
      },
      {
        attributeName: "overallAccessibilityNeed",
        dimensionKey: "accessibility",
        direction: "increase_friction",
        intensity: 0.75,
        sensitivityWeight: 0.85,
        rationale: "Campus transit and sensory load create disproportionate fatigue for vulnerable staff.",
      },
    ],
    argumentsFor: [
      "Enables spontaneous hallway interactions, whiteboard ideation, and rapid cross-functional alignment.",
      "Strengthens organizational culture, onboarding immersion, and informal apprenticeship for junior talent.",
      "Facilitates co-located executive coordination and dedicated physical team workshops.",
    ],
    argumentsAgainst: [
      "Significantly increases weekly unpaid commuting time, transit expense, and carbon emissions.",
      "Creates acute schedule friction for primary caregivers whose dependent routines cannot flex.",
      "Can degrade deep focus work due to open-plan office acoustics and frequent conversational interruptions.",
    ],
    typicalStakeholders: ["Long-commute employees", "Working parents & caregivers", "New hires & interns", "Senior leadership"],
  },

  // 3. Facility Relocation & Commute Corridor Shifts
  {
    conceptKey: "facility_relocation",
    matchPatterns: ["relocat", "move office", "move our office", "farther", "suburb", "campus move", "20 km", "new location", "distance"],
    description: "Physical relocation of corporate facilities altering travel distances and transit corridors.",
    associatedDimensions: [
      {
        dimensionKey: "commute",
        dimensionName: "Transit Corridor & Commute Duration",
        sensitivityWeight: 0.98,
        rationale: "Facility relocation alters travel routes, extending average one-way transit time.",
        mappedAttributes: ["commuteMinutes", "transportationMode", "transportReliability", "relocationWillingness"],
      },
      {
        dimensionKey: "financialSensitivity",
        dimensionName: "Financial Transit Costs",
        sensitivityWeight: 0.85,
        rationale: "Greater travel distance increases fuel, public transit fares, vehicle wear, and parking fees.",
        mappedAttributes: ["financialSensitivity", "incomeDependency"],
      },
      {
        dimensionKey: "flexibility",
        dimensionName: "Schedule Elasticity",
        sensitivityWeight: 0.80,
        rationale: "Longer transit corridors absorb personal morning and evening discretionary time.",
        mappedAttributes: ["flexibilityImportance", "scheduleConstraints"],
      },
    ],
    attributePressures: [
      {
        attributeName: "commuteMinutes",
        dimensionKey: "commute",
        direction: "increase_friction",
        intensity: 0.90,
        sensitivityWeight: 0.98,
        rationale: "Distance expansion directly inflates daily transit minutes.",
      },
      {
        attributeName: "financialSensitivity",
        dimensionKey: "financialSensitivity",
        direction: "increase_friction",
        intensity: 0.75,
        sensitivityWeight: 0.85,
        rationale: "Unbudgeted mileage, transit fares, and toll expenses.",
      },
      {
        attributeName: "relocationWillingness",
        dimensionKey: "commute",
        direction: "increase_friction",
        intensity: 0.80,
        sensitivityWeight: 0.80,
        rationale: "Employees with fixed residential roots face severe transit friction.",
      },
    ],
    argumentsFor: [
      "Access to modern, energy-efficient corporate facilities with upgraded amenities and technology.",
      "Potential reduction in corporate real estate leasing overhead or expansion capacity.",
      "Consolidation of fragmented regional offices into a unified corporate hub.",
    ],
    argumentsAgainst: [
      "Substantially extends daily commuting burden, driving elevated transit fatigue and turnover risk.",
      "Imposes unbudgeted transportation costs on lower salary bands.",
      "May alienate employees who chose residences specifically for transit proximity to the previous site.",
    ],
    typicalStakeholders: ["Suburban vs urban commuters", "Non-driving public transit riders", "Lower-income salary bands"],
  },

  // 4. Working Hours, Compressed Workweeks & Shift Schedules
  {
    conceptKey: "working_hours_schedule",
    matchPatterns: ["working hours", "workweek", "4-day", "four-day", "compressed", "10-hour", "shift", "core hours", "schedule change", "working schedule"],
    description: "Alterations to standard daily or weekly working hour patterns, including compressed schedules.",
    associatedDimensions: [
      {
        dimensionKey: "flexibility",
        dimensionName: "Temporal Flexibility & Autonomy",
        sensitivityWeight: 0.92,
        rationale: "Shift length changes fundamentally reshape daily personal cadence and schedule autonomy.",
        mappedAttributes: ["flexibilityImportance", "scheduleConstraints", "autonomyPreference"],
      },
      {
        dimensionKey: "caregiving",
        dimensionName: "Caregiving & Dependent Schedules",
        sensitivityWeight: 0.90,
        rationale: "Daily shift duration changes interact heavily with external school, daycare, and care service operating hours.",
        mappedAttributes: ["caregivingResponsibility", "caregivingIntensity", "familyObligations"],
      },
      {
        dimensionKey: "workLifeBalance",
        dimensionName: "Work-Life Integration & Recovery",
        sensitivityWeight: 0.88,
        rationale: "Compressed days offer longer weekends but require longer individual working shifts.",
        mappedAttributes: ["workLifeBalanceImportance", "scheduleConstraints"],
      },
      {
        dimensionKey: "commute",
        dimensionName: "Commute Frequency",
        sensitivityWeight: 0.75,
        rationale: "Fewer total weekly working days reduces weekly transit trips by 20%.",
        mappedAttributes: ["commuteMinutes", "transportReliability"],
      },
    ],
    attributePressures: [
      {
        attributeName: "caregivingResponsibility",
        dimensionKey: "caregiving",
        direction: "increase_friction",
        intensity: 0.85,
        sensitivityWeight: 0.90,
        rationale: "10-hour workdays frequently extend past standard 08:00-17:00 childcare facility operations.",
      },
      {
        attributeName: "scheduleConstraints",
        dimensionKey: "flexibility",
        direction: "increase_friction",
        intensity: 0.80,
        sensitivityWeight: 0.85,
        rationale: "Lengthened daily working blocks reduce personal elasticity on workdays.",
      },
      {
        attributeName: "commuteMinutes",
        dimensionKey: "commute",
        direction: "relieve_friction",
        intensity: 0.25,
        sensitivityWeight: 0.75,
        rationale: "A four-day pattern eliminates one full day of weekly commuting transit.",
      },
    ],
    argumentsFor: [
      "Consecutive three-day weekends provide extended mental recovery, personal development, and family time.",
      "Eliminates 20% of weekly commuting trips, lowering transit costs and carbon footprint.",
      "Can improve talent attraction and retention in competitive technical hiring markets.",
    ],
    argumentsAgainst: [
      "Ten-hour daily shifts create severe logistical friction for parents and caregivers bound to strict daycare hours.",
      "Can induce late-afternoon cognitive fatigue and lower sustained productivity toward the end of long shifts.",
      "Requires careful planning to maintain customer coverage and asynchronous cross-team continuity.",
    ],
    typicalStakeholders: ["Parents of school-age children", "Long-distance commuters", "Operations & support staff needing coverage"],
  },

  // 5. AI Tooling & Generative Assistants
  {
    conceptKey: "ai_tooling_adoption",
    matchPatterns: [/\bai\b/i, "ai coding", "copilot", "coding assistant", "generative ai", "ai assistant", "llm tooling", "llm", "automation tool"],
    description: "Enterprise introduction of generative AI tools, coding assistants, and automated workflow aids.",
    associatedDimensions: [
      {
        dimensionKey: "technologyChange",
        dimensionName: "Technology Adoption & Automation Trust",
        sensitivityWeight: 0.95,
        rationale: "AI adoption speeds vary according to baseline technology trust, learning agility, and perceived job security.",
        mappedAttributes: ["technologyAdoption", "technologyTrust", "learningOrientation", "changeTolerance", "jobSecurityImportance"],
      },
      {
        dimensionKey: "professional",
        dimensionName: "Professional Craft & Skills",
        sensitivityWeight: 0.85,
        rationale: "Augmented tooling reshapes daily technical workflows, code review standards, and skill development.",
        mappedAttributes: ["skills", "experienceYears"],
      },
      {
        dimensionKey: "collaboration",
        dimensionName: "Team Review & Coordination",
        sensitivityWeight: 0.75,
        rationale: "AI-generated artifacts alter peer review bandwidth, documentation norms, and quality assurance.",
        mappedAttributes: ["collaborationPreference", "crossFunctionalDependency"],
      },
    ],
    attributePressures: [
      {
        attributeName: "technologyTrust",
        dimensionKey: "technologyChange",
        direction: "increase_friction",
        intensity: 0.75,
        sensitivityWeight: 0.90,
        rationale: "Anxiety regarding algorithmic accuracy, intellectual property, and automated evaluation.",
      },
      {
        attributeName: "technologyAdoption",
        dimensionKey: "technologyChange",
        direction: "increase_friction",
        intensity: 0.70,
        sensitivityWeight: 0.85,
        rationale: "Learning curve and cognitive friction while adapting established development habits.",
      },
      {
        attributeName: "learningOrientation",
        dimensionKey: "technologyChange",
        direction: "relieve_friction",
        intensity: 0.80,
        sensitivityWeight: 0.85,
        rationale: "High learning agility personas leverage AI tools to rapidly compress development cycles.",
      },
    ],
    argumentsFor: [
      "Substantially accelerates routine boilerplate generation, documentation, and repetitive coding tasks.",
      "Empowers engineers to focus on higher-level architectural design and complex problem-solving.",
      "Lowers entry barriers for junior developers exploring unfamiliar libraries or frameworks.",
    ],
    argumentsAgainst: [
      "Potential risk of degraded code quality or subtle bugs if generated code is insufficiently reviewed.",
      "May provoke job security anxiety and resistance among developers who value traditional craft processes.",
      "Creates intellectual property, compliance, and codebase context security concerns.",
    ],
    typicalStakeholders: ["Junior vs senior engineers", "Quality assurance & security teams", "Engineering managers"],
  },

  // 6. Continuous Monitoring & Activity Telemetry
  {
    conceptKey: "performance_surveillance_telemetry",
    matchPatterns: ["monitor", "continuous monitoring", "tracking", "surveillance", "activity tracking", "telemetry", "keystroke", "presence tracking"],
    description: "Introduction of automated activity, presence, or output telemetry monitoring.",
    associatedDimensions: [
      {
        dimensionKey: "flexibility",
        dimensionName: "Task Autonomy & Trust",
        sensitivityWeight: 0.95,
        rationale: "Continuous surveillance directly erodes perceived trust and micro-management autonomy.",
        mappedAttributes: ["autonomyPreference", "flexibilityImportance"],
      },
      {
        dimensionKey: "technologyChange",
        dimensionName: "Psychological Safety & Job Security",
        sensitivityWeight: 0.90,
        rationale: "Metric tracking heightens fear of punitive evaluations and algorithmic bias.",
        mappedAttributes: ["technologyTrust", "jobSecurityImportance", "changeTolerance"],
      },
      {
        dimensionKey: "workLifeBalance",
        dimensionName: "Wellbeing & Stress",
        sensitivityWeight: 0.88,
        rationale: "Constantly feeling observed elevates baseline workplace stress and burnout.",
        mappedAttributes: ["workLifeBalanceImportance"],
      },
    ],
    attributePressures: [
      {
        attributeName: "autonomyPreference",
        dimensionKey: "flexibility",
        direction: "increase_friction",
        intensity: 0.92,
        sensitivityWeight: 0.95,
        rationale: "Surveillance mechanisms directly conflict with personal agency and professional discretion.",
      },
      {
        attributeName: "jobSecurityImportance",
        dimensionKey: "technologyChange",
        direction: "increase_friction",
        intensity: 0.85,
        sensitivityWeight: 0.90,
        rationale: "Elevated anxiety over algorithmic misinterpretation of non-linear creative work.",
      },
      {
        attributeName: "workLifeBalanceImportance",
        dimensionKey: "workLifeBalance",
        direction: "increase_friction",
        intensity: 0.80,
        sensitivityWeight: 0.88,
        rationale: "Continuous monitoring prevents mental disengagement during natural cognitive pauses.",
      },
    ],
    argumentsFor: [
      "Provides objective operational visibility into capacity bottlenecks and project resourcing.",
      "Helps detect early burnout or excessive overtime hours across remote engineering teams.",
      "Standardizes objective productivity metrics across distributed locations.",
    ],
    argumentsAgainst: [
      "Severely undermines employer-employee trust and triggers employee backlash or union scrutiny.",
      "Incentivizes gaming of superficial activity metrics (e.g. mouse-jiggling) rather than genuine creative output.",
      "Disproportionately penalizes senior architects whose primary work involves thinking and reading rather than typing.",
    ],
    typicalStakeholders: ["Senior autonomous specialists", "Remote workers", "People managers & HR leadership"],
  },

  // 7. Workspace Seating & Hot-Desking
  {
    conceptKey: "workspace_hotdesking",
    matchPatterns: ["hot-desk", "hot desk", "unassigned", "desk-sharing", "seating", "hotdesking", "assigned seating", "dedicated desks"],
    description: "Elimination of dedicated assigned desks in favor of unassigned dynamic hot-desking.",
    associatedDimensions: [
      {
        dimensionKey: "accessibility",
        dimensionName: "Accessibility & Sensory Predictability",
        sensitivityWeight: 0.95,
        rationale: "Loss of fixed seating eliminates personalized ergonomic equipment and acoustic stability.",
        mappedAttributes: ["overallAccessibilityNeed", "sensoryRequirements", "mobilityRequirements", "environmentalRequirements"],
      },
      {
        dimensionKey: "flexibility",
        dimensionName: "Routine Autonomy",
        sensitivityWeight: 0.85,
        rationale: "Daily desk reservations and unpredictability introduce morning cognitive overhead.",
        mappedAttributes: ["autonomyPreference", "scheduleConstraints"],
      },
      {
        dimensionKey: "collaboration",
        dimensionName: "Team Proximity",
        sensitivityWeight: 0.75,
        rationale: "Physical team adjacency changes dynamically, requiring intentional co-location planning.",
        mappedAttributes: ["collaborationPreference", "crossFunctionalDependency"],
      },
    ],
    attributePressures: [
      {
        attributeName: "overallAccessibilityNeed",
        dimensionKey: "accessibility",
        direction: "increase_friction",
        intensity: 0.90,
        sensitivityWeight: 0.95,
        rationale: "Daily ergonomic variability exacerbates physical strain and sensory fatigue.",
      },
      {
        attributeName: "sensoryRequirements",
        dimensionKey: "accessibility",
        direction: "increase_friction",
        intensity: 0.85,
        sensitivityWeight: 0.90,
        rationale: "Lack of designated quiet zones impairs focus for sensory-sensitive staff.",
      },
      {
        attributeName: "autonomyPreference",
        dimensionKey: "flexibility",
        direction: "increase_friction",
        intensity: 0.75,
        sensitivityWeight: 0.80,
        rationale: "Desk competition creates morning arrival anxiety.",
      },
    ],
    argumentsFor: [
      "Optimizes corporate facility space and reduces overhead costs for hybrid work patterns.",
      "Encourages serendipitous cross-department interactions and inter-team relationship building.",
      "Supports flexible, reconfigurable project team seating arrangements.",
    ],
    argumentsAgainst: [
      "Disrupts employees needing specialized ergonomic chairs, dual-monitor setups, or assistive tech.",
      "Creates acute stress for neurodivergent staff who depend on predictable sensory environments.",
      "Generates morning friction and lost productivity as workers search for workstations.",
    ],
    typicalStakeholders: ["Employees with medical/mobility accommodations", "Neurodivergent staff", "Facilities & real estate teams"],
  },

  // 8. Global Timezones & Core Working Hours
  {
    conceptKey: "timezone_coordination",
    matchPatterns: ["timezone", "pacific", "pst", "est", "global time", "core hours", "async collaboration", "international"],
    description: "Policies aligning distributed global teams to unified core working or meeting hours.",
    associatedDimensions: [
      {
        dimensionKey: "collaboration",
        dimensionName: "Cross-Timezone Collaboration",
        sensitivityWeight: 0.95,
        rationale: "Mandated meeting hours create asymmetrical domestic disruption for non-headquarters regions.",
        mappedAttributes: ["timezoneDependency", "globalTeamInvolvement", "collaborationPreference"],
      },
      {
        dimensionKey: "workLifeBalance",
        dimensionName: "Domestic Evening Boundaries",
        sensitivityWeight: 0.90,
        rationale: "Late evening or early morning overlap requirements erode family and sleep routines.",
        mappedAttributes: ["workLifeBalanceImportance", "scheduleConstraints"],
      },
      {
        dimensionKey: "caregiving",
        dimensionName: "Family Obligations",
        sensitivityWeight: 0.85,
        rationale: "Evening calls clash with dinner preparation, bedtime routines, and dependent care.",
        mappedAttributes: ["caregivingResponsibility", "familyObligations"],
      },
    ],
    attributePressures: [
      {
        attributeName: "timezoneDependency",
        dimensionKey: "collaboration",
        direction: "increase_friction",
        intensity: 0.90,
        sensitivityWeight: 0.95,
        rationale: "Forced synchronous alignment conflicts with local daylight working hours.",
      },
      {
        attributeName: "familyObligations",
        dimensionKey: "caregiving",
        direction: "increase_friction",
        intensity: 0.80,
        sensitivityWeight: 0.85,
        rationale: "Late meetings collide with critical family responsibilities.",
      },
    ],
    argumentsFor: [
      "Provides predictable synchronous overlap windows for rapid decision-making across regions.",
      "Reduces 24-hour latency on cross-regional code reviews and critical blockers.",
      "Strengthens global cultural unity and cross-geography alignment.",
    ],
    argumentsAgainst: [
      "Imposes severe late-night or early-morning burden on international team members.",
      "Incentivizes synchronous meeting culture over durable asynchronous documentation.",
      "Elevates turnover risk among senior talent in satellite and distributed regions.",
    ],
    typicalStakeholders: ["Distributed international engineers", "HQ leadership", "Working parents in overseas offices"],
  },

  // 9. Talent Mobility, Role Transition & Candidate Hiring Evaluation
  {
    conceptKey: "talent_mobility_role_transition",
    matchPatterns: [
      "applying for",
      "intern role",
      "internship",
      "cyber security intern",
      "software engineering intern",
      "chances of being hired",
      "role transition",
      "transfer role",
      "transition from",
      "good fit for",
      "talent mobility",
      "switch role",
      "career change",
      "job application",
      "fit for the role",
      "hired",
      "hiring",
    ],
    description: "Candidate application, hiring feasibility, or internal talent mobility between technical domains.",
    associatedDimensions: [
      {
        dimensionKey: "professional",
        dimensionName: "Professional Skills & Role Domain Fit",
        sensitivityWeight: 0.95,
        rationale: "Evaluation of technical competencies, programming language fluency, and engineering craft fit.",
        mappedAttributes: ["skills", "experienceYears", "learningOrientation"],
      },
      {
        dimensionKey: "technologyChange",
        dimensionName: "Technical Adaptability & Coding Language Mastery",
        sensitivityWeight: 0.90,
        rationale: "Capacity to code fluently across company-required programming languages and adapt to engineering architectures.",
        mappedAttributes: ["technologyAdoption", "learningOrientation", "changeTolerance"],
      },
      {
        dimensionKey: "collaboration",
        dimensionName: "Engineering Squad & Team Synergy",
        sensitivityWeight: 0.80,
        rationale: "Collaboration habits, code review participation, and integration into Agile engineering cadences.",
        mappedAttributes: ["collaborationPreference", "crossFunctionalDependency"],
      },
      {
        dimensionKey: "workLifeBalance",
        dimensionName: "Role Engagement & Intrinsic Motivation",
        sensitivityWeight: 0.85,
        rationale: "Strong domain passion ('enjoy coding more') predicts accelerated ramp-up, high job satisfaction, and retention.",
        mappedAttributes: ["learningImportance", "careerGrowthImportance"],
      },
    ],
    attributePressures: [
      {
        attributeName: "learningOrientation",
        dimensionKey: "technologyChange",
        direction: "relieve_friction",
        intensity: 0.85,
        sensitivityWeight: 0.90,
        rationale: "High learning agility and coding motivation significantly accelerate technical ramp-up.",
      },
      {
        attributeName: "technologyAdoption",
        dimensionKey: "technologyChange",
        direction: "relieve_friction",
        intensity: 0.80,
        sensitivityWeight: 0.85,
        rationale: "Mastery of required programming languages fulfills core technical qualification criteria.",
      },
      {
        attributeName: "changeTolerance",
        dimensionKey: "professional",
        direction: "increase_friction",
        intensity: 0.35,
        sensitivityWeight: 0.70,
        rationale: "Transitioning mental models from cybersecurity threat modeling to software engineering feature delivery requires adaptation.",
      },
    ],
    argumentsFor: [
      "Demonstrated multi-language coding skills directly fulfill core software engineering intern prerequisites.",
      "Prior internal internship experience provides proven cultural alignment and organizational familiarity.",
      "Strong intrinsic passion for coding ('enjoy coding more') predicts accelerated ramp-up speed and high role engagement.",
    ],
    argumentsAgainst: [
      "Domain transition gap: Requires assessing foundational software design, data structures, and testing beyond syntax familiarity.",
      "Engineering intern hiring is typically competitive, requiring candidate benchmarking against peer applicant pools.",
      "Transition from cybersecurity compliance workflows to Agile sprint delivery may require structured ramp-up mentorship.",
    ],
    typicalStakeholders: ["Candidate / Intern applicant", "Engineering Hiring Managers", "Engineering Mentors & Team Leads", "Campus Recruiting"],
  },
];
