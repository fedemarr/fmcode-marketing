export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  description: z.string().optional(),
  services: z.string().optional(),
  brand_tone: z.string().optional(),
  target_audience: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  posts_per_week: z.number().int().min(1).max(21).optional(),
  brand_colors: z.record(z.string()).optional(),
})

async function getOwnedCompany(supabase: ReturnType<typeof createClient>, id: string, userId: string) {
  return supabase
    .from("companies")
    .select("id, owner_id")
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at" as never, null)
    .single()
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const { data, error } = await supabase
    .from("companies")
    .select("*, social_accounts(*)")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single()

  if (error || !data) return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } }, { status: 404 })
  return Response.json({ success: true, data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const { error: accessError } = await getOwnedCompany(supabase, params.id, user.id)
  if (accessError) return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 })

  const { data, error } = await supabase
    .from("companies")
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as never)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return Response.json({ success: false, error: { code: "DB_ERROR", message: error.message } }, { status: 500 })
  return Response.json({ success: true, data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const { error: accessError } = await getOwnedCompany(supabase, params.id, user.id)
  if (accessError) return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } }, { status: 404 })

  const { error } = await supabase
    .from("companies")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", params.id)

  if (error) return Response.json({ success: false, error: { code: "DB_ERROR", message: error.message } }, { status: 500 })
  return Response.json({ success: true, data: { deleted: true } })
}
