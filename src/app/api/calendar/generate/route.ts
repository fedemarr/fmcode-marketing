export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiSuccess, NotFoundError } from "@/lib/errors"
import { generateMonthlyStrategy } from "@/services/ai/strategy"
import { generateCalendarSlots } from "@/services/ai/calendar"
import { generatePost } from "@/services/ai/content"
import { formatMetricsForAI } from "@/services/instagram/metrics"
import { ContentStatus } from "@prisma/client"

const schema = z.object({
  clientId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2030),
  batch: z.number().int().min(0).default(0), // 0 = primera vez, 1 = segunda tanda, etc.
})

const BATCH_SIZE = 6

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
    const { clientId, month, year, batch } = schema.parse(body)

    const client = await db.client.findUnique({ where: { id: clientId, deletedAt: null } })
    if (!client) throw new NotFoundError("Cliente")

    // 1. Métricas del mes anterior
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const previousMetrics = await formatMetricsForAI(clientId, prevMonth, prevYear)

    // 2. Estrategia: si ya existe la reutilizamos (solo en batch > 0)
    let strategyRecord = await db.contentStrategy.findUnique({
      where: { clientId_month_year: { clientId, month, year } },
    })

    let strategyData
    if (batch === 0 || !strategyRecord) {
      strategyData = await generateMonthlyStrategy(client, month, year, previousMetrics || undefined)

      if (strategyRecord) {
        strategyRecord = await db.contentStrategy.update({
          where: { id: strategyRecord.id },
          data: { analysis: strategyData.analysis, strategy: JSON.stringify(strategyData) },
        })
      } else {
        strategyRecord = await db.contentStrategy.create({
          data: {
            clientId, month, year,
            analysis: strategyData.analysis,
            strategy: JSON.stringify(strategyData),
          },
        })
      }
    } else {
      strategyData = JSON.parse(strategyRecord.strategy)
    }

    // 3. Slots del mes completo — salteamos los ya generados
    const allSlots = generateCalendarSlots(strategyData, month, year, client.postFrequency)
    const existingCount = await db.post.count({
      where: { clientId, deletedAt: null, scheduledAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
    })
    const slots = allSlots.slice(existingCount, existingCount + BATCH_SIZE)

    if (slots.length === 0) {
      return apiSuccess({ strategyId: strategyRecord.id, postsGenerated: 0, posts: [], done: true })
    }

    // 4. Generar posts con imagen IA incluida
    const createdPosts = []
    const previousCaptions: string[] = []

    for (const slot of slots) {
      const pillar = strategyData.contentPillars.find((p: { name: string }) => p.name === slot.pillarName)
        ?? strategyData.contentPillars[0]

      const generated = await generatePost(client, strategyData, pillar, slot.contentType, slot.date, previousCaptions)
      previousCaptions.push(generated.caption.slice(0, 100))

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
          scheduledAt: slot.date,
        },
      })

      await db.calendarEntry.create({
        data: {
          clientId,
          scheduledAt: slot.date,
          contentType: slot.contentType,
          platform: slot.platform,
          status: ContentStatus.DRAFT,
          postId: post.id,
        },
      })

      createdPosts.push(post)
    }

    const totalAfter = existingCount + createdPosts.length
    const done = totalAfter >= allSlots.length

    return apiSuccess({
      strategyId: strategyRecord.id,
      postsGenerated: createdPosts.length,
      posts: createdPosts,
      done,
      totalPosts: totalAfter,
      totalSlots: allSlots.length,
    })
  } catch (error) {
    console.error("[generate] error:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    )
  }
}
