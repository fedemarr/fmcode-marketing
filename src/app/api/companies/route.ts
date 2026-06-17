export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const createSchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  description: z.string().optional(),
  services: z.string().optional(),
  brand_tone: z.string().optional(),
  target_audience: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  posts_per_week: z.number().int().min(1).max(21).default(5),
})

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, industry, description, plan, posts_per_week, is_active, logo_url, created_at, social_accounts(id, platform, username, is_active)")
    .eq("owner_id", user.id)
    .is("deleted_at" as never, null)
    .order("created_at", { ascending: false })

  if (error) return Response.json({ success: false, error: { code: "DB_ERROR", message: error.message } }, { status: 500 })
  return Response.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 })

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...parsed.data, owner_id: user.id } as never)
    .select()
    .single()

  if (error) return Response.json({ success: false, error: { code: "DB_ERROR", message: error.message } }, { status: 500 })
  return Response.json({ success: true, data }, { status: 201 })
}
