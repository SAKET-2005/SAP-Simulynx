import fs from "node:fs";
import path from "node:path";
import { testAIConnection, getAIStatus, getAIProvider } from "../lib/ai/index.js";

async function run() {
  console.log("===============================================================");
  console.log("       SAP Simulynx — Joule / AI Core Diagnostic Tool          ");
  console.log("===============================================================\n");

  const envPath = path.resolve(process.cwd(), ".env");
  const hasEnvFile = fs.existsSync(envPath);

  console.log(`[1] Checking Configuration Files:`);
  if (hasEnvFile) {
    console.log(`  ✓ .env file found at: ${envPath}`);
  } else {
    console.log(`  ⚠️ No .env file found in project root (${envPath}).`);
    console.log(`    (Simulynx will look for system environment variables)`);
  }

  console.log(`\n[2] Checking AI Core / Joule Environment Variables:`);
  const vars = [
    { key: "AICORE_BASE_URL", val: process.env.AICORE_BASE_URL || process.env.SAP_AI_API_URL, secret: false },
    { key: "AICORE_AUTH_URL", val: process.env.AICORE_AUTH_URL, secret: false },
    { key: "AICORE_CLIENT_ID", val: process.env.AICORE_CLIENT_ID, secret: false },
    { key: "AICORE_CLIENT_SECRET", val: process.env.AICORE_CLIENT_SECRET, secret: true },
    { key: "AICORE_RESOURCE_GROUP", val: process.env.AICORE_RESOURCE_GROUP || "default (default)", secret: false },
    { key: "AICORE_DEPLOYMENT_ID", val: process.env.AICORE_DEPLOYMENT_ID || "default (default)", secret: false },
    { key: "SAP_AI_API_KEY", val: process.env.SAP_AI_API_KEY || process.env.JOULE_API_KEY, secret: true },
    { key: "OPENAI_API_KEY", val: process.env.OPENAI_API_KEY, secret: true },
  ];

  for (const v of vars) {
    if (v.val) {
      const display = v.secret ? `${v.val.substring(0, 4)}...${v.val.substring(v.val.length - 3)} (SET)` : v.val;
      console.log(`  ✓ ${v.key}: ${display}`);
    } else {
      console.log(`  ✗ ${v.key}: NOT SET`);
    }
  }

  console.log(`\n[3] Current Provider Status:`);
  const initialStatus = getAIStatus();
  console.log(`  Active Provider: ${initialStatus.activeProvider}`);
  console.log(`  Mode:            ${initialStatus.mode}`);
  console.log(`  Configured:      ${initialStatus.isConfigured ? "YES" : "NO (Offline Fallback active)"}`);

  console.log(`\n[4] Running Live Connection Test...`);
  const result = await testAIConnection();

  if (result.success) {
    console.log(`\n  ✅ CONNECTION SUCCESSFUL!`);
    console.log(`  Message:    ${result.message}`);
    console.log(`  Latency:    ${result.latencyMs}ms`);
    console.log(`  Endpoint:   ${result.apiEndpoint}`);
    console.log(`  Deployment: ${result.deploymentId}`);
    console.log(`\n  Joule AI is active and responding. Simulynx will use live AI parsing & reasoning!`);
  } else {
    console.log(`\n  ❌ CONNECTION FAILED OR UNCONFIGURED`);
    console.log(`  Message: ${result.message}`);
    if (result.errorDetail) {
      console.log(`  Details: ${result.errorDetail}`);
    }
    if (result.missingVariables.length > 0) {
      console.log(`  Missing Required Variables:`);
      for (const m of result.missingVariables) {
        console.log(`    - ${m}`);
      }
    }

    console.log(`\n===============================================================`);
    console.log(`                      HOW TO FIX THIS                          `);
    console.log(`===============================================================`);
    console.log(`To connect SAP AI Core / Joule, create a '.env' file in this folder:`);
    console.log(`\n--- Example .env (SAP AI Core Service Key) ---`);
    console.log(`AICORE_BASE_URL=https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com`);
    console.log(`AICORE_AUTH_URL=https://your-tenant.authentication.eu10.hana.ondemand.com`);
    console.log(`AICORE_CLIENT_ID=sb-clone-xxx!b12345|aicore!b123`);
    console.log(`AICORE_CLIENT_SECRET=your-client-secret-here`);
    console.log(`AICORE_RESOURCE_GROUP=default`);
    console.log(`AICORE_DEPLOYMENT_ID=your-model-deployment-id`);
    console.log(`\n--- Or Direct Joule / API Gateway ---`);
    console.log(`AICORE_BASE_URL=https://your-joule-gateway.corp/v1`);
    console.log(`SAP_AI_API_KEY=your-api-key`);
    console.log(`\n--- Or OpenAI Gateway (Fallback Option) ---`);
    console.log(`OPENAI_API_KEY=sk-...`);
    console.log(`===============================================================\n`);
  }
}

run().catch((err) => {
  console.error("Diagnostic tool encountered an unexpected error:", err);
  process.exit(1);
});
