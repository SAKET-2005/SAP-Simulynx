import { PersonaData, LifeStage, SeniorityLevel, EmploymentType, SalaryBand } from "./types.js";
import {
  PRNG,
  FIRST_NAMES,
  LAST_NAMES,
  LOCATIONS,
  ROLES_BY_DEPT,
} from "./distributions.js";

export function generateWorkforce(count: number = 300, seed: number = 1042): PersonaData[] {
  const prng = new PRNG(seed);
  const personas: PersonaData[] = [];

  // Seed the 12 classic anchor personas to provide familiar references for demos
  const anchorTemplates = getAnchorTemplates();
  for (let i = 0; i < Math.min(count, anchorTemplates.length); i++) {
    personas.push({
      ...anchorTemplates[i],
      externalId: `PER-${String(i + 1).padStart(4, "0")}`,
    });
  }

  const deptKeys = Object.keys(ROLES_BY_DEPT);

  for (let i = personas.length; i < count; i++) {
    const firstName = prng.pick(FIRST_NAMES);
    const lastName = prng.pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const avatarGlyph = firstName.toLowerCase();

    // 1. Identity & Life Stage
    const lifeStage = prng.weightedPick<LifeStage>([
      { item: "early-career", weight: 22 },
      { item: "establishing", weight: 25 },
      { item: "family-with-young-children", weight: 28 },
      { item: "mature-family", weight: 15 },
      { item: "empty-nester", weight: 7 },
      { item: "senior", weight: 3 },
    ]);

    let age: number;
    let expYears: number;
    let seniority: SeniorityLevel;

    if (lifeStage === "early-career") {
      age = prng.range(22, 28);
      expYears = prng.range(0, 4);
      seniority = expYears <= 2 ? "associate" : "specialist";
    } else if (lifeStage === "establishing") {
      age = prng.range(28, 36);
      expYears = prng.range(5, 11);
      seniority = prng.weightedPick([
        { item: "specialist", weight: 40 },
        { item: "senior", weight: 50 },
        { item: "lead", weight: 10 },
      ]);
    } else if (lifeStage === "family-with-young-children") {
      age = prng.range(31, 44);
      expYears = prng.range(7, 18);
      seniority = prng.weightedPick([
        { item: "specialist", weight: 20 },
        { item: "senior", weight: 50 },
        { item: "lead", weight: 20 },
        { item: "director", weight: 10 },
      ]);
    } else if (lifeStage === "mature-family") {
      age = prng.range(42, 53);
      expYears = prng.range(15, 26);
      seniority = prng.weightedPick([
        { item: "senior", weight: 30 },
        { item: "lead", weight: 40 },
        { item: "director", weight: 25 },
        { item: "executive", weight: 5 },
      ]);
    } else {
      age = prng.range(52, 65);
      expYears = prng.range(25, 38);
      seniority = prng.weightedPick([
        { item: "senior", weight: 30 },
        { item: "lead", weight: 35 },
        { item: "director", weight: 25 },
        { item: "executive", weight: 10 },
      ]);
    }

    const education = prng.weightedPick([
      { item: "B.Sc. / B.A. Degree", weight: 50 },
      { item: "M.Sc. / M.A. Degree", weight: 38 },
      { item: "Doctorate / Ph.D.", weight: 7 },
      { item: "Vocational / Dual Studies", weight: 5 },
    ]);

    // 2. Department & Role
    const department = prng.pick(deptKeys);
    const roleDef = prng.pick(ROLES_BY_DEPT[department]);
    const role = roleDef.role;
    const skills = roleDef.skills.join(", ");
    const employmentType: EmploymentType = prng.weightedPick([
      { item: "full-time", weight: 84 },
      { item: "part-time", weight: 12 },
      { item: "contractor", weight: 4 },
    ]);

    // 3. Logistics & Commute (Correlated with Location)
    const locObj = prng.pick(LOCATIONS);
    const locationCity = locObj.city;
    const location = `${locationCity}, Germany`;
    const transportationMode = locObj.mode;
    const commuteMinutes = Math.max(
      10,
      Math.min(120, Math.round(locObj.avgCommute + prng.range(-15, 25)))
    );
    const transportReliability = prng.clamp(
      transportationMode === "car" ? prng.range(60, 85) : prng.range(70, 95)
    );
    const relocationWillingness = prng.clamp(
      lifeStage === "early-career"
        ? prng.range(60, 95)
        : lifeStage === "family-with-young-children"
        ? prng.range(10, 40)
        : prng.range(20, 60)
    );

    // 4. Life Context & Caregiving
    let caregivingResponsibility = false;
    let caregivingIntensity = 0;
    let dependentsCount = 0;
    let scheduleConstraints = 0;
    let familyObligations = 0;

    if (lifeStage === "family-with-young-children") {
      caregivingResponsibility = prng.booleanWithProb(0.92);
      dependentsCount = prng.range(1, 3);
      caregivingIntensity = prng.range(70, 95);
      scheduleConstraints = prng.range(70, 95);
      familyObligations = prng.range(75, 98);
    } else if (lifeStage === "mature-family") {
      caregivingResponsibility = prng.booleanWithProb(0.65);
      dependentsCount = prng.range(1, 2);
      caregivingIntensity = prng.range(40, 75);
      scheduleConstraints = prng.range(50, 80);
      familyObligations = prng.range(55, 85);
    } else if (lifeStage === "empty-nester" || lifeStage === "senior") {
      caregivingResponsibility = prng.booleanWithProb(0.35); // eldercare
      dependentsCount = caregivingResponsibility ? 1 : 0;
      caregivingIntensity = caregivingResponsibility ? prng.range(30, 65) : 0;
      scheduleConstraints = prng.range(25, 60);
      familyObligations = prng.range(30, 65);
    } else {
      caregivingResponsibility = prng.booleanWithProb(0.12);
      dependentsCount = caregivingResponsibility ? 1 : 0;
      caregivingIntensity = caregivingResponsibility ? prng.range(30, 60) : 0;
      scheduleConstraints = prng.range(15, 45);
      familyObligations = prng.range(15, 40);
    }

    // 5. Work Style (Correlated with commute, role, and caregiving)
    const remotePreference = prng.clamp(
      (commuteMinutes > 50 ? 30 : 10) +
        (caregivingResponsibility ? 35 : 0) +
        (department === "Engineering" ? 25 : 0) +
        prng.range(10, 30)
    );
    const officePreference = prng.clamp(100 - remotePreference + prng.range(-15, 15));
    const collaborationPreference = prng.clamp(
      (department === "Human Resources" || department === "Sales & Consulting" ? 75 : 45) +
        prng.range(-20, 20)
    );
    const autonomyPreference = prng.clamp(
      (seniority === "lead" || seniority === "director" ? 80 : 55) + prng.range(-15, 20)
    );
    const asyncPreference = prng.clamp(
      (department === "Engineering" || department === "Product & AI" ? 75 : 45) +
        prng.range(-20, 20)
    );
    const meetingTolerance = prng.clamp(
      (seniority === "director" || seniority === "lead" ? 75 : 40) + prng.range(-15, 25)
    );

    // 6. Priorities
    const flexibilityImportance = prng.clamp(
      (caregivingResponsibility ? 45 : 15) +
        (commuteMinutes > 45 ? 25 : 10) +
        prng.range(20, 35)
    );
    const workLifeBalanceImportance = prng.clamp(
      (caregivingResponsibility ? 40 : 20) + prng.range(30, 45)
    );
    const careerGrowthImportance = prng.clamp(
      (lifeStage === "early-career" ? 85 : lifeStage === "establishing" ? 75 : 45) +
        prng.range(-15, 15)
    );
    const learningImportance = prng.clamp(
      (lifeStage === "early-career" || department === "Engineering" ? 80 : 55) +
        prng.range(-15, 20)
    );
    const jobSecurityImportance = prng.clamp(
      (caregivingResponsibility || age > 45 ? 75 : 50) + prng.range(-15, 20)
    );
    const compensationImportance = prng.clamp(prng.range(50, 90));
    const recognitionImportance = prng.clamp(prng.range(40, 80));
    const autonomyImportance = prng.clamp(autonomyPreference * 0.9 + prng.range(-10, 10));

    // 7. Behavior & Technology
    const technologyAdoption = prng.clamp(
      (department === "Engineering" || department === "Product & AI" ? 85 : 55) +
        (age < 35 ? 15 : -10) +
        prng.range(-15, 15)
    );
    const technologyTrust = prng.clamp(
      technologyAdoption * 0.85 + prng.range(-15, 15)
    );
    const learningOrientation = prng.clamp(learningImportance * 0.9 + prng.range(-10, 10));
    const changeTolerance = prng.clamp(
      (age < 35 ? 65 : 45) + (seniority === "associate" ? 15 : -5) + prng.range(-20, 20)
    );
    const riskTolerance = prng.clamp(
      (lifeStage === "early-career" ? 65 : 40) + prng.range(-15, 20)
    );

    // 8. Financial
    const salaryBand: SalaryBand =
      seniority === "associate"
        ? "entry"
        : seniority === "specialist"
        ? "mid"
        : seniority === "senior" || seniority === "lead"
        ? "senior"
        : "executive";
    const financialSensitivity = prng.clamp(
      (salaryBand === "entry" ? 75 : salaryBand === "mid" ? 55 : 30) +
        (dependentsCount > 1 ? 20 : 0) +
        prng.range(-10, 15)
    );
    const incomeDependency = prng.clamp(
      (dependentsCount > 0 ? 80 : 60) + prng.range(-10, 15)
    );

    // 9. Collaboration Context
    const teamSize = prng.range(4, 18);
    const globalTeamInvolvement = prng.booleanWithProb(
      department === "Engineering" || department === "Product & AI" ? 0.65 : 0.35
    );
    const timezoneDependency = prng.clamp(
      globalTeamInvolvement ? prng.range(60, 95) : prng.range(10, 35)
    );
    const clientInteraction = prng.clamp(
      department === "Sales & Consulting" ? prng.range(75, 95) : prng.range(15, 45)
    );
    const crossFunctionalDependency = prng.clamp(
      department === "Product & AI" || seniority === "lead" ? prng.range(70, 95) : prng.range(30, 65)
    );

    // 10. Accessibility (Realistic 12-16% distribution)
    const hasAccessibilityNeed = prng.booleanWithProb(0.14);
    const mobilityRequirements = hasAccessibilityNeed && prng.booleanWithProb(0.45);
    const sensoryRequirements = hasAccessibilityNeed && prng.booleanWithProb(0.5);
    const assistiveTechRequirements = hasAccessibilityNeed && prng.booleanWithProb(0.4);
    const environmentalRequirements = prng.clamp(
      hasAccessibilityNeed ? prng.range(65, 95) : prng.range(10, 35)
    );
    const overallAccessibilityNeed = prng.clamp(
      hasAccessibilityNeed
        ? (mobilityRequirements ? 35 : 0) +
          (sensoryRequirements ? 35 : 0) +
          (assistiveTechRequirements ? 25 : 0) +
          prng.range(15, 30)
        : prng.range(5, 25)
    );

    const personalitySummary = `${seniority.toUpperCase()} ${role} based in ${locationCity}. Values ${
      flexibilityImportance > 70 ? "schedule flexibility, " : ""
    }${learningImportance > 70 ? "continuous learning, " : ""}${
      collaborationPreference > 70 ? "in-person teamwork" : "focused autonomy"
    }.`;

    const primaryConcerns = [
      caregivingResponsibility ? "Family coordination & school schedules" : null,
      commuteMinutes > 50 ? `Long commute (${commuteMinutes}m transit time)` : null,
      overallAccessibilityNeed > 60 ? "Physical campus access & sensory fatigue" : null,
      careerGrowthImportance > 75 ? "Visibility and promotion progression" : null,
    ]
      .filter(Boolean)
      .join("; ") || "Maintaining balanced workflow and team alignment";

    personas.push({
      externalId: `PER-${String(i + 1).padStart(4, "0")}`,
      name,
      avatarGlyph,
      age,
      location,
      locationCity,
      education,
      lifeStage,
      role,
      department,
      seniority,
      employmentType,
      experienceYears: expYears,
      skills,
      remotePreference,
      officePreference,
      collaborationPreference,
      autonomyPreference,
      asyncPreference,
      meetingTolerance,
      caregivingResponsibility,
      caregivingIntensity,
      dependentsCount,
      scheduleConstraints,
      familyObligations,
      commuteMinutes,
      transportationMode,
      transportReliability,
      relocationWillingness,
      compensationImportance,
      careerGrowthImportance,
      learningImportance,
      jobSecurityImportance,
      flexibilityImportance,
      workLifeBalanceImportance,
      recognitionImportance,
      autonomyImportance,
      changeTolerance,
      technologyAdoption,
      learningOrientation,
      riskTolerance,
      technologyTrust,
      salaryBand,
      financialSensitivity,
      incomeDependency,
      teamSize,
      globalTeamInvolvement,
      timezoneDependency,
      clientInteraction,
      crossFunctionalDependency,
      mobilityRequirements,
      sensoryRequirements,
      assistiveTechRequirements,
      environmentalRequirements,
      overallAccessibilityNeed,
      personalitySummary,
      primaryConcerns,
    });
  }

  return personas;
}

function getAnchorTemplates(): Omit<PersonaData, "externalId">[] {
  return [
    {
      name: "Maya Patel",
      avatarGlyph: "maya",
      age: 34,
      location: "Frankfurt Outer Ring, Germany",
      locationCity: "Frankfurt Outer Ring",
      education: "M.Sc. Information Systems",
      lifeStage: "family-with-young-children",
      role: "Lead Product Manager",
      department: "Product & AI",
      seniority: "lead",
      employmentType: "full-time",
      experienceYears: 10,
      skills: "Product Strategy, Roadmap, Stakeholder Alignment, Design Thinking",
      remotePreference: 85,
      officePreference: 25,
      collaborationPreference: 70,
      autonomyPreference: 80,
      asyncPreference: 75,
      meetingTolerance: 55,
      caregivingResponsibility: true,
      caregivingIntensity: 85,
      dependentsCount: 2,
      scheduleConstraints: 90,
      familyObligations: 92,
      commuteMinutes: 65,
      transportationMode: "car",
      transportReliability: 70,
      relocationWillingness: 20,
      compensationImportance: 80,
      careerGrowthImportance: 75,
      learningImportance: 80,
      jobSecurityImportance: 85,
      flexibilityImportance: 95,
      workLifeBalanceImportance: 95,
      recognitionImportance: 65,
      autonomyImportance: 85,
      changeTolerance: 50,
      technologyAdoption: 85,
      learningOrientation: 80,
      riskTolerance: 40,
      technologyTrust: 75,
      salaryBand: "senior",
      financialSensitivity: 60,
      incomeDependency: 85,
      teamSize: 8,
      globalTeamInvolvement: true,
      timezoneDependency: 70,
      clientInteraction: 50,
      crossFunctionalDependency: 85,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 30,
      overallAccessibilityNeed: 20,
      personalitySummary: "Lead PM juggling cross-functional launches and kindergarten pick-up schedules. Highly dependent on calendar autonomy.",
      primaryConcerns: "Loss of calendar autonomy; rigid office hours conflict with school runs; commute traffic overhead.",
    },
    {
      name: "Daniel Vanderbilt",
      avatarGlyph: "daniel",
      age: 24,
      location: "Walldorf HQ Campus, Germany",
      locationCity: "Walldorf HQ Campus",
      education: "B.Sc. Computer Science",
      lifeStage: "early-career",
      role: "Associate Developer",
      department: "Engineering",
      seniority: "associate",
      employmentType: "full-time",
      experienceYears: 1,
      skills: "JavaScript, TypeScript, SAPUI5, Node.js, Git",
      remotePreference: 35,
      officePreference: 80,
      collaborationPreference: 85,
      autonomyPreference: 45,
      asyncPreference: 40,
      meetingTolerance: 75,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 0,
      scheduleConstraints: 20,
      familyObligations: 15,
      commuteMinutes: 20,
      transportationMode: "cycling",
      transportReliability: 95,
      relocationWillingness: 85,
      compensationImportance: 70,
      careerGrowthImportance: 95,
      learningImportance: 95,
      jobSecurityImportance: 65,
      flexibilityImportance: 45,
      workLifeBalanceImportance: 55,
      recognitionImportance: 85,
      autonomyImportance: 40,
      changeTolerance: 75,
      technologyAdoption: 90,
      learningOrientation: 95,
      riskTolerance: 65,
      technologyTrust: 85,
      salaryBand: "entry",
      financialSensitivity: 75,
      incomeDependency: 60,
      teamSize: 6,
      globalTeamInvolvement: false,
      timezoneDependency: 15,
      clientInteraction: 10,
      crossFunctionalDependency: 45,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 20,
      overallAccessibilityNeed: 10,
      personalitySummary: "Eager early-career engineer seeking in-person mentorship, rapid feedback, and informal whiteboard sessions.",
      primaryConcerns: "Isolated remote onboarding; difficulty reaching senior leads asynchronously; career visibility.",
    },
    {
      name: "Aisha Al-Mansoor",
      avatarGlyph: "aisha",
      age: 38,
      location: "Munich Tech Park, Germany",
      locationCity: "Munich Tech Park",
      education: "M.A. Interaction Design",
      lifeStage: "establishing",
      role: "UX / Fiori Design Specialist",
      department: "Product & AI",
      seniority: "senior",
      employmentType: "full-time",
      experienceYears: 12,
      skills: "SAP Fiori, WCAG Accessibility, Figma, Inclusive Design",
      remotePreference: 80,
      officePreference: 30,
      collaborationPreference: 65,
      autonomyPreference: 80,
      asyncPreference: 70,
      meetingTolerance: 45,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 0,
      scheduleConstraints: 65,
      familyObligations: 30,
      commuteMinutes: 50,
      transportationMode: "public_transit",
      transportReliability: 75,
      relocationWillingness: 30,
      compensationImportance: 75,
      careerGrowthImportance: 70,
      learningImportance: 80,
      jobSecurityImportance: 80,
      flexibilityImportance: 85,
      workLifeBalanceImportance: 85,
      recognitionImportance: 60,
      autonomyImportance: 80,
      changeTolerance: 55,
      technologyAdoption: 80,
      learningOrientation: 85,
      riskTolerance: 45,
      technologyTrust: 75,
      salaryBand: "senior",
      financialSensitivity: 50,
      incomeDependency: 75,
      teamSize: 10,
      globalTeamInvolvement: true,
      timezoneDependency: 50,
      clientInteraction: 35,
      crossFunctionalDependency: 80,
      mobilityRequirements: false,
      sensoryRequirements: true,
      assistiveTechRequirements: true,
      environmentalRequirements: 85,
      overallAccessibilityNeed: 88,
      personalitySummary: "Senior designer with sensory processing sensitivities and chronic migraine constraints. Thrives with controlled home acoustics.",
      primaryConcerns: "Open-plan acoustic noise; sensory fatigue from daily public transit; lack of quiet rooms.",
    },
    {
      name: "Priya Sharma",
      avatarGlyph: "priya",
      age: 41,
      location: "Berlin Suburban, Germany",
      locationCity: "Berlin Suburban",
      education: "MBA & B.Tech",
      lifeStage: "mature-family",
      role: "Strategic Customer Success Lead",
      department: "Sales & Consulting",
      seniority: "lead",
      employmentType: "full-time",
      experienceYears: 16,
      skills: "Enterprise Customer Success, Value Realization, Executive Governance",
      remotePreference: 70,
      officePreference: 45,
      collaborationPreference: 80,
      autonomyPreference: 75,
      asyncPreference: 60,
      meetingTolerance: 65,
      caregivingResponsibility: true,
      caregivingIntensity: 65,
      dependentsCount: 2,
      scheduleConstraints: 75,
      familyObligations: 80,
      commuteMinutes: 60,
      transportationMode: "public_transit",
      transportReliability: 80,
      relocationWillingness: 25,
      compensationImportance: 85,
      careerGrowthImportance: 80,
      learningImportance: 75,
      jobSecurityImportance: 80,
      flexibilityImportance: 85,
      workLifeBalanceImportance: 90,
      recognitionImportance: 70,
      autonomyImportance: 75,
      changeTolerance: 60,
      technologyAdoption: 75,
      learningOrientation: 75,
      riskTolerance: 50,
      technologyTrust: 70,
      salaryBand: "senior",
      financialSensitivity: 55,
      incomeDependency: 90,
      teamSize: 12,
      globalTeamInvolvement: true,
      timezoneDependency: 75,
      clientInteraction: 90,
      crossFunctionalDependency: 85,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 35,
      overallAccessibilityNeed: 25,
      personalitySummary: "Customer Success Director navigating international clients, regional travel, and dual teenage dependents.",
      primaryConcerns: "Inflexible office day mandate clashes with global client timezones and late customer escalation calls.",
    },
    {
      name: "Liam Gallagher",
      avatarGlyph: "liam",
      age: 46,
      location: "Remote / Rural Bavaria, Germany",
      locationCity: "Remote / Rural Bavaria",
      education: "M.Sc. Software Engineering",
      lifeStage: "mature-family",
      role: "Senior Cloud Architect",
      department: "Engineering",
      seniority: "senior",
      employmentType: "full-time",
      experienceYears: 20,
      skills: "SAP HANA Cloud, BTP, Distributed Systems, Event-Driven Architecture",
      remotePreference: 95,
      officePreference: 10,
      collaborationPreference: 50,
      autonomyPreference: 90,
      asyncPreference: 90,
      meetingTolerance: 30,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 1,
      scheduleConstraints: 40,
      familyObligations: 50,
      commuteMinutes: 105,
      transportationMode: "mixed",
      transportReliability: 60,
      relocationWillingness: 10,
      compensationImportance: 80,
      careerGrowthImportance: 60,
      learningImportance: 85,
      jobSecurityImportance: 75,
      flexibilityImportance: 95,
      workLifeBalanceImportance: 95,
      recognitionImportance: 50,
      autonomyImportance: 95,
      changeTolerance: 45,
      technologyAdoption: 90,
      learningOrientation: 90,
      riskTolerance: 40,
      technologyTrust: 80,
      salaryBand: "senior",
      financialSensitivity: 40,
      incomeDependency: 80,
      teamSize: 7,
      globalTeamInvolvement: true,
      timezoneDependency: 65,
      clientInteraction: 20,
      crossFunctionalDependency: 65,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 25,
      overallAccessibilityNeed: 20,
      personalitySummary: "Principal architect hired under remote agreement, living 100km from the nearest office hub. Highly productive in deep-work blocks.",
      primaryConcerns: "Mandatory office attendance constitutes de-facto constructive dismissal or extreme 3.5h daily transit.",
    },
    {
      name: "Arjun Kapoor",
      avatarGlyph: "arjun",
      age: 31,
      location: "Berlin Urban Core, Germany",
      locationCity: "Berlin Urban Core",
      education: "B.Tech Computer Science",
      lifeStage: "establishing",
      role: "Full-Stack Developer",
      department: "Engineering",
      seniority: "specialist",
      employmentType: "full-time",
      experienceYears: 6,
      skills: "TypeScript, Node.js, SAP CAP, OData v4, Docker",
      remotePreference: 50,
      officePreference: 65,
      collaborationPreference: 75,
      autonomyPreference: 65,
      asyncPreference: 60,
      meetingTolerance: 60,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 0,
      scheduleConstraints: 30,
      familyObligations: 25,
      commuteMinutes: 25,
      transportationMode: "public_transit",
      transportReliability: 90,
      relocationWillingness: 70,
      compensationImportance: 85,
      careerGrowthImportance: 85,
      learningImportance: 85,
      jobSecurityImportance: 70,
      flexibilityImportance: 65,
      workLifeBalanceImportance: 70,
      recognitionImportance: 75,
      autonomyImportance: 65,
      changeTolerance: 70,
      technologyAdoption: 90,
      learningOrientation: 85,
      riskTolerance: 60,
      technologyTrust: 85,
      salaryBand: "mid",
      financialSensitivity: 60,
      incomeDependency: 75,
      teamSize: 8,
      globalTeamInvolvement: false,
      timezoneDependency: 25,
      clientInteraction: 15,
      crossFunctionalDependency: 55,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 25,
      overallAccessibilityNeed: 15,
      personalitySummary: "Balanced urban developer enjoying 2-3 office days for social energy and pairing, but appreciates Friday focus time at home.",
      primaryConcerns: "Unnecessary rigid bureaucracy; prefers team autonomy over company-wide top-down mandates.",
    },
    {
      name: "Sofia Mendoza",
      avatarGlyph: "sofia",
      age: 48,
      location: "Walldorf HQ Campus, Germany",
      locationCity: "Walldorf HQ Campus",
      education: "M.A. Organizational Psychology",
      lifeStage: "mature-family",
      role: "Workplace Strategy Specialist",
      department: "Human Resources",
      seniority: "senior",
      employmentType: "full-time",
      experienceYears: 22,
      skills: "Workplace Dynamics, Employee Engagement, SAP SuccessFactors, Change Mgmt",
      remotePreference: 40,
      officePreference: 80,
      collaborationPreference: 85,
      autonomyPreference: 60,
      asyncPreference: 45,
      meetingTolerance: 80,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 0,
      scheduleConstraints: 35,
      familyObligations: 40,
      commuteMinutes: 30,
      transportationMode: "car",
      transportReliability: 85,
      relocationWillingness: 30,
      compensationImportance: 75,
      careerGrowthImportance: 70,
      learningImportance: 70,
      jobSecurityImportance: 85,
      flexibilityImportance: 55,
      workLifeBalanceImportance: 75,
      recognitionImportance: 80,
      autonomyImportance: 60,
      changeTolerance: 55,
      technologyAdoption: 65,
      learningOrientation: 70,
      riskTolerance: 40,
      technologyTrust: 65,
      salaryBand: "senior",
      financialSensitivity: 40,
      incomeDependency: 85,
      teamSize: 10,
      globalTeamInvolvement: false,
      timezoneDependency: 20,
      clientInteraction: 40,
      crossFunctionalDependency: 90,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 30,
      overallAccessibilityNeed: 20,
      personalitySummary: "People specialist championing organizational culture and interpersonal connection, sensitive to morale shifts.",
      primaryConcerns: "Cultural friction between mandated presence and actual employee retention/engagement.",
    },
    {
      name: "Ethan Wong",
      avatarGlyph: "ethan",
      age: 33,
      location: "Frankfurt Outer Ring, Germany",
      locationCity: "Frankfurt Outer Ring",
      education: "M.Sc. Artificial Intelligence",
      lifeStage: "establishing",
      role: "AI Research Scientist",
      department: "Product & AI",
      seniority: "senior",
      employmentType: "full-time",
      experienceYears: 8,
      skills: "Machine Learning, LLM Evaluation, SAP Generative AI Hub, Python",
      remotePreference: 75,
      officePreference: 40,
      collaborationPreference: 60,
      autonomyPreference: 85,
      asyncPreference: 80,
      meetingTolerance: 40,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 0,
      scheduleConstraints: 35,
      familyObligations: 30,
      commuteMinutes: 60,
      transportationMode: "car",
      transportReliability: 75,
      relocationWillingness: 45,
      compensationImportance: 85,
      careerGrowthImportance: 85,
      learningImportance: 95,
      jobSecurityImportance: 70,
      flexibilityImportance: 80,
      workLifeBalanceImportance: 80,
      recognitionImportance: 70,
      autonomyImportance: 85,
      changeTolerance: 75,
      technologyAdoption: 98,
      learningOrientation: 95,
      riskTolerance: 65,
      technologyTrust: 90,
      salaryBand: "senior",
      financialSensitivity: 50,
      incomeDependency: 70,
      teamSize: 6,
      globalTeamInvolvement: true,
      timezoneDependency: 60,
      clientInteraction: 20,
      crossFunctionalDependency: 70,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 35,
      overallAccessibilityNeed: 20,
      personalitySummary: "AI scientist needing sustained uninterrupted deep work cycles for model training and mathematical evaluations.",
      primaryConcerns: "Context switching and distraction in crowded office environments; lost commute hours.",
    },
    {
      name: "Rahul Iyer",
      avatarGlyph: "rahul",
      age: 29,
      location: "Munich Tech Park, Germany",
      locationCity: "Munich Tech Park",
      education: "M.Sc. Cloud Computing",
      lifeStage: "establishing",
      role: "DevOps / Reliability Engineer",
      department: "Engineering",
      seniority: "specialist",
      employmentType: "full-time",
      experienceYears: 5,
      skills: "Kubernetes, Cloud Foundry, BTP Infrastructure, Monitoring",
      remotePreference: 65,
      officePreference: 55,
      collaborationPreference: 65,
      autonomyPreference: 70,
      asyncPreference: 70,
      meetingTolerance: 50,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 0,
      scheduleConstraints: 35,
      familyObligations: 30,
      commuteMinutes: 35,
      transportationMode: "public_transit",
      transportReliability: 85,
      relocationWillingness: 60,
      compensationImportance: 85,
      careerGrowthImportance: 90,
      learningImportance: 85,
      jobSecurityImportance: 75,
      flexibilityImportance: 70,
      workLifeBalanceImportance: 75,
      recognitionImportance: 80,
      autonomyImportance: 70,
      changeTolerance: 65,
      technologyAdoption: 90,
      learningOrientation: 85,
      riskTolerance: 55,
      technologyTrust: 80,
      salaryBand: "mid",
      financialSensitivity: 65,
      incomeDependency: 80,
      teamSize: 7,
      globalTeamInvolvement: true,
      timezoneDependency: 55,
      clientInteraction: 15,
      crossFunctionalDependency: 60,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 30,
      overallAccessibilityNeed: 15,
      personalitySummary: "On-call SRE who needs dependable quiet workspace and immediate access during production incidents.",
      primaryConcerns: "On-call shifts during transit; visibility bias favoring colleagues who attend the physical office daily.",
    },
    {
      name: "Emma Lindqvist",
      avatarGlyph: "emma",
      age: 39,
      location: "Hamburg Metro, Germany",
      locationCity: "Hamburg Metro",
      education: "B.A. Business Administration",
      lifeStage: "family-with-young-children",
      role: "People Operations Partner",
      department: "Human Resources",
      seniority: "specialist",
      employmentType: "part-time",
      experienceYears: 13,
      skills: "Employee Relations, HR Policy, Mediation, Talent Analytics",
      remotePreference: 80,
      officePreference: 35,
      collaborationPreference: 75,
      autonomyPreference: 75,
      asyncPreference: 65,
      meetingTolerance: 60,
      caregivingResponsibility: true,
      caregivingIntensity: 80,
      dependentsCount: 2,
      scheduleConstraints: 85,
      familyObligations: 90,
      commuteMinutes: 35,
      transportationMode: "cycling",
      transportReliability: 85,
      relocationWillingness: 20,
      compensationImportance: 70,
      careerGrowthImportance: 65,
      learningImportance: 70,
      jobSecurityImportance: 85,
      flexibilityImportance: 95,
      workLifeBalanceImportance: 95,
      recognitionImportance: 60,
      autonomyImportance: 75,
      changeTolerance: 50,
      technologyAdoption: 70,
      learningOrientation: 70,
      riskTolerance: 35,
      technologyTrust: 70,
      salaryBand: "mid",
      financialSensitivity: 60,
      incomeDependency: 80,
      teamSize: 8,
      globalTeamInvolvement: false,
      timezoneDependency: 20,
      clientInteraction: 45,
      crossFunctionalDependency: 75,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 25,
      overallAccessibilityNeed: 15,
      personalitySummary: "Part-time HR specialist balancing 30-hour work week with nursery and primary school commitments.",
      primaryConcerns: "Full 5-day presence is incompatible with part-time contract and afternoon childcare.",
    },
    {
      name: "Noor Haddad",
      avatarGlyph: "noor",
      age: 26,
      location: "Düsseldorf Downtown, Germany",
      locationCity: "Düsseldorf Downtown",
      education: "B.Sc. Business Informatics",
      lifeStage: "early-career",
      role: "Associate Developer",
      department: "Engineering",
      seniority: "associate",
      employmentType: "full-time",
      experienceYears: 2,
      skills: "Node.js, SQL, REST APIs, Frontend UI5",
      remotePreference: 45,
      officePreference: 75,
      collaborationPreference: 80,
      autonomyPreference: 50,
      asyncPreference: 50,
      meetingTolerance: 70,
      caregivingResponsibility: false,
      caregivingIntensity: 0,
      dependentsCount: 0,
      scheduleConstraints: 25,
      familyObligations: 20,
      commuteMinutes: 15,
      transportationMode: "walking",
      transportReliability: 95,
      relocationWillingness: 80,
      compensationImportance: 75,
      careerGrowthImportance: 95,
      learningImportance: 90,
      jobSecurityImportance: 70,
      flexibilityImportance: 50,
      workLifeBalanceImportance: 60,
      recognitionImportance: 80,
      autonomyImportance: 50,
      changeTolerance: 70,
      technologyAdoption: 85,
      learningOrientation: 90,
      riskTolerance: 60,
      technologyTrust: 80,
      salaryBand: "entry",
      financialSensitivity: 70,
      incomeDependency: 65,
      teamSize: 9,
      globalTeamInvolvement: false,
      timezoneDependency: 15,
      clientInteraction: 20,
      crossFunctionalDependency: 50,
      mobilityRequirements: false,
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 20,
      overallAccessibilityNeed: 10,
      personalitySummary: "Downtown resident living within walking distance of the office; eager for face-to-face peer pairing.",
      primaryConcerns: "Quiet office desks turning into empty echo chambers if colleagues are not coordinated.",
    },
    {
      name: "Vikram Rao",
      avatarGlyph: "vikram",
      age: 52,
      location: "Stuttgart Region, Germany",
      locationCity: "Stuttgart Region",
      education: "Ph.D. Computer Engineering",
      lifeStage: "senior",
      role: "Principal Systems Engineer",
      department: "Engineering",
      seniority: "executive",
      employmentType: "full-time",
      experienceYears: 27,
      skills: "Enterprise Architecture, High Availability, Security Governance",
      remotePreference: 60,
      officePreference: 60,
      collaborationPreference: 65,
      autonomyPreference: 85,
      asyncPreference: 70,
      meetingTolerance: 65,
      caregivingResponsibility: true, // eldercare
      caregivingIntensity: 45,
      dependentsCount: 1,
      scheduleConstraints: 50,
      familyObligations: 60,
      commuteMinutes: 50,
      transportationMode: "car",
      transportReliability: 80,
      relocationWillingness: 20,
      compensationImportance: 80,
      careerGrowthImportance: 50,
      learningImportance: 75,
      jobSecurityImportance: 85,
      flexibilityImportance: 75,
      workLifeBalanceImportance: 85,
      recognitionImportance: 70,
      autonomyImportance: 85,
      changeTolerance: 50,
      technologyAdoption: 80,
      learningOrientation: 80,
      riskTolerance: 45,
      technologyTrust: 75,
      salaryBand: "executive",
      financialSensitivity: 30,
      incomeDependency: 85,
      teamSize: 15,
      globalTeamInvolvement: true,
      timezoneDependency: 70,
      clientInteraction: 40,
      crossFunctionalDependency: 80,
      mobilityRequirements: true, // physical mobility
      sensoryRequirements: false,
      assistiveTechRequirements: false,
      environmentalRequirements: 70,
      overallAccessibilityNeed: 75,
      personalitySummary: "Veteran architect with reduced physical mobility and eldercare duties, valuing campus accessibility and flexible schedule windows.",
      primaryConcerns: "Accessible parking bays, campus elevator congestion, and eldercare emergency availability.",
    }
  ];
}
