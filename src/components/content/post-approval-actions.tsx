"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Check, X, Edit2, Save } from "lucide-react"
import { ContentStatus } from "@prisma/client"

interface Props {
  postId: string
  currentStatus: ContentStatus
  scheduledAt?: string
  initialCaption: string
  initialHook: string
  initialCta: string
  initialHashtags: string[]
  clientId: string
}

export function PostApprovalActions({
  postId,
  scheduledAt,
  initialCaption,
  initialHook,
  initialCta,
  initialHashtags,
  clientId,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"view" | "edit" | "reject">("view")
  const [loading, setLoading] = useState(false)

  const [caption, setCaption] = useState(initialCaption)
  const [hook, setHook] = useState(initialHook)
  const [cta, setCta] = useState(initialCta)
  const [hashtags, setHashtags] = useState(initialHashtags.join(", "))
  const [rejectReason, setRejectReason] = useState("")

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/content/${postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Post aprobado", variant: "success" })
      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEdit() {
    setLoading(true)
    try {
      const res = await fetch(`/api/content/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hook,
          caption,
          cta,
          hashtags: hashtags.split(",").map((h) => h.trim().replace(/^#/, "")).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Post actualizado", variant: "success" })
      setMode("view")
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast({ title: "Indicá el motivo del rechazo", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/content/${postId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Post rechazado" })
      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (mode === "edit") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Editar contenido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Hook</Label>
            <Textarea rows={2} value={hook} onChange={(e) => setHook(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Caption</Label>
            <Textarea rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>CTA</Label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Hashtags (separados por coma)</Label>
            <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveEdit} disabled={loading}>
              <Save className="h-4 w-4 mr-1" />
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            <Button variant="outline" onClick={() => setMode("view")} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mode === "reject") {
    return (
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-red-700">Rechazar post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Motivo del rechazo</Label>
            <Textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="¿Por qué no sirve este post? El agente usará este feedback para mejorar."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading ? "Rechazando..." : "Confirmar rechazo"}
            </Button>
            <Button variant="outline" onClick={() => setMode("view")} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-3">
      <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
        <Check className="h-4 w-4 mr-1" />
        {loading ? "Aprobando..." : "Aprobar"}
      </Button>
      <Button variant="outline" onClick={() => setMode("edit")} disabled={loading}>
        <Edit2 className="h-4 w-4 mr-1" />
        Editar
      </Button>
      <Button variant="outline" onClick={() => setMode("reject")} disabled={loading} className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
        <X className="h-4 w-4 mr-1" />
        Rechazar
      </Button>
    </div>
  )
}
