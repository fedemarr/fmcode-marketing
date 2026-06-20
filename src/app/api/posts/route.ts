export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  company_id: z.string().uuid(),
  content_type: z.enum(["feed_post", "story", "reel", "carousel"]).default("feed_post"),
  status: z.enum(["draft", "pending_approval"]).default("draft"),
  objective: z.string().optional(),
  hook: z.string().optional(),
  caption: z.string().optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  image_prompt: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  scheduled_at: z.string().datetime().optional().nullable(),
  n8n_execution_id: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 })

  // Verificar que el usuario es dueño de la empresa
  const { data: companyRaw } = await supabase
    .from("companies")
    .select("id")
    .eq("id", parsed.data.company_id)
    .eq("owner_id", user.id)
    .single()

  if (!companyRaw) return Response.json({ success: false, error: { code: "FORBIDDEN", message: "Sin acceso a esta empresa" } }, { status: 403 })

  const { data, error } = await supabase
    .from("posts")
    .insert(parsed.data as never)
    .select()
    .single()

  if (error) return Response.json({ success: false, error: { code: "DB_ERROR", message: error.message } }, { status: 500 })
  return Response.json({ success: true, data }, { status: 201 })
}
