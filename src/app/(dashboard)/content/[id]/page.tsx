import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ContentStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PostApprovalActions } from "@/components/content/post-approval-actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

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

const contentTypeLabels: Record<string, string> = {
  FEED_POST: "Post de feed",
  STORY: "Historia",
  REEL: "Reel",
  CAROUSEL: "Carrusel",
}

async function getPost(id: string) {
  return db.post.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      platform: true,
      contentType: true,
      status: true,
      objective: true,
      hook: true,
      caption: true,
      cta: true,
      hashtags: true,
      imagePrompt: true,
      imageUrl: true,
      scheduledAt: true,
      publishedAt: true,
      approvalNotes: true,
      rejectionReason: true,
      client: {
        select: { id: true, name: true, industry: true, communicationTone: true },
      },
      metrics: true,
    },
  })
}

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)
  if (!post) notFound()

  const isEditable = post.status === ContentStatus.DRAFT || post.status === ContentStatus.PENDING_APPROVAL

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/clients/${post.client.id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 truncate">{post.client.name}</h1>
            <span className="text-gray-400">·</span>
            <span className="text-sm text-gray-600">{contentTypeLabels[post.contentType]}</span>
            {post.scheduledAt && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-sm text-gray-600">
                  {new Date(post.scheduledAt).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            )}
          </div>
        </div>
        <Badge variant={statusVariants[post.status]}>{statusLabels[post.status]}</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-500 font-medium uppercase tracking-wide">Objetivo del post</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{post.objective}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contenido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Hook (primeras líneas)</p>
            <p className="text-sm font-medium text-gray-900 bg-blue-50 border border-blue-100 rounded-md p-3">{post.hook}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Caption completo</p>
            <p className="text-sm text-gray-700 whitespace-pre-line border rounded-md p-3 bg-gray-50">{post.caption}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">CTA</p>
            <p className="text-sm text-gray-700">{post.cta}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Hashtags</p>
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {post.imageUrl ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Imagen</CardTitle>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt="Imagen del post" className="rounded-md max-w-sm" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Prompt de imagen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 italic">{post.imagePrompt}</p>
            <p className="text-xs text-gray-400 mt-2">Usá este prompt en Midjourney, DALL-E o similar para generar la imagen.</p>
          </CardContent>
        </Card>
      )}

      {post.status === ContentStatus.REJECTED && post.rejectionReason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-red-600 mb-1">Motivo de rechazo</p>
            <p className="text-sm text-red-700">{post.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {post.metrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {[
                { label: "Likes", value: post.metrics.likes },
                { label: "Comentarios", value: post.metrics.comments },
                { label: "Guardados", value: post.metrics.saves },
                { label: "Compartidos", value: post.metrics.shares },
                { label: "Alcance", value: post.metrics.reach },
                { label: "Engagement", value: `${post.metrics.engagementRate.toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isEditable && (
        <PostApprovalActions
          postId={post.id}
          currentStatus={post.status}
          scheduledAt={post.scheduledAt?.toISOString()}
          initialCaption={post.caption}
          initialHook={post.hook}
          initialCta={post.cta}
          initialHashtags={post.hashtags}
          clientId={post.client.id}
        />
      )}
    </div>
  )
}
