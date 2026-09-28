import { IAIProvider, AIConnectionTestResult } from "./ai-interface.js";
import { SapAIProvider } from "./sap-ai-provider.js";
import { DeterministicAIProvider } from "./deterministic-provider.js";

// Attempt to load .env if running under modern Node and file exists
if (typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile();
  } catch {
    // Ignore if file doesn't exist
  }
}

let cachedProvider: IAIProvider | null = null;

export function hasAICredentials(): boolean {
  return !!(
    process.env.AICORE_BASE_URL ||
    process.env.AICORE_AI_API_URL ||
    process.env.SAP_AI_API_URL ||
    process.env.AICORE_CLIENT_ID ||
    process.env.SAP_AI_API_KEY ||
    process.env.JOULE_API_KEY ||
    process.env.VCAP_SERVICES ||
    process.env.OPENAI_API_KEY
  );
}

export function getAIProvider(): IAIProvider {
  if (!cachedProvider) {
    if (hasAICredentials()) {
      cachedProvider = new SapAIProvider();
    } else {
      cachedProvider = new DeterministicAIProvider();
    }
  }
  return cachedProvider;
}

export function resetAIProvider(): void {
  cachedProvider = null;
}

export async function testAIConnection(): Promise<AIConnectionTestResult> {
  const provider = new SapAIProvider();
  return provider.testConnection();
}

export function getAIStatus(): AIConnectionTestResult {
  const provider = getAIProvider();
  if (typeof provider.getStatus === "function") {
    return provider.getStatus();
  }
  return {
    success: false,
    activeProvider: provider.name,
    isConfigured: false,
    mode: "FALLBACK_DETERMINISTIC",
    authType: "NONE",
    missingVariables: [],
    message: "Deterministic Fallback Provider active",
  };
}

export * from "./ai-interface.js";
export * from "./deterministic-provider.js";
export * from "./sap-ai-provider.js";
