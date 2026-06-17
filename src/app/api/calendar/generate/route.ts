export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError } from "@/lib/errors"
import { generateMonthlyStrategy } from "@/services/ai/strategy"
import { generateCalendarSlots } from "@/services/ai/calendar"
import { generatePost } from "@/services/ai/content"
import { formatMetricsForAI } from "@/services/instagram/metrics"
import { ContentStatus } from "@prisma/client"

const schema = z.object({
  clientId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2030),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, month, year } = schema.parse(body)

    const client = await db.client.findUnique({ where: { id: clientId, deletedAt: null } })
    if (!client) throw new NotFoundError("Cliente")

    // 1. Traer métricas del mes anterior para el feedback loop
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const previousMetrics = await formatMetricsForAI(clientId, prevMonth, prevYear)

    // 2. Generar (o regenerar) la estrategia mensual con contexto de métricas anteriores
    let strategyRecord = await db.contentStrategy.findUnique({
      where: { clientId_month_year: { clientId, month, year } },
    })

    const strategyData = await generateMonthlyStrategy(client, month, year, previousMetrics || undefined)

    if (strategyRecord) {
      strategyRecord = await db.contentStrategy.update({
        where: { id: strategyRecord.id },
        data: {
          analysis: strategyData.analysis,
          strategy: JSON.stringify(strategyData),
        },
      })
    } else {
      strategyRecord = await db.contentStrategy.create({
        data: {
          clientId,
          month,
          year,
          analysis: strategyData.analysis,
          strategy: JSON.stringify(strategyData),
        },
      })
    }

    // 3. Generar los slots del calendario (máx 16 para no superar el timeout de Vercel Hobby)
    const allSlots = generateCalendarSlots(strategyData, month, year, client.postFrequency)
    const slots = allSlots.slice(0, 16)

    // 4. Generar cada post y guardarlo
    const createdPosts = []
    const previousCaptions: string[] = []

    for (const slot of slots) {
      const pillar = strategyData.contentPillars.find((p) => p.name === slot.pillarName)
        ?? strategyData.contentPillars[0]

      const generated = await generatePost(
        client,
        strategyData,
        pillar,
        slot.contentType,
        slot.date,
        previousCaptions
      )

      previousCaptions.push(generated.caption.slice(0, 100))

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

    return apiSuccess({
      strategyId: strategyRecord.id,
      postsGenerated: createdPosts.length,
      posts: createdPosts,
    })
  } catch (error) {
    return apiError(error)
  }
}
