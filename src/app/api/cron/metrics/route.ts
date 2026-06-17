import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ContentStatus } from "@prisma/client"
import { collectPostMetrics } from "@/services/instagram/metrics"
import { env } from "@/lib/env"

// Corre todos los días a las 10hs — recolecta métricas de posts publicados hace 24hs
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const dayBefore = new Date(yesterday)
  dayBefore.setDate(dayBefore.getDate() - 1)

  const posts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      publishedAt: { gte: dayBefore, lte: yesterday },
      instagramPostId: { not: null },
      metrics: null,
    },
    select: {
      id: true,
      instagramPostId: true,
      client: { select: { instagramToken: true } },
    },
  })

  const results = { attempted: posts.length, collected: 0, failed: 0, errors: [] as string[] }

  for (const post of posts) {
    try {
      if (!post.instagramPostId || !post.client.instagramToken) continue
      await collectPostMetrics(post.id, post.instagramPostId, post.client.instagramToken)
      results.collected++
    } catch (error) {
      results.failed++
      results.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : "Error"}`)
    }
  }

  console.log(`[CRON metrics] ${JSON.stringify(results)}`)
  return Response.json(results)
}
