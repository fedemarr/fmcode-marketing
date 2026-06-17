export const dynamic = "force-dynamic"

export async function GET() {
  const vars = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_KEY_PREFIX: process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? "NOT SET",
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    CRON_SECRET: !!process.env.CRON_SECRET,
    CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
    INSTAGRAM_APP_ID: !!process.env.INSTAGRAM_APP_ID,
  }

  const missing = Object.entries(vars)
    .filter(([k, v]) => k !== "ANTHROPIC_KEY_PREFIX" && !v)
    .map(([k]) => k)

  return Response.json({ ok: missing.length === 0, vars, missing })
}
