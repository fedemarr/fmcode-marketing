export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiSuccess, NotFoundError } from "@/lib/errors"
import { generatePost } from "@/services/ai/content"
import { ContentStatus, ContentType, Platform } from "@prisma/client"

const schema = z.object({
  clientId: z.string().min(1),
  strategyId: z.string().min(1),
  slot: z.object({
    date: z.string(),
    contentType: z.nativeEnum(ContentType),
    platform: z.nativeEnum(Platform),
    pillarName: z.string(),
  }),
  previousCaptions: z.array(z.string()).default([]),
})

function buildImageUrl(prompt: string): string {
  const seed = Math.floor(Math.random() * 999999)
  const encoded = encodeURIComponent(
    prompt + ", instagram post, square format 1:1, professional photography, high quality"
  )
  return `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1080&seed=${seed}&nologo=true&enhance=true`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, strategyId, slot, previousCaptions } = schema.parse(body)

    const client = await db.client.findUnique({ where: { id: clientId, deletedAt: null } })
    if (!client) throw new NotFoundError("Cliente")

    const strategyRecord = await db.contentStrategy.findUnique({ where: { id: strategyId } })
    if (!strategyRecord) throw new NotFoundError("Estrategia")

    const strategyData = JSON.parse(strategyRecord.strategy)
    const pillar = strategyData.contentPillars.find((p: { name: string }) => p.name === slot.pillarName)
      ?? strategyData.contentPillars[0]

    const slotDate = new Date(slot.date)
    const generated = await generatePost(client, strategyData, pillar, slot.contentType, slotDate, previousCaptions)
    const imageUrl = buildImageUrl(generated.imagePrompt)

    const post = await db.post.create({
      data: {
        clientId,
        platform: slot.platform,
        contentType: slot.contentType,
        status: ContentStatus.DRAFT,
        objective: generated.objective,
        hook: generated.hook,
        caption: generated.caption,
        cta: generated.cta,
        hashtags: generated.hashtags,
        imagePrompt: generated.imagePrompt,
        imageUrl,
        scheduledAt: slotDate,
      },
    })

    await db.calendarEntry.create({
      data: {
        clientId,
        scheduledAt: slotDate,
        contentType: slot.contentType,
        platform: slot.platform,
        status: ContentStatus.DRAFT,
        postId: post.id,
      },
    })

    return apiSuccess({ post, caption: generated.caption.slice(0, 100) })
  } catch (error) {
    console.error("[generate-post] error:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message } }, { status: 500 })
  }
}
