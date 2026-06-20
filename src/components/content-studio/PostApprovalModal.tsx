"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PostStatusBadge from "./PostStatusBadge"
import type { StudioPost } from "./PostCard"

interface Props {
  post: StudioPost & {
    objective?: string | null
    cta?: string | null
    hashtags?: string[]
    image_prompt?: string | null
    approval_notes?: string | null
    rejection_reason?: string | null
  }
  onClose: () => void
  onUpdated: () => void
}

export default function PostApprovalModal({ post, onClose, onUpdated }: Props) {
  const router = useRouter()
  const canAct = ["draft", "pending_approval"].includes(post.status)

  const [scheduledAt, setScheduledAt] = useState(
    post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : ""
  )
  const [notes, setNotes] = useState(post.approval_notes ?? "")
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState<"approve" | "reject" | "regen-img" | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(post.image_url)

  async function approve() {
    setLoading("approve")
    const res = await fetch(`/api/posts/${post.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        approval_notes: notes,
      }),
    })
    setLoading(null)
    if (res.ok) { onUpdated(); onClose(); router.refresh() }
    else { const d = await res.json(); alert(d?.error?.message ?? "Error al aprobar") }
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
    if (res.ok) { onUpdated(); onClose(); router.refresh() }
    else { const d = await res.json(); alert(d?.error?.message ?? "Error al rechazar") }
  }

  async function regenImage() {
    if (!post.image_prompt) return
    setLoading("regen-img")
    const res = await fetch("/api/generate/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_prompt: post.image_prompt, content_type: post.content_type }),
    })
    const d = await res.json()
    setLoading(null)
    if (d.success) setCurrentImageUrl(d.data.image_url)
    else alert("Error al regenerar imagen")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <PostStatusBadge status={post.status} />
            <span className="text-sm text-gray-500 capitalize">{post.content_type.replace("_", " ")}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Preview izquierda */}
          <div className="bg-gray-50 p-5 flex flex-col items-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Preview Instagram</p>
            <div className="bg-white border rounded-xl overflow-hidden w-full max-w-xs shadow-sm">
              <div className="flex items-center gap-2 p-2.5 border-b">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
                <span className="text-xs font-semibold">tu_marca</span>
              </div>
              {currentImageUrl ? (
                <img src={currentImageUrl} alt="" className="w-full aspect-square object-cover" />
              ) : (
                <div className="aspect-square bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center text-gray-300 text-4xl">
                  🖼
                </div>
              )}
              <div className="p-3">
                {post.hook && <p className="text-xs font-bold mb-1">{post.hook}</p>}
                <p className="text-xs text-gray-700 line-clamp-4">{post.caption}</p>
                {post.cta && <p className="text-xs text-green-600 font-medium mt-1">{post.cta}</p>}
                {post.hashtags && post.hashtags.length > 0 && (
                  <p className="text-[10px] text-blue-500 mt-2 line-clamp-2">
                    {post.hashtags.map(h => `#${h}`).join(" ")}
                  </p>
                )}
              </div>
            </div>

            {post.image_prompt && (
              <button
                onClick={regenImage}
                disabled={!!loading}
                className="mt-3 text-xs text-green-600 underline hover:text-green-700 disabled:opacity-50"
              >
                {loading === "regen-img" ? "Generando imagen..." : "🔄 Regenerar imagen"}
              </button>
            )}
          </div>

          {/* Detalles derecha */}
          <div className="p-5 space-y-4">
            {post.objective && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Objetivo</p>
                <p className="text-sm text-gray-700">{post.objective}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hook</p>
              <p className="text-sm font-medium">{post.hook ?? "—"}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Caption</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.caption ?? "—"}</p>
            </div>

            {post.cta && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">CTA</p>
                <p className="text-sm text-green-600 font-medium">{post.cta}</p>
              </div>
            )}

            {post.hashtags && post.hashtags.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Hashtags</p>
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map(h => (
                    <span key={h} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">#{h}</span>
                  ))}
                </div>
              </div>
            )}

            {canAct && (
              <>
                <div className="border-t pt-4">
                  <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Fecha y hora de publicación
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Notas (feedback para próxima generación)
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ej: mejorar el tono, más casual..."
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={approve}
                    disabled={!!loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading === "approve" ? "Aprobando..." : "✓ Aprobar y programar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReject(v => !v)}
                    disabled={!!loading}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Rechazar
                  </Button>
                </div>

                {showReject && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-2">
                    <Textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="¿Por qué se rechaza este post?"
                      rows={2}
                      className="text-sm"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={reject}
                      disabled={!!loading || !rejectReason.trim()}
                    >
                      {loading === "reject" ? "Rechazando..." : "Confirmar rechazo"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
