"use client"

import PostCard, { type StudioPost } from "./PostCard"

interface Props {
  posts: StudioPost[]
  onSelect: (post: StudioPost) => void
  emptyMessage?: string
}

export default function PostGrid({ posts, onSelect, emptyMessage = "No hay posts en esta sección" }: Props) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {posts.map(post => (
        <PostCard key={post.id} post={post} onClick={onSelect} />
      ))}
    </div>
  )
}
