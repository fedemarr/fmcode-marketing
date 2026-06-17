"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { STATUS_LABELS, STATUS_VARIANTS, CONTENT_TYPE_LABELS } from "@/types"
import type { ContentStatus, ContentType } from "@/types"

interface Post {
  id: string
  content_type: string
  status: string
  objective: string | null
  hook: string | null
  caption: string | null
  cta: string | null
  hashtags: string[]
  image_url: string | null
  image_prompt: string | null
  scheduled_at: string | null
  companies: { name: string; brand_colors: Record<string, string> | null }
}

export default function PostApproval({ post }: { post: Post }) {
  const router = useRouter()
  const status = post.status as ContentStatus
  const canAct = ["draft", "pending_approval"].includes(status)

  const [scheduledAt, setScheduledAt] = useState(
    post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : ""
  )
  const [notes, setNotes] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)

  async function approve() {
    setLoading("approve")
    const res = await fetch(`/api/posts/${post.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined, approval_notes: notes }),
    })
    setLoading(null)
    if (res.ok) { router.push("/posts"); router.refresh() }
    else {
      const d = await res.json()
      alert(d?.error?.message ?? "Error al aprobar")
    }
  }

  async function reject() {
    if (!rejectReason.trim()) return
    setLoading("reject")
    const res = await fetch(`/api/posts/${post.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    })
    setLoading(null)
    if (res.ok) { router.push("/posts"); router.refresh() }
    else {
      const d = await res.json()
      alert(d?.error?.message ?? "Error al rechazar")
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/posts" className="text-muted-foreground hover:text-foreground text-sm">← Volver</a>
        <Badge variant={STATUS_VARIANTS[status] as "default" | "secondary" | "destructive" | "outline"}>
          {STATUS_LABELS[status] ?? status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {CONTENT_TYPE_LABELS[post.content_type as ContentType] ?? post.content_type}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Instagram preview */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Vista previa</h2>
          <div className="bg-white border rounded-xl overflow-hidden max-w-sm">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-sm font-medium">{(post.companies as { name: string }).name}</span>
            </div>
            {post.image_url ? (
              <img src={post.image_url} alt="" className="w-full aspect-square object-cover" />
            ) : (
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-muted-foreground text-sm">
                Sin imagen
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-semibold">{post.hook}</p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap line-clamp-4">{post.caption}</p>
              {post.cta && <p className="text-sm font-medium text-blue-600 mt-1">{post.cta}</p>}
              {post.hashtags?.length > 0 && (
                <p className="text-xs text-blue-500 mt-2 line-clamp-2">{post.hashtags.map(h => `#${h}`).join(" ")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Details + actions */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Objetivo</Label>
            <p className="text-sm mt-1">{post.objective ?? "—"}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Hook</Label>
            <p className="text-sm font-medium mt-1">{post.hook ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Caption</Label>
            <p className="text-sm mt-1 whitespace-pre-wrap">{post.caption ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">CTA</Label>
            <p className="text-sm mt-1">{post.cta ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hashtags</Label>
            <p className="text-sm mt-1">{post.hashtags?.map(h => `#${h}`).join(" ") ?? "—"}</p>
          </div>
          {post.image_prompt && (
            <div>
              <Label className="text-xs text-muted-foreground">Prompt de imagen</Label>
              <p className="text-xs mt-1 text-muted-foreground italic">{post.image_prompt}</p>
            </div>
          )}

          {canAct && (
            <>
              <Separator />
              <div>
                <Label htmlFor="scheduled_at" className="text-xs text-muted-foreground">Fecha y hora de publicación</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-xs text-muted-foreground">Notas de aprobación (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: cambiar el tono..."
                  className="mt-1 text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={approve} disabled={!!loading} className="flex-1">
                  {loading === "approve" ? "Aprobando..." : "Aprobar"}
                </Button>
                <Button variant="outline" onClick={() => setShowReject(v => !v)} disabled={!!loading}>
                  Rechazar
                </Button>
              </div>
              {showReject && (
                <div className="space-y-2 p-3 bg-red-50 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Motivo de rechazo</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="¿Por qué se rechaza este post?"
                    rows={2}
                    className="text-sm"
                  />
                  <Button variant="destructive" size="sm" onClick={reject} disabled={!!loading || !rejectReason.trim()}>
                    {loading === "reject" ? "Rechazando..." : "Confirmar rechazo"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
