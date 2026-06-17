import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  N8N_WEBHOOK_BASE_URL: z.string().url(),
  N8N_WEBHOOK_SECRET: z.string().min(16),
  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email(),
})

type Env = z.infer<typeof envSchema>

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

function getEnv(): Env {
  if (isBuildPhase) return {} as Env
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("❌ Variables de entorno inválidas:", parsed.error.flatten().fieldErrors)
    throw new Error("Variables de entorno faltantes o inválidas")
  }
  return parsed.data
}

export const env = new Proxy({} as Env, {
  get(_target, key: string) {
    return getEnv()[key as keyof Env]
  },
})
