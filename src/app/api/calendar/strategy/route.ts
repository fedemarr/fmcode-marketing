export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiSuccess, NotFoundError } from "@/lib/errors"
import { generateMonthlyStrategy } from "@/services/ai/strategy"
import { generateCalendarSlots } from "@/services/ai/calendar"
import { formatMetricsForAI } from "@/services/instagram/metrics"

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

    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const previousMetrics = await formatMetricsForAI(clientId, prevMonth, prevYear)

    const strategyData = await generateMonthlyStrategy(client, month, year, previousMetrics || undefined)

    let strategyRecord = await db.contentStrategy.findUnique({
      where: { clientId_month_year: { clientId, month, year } },
    })

    if (strategyRecord) {
      strategyRecord = await db.contentStrategy.update({
        where: { id: strategyRecord.id },
        data: { analysis: strategyData.analysis, strategy: JSON.stringify(strategyData) },
      })
    } else {
      strategyRecord = await db.contentStrategy.create({
        data: { clientId, month, year, analysis: strategyData.analysis, strategy: JSON.stringify(strategyData) },
      })
    }

    const slots = generateCalendarSlots(strategyData, month, year, client.postFrequency)

    return apiSuccess({
      strategyId: strategyRecord.id,
      strategy: strategyData,
      slots: slots.map((s) => ({
        date: s.date.toISOString(),
        contentType: s.contentType,
        platform: s.platform,
        pillarName: s.pillarName,
      })),
    })
  } catch (error) {
    console.error("[strategy] error:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message } }, { status: 500 })
  }
}
