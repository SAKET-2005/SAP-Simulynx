import { IAIProvider } from "./ai-interface.js";
import { SapAIProvider } from "./sap-ai-provider.js";
import { DeterministicAIProvider } from "./deterministic-provider.js";

let cachedProvider: IAIProvider | null = null;

export function getAIProvider(): IAIProvider {
  if (!cachedProvider) {
    if (process.env.AICORE_BASE_URL || process.env.SAP_AI_API_URL) {
      cachedProvider = new SapAIProvider();
    } else {
      cachedProvider = new DeterministicAIProvider();
    }
  }
  return cachedProvider;
}

export * from "./ai-interface.js";
export * from "./deterministic-provider.js";
export * from "./sap-ai-provider.js";
