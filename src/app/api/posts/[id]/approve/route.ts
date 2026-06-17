export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { notifyPostApproved } from "@/lib/n8n/webhooks"

const schema = z.object({
  scheduled_at: z.string().datetime().optional(),
  approval_notes: z.string().optional(),
})

type PostRow = {
  id: string; status: string; scheduled_at: string | null
  company_id: string; companies: { owner_id: string }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

    const { data: postRaw, error: fetchErr } = await supabase
      .from("posts")
      .select("id, status, scheduled_at, company_id, companies!inner(owner_id)")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single()

    const post = postRaw as PostRow | null
    if (fetchErr || !post) return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Post no encontrado" } }, { status: 404 })
    if (post.companies.owner_id !== user.id) {
      return Response.json({ success: false, error: { code: "FORBIDDEN", message: "Sin permiso" } }, { status: 403 })
    }
    if (!["draft", "pending_approval"].includes(post.status)) {
      return Response.json({ success: false, error: { code: "INVALID_STATUS", message: "El post no puede aprobarse en su estado actual" } }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { scheduled_at, approval_notes } = schema.parse(body)

    const { data: updated, error } = await supabase
      .from("posts")
      .update({
        status: "approved",
        approval_notes,
        scheduled_at: scheduled_at ?? post.scheduled_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    const scheduledAt = scheduled_at ?? post.scheduled_at ?? new Date().toISOString()
    await notifyPostApproved(params.id, scheduledAt).catch(console.error)

    return Response.json({ success: true, data: updated })
  } catch (error) {
    console.error("[posts/approve]", error)
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: String(error) } }, { status: 500 })
  }
}
