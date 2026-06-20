import { Badge } from "@/components/ui/badge"
import type { ContentStatus } from "@/types"

const CONFIG: Record<ContentStatus, { label: string; className: string }> = {
  draft:            { label: "Borrador",     className: "bg-gray-100 text-gray-700 border-gray-200" },
  pending_approval: { label: "Para aprobar", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  approved:         { label: "Aprobado",     className: "bg-blue-100 text-blue-800 border-blue-200" },
  scheduled:        { label: "Programado",   className: "bg-orange-100 text-orange-700 border-orange-200" },
  published:        { label: "Publicado",    className: "bg-green-100 text-green-700 border-green-200" },
  rejected:         { label: "Rechazado",    className: "bg-red-100 text-red-700 border-red-200" },
  failed:           { label: "Falló",        className: "bg-red-100 text-red-700 border-red-200" },
}

export default function PostStatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as ContentStatus] ?? CONFIG.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
