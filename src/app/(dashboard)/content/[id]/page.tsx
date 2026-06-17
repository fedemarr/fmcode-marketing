import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ContentStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PostActions } from "@/components/content/post-actions"
import { ArrowLeft, ImageIcon } from "lucide-react"
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

  const isActionable =
    post.status === ContentStatus.DRAFT ||
    post.status === ContentStatus.PENDING_APPROVAL ||
    post.status === ContentStatus.APPROVED

  const formattedDate = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/clients/${post.client.id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 truncate">{post.client.name}</h1>
            <span className="text-gray-400">·</span>
            <span className="text-sm text-gray-600">{contentTypeLabels[post.contentType]}</span>
            {formattedDate && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-sm text-gray-600">{formattedDate}</span>
              </>
            )}
          </div>
        </div>
        <Badge variant={statusVariants[post.status]}>{statusLabels[post.status]}</Badge>
      </div>

      {/* Main layout: image preview + details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Instagram-style preview */}
        <div className="space-y-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Instagram post header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {post.client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{post.client.name.toLowerCase().replace(/\s+/g, "_")}</p>
                <p className="text-xs text-gray-400">{contentTypeLabels[post.contentType]}</p>
              </div>
            </div>

            {/* Image */}
            {post.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.imageUrl}
                alt="Imagen del post"
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-3 p-6">
                <ImageIcon className="h-12 w-12 text-gray-300" />
                <p className="text-xs text-gray-400 text-center italic leading-relaxed">
                  {post.imagePrompt}
                </p>
                <p className="text-xs text-gray-300 text-center">
                  Copiá el prompt de arriba para generar la imagen en Midjourney o DALL-E
                </p>
              </div>
            )}

            {/* Caption */}
            <div className="px-3 py-3 space-y-1">
              <p className="text-xs text-gray-900 line-clamp-3">
                <span className="font-semibold">{post.client.name.toLowerCase().replace(/\s+/g, "_")} </span>
                {post.caption}
              </p>
              {post.hashtags.length > 0 && (
                <p className="text-xs text-blue-500 line-clamp-1">
                  {post.hashtags.map((h) => `#${h}`).join(" ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Post details + actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Objetivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{post.objective}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Hook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-gray-900 bg-blue-50 border border-blue-100 rounded p-2">{post.hook}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Caption completo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{post.caption}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">CTA · Hashtags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-700">{post.cta}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {!post.imageUrl && (
            <Card className="border-dashed border-gray-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Prompt de imagen (para IA)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 italic">{post.imagePrompt}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {post.status === ContentStatus.REJECTED && post.rejectionReason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-red-600 mb-1">Motivo de rechazo</p>
            <p className="text-sm text-red-700">{post.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
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

      {/* Actions */}
      {isActionable && (
        <Card>
          <CardContent className="pt-5">
            <PostActions
              postId={post.id}
              currentStatus={post.status}
              scheduledAt={post.scheduledAt?.toISOString()}
              initialCaption={post.caption}
              initialHook={post.hook}
              initialCta={post.cta}
              initialHashtags={post.hashtags}
              clientId={post.client.id}
              hasImage={!!post.imageUrl}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
