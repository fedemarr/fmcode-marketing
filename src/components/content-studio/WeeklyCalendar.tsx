"use client"

import Link from "next/link"
import PostStatusBadge from "./PostStatusBadge"
import type { StudioPost } from "./PostCard"

interface Props {
  posts: StudioPost[]
  onSelect: (post: StudioPost) => void
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - day + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function WeeklyCalendar({ posts, onSelect }: Props) {
  const weekDates = getWeekDates()
  const today = new Date()

  const postsByDay: Record<string, StudioPost[]> = {}
  for (const post of posts) {
    if (!post.scheduled_at) continue
    const key = new Date(post.scheduled_at).toDateString()
    if (!postsByDay[key]) postsByDay[key] = []
    postsByDay[key].push(post)
  }

  const STATUS_DOT: Record<string, string> = {
    published: "bg-green-500",
    scheduled: "bg-orange-400",
    approved:  "bg-blue-400",
    pending_approval: "bg-yellow-400",
    draft:     "bg-gray-300",
    rejected:  "bg-red-400",
    failed:    "bg-red-400",
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const key = date.toDateString()
          const dayPosts = postsByDay[key] ?? []
          const isToday = date.toDateString() === today.toDateString()

          return (
            <div key={i} className="min-h-[120px]">
              {/* Header del día */}
              <div className={`text-center py-1.5 mb-2 rounded-lg ${isToday ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                <p className="text-[10px] font-medium">{DAYS[(i + 1) % 7]}</p>
                <p className={`text-sm font-bold ${isToday ? "text-white" : "text-gray-800"}`}>{date.getDate()}</p>
              </div>

              {/* Posts del día */}
              <div className="space-y-1">
                {dayPosts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => onSelect(post)}
                    className="w-full text-left group"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg p-1.5 hover:border-green-300 hover:shadow-sm transition-all">
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="w-full aspect-square object-cover rounded mb-1" />
                      )}
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[post.status] ?? "bg-gray-300"}`} />
                        <p className="text-[9px] text-gray-600 truncate leading-tight">
                          {post.hook ?? post.caption ?? "Post"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {dayPosts.length === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-lg h-16 flex items-center justify-center">
                    <span className="text-[10px] text-gray-300">Sin posts</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
