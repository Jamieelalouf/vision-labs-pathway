export function isDemoBypassEnabled() {
  // Fail closed in production regardless of any flag value.
  if (process.env.VERCEL_ENV === "production") return false;

  const isBypassFlagEnabled = process.env.VISION_LABS_DEMO_BYPASS === "1";
  const isNonProductionNodeEnv = process.env.NODE_ENV !== "production";
  // Vercel preview/dev builds use NODE_ENV=production, so gate on VERCEL_ENV for non-prod deployments.
  const isVercelNonProductionEnv =
    process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development";

  return isBypassFlagEnabled && (isNonProductionNodeEnv || isVercelNonProductionEnv);
}

export function getDemoRoleOverride() {
  if (!isDemoBypassEnabled()) return null;

  const role = process.env.VISION_LABS_DEMO_ROLE;
  if (role === "admin" || role === "student") return role;
  return "student";
}
