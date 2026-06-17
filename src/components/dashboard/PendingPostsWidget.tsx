import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CONTENT_TYPE_LABELS } from "@/types"
import type { ContentType } from "@/types"

interface Post {
  id: string
  content_type: string
  caption: string | null
  hook: string | null
  scheduled_at: string | null
  image_url: string | null
  status: string
}

interface Props { posts: Post[] }

export default function PendingPostsWidget({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground text-sm">
        No hay posts pendientes de aprobación
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <Link key={post.id} href={`/posts/${post.id}`}>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4 items-start">
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {CONTENT_TYPE_LABELS[post.content_type as ContentType] ?? post.content_type}
                </Badge>
                {post.scheduled_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.scheduled_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium truncate">{post.hook ?? "Sin hook"}</p>
              <p className="text-xs text-muted-foreground truncate">{post.caption ?? "Sin caption"}</p>
            </div>
          </Card>
        </Link>
      ))}
      <Link href="/posts" className="text-sm text-primary underline block text-center py-1">
        Ver todos los posts →
      </Link>
    </div>
  )
}
