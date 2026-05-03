import { existsSync } from "node:fs";

const requiredFiles = [
  "supabase/migrations/20260503000000_initial_schema.sql",
  "supabase/migrations/20260503010000_phase3_registration_hardening.sql",
  "supabase/migrations/20260503020000_phase6_video_uploads.sql",
  "supabase/migrations/20260503030000_phase7_reward_automation.sql",
  "supabase/seed/phase8_seed.sql",
  "vercel.json",
  "docs/PHASE8_QA_DEPLOYMENT.md"
];

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET"
];

const missingFiles = requiredFiles.filter((file) => !existsSync(file));
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingFiles.length) {
  console.error("Missing required project files:");
  for (const file of missingFiles) console.error(`- ${file}`);
}

if (missingEnv.length) {
  console.error("Missing production environment variables:");
  for (const key of missingEnv) console.error(`- ${key}`);
}

if (missingFiles.length || missingEnv.length) {
  process.exit(1);
}

console.log("Preflight passed.");
