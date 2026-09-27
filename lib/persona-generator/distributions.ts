import {
  LifeStage,
  SeniorityLevel,
  EmploymentType,
  TransportationMode,
  SalaryBand,
} from "./types.js";

/**
 * Seedable Linear Congruential Generator for reproducible pseudo-random numbers
 */
export class PRNG {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  rangeFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  clamp(val: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(val)));
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  weightedPick<T>(items: { item: T; weight: number }[]): T {
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let r = this.next() * total;
    for (const entry of items) {
      if (r <= entry.weight) return entry.item;
      r -= entry.weight;
    }
    return items[items.length - 1].item;
  }

  booleanWithProb(prob: number): boolean {
    return this.next() < prob;
  }
}

export const FIRST_NAMES = [
  "Maya", "Daniel", "Priya", "Liam", "Aisha", "Arjun", "Sofia", "Ethan",
  "Rahul", "Emma", "Noor", "Vikram", "Elena", "Marcus", "Chen", "Fatima",
  "Lucas", "Chloe", "Mateo", "Zara", "Dev", "Hannah", "Gabriel", "Ananya",
  "Oliver", "Mei", "Samuel", "Ingrid", "Tariq", "Leila", "Klaus", "Amara"
];

export const LAST_NAMES = [
  "Patel", "Vanderbilt", "Sharma", "Gallagher", "Al-Mansoor", "Kapoor",
  "Mendoza", "Wong", "Iyer", "Lindqvist", "Haddad", "Rao", "Nielsen",
  "O'Connor", "Zhang", "El-Sayed", "Silva", "Dubois", "Santos", "Kaur",
  "Mehta", "Schmidt", "Moreau", "Reddy", "Tanaka", "Fischer", "Ivanov"
];

export const LOCATIONS = [
  { city: "Berlin Urban Core", mode: "public_transit" as TransportationMode, avgCommute: 25 },
  { city: "Berlin Suburban", mode: "public_transit" as TransportationMode, avgCommute: 55 },
  { city: "Walldorf HQ Campus", mode: "car" as TransportationMode, avgCommute: 40 },
  { city: "Frankfurt Outer Ring", mode: "car" as TransportationMode, avgCommute: 65 },
  { city: "Munich Tech Park", mode: "public_transit" as TransportationMode, avgCommute: 35 },
  { city: "Hamburg Metro", mode: "cycling" as TransportationMode, avgCommute: 20 },
  { city: "Stuttgart Region", mode: "car" as TransportationMode, avgCommute: 50 },
  { city: "Düsseldorf Downtown", mode: "walking" as TransportationMode, avgCommute: 15 },
  { city: "Remote / Rural Bavaria", mode: "mixed" as TransportationMode, avgCommute: 90 },
  { city: "Remote / Black Forest", mode: "car" as TransportationMode, avgCommute: 85 }
];

export const ROLES_BY_DEPT: Record<string, { role: string; skills: string[]; baseSalary: SalaryBand }[]> = {
  "Engineering": [
    { role: "Senior Cloud Architect", skills: ["SAP BTP", "HANA", "TypeScript", "Microservices"], baseSalary: "senior" },
    { role: "Full-Stack Developer", skills: ["Node.js", "SAPUI5", "OData", "CDS"], baseSalary: "mid" },
    { role: "DevOps / Reliability Engineer", skills: ["CI/CD", "Kubernetes", "BTP Cloud Foundry", "Terraform"], baseSalary: "mid" },
    { role: "Principal Systems Engineer", skills: ["Distributed Systems", "Security", "Architecture"], baseSalary: "executive" },
    { role: "Associate Developer", skills: ["JavaScript", "HTML5", "SQL", "Git"], baseSalary: "entry" }
  ],
  "Product & AI": [
    { role: "Lead Product Manager", skills: ["Product Strategy", "User Research", "Agile", "Roadmapping"], baseSalary: "lead" as any },
    { role: "AI Research Scientist", skills: ["Generative AI", "LLM Fine-tuning", "Python", "Evaluation"], baseSalary: "senior" },
    { role: "UX / Fiori Design Specialist", skills: ["SAP Fiori", "Figma", "Design Thinking", "Accessibility"], baseSalary: "mid" }
  ],
  "Human Resources": [
    { role: "People Operations Partner", skills: ["Policy Governance", "Employee Experience", "HRIS"], baseSalary: "mid" },
    { role: "Workplace Strategy Specialist", skills: ["Hybrid Models", "Space Analytics", "Change Management"], baseSalary: "senior" },
    { role: "Talent Development Specialist", skills: ["Onboarding", "Mentorship", "Skills Mapping"], baseSalary: "mid" }
  ],
  "Sales & Consulting": [
    { role: "Enterprise Solution Advisor", skills: ["Client Engagement", "ERP Modernization", "Workshops"], baseSalary: "senior" },
    { role: "Strategic Customer Success Lead", skills: ["Account Growth", "Executive Stakeholder Mgmt"], baseSalary: "lead" as any },
    { role: "Business Development Representative", skills: ["Prospecting", "CRM", "Outreach"], baseSalary: "entry" }
  ],
  "Finance & Governance": [
    { role: "Senior Financial Analyst", skills: ["Workforce Budgeting", "Cost Modeling", "SAP S/4HANA"], baseSalary: "senior" },
    { role: "Compliance & Risk Analyst", skills: ["Data Privacy", "Regulatory Standards", "Internal Controls"], baseSalary: "mid" }
  ]
};
