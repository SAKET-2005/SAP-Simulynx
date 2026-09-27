import {
  IAIProvider,
  ScenarioAnalysisResult,
  AggregateSimulationSummary,
  AIExplanationResult,
} from "./ai-interface.js";
import { DeterministicAIProvider } from "./deterministic-provider.js";
import { CounterfactualAttributeResult } from "../counterfactual/redteam-engine.js";

/**
 * SAP AI Core / Generative AI Hub Adapter
 * Connects to SAP BTP Generative AI Hub when bindings are available,
 * falling back gracefully to the deterministic provider if absent or offline.
 */
export class SapAIProvider implements IAIProvider {
  name = "SapAIProvider";
  private fallback: DeterministicAIProvider;
  private isConfigured: boolean = false;
  private apiEndpoint?: string;
  private authUrl?: string;
  private clientId?: string;
  private clientSecret?: string;
  private resourceGroup: string = "default";
  private deploymentId: string = "default";
  private directApiKey?: string;

  // Cached OAuth token
  private cachedToken?: string;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.fallback = new DeterministicAIProvider();
    this.initCredentials();
  }

  private initCredentials(): void {
    // 1. Try VCAP_SERVICES (SAP BTP Cloud Foundry runtime binding)
    if (process.env.VCAP_SERVICES) {
      try {
        const vcap = JSON.parse(process.env.VCAP_SERVICES);
        const aiService = vcap.aicore?.[0] || vcap["sap-ai-core"]?.[0];
        if (aiService?.credentials) {
          const creds = aiService.credentials;
          this.apiEndpoint = creds.serviceurls?.AI_API_URL || creds.apiurl;
          this.authUrl = creds.url;
          this.clientId = creds.clientid;
          this.clientSecret = creds.clientsecret;
          this.isConfigured = true;
        }
      } catch (err) {
        console.warn("[Simulynx Joule Adapter] Error reading VCAP_SERVICES:", err);
      }
    }

    // 2. Try explicit environment variables
    if (!this.isConfigured) {
      this.apiEndpoint = process.env.AICORE_BASE_URL || process.env.AICORE_AI_API_URL || process.env.SAP_AI_API_URL;
      this.authUrl = process.env.AICORE_AUTH_URL;
      this.clientId = process.env.AICORE_CLIENT_ID;
      this.clientSecret = process.env.AICORE_CLIENT_SECRET;
      this.directApiKey = process.env.SAP_AI_API_KEY || process.env.JOULE_API_KEY;

      if (this.apiEndpoint && (this.clientSecret || this.directApiKey)) {
        this.isConfigured = true;
      }
    }

    if (process.env.AICORE_RESOURCE_GROUP) {
      this.resourceGroup = process.env.AICORE_RESOURCE_GROUP;
    }
    if (process.env.AICORE_DEPLOYMENT_ID) {
      this.deploymentId = process.env.AICORE_DEPLOYMENT_ID;
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.directApiKey) {
      return this.directApiKey;
    }

    if (!this.authUrl || !this.clientId || !this.clientSecret) {
      return null;
    }

    // Check cached token
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken;
    }

    try {
      const tokenEndpoint = this.authUrl.replace(/\/+$/, "") + "/oauth/token?grant_type=client_credentials";
      const authHeader = "Basic " + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        console.warn(`[Simulynx Joule Adapter] OAuth token request failed: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      this.cachedToken = data.access_token;
      this.tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
      return this.cachedToken;
    } catch (err) {
      console.warn("[Simulynx Joule Adapter] Failed to obtain access token:", err);
      return null;
    }
  }

  async parseScenario(text: string): Promise<UniversalScenarioIR> {
    if (!this.isConfigured) {
      return this.fallback.parseScenario(text);
    }

    try {
      const token = await this.getAccessToken();
      if (!token) return this.fallback.parseScenario(text);

      const endpoint = `${this.apiEndpoint?.replace(/\/+$/, "")}/v2/inference/deployments/${this.deploymentId}/chat/completions?api-version=2023-05-15`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "AI-Resource-Group": this.resourceGroup,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an SAP workforce organizational decision assistant. Extract a structured UniversalScenarioIR JSON object:
{
  "intent": "policy_evaluation" | "tradeoff_inquiry" | "change_proposal" | "exploratory_question" | "unclear_inquiry",
  "proposal": string,
  "baseline": string,
  "changes": [{ "attribute": string, "beforeValue": any, "afterValue": any }],
  "stakeholders": string[],
  "potentialEffects": string[],
  "argumentsFor": string[],
  "argumentsAgainst": string[],
  "constraints": string[],
  "confidence": number (0.0 to 1.0),
  "unmappedConcepts": string[],
  "clarificationNeeded": string or null
}
Respond ONLY with valid JSON.`,
            },
            { role: "user", content: text },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) return this.fallback.parseScenario(text);

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;
      if (!content) return this.fallback.parseScenario(text);

      content = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(content);
      const fallbackIR = await this.fallback.parseScenario(text);

      return {
        ...fallbackIR,
        intent: parsed.intent || fallbackIR.intent,
        proposal: parsed.proposal || fallbackIR.proposal,
        baseline: parsed.baseline || fallbackIR.baseline,
        changes: parsed.changes || fallbackIR.changes,
        stakeholders: parsed.stakeholders || fallbackIR.stakeholders,
        argumentsFor: parsed.argumentsFor || fallbackIR.argumentsFor,
        argumentsAgainst: parsed.argumentsAgainst || fallbackIR.argumentsAgainst,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : fallbackIR.confidence,
        unmappedConcepts: parsed.unmappedConcepts || fallbackIR.unmappedConcepts,
        clarificationNeeded: parsed.clarificationNeeded || fallbackIR.clarificationNeeded,
      };
    } catch {
      return this.fallback.parseScenario(text);
    }
  }

  async analyzeScenario(text: string): Promise<ScenarioAnalysisResult> {
    const ir = await this.parseScenario(text);
    return {
      scenarioType: ir.intent,
      title: ir.proposal.length > 55 ? `${ir.proposal.substring(0, 52)}...` : ir.proposal,
      description: ir.proposal,
      changes: ir.changes,
      affectedDimensions: ir.affectedDimensions,
      ir,
    };
  }

  async explainSimulation(summary: AggregateSimulationSummary): Promise<AIExplanationResult> {
    if (!this.isConfigured) {
      return this.fallback.explainSimulation(summary);
    }

    try {
      const token = await this.getAccessToken();
      if (!token) {
        return this.fallback.explainSimulation(summary);
      }

      const endpoint = `${this.apiEndpoint?.replace(/\/+$/, "")}/v2/inference/deployments/${this.deploymentId}/chat/completions?api-version=2023-05-15`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "AI-Resource-Group": this.resourceGroup,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an executive HR decision support assistant for SAP Simulynx.
You provide a concise, high-level narrative analysis of aggregate numerical simulation results without altering any numbers.
Structure your JSON response with:
- executiveSummary: a 2-3 sentence overview explaining how this policy lands across the workforce and identifying key friction drivers.
- keyFindings: array of 3 bullet points with specific insights.
- questionsForReview: array of 3 actionable questions for executive leaders to consider before rollout. Remember: Simulynx provides decision support; final decisions remain with human leaders.
Respond ONLY with a valid JSON object.`,
            },
            {
              role: "user",
              content: JSON.stringify(summary),
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        return this.fallback.explainSimulation(summary);
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content;
      if (!text) {
        return this.fallback.explainSimulation(summary);
      }

      text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

      try {
        const parsed = JSON.parse(text);
        return {
          executiveSummary: parsed.executiveSummary || text,
          keyFindings: parsed.keyFindings || [
            `Overall workforce simulated impact: ${summary.overallImpactScore}%`,
            `Affected population: ${summary.affectedPercentage}%`,
          ],
          questionsForReview: parsed.questionsForReview || [
            "Can localized hybrid flexibility reduce turnover risk among high-commute caregivers?",
            "Simulynx provides decision support. Final decisions remain with human leaders.",
          ],
        };
      } catch {
        return {
          executiveSummary: text,
          keyFindings: [
            `Overall workforce simulated impact: ${summary.overallImpactScore}%`,
            `Affected population: ${summary.affectedPercentage}%`,
          ],
          questionsForReview: [
            "Can localized hybrid flexibility reduce turnover risk among high-commute caregivers?",
            "Simulynx provides decision support. Final decisions remain with human leaders.",
          ],
        };
      }
    } catch (err) {
      console.warn("[Simulynx Joule Adapter] explainSimulation error, using deterministic fallback:", err);
      return this.fallback.explainSimulation(summary);
    }
  }

  async analyzeRedTeam(counterfactuals: CounterfactualAttributeResult[]): Promise<string> {
    return this.fallback.analyzeRedTeam(counterfactuals);
  }
}
