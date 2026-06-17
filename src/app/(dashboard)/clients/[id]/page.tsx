import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ContentStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GenerateCalendarButton } from "@/components/clients/generate-calendar-button"
import { InstagramSettings } from "@/components/clients/instagram-settings"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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

async function getClient(id: string) {
  return db.client.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      industry: true,
      description: true,
      targetAudience: true,
      objectives: true,
      communicationTone: true,
      postFrequency: true,
      instagramHandle: true,
      instagramAccountId: true,
      instagramToken: true,
      isActive: true,
      posts: {
        where: { deletedAt: null },
        select: {
          id: true,
          hook: true,
          status: true,
          contentType: true,
          scheduledAt: true,
          imageUrl: true,
        },
        orderBy: { scheduledAt: "asc" },
        take: 30,
      },
    },
  })
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id)
  if (!client) notFound()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const upcomingPosts = client.posts.filter(
    (p) => p.scheduledAt && new Date(p.scheduledAt) >= now && p.status !== ContentStatus.REJECTED
  )
  const pendingPosts = client.posts.filter(
    (p) => p.status === ContentStatus.DRAFT || p.status === ContentStatus.PENDING_APPROVAL
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500">{client.industry}</p>
        </div>
        <GenerateCalendarButton
          clientId={client.id}
          clientName={client.name}
          month={currentMonth}
          year={currentYear}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información del cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
              <p className="text-sm text-gray-700">{client.description}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Público objetivo</p>
              <p className="text-sm text-gray-700">{client.targetAudience}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Objetivos</p>
              <p className="text-sm text-gray-700">{client.objectives}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tono</p>
                <p className="text-sm text-gray-700">{client.communicationTone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Frecuencia</p>
                <p className="text-sm text-gray-700">{client.postFrequency}x por semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Instagram</CardTitle>
          </CardHeader>
          <CardContent>
            <InstagramSettings
              clientId={client.id}
              instagramHandle={client.instagramHandle}
              instagramAccountId={client.instagramAccountId}
              isConnected={!!(client.instagramAccountId && client.instagramToken)}
            />
          </CardContent>
        </Card>
      </div>

      {pendingPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Pendientes de aprobación ({pendingPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {pendingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/content/${post.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{post.hook}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {post.contentType} ·{" "}
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
          </CardContent>
        </Card>
      )}

      {upcomingPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Próximas publicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {upcomingPosts.slice(0, 10).map((post) => (
                <Link
                  key={post.id}
                  href={`/content/${post.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{post.hook}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {post.contentType} ·{" "}
                      {post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })
                        : "Sin fecha"}
                    </p>
                  </div>
                  <Badge variant={statusVariants[post.status]} className="ml-3 shrink-0">
                    {statusLabels[post.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
