import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const rootDir = process.cwd();

[
  path.join(rootDir, ".env.local"),
  path.join(rootDir, ".env"),
  path.join(rootDir, "product_poster_generator_codex_pack", "poster_gen_codex_pack", ".env.local")
].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});

export const config = {
  rootDir,
  isVercel: Boolean(process.env.VERCEL),
  port: Number(process.env.PORT || 5173),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:5173",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterImageModel: process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-image-1",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "product-images",
  localDataFile: process.env.LOCAL_DATA_FILE || "data/store.local.json"
};

export function publicConfig() {
  return {
    openRouterConfigured: Boolean(config.openRouterApiKey),
    supabaseConfigured: Boolean(config.supabaseUrl && config.supabaseServiceRoleKey),
    supabaseStorageBucket: config.supabaseStorageBucket
  };
}
