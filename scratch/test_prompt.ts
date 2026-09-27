import { parseScenarioToIR } from "../lib/universal-scenario/universal-parser.js";
import { CONCEPT_ONTOLOGY_REGISTRY } from "../lib/universal-scenario/concept-ontology.js";

const text = "I am applying for a Software Engineering Intern role after completing my internship as a Cyber Security Intern. After completing this internship I realised that I am not a good fit for this domain as I enjoy coding more and I would be a better fit for the Software Engineering role. What are my chances of being hired if I have the required skills and am able to code in all the major langueages required by the company.";

const ir = parseScenarioToIR(text);
console.log("INTENT:", ir.intent);
console.log("PROPOSAL:", ir.proposal);
console.log("CHANGES:", ir.changes);
console.log("AFFECTED DIMS:", ir.affectedDimensions.map(d => d.dimensionKey));
console.log("PRESSURES:", ir.attributePressures);
console.log("CONFIDENCE:", ir.confidence);
console.log("UNMAPPED:", ir.unmappedConcepts);
console.log("CLARIFICATION:", ir.clarificationNeeded);
