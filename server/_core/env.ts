import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  appId: z.string().min(1, "VITE_APP_ID is required"),
  cookieSecret: isProduction
    ? z.string().min(32, "JWT_SECRET must be at least 32 characters in production")
    : z.string().default("dev-secret-change-me-in-production"),
  databaseUrl: z.string().default(""),
  oAuthServerUrl: z.string().default(""),
  ownerOpenId: z.string().default(""),
  isProduction: z.boolean(),
  localAuthEnabled: z.boolean(),
  forgeApiUrl: z.string().default(""),
  forgeApiKey: z.string().default(""),
});

function loadEnv() {
  const raw = {
    appId: process.env.VITE_APP_ID ?? "",
    cookieSecret: process.env.JWT_SECRET ?? "",
    databaseUrl: process.env.DATABASE_URL ?? "",
    oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
    ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
    isProduction,
    localAuthEnabled: process.env.VIVIOKE_LOCAL_AUTH === "1" && !isProduction,
    forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
    forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  };

  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error("[Env] Invalid environment configuration:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    if (isProduction) {
      process.exit(1);
    }
  }

  return result.success ? result.data : (raw as z.infer<typeof envSchema>);
}

export const ENV = loadEnv();
