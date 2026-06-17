export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { notifyPostRejected } from "@/lib/n8n/webhooks"

const schema = z.object({ reason: z.string().min(1) })

type PostRow = { id: string; status: string; company_id: string; companies: { owner_id: string } }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

    const { data: postRaw, error: fetchErr } = await supabase
      .from("posts")
      .select("id, status, company_id, companies!inner(owner_id)")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single()

    const post = postRaw as PostRow | null
    if (fetchErr || !post) return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Post no encontrado" } }, { status: 404 })
    if (post.companies.owner_id !== user.id) {
      return Response.json({ success: false, error: { code: "FORBIDDEN", message: "Sin permiso" } }, { status: 403 })
    }

    const body = await req.json()
    const { reason } = schema.parse(body)

    const { error } = await supabase
      .from("posts")
      .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
      .eq("id", params.id)

    if (error) throw error

    await notifyPostRejected(params.id, reason).catch(console.error)

    return Response.json({ success: true, data: { rejected: true } })
  } catch (error) {
    console.error("[posts/reject]", error)
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: String(error) } }, { status: 500 })
  }
}
