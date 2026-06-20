export const dynamic = "force-dynamic"
export const maxDuration = 55

import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { generatePostImage } from "@/lib/ai/generate-image"
import type { ContentType } from "@/types"

const schema = z.object({
  image_prompt: z.string().min(10),
  content_type: z.enum(["feed_post", "story", "reel", "carousel"]).default("feed_post"),
  company_name: z.string().default(""),
  use_paid: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 })

  const { image_prompt, content_type, company_name, use_paid } = parsed.data

  const imageUrl = await generatePostImage(image_prompt, content_type as ContentType, company_name, use_paid)

  return Response.json({ success: true, data: { image_url: imageUrl } })
}
