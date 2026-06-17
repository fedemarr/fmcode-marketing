export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import type { N8NWebhookPayload } from "@/types"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-n8n-secret")
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: N8NWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (payload.event) {
      case "content_generated": {
        const { company_id, posts } = payload.data
        if (posts.length > 0) {
          const { error } = await supabase.from("posts").insert(
            posts.map((p) => ({ ...p, status: "pending_approval" as const }))
          )
          if (error) throw error
        }
        await supabase.from("n8n_events").insert({
          event_type: "content_generated",
          company_id,
          payload: payload as unknown as Record<string, unknown>,
        })
        break
      }

      case "post_published": {
        const { post_id, platform_post_id } = payload.data
        const { error } = await supabase
          .from("posts")
          .update({ status: "published", platform_post_id, published_at: new Date().toISOString() })
          .eq("id", post_id)
        if (error) throw error
        await supabase.from("n8n_events").insert({
          event_type: "post_published",
          post_id,
          payload: payload as unknown as Record<string, unknown>,
        })
        break
      }

      case "post_failed": {
        const { post_id, error: errMsg, execution_id, workflow } = payload.data
        await supabase.from("posts").update({ status: "failed" }).eq("id", post_id)
        await supabase.from("automation_errors").insert({
          post_id,
          n8n_workflow: workflow,
          n8n_execution_id: execution_id,
          error_message: errMsg,
        })
        await supabase.from("n8n_events").insert({
          event_type: "post_failed",
          post_id,
          payload: payload as unknown as Record<string, unknown>,
        })
        break
      }

      case "metrics_updated": {
        const { post_id, metrics } = payload.data
        await supabase.from("post_metrics").upsert({ post_id, ...metrics, updated_at: new Date().toISOString() }, { onConflict: "post_id" })
        await supabase.from("n8n_events").insert({
          event_type: "metrics_updated",
          post_id,
          payload: payload as unknown as Record<string, unknown>,
        })
        break
      }

      default:
        return Response.json({ error: "Unknown event" }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[webhook/n8n]", error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
