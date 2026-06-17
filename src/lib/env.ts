import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
})

type Env = z.infer<typeof envSchema>

// Durante el build de Next.js no hay env vars — la validación ocurre en runtime
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

function getEnv(): Env {
  if (isBuildPhase) {
    // Devuelve un objeto vacío tipado durante el build (nunca se llama a estas rutas en build)
    return {} as Env
  }
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("❌ Variables de entorno inválidas:")
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error("Variables de entorno faltantes o inválidas. Revisá .env.example")
  }
  return parsed.data
}

export const env = new Proxy({} as Env, {
  get(_target, key: string) {
    return getEnv()[key as keyof Env]
  },
})
