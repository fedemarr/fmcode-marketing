export const dynamic = "force-dynamic"
export const maxDuration = 55

import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { generateInstagramPost } from "@/lib/ai/generate-content"
import type { ContentType } from "@/types"

const schema = z.object({
  company_id: z.string().uuid(),
  content_type: z.enum(["feed_post", "story", "reel", "carousel"]).default("feed_post"),
  pillar: z.enum(["educativo", "conversión", "autoridad", "branding", "entretenimiento"]).default("educativo"),
  scheduled_date: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 })

  const { company_id, content_type, pillar, scheduled_date } = parsed.data

  const { data: companyRaw } = await supabase
    .from("companies")
    .select("id, name, industry, description, services, brand_tone, target_audience")
    .eq("id", company_id)
    .eq("owner_id", user.id)
    .single()

  const company = companyRaw as {
    id: string; name: string; industry: string; description: string | null
    services: string | null; brand_tone: string | null; target_audience: string | null
  } | null

  if (!company) return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } }, { status: 404 })

  // Buscar captions anteriores para evitar repetición
  const { data: prevRaw } = await supabase
    .from("posts")
    .select("caption")
    .eq("company_id", company_id)
    .not("caption", "is", null)
    .order("created_at", { ascending: false })
    .limit(10)

  const previousCaptions = (prevRaw as Array<{ caption: string | null }> | null)
    ?.map(p => p.caption).filter(Boolean) as string[] ?? []

  const scheduledDate = scheduled_date ? new Date(scheduled_date) : new Date()

  const generated = await generateInstagramPost(
    company,
    content_type as ContentType,
    pillar,
    scheduledDate,
    previousCaptions
  )

  return Response.json({ success: true, data: generated })
}
