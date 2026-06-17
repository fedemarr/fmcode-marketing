import { createServiceClient } from "@/lib/supabase/server"

const BASE_URL = process.env.N8N_WEBHOOK_BASE_URL!
const SECRET = process.env.N8N_WEBHOOK_SECRET!

async function callN8N(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-Secret": SECRET,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`N8N error ${res.status}: ${await res.text()}`)
  }

  return res.json()
}

async function logEvent(
  eventType: string,
  companyId: string | null,
  postId: string | null,
  payload: Record<string, unknown>
) {
  const supabase = createServiceClient()
  await supabase.from("n8n_events").insert({ event_type: eventType, company_id: companyId, post_id: postId, payload })
}

export async function triggerContentGeneration(companyId: string): Promise<void> {
  await callN8N("/content-generation", { company_id: companyId })
  await logEvent("content_generation_triggered", companyId, null, { company_id: companyId })
}

export async function notifyPostApproved(postId: string, scheduledAt: string): Promise<void> {
  await callN8N("/post-approved", { post_id: postId, scheduled_at: scheduledAt })
  await logEvent("post_approved", null, postId, { post_id: postId, scheduled_at: scheduledAt })
}

export async function notifyPostRejected(postId: string, reason: string): Promise<void> {
  await callN8N("/post-rejected", { post_id: postId, reason })
  await logEvent("post_rejected", null, postId, { post_id: postId, reason })
}

export async function retryFailedWorkflow(executionId: string): Promise<void> {
  await callN8N("/retry-execution", { execution_id: executionId })
  await logEvent("workflow_retry", null, null, { execution_id: executionId })
}
