import { db } from "@/lib/db"
import { ContentStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const statusLabels: Record<ContentStatus, string> = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "Para aprobar",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  REJECTED: "Rechazado",
}

const statusColors: Record<ContentStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-600",
}

async function getCalendarData(year: number, month: number) {
  return db.calendarEntry.findMany({
    where: {
      scheduledAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
      post: { deletedAt: null },
    },
    select: {
      id: true,
      scheduledAt: true,
      contentType: true,
      status: true,
      post: {
        select: {
          id: true,
          hook: true,
        },
      },
      client: {
        select: { id: true, name: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const now = new Date()
  const month = Number(searchParams.month) || now.getMonth() + 1
  const year = Number(searchParams.year) || now.getFullYear()

  const entries = await getCalendarData(year, month)

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()

  const entriesByDay: Record<number, typeof entries> = {}
  for (const entry of entries) {
    const day = new Date(entry.scheduledAt).getDate()
    if (!entriesByDay[day]) entriesByDay[day] = []
    entriesByDay[day].push(entry)
  }

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prevMonth}&year=${prevYear}`}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Anterior
          </Link>
          <span className="text-sm font-medium px-4 text-gray-700">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Link
            href={`/calendar?month=${nextMonth}&year=${nextYear}`}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
              <div key={d} className="text-xs font-medium text-gray-500 text-center py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayEntries = entriesByDay[day] ?? []
              const isToday =
                day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()

              return (
                <div
                  key={day}
                  className={`min-h-[80px] p-1.5 rounded-md border ${isToday ? "border-blue-400 bg-blue-50" : "border-gray-100 bg-white hover:bg-gray-50"}`}
                >
                  <p className={`text-xs font-medium mb-1 ${isToday ? "text-blue-700" : "text-gray-700"}`}>{day}</p>
                  <div className="space-y-0.5">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <Link
                        key={entry.id}
                        href={entry.post ? `/content/${entry.post.id}` : "#"}
                        className={`block text-xs px-1 py-0.5 rounded truncate ${statusColors[entry.status]}`}
                        title={entry.post?.hook ?? ""}
                      >
                        {entry.client.name.split(" ")[0]}
                      </Link>
                    ))}
                    {dayEntries.length > 3 && (
                      <p className="text-xs text-gray-400 px-1">+{dayEntries.length - 3}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Posts de {MONTH_NAMES[month - 1]} ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <div key={entry.id} className="py-3 flex items-center gap-3">
                  <div className="text-xs text-gray-400 w-16 shrink-0">
                    {new Date(entry.scheduledAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.post ? (
                      <Link href={`/content/${entry.post.id}`} className="text-sm text-gray-900 hover:text-blue-600 truncate block">
                        {entry.post.hook}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Sin post</span>
                    )}
                    <p className="text-xs text-gray-500">{entry.client.name} · {entry.contentType}</p>
                  </div>
                  <Badge
                    className={`shrink-0 text-xs ${statusColors[entry.status]} border-0`}
                  >
                    {statusLabels[entry.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
