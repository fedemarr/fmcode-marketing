import { db } from "@/lib/db"
import { getPostInsights } from "./client"

export async function collectPostMetrics(
  postId: string,
  instagramPostId: string,
  accessToken: string
): Promise<void> {
  const insights = await getPostInsights(instagramPostId, accessToken)

  await db.postMetrics.upsert({
    where: { postId },
    create: {
      postId,
      likes: insights.likes,
      comments: insights.comments,
      shares: insights.shares,
      saves: insights.saves,
      reach: insights.reach,
      impressions: insights.impressions,
      engagementRate: insights.engagementRate,
    },
    update: {
      likes: insights.likes,
      comments: insights.comments,
      shares: insights.shares,
      saves: insights.saves,
      reach: insights.reach,
      impressions: insights.impressions,
      engagementRate: insights.engagementRate,
      updatedAt: new Date(),
    },
  })
}

export async function formatMetricsForAI(clientId: string, month: number, year: number): Promise<string> {
  const posts = await db.post.findMany({
    where: {
      clientId,
      publishedAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
      metrics: { isNot: null },
      deletedAt: null,
    },
    select: {
      hook: true,
      contentType: true,
      metrics: {
        select: {
          likes: true,
          comments: true,
          saves: true,
          reach: true,
          engagementRate: true,
        },
      },
    },
    orderBy: { publishedAt: "asc" },
  })

  if (posts.length === 0) return ""

  const avgEngagement =
    posts.reduce((acc, p) => acc + (p.metrics?.engagementRate ?? 0), 0) / posts.length

  const topPosts = posts
    .filter((p) => p.metrics)
    .sort((a, b) => (b.metrics?.engagementRate ?? 0) - (a.metrics?.engagementRate ?? 0))
    .slice(0, 3)

  return `
Resumen del mes anterior:
- Posts publicados: ${posts.length}
- Engagement promedio: ${avgEngagement.toFixed(2)}%
- Posts con mejor performance:
${topPosts.map((p) => `  • "${p.hook.slice(0, 60)}..." (${p.contentType}) — ${p.metrics?.engagementRate.toFixed(1)}% engagement, ${p.metrics?.reach} alcance`).join("\n")}
`.trim()
}
