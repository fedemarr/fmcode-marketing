"use client"

import PostStatusBadge from "./PostStatusBadge"
import type { ContentType } from "@/types"

const TYPE_LABEL: Record<ContentType, string> = {
  feed_post: "Feed 1:1",
  carousel:  "Carrusel",
  story:     "Story 9:16",
  reel:      "Reel",
}

const TYPE_COLOR: Record<ContentType, string> = {
  feed_post: "bg-green-100 text-green-700",
  carousel:  "bg-orange-100 text-orange-700",
  story:     "bg-blue-100 text-blue-700",
  reel:      "bg-purple-100 text-purple-700",
}

export interface StudioPost {
  id: string
  content_type: string
  status: string
  hook: string | null
  caption: string | null
  image_url: string | null
  scheduled_at: string | null
}

interface Props {
  post: StudioPost
  onClick: (post: StudioPost) => void
  compact?: boolean
}

export default function PostCard({ post, onClick, compact = false }: Props) {
  const type = post.content_type as ContentType
  const isStory = type === "story" || type === "reel"
  const aspectClass = isStory ? "aspect-[9/16]" : "aspect-square"

  return (
    <div
      onClick={() => onClick(post)}
      className="group cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-green-300 transition-all"
    >
      {/* Imagen */}
      <div className={`relative ${compact ? "aspect-square" : aspectClass} bg-gradient-to-br from-green-50 to-gray-100 overflow-hidden`}>
        {post.image_url ? (
          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
            <div className="text-3xl mb-2">✍️</div>
            <p className="text-xs text-gray-400 line-clamp-3">{post.hook ?? post.caption ?? "Sin contenido"}</p>
          </div>
        )}

        {/* Overlay en hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="bg-white text-gray-900 text-xs font-medium px-3 py-1.5 rounded-full">
            Ver detalle
          </button>
        </div>

        {/* Badge de tipo arriba derecha */}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[type] ?? "bg-gray-100 text-gray-600"}`}>
            {TYPE_LABEL[type] ?? type}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2.5">
        <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1.5">
          {post.hook ?? post.caption ?? "Sin contenido"}
        </p>
        <div className="flex items-center justify-between">
          <PostStatusBadge status={post.status} />
          {post.scheduled_at && (
            <span className="text-[10px] text-gray-400">
              {new Date(post.scheduled_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
