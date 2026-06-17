import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, STATUS_VARIANTS, CONTENT_TYPE_LABELS } from "@/types"
import type { ContentStatus, ContentType } from "@/types"

interface Post {
  id: string
  content_type: string
  status: string
  caption: string | null
  hook: string | null
  scheduled_at: string | null
  image_url: string | null
}

export default function PostCard({ post }: { post: Post }) {
  const status = post.status as ContentStatus
  const contentType = post.content_type as ContentType

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer h-full">
        {post.image_url ? (
          <div className="aspect-square relative overflow-hidden bg-gray-100">
            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-4xl">✍</span>
          </div>
        )}
        <CardContent className="pt-3 pb-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant={STATUS_VARIANTS[status] as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
              {STATUS_LABELS[status] ?? status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {CONTENT_TYPE_LABELS[contentType] ?? contentType}
            </span>
          </div>
          <p className="text-sm font-medium line-clamp-2">{post.hook ?? post.caption ?? "Sin contenido"}</p>
        </CardContent>
        <CardFooter className="pt-0 pb-3">
          {post.scheduled_at && (
            <p className="text-xs text-muted-foreground">
              {new Date(post.scheduled_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
