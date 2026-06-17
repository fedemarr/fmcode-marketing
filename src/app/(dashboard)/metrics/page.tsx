import { db } from "@/lib/db"
import { ContentStatus } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

async function getMetrics() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [topPosts, clientMetrics, totalPublished] = await Promise.all([
    db.post.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        metrics: { isNot: null },
        deletedAt: null,
      },
      select: {
        id: true,
        hook: true,
        contentType: true,
        publishedAt: true,
        client: { select: { name: true } },
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
      orderBy: { metrics: { engagementRate: "desc" } },
      take: 10,
    }),

    db.client.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        posts: {
          where: { deletedAt: null, status: ContentStatus.PUBLISHED, publishedAt: { gte: startOfMonth } },
          select: {
            metrics: { select: { engagementRate: true, reach: true, likes: true } },
          },
        },
      },
    }),

    db.post.count({
      where: { deletedAt: null, status: ContentStatus.PUBLISHED, publishedAt: { gte: startOfMonth } },
    }),
  ])

  const clientStats = clientMetrics.map((c) => {
    const postsWithMetrics = c.posts.filter((p) => p.metrics)
    const avgEngagement =
      postsWithMetrics.length > 0
        ? postsWithMetrics.reduce((acc, p) => acc + (p.metrics?.engagementRate ?? 0), 0) / postsWithMetrics.length
        : 0
    const totalReach = postsWithMetrics.reduce((acc, p) => acc + (p.metrics?.reach ?? 0), 0)
    return {
      id: c.id,
      name: c.name,
      published: c.posts.length,
      avgEngagement,
      totalReach,
    }
  })

  return { topPosts, clientStats, totalPublished }
}

export default async function MetricsPage() {
  const { topPosts, clientStats, totalPublished } = await getMetrics()

  const now = new Date()
  const monthName = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>
        <p className="text-sm text-gray-500 mt-1">{monthName} — {totalPublished} posts publicados</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Por cliente este mes</CardTitle>
        </CardHeader>
        <CardContent>
          {clientStats.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Sin datos todavía</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {clientStats.map((c) => (
                <div key={c.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.published} posts publicados</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {c.avgEngagement > 0 ? `${c.avgEngagement.toFixed(1)}%` : "—"}
                    </p>
                    <p className="text-xs text-gray-400">engagement</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {c.totalReach > 0 ? c.totalReach.toLocaleString("es-AR") : "—"}
                    </p>
                    <p className="text-xs text-gray-400">alcance</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top posts por engagement</CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Las métricas aparecen 24hs después de publicar
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topPosts.map((post, i) => (
                <div key={post.id} className="py-3 flex items-start gap-3">
                  <span className="text-lg font-bold text-gray-300 w-6 shrink-0 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{post.hook}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {post.client.name} · {post.contentType}
                      {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">{post.metrics?.engagementRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">{post.metrics?.reach.toLocaleString("es-AR")} alcance</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
