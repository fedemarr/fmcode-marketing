"use client"

import Link from "next/link"
import { STATUS_VARIANTS, STATUS_LABELS } from "@/types"
import type { ContentStatus } from "@/types"

interface Post {
  id: string
  content_type: string
  status: string
  hook: string | null
  caption: string | null
  image_url: string | null
  scheduled_at: string | null
}

interface Props { posts: Post[] }

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  scheduled: "bg-indigo-100 text-indigo-800",
  published: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
}

export default function ContentCalendar({ posts }: Props) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const postsByDay: Record<number, Post[]> = {}
  for (const post of posts) {
    if (!post.scheduled_at) continue
    const d = new Date(post.scheduled_at).getDate()
    if (!postsByDay[d]) postsByDay[d] = []
    postsByDay[d].push(post)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthName = now.toLocaleString("es-AR", { month: "long", year: "numeric" })

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 capitalize">{monthName}</h2>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div
              key={i}
              className={`min-h-[100px] p-1.5 border-b border-r last:border-r-0 ${
                day === now.getDate() ? "bg-blue-50" : ""
              } ${!day ? "bg-gray-50" : ""}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-medium ${day === now.getDate() ? "text-blue-600" : "text-gray-500"}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {(postsByDay[day] ?? []).map(post => (
                      <Link key={post.id} href={`/posts/${post.id}`}>
                        <div className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${STATUS_COLORS[post.status as ContentStatus] ?? "bg-gray-100"}`}>
                          {post.hook ?? post.caption ?? "Post"}
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.entries(STATUS_COLORS) as [ContentStatus, string][]).map(([status, color]) => (
          <span key={status} className={`text-xs px-2 py-0.5 rounded ${color}`}>
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  )
}
