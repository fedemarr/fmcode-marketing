import { db } from "@/lib/db"
import { ContentStatus } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, FileText, CheckCircle, Clock } from "lucide-react"

async function getStats() {
  const [totalClients, pendingPosts, approvedPosts, publishedThisMonth] = await Promise.all([
    db.client.count({ where: { deletedAt: null, isActive: true } }),
    db.post.count({ where: { deletedAt: null, status: { in: [ContentStatus.DRAFT, ContentStatus.PENDING_APPROVAL] } } }),
    db.post.count({ where: { deletedAt: null, status: ContentStatus.APPROVED } }),
    db.post.count({
      where: {
        deletedAt: null,
        status: ContentStatus.PUBLISHED,
        publishedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ])

  return { totalClients, pendingPosts, approvedPosts, publishedThisMonth }
}

async function getRecentPosts() {
  return db.post.findMany({
    where: {
      deletedAt: null,
      status: { in: [ContentStatus.DRAFT, ContentStatus.PENDING_APPROVAL, ContentStatus.APPROVED] },
    },
    select: {
      id: true,
      hook: true,
      status: true,
      contentType: true,
      scheduledAt: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  })
}

const statusLabels: Record<ContentStatus, string> = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "Para aprobar",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  REJECTED: "Rechazado",
}

const statusVariants: Record<ContentStatus, "default" | "warning" | "success" | "destructive" | "secondary" | "info" | "outline"> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  SCHEDULED: "info",
  PUBLISHED: "default",
  REJECTED: "destructive",
}

export default async function DashboardPage() {
  const [stats, recentPosts] = await Promise.all([getStats(), getRecentPosts()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Clientes activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-md">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Para revisar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-md">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Publicados este mes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Posts pendientes de revisión</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No hay posts pendientes</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/content/${post.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.hook}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {post.client.name} ·{" "}
                      {post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                        : "Sin fecha"}
                    </p>
                  </div>
                  <Badge variant={statusVariants[post.status]} className="ml-3 shrink-0">
                    {statusLabels[post.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
