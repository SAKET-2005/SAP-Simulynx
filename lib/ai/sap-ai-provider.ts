import {
  IAIProvider,
  ScenarioAnalysisResult,
  AggregateSimulationSummary,
  AIExplanationResult,
  AIConnectionTestResult,
} from "./ai-interface.js";
import { DeterministicAIProvider } from "./deterministic-provider.js";
import { UniversalScenarioIR, CounterfactualAttributeResult } from "../universal-scenario/types.js";

/**
 * SAP AI Core / Generative AI Hub / Joule Adapter
 * Connects to SAP BTP Generative AI Hub when credentials are configured,
 * with full diagnostics and graceful fallback to the deterministic engine.
 */
export class SapAIProvider implements IAIProvider {
  name = "SapAIProvider";
  private fallback: DeterministicAIProvider;
  private isConfigured: boolean = false;
  private authType: "OAUTH_CLIENT_CREDENTIALS" | "DIRECT_API_KEY" | "OPENAI_KEY" | "NONE" = "NONE";
  private apiEndpoint?: string;
  private authUrl?: string;
  private clientId?: string;
  private clientSecret?: string;
  private resourceGroup: string = "default";
  private deploymentId: string = "default";
  private directApiKey?: string;

  // Optional OpenAI / Azure OpenAI direct mode
  private openAiApiKey?: string;
  private openAiBaseUrl: string = "https://api.openai.com/v1";
  private openAiModel: string = "gpt-4o";

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
          this.authType = "OAUTH_CLIENT_CREDENTIALS";
          this.isConfigured = true;
        }
      } catch (err) {
        console.warn("[Simulynx Joule Adapter] Error reading VCAP_SERVICES:", err);
      }
    }

    // 2. Try explicit SAP AI Core environment variables
    if (!this.isConfigured) {
      this.apiEndpoint =
        process.env.AICORE_BASE_URL ||
        process.env.AICORE_AI_API_URL ||
        process.env.SAP_AI_API_URL;
      this.authUrl = process.env.AICORE_AUTH_URL;
      this.clientId = process.env.AICORE_CLIENT_ID;
      this.clientSecret = process.env.AICORE_CLIENT_SECRET;
      this.directApiKey = process.env.SAP_AI_API_KEY || process.env.JOULE_API_KEY;

      if (this.authUrl && this.clientId && this.clientSecret) {
        this.authType = "OAUTH_CLIENT_CREDENTIALS";
        this.isConfigured = !!this.apiEndpoint;
      } else if (this.directApiKey && this.apiEndpoint) {
        this.authType = "DIRECT_API_KEY";
        this.isConfigured = true;
      }
    }

    // 3. Try standard OpenAI / compatible Gateway if provided
    if (!this.isConfigured && process.env.OPENAI_API_KEY) {
      this.openAiApiKey = process.env.OPENAI_API_KEY;
      if (process.env.OPENAI_BASE_URL) this.openAiBaseUrl = process.env.OPENAI_BASE_URL;
      if (process.env.OPENAI_MODEL) this.openAiModel = process.env.OPENAI_MODEL;
      this.authType = "OPENAI_KEY";
      this.isConfigured = true;
    }

    if (process.env.AICORE_RESOURCE_GROUP) {
      this.resourceGroup = process.env.AICORE_RESOURCE_GROUP;
    }
    if (process.env.AICORE_DEPLOYMENT_ID) {
      this.deploymentId = process.env.AICORE_DEPLOYMENT_ID;
    }
  }

  public getStatus(): AIConnectionTestResult {
    const missing: string[] = [];
    if (!this.apiEndpoint && !this.openAiApiKey) {
      missing.push("AICORE_BASE_URL (or SAP_AI_API_URL)");
    }
    if (this.authType !== "DIRECT_API_KEY" && this.authType !== "OPENAI_KEY") {
      if (!this.authUrl) missing.push("AICORE_AUTH_URL");
      if (!this.clientId) missing.push("AICORE_CLIENT_ID");
      if (!this.clientSecret) missing.push("AICORE_CLIENT_SECRET");
    }

    return {
      success: this.isConfigured,
      activeProvider: this.name,
      isConfigured: this.isConfigured,
      mode: this.isConfigured ? (this.authType === "OPENAI_KEY" ? "OPENAI_DIRECT" : "LIVE_JOULE") : "FALLBACK_DETERMINISTIC",
      authType: this.authType,
      apiEndpoint: this.apiEndpoint || (this.openAiApiKey ? this.openAiBaseUrl : undefined),
      deploymentId: this.deploymentId,
      resourceGroup: this.resourceGroup,
      missingVariables: missing,
      message: this.isConfigured
        ? `Configured via ${this.authType}. Deployment: ${this.deploymentId}, Resource Group: ${this.resourceGroup}`
        : "Unconfigured: Missing required SAP AI Core / Joule environment variables.",
    };
  }

  public async testConnection(): Promise<AIConnectionTestResult> {
    const status = this.getStatus();
    if (!this.isConfigured) {
      return {
        ...status,
        success: false,
        message: "SAP AI Core credentials not configured. Running in Fallback Deterministic mode.",
        errorDetail: `Missing variables: ${status.missingVariables.join(", ")}`,
      };
    }

    const startTime = Date.now();

    // 1. If OpenAI Direct Mode
    if (this.authType === "OPENAI_KEY" && this.openAiApiKey) {
      try {
        const endpoint = `${this.openAiBaseUrl.replace(/\/+$/, "")}/chat/completions`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.openAiApiKey}`,
          },
          body: JSON.stringify({
            model: this.openAiModel,
            messages: [{ role: "user", content: "Ping" }],
            max_tokens: 5,
          }),
        });

        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
          const body = await res.text();
          return {
            ...status,
            success: false,
            latencyMs,
            message: `OpenAI gateway ping failed (HTTP ${res.status}: ${res.statusText})`,
            errorDetail: body,
          };
        }

        return {
          ...status,
          success: true,
          latencyMs,
          message: `Successfully connected to LLM Endpoint (${this.openAiModel}). Latency: ${latencyMs}ms.`,
        };
      } catch (err: any) {
        return {
          ...status,
          success: false,
          latencyMs: Date.now() - startTime,
          message: "Network error connecting to OpenAI endpoint.",
          errorDetail: err?.message || String(err),
        };
      }
    }

    // 2. Test Token Fetch for OAuth
    let token: string | null = null;
    if (this.authType === "OAUTH_CLIENT_CREDENTIALS") {
      try {
        token = await this.getAccessToken();
        if (!token) {
          return {
            ...status,
            success: false,
            latencyMs: Date.now() - startTime,
            message: "Failed to obtain OAuth token from SAP Authentication Service (XSUAA / IAS).",
            errorDetail: `Check AICORE_AUTH_URL (${this.authUrl}), AICORE_CLIENT_ID, and AICORE_CLIENT_SECRET.`,
          };
        }
      } catch (err: any) {
        return {
          ...status,
          success: false,
          latencyMs: Date.now() - startTime,
          message: "OAuth token exchange error.",
          errorDetail: err?.message || String(err),
        };
      }
    } else {
      token = this.directApiKey || null;
    }

    // 3. Test Inference Ping against Generative AI Hub / Joule deployment
    try {
      const endpoint = `${this.apiEndpoint?.replace(/\/+$/, "")}/v2/inference/deployments/${this.deploymentId}/chat/completions?api-version=2023-05-15`;
      const pingRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "AI-Resource-Group": this.resourceGroup,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Ping. Respond with 'PONG'." }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!pingRes.ok) {
        const errorText = await pingRes.text();
        let hint = "";
        if (pingRes.status === 404) {
          hint = `Deployment ID "${this.deploymentId}" not found in resource group "${this.resourceGroup}". Check SAP AI Launchpad deployment list.`;
        } else if (pingRes.status === 401) {
          hint = "Unauthorized (401). Verify client credentials or API key permissions.";
        } else if (pingRes.status === 403) {
          hint = `Forbidden (403). Ensure service key has access to resource group "${this.resourceGroup}".`;
        }

        return {
          ...status,
          success: false,
          latencyMs,
          message: `SAP AI Core returned HTTP ${pingRes.status}: ${pingRes.statusText}. ${hint}`.trim(),
          errorDetail: errorText,
        };
      }

      return {
        ...status,
        success: true,
        latencyMs,
        message: `Successfully connected to SAP AI Core Generative AI Hub (Deployment: ${this.deploymentId}). Latency: ${latencyMs}ms.`,
      };
    } catch (err: any) {
      return {
        ...status,
        success: false,
        latencyMs: Date.now() - startTime,
        message: "Failed to connect to SAP AI Core API endpoint.",
        errorDetail: err?.message || String(err),
      };
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
      const tokenEndpoint =
        this.authUrl.replace(/\/+$/, "") + "/oauth/token?grant_type=client_credentials";
      const authHeader =
        "Basic " + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(
          `[Simulynx Joule Adapter] OAuth token request failed (${response.status} ${response.statusText}):`,
          errBody
        );
        return null;
      }

      const data = await response.json();
      this.cachedToken = data.access_token;
      this.tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
      return this.cachedToken;
    } catch (err) {
      console.error("[Simulynx Joule Adapter] Failed to obtain access token:", err);
      return null;
    }
  }

  async parseScenario(text: string): Promise<UniversalScenarioIR> {
    if (!this.isConfigured) {
      return this.fallback.parseScenario(text);
    }

    try {
      let endpoint: string;
      let headers: Record<string, string>;
      let body: any;

      if (this.authType === "OPENAI_KEY" && this.openAiApiKey) {
        endpoint = `${this.openAiBaseUrl.replace(/\/+$/, "")}/chat/completions`;
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openAiApiKey}`,
        };
        body = {
          model: this.openAiModel,
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
        };
      } else {
        const token = await this.getAccessToken();
        if (!token) {
          console.warn("[Simulynx Joule Adapter] No token available, using deterministic fallback.");
          return this.fallback.parseScenario(text);
        }

        endpoint = `${this.apiEndpoint?.replace(/\/+$/, "")}/v2/inference/deployments/${this.deploymentId}/chat/completions?api-version=2023-05-15`;
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "AI-Resource-Group": this.resourceGroup,
        };
        body = {
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
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Simulynx Joule Adapter] Inference request failed (HTTP ${response.status} ${response.statusText}):`,
          errorText
        );
        return this.fallback.parseScenario(text);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.warn("[Simulynx Joule Adapter] Empty response content from AI Core.");
        return this.fallback.parseScenario(text);
      }

      content = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(content);
      const fallbackIR = await this.fallback.parseScenario(text);

      return {
        ...fallbackIR,
        intent: parsed.intent || fallbackIR.intent,
        proposal: parsed.proposal || fallbackIR.proposal,
        baseline: parsed.baseline || fallbackIR.baseline,
        changes: parsed.changes && parsed.changes.length > 0 ? parsed.changes : fallbackIR.changes,
        stakeholders: parsed.stakeholders || fallbackIR.stakeholders,
        argumentsFor: parsed.argumentsFor || fallbackIR.argumentsFor,
        argumentsAgainst: parsed.argumentsAgainst || fallbackIR.argumentsAgainst,
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : fallbackIR.confidence,
        unmappedConcepts: parsed.unmappedConcepts || fallbackIR.unmappedConcepts,
        clarificationNeeded: parsed.clarificationNeeded || fallbackIR.clarificationNeeded,
      };
    } catch (err) {
      console.error("[Simulynx Joule Adapter] Exception during parseScenario:", err);
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
      let endpoint: string;
      let headers: Record<string, string>;
      let body: any;

      const systemPrompt = `You are an executive HR decision support assistant for SAP Simulynx.
You provide a concise, high-level narrative analysis of aggregate numerical simulation results without altering any numbers.
Structure your JSON response with:
- executiveSummary: a 2-3 sentence overview explaining how this policy lands across the workforce and identifying key friction drivers.
- keyFindings: array of 3 bullet points with specific insights.
- questionsForReview: array of 3 actionable questions for executive leaders to consider before rollout. Remember: Simulynx provides decision support; final decisions remain with human leaders.
Respond ONLY with a valid JSON object.`;

      if (this.authType === "OPENAI_KEY" && this.openAiApiKey) {
        endpoint = `${this.openAiBaseUrl.replace(/\/+$/, "")}/chat/completions`;
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openAiApiKey}`,
        };
        body = {
          model: this.openAiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(summary) },
          ],
          temperature: 0.2,
        };
      } else {
        const token = await this.getAccessToken();
        if (!token) {
          return this.fallback.explainSimulation(summary);
        }

        endpoint = `${this.apiEndpoint?.replace(/\/+$/, "")}/v2/inference/deployments/${this.deploymentId}/chat/completions?api-version=2023-05-15`;
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "AI-Resource-Group": this.resourceGroup,
        };
        body = {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(summary) },
          ],
          temperature: 0.2,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Simulynx Joule Adapter] explainSimulation failed (HTTP ${response.status}):`,
          errorText
        );
        return this.fallback.explainSimulation(summary);
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content;
      if (!text) {
        return this.fallback.explainSimulation(summary);
      }

      text = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

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
      console.error("[Simulynx Joule Adapter] explainSimulation error, using deterministic fallback:", err);
      return this.fallback.explainSimulation(summary);
    }
  }

  async analyzeRedTeam(counterfactuals: CounterfactualAttributeResult[]): Promise<string> {
    return this.fallback.analyzeRedTeam(counterfactuals);
  }
}
