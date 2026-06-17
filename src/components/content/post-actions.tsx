"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Check, X, Edit2, Save, Send, Calendar, Clock } from "lucide-react"
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

function toLocalDatetimeValue(isoString?: string): string {
  if (!isoString) {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }
  return new Date(isoString).toISOString().slice(0, 16)
}

export function PostActions({
  postId,
  currentStatus,
  scheduledAt,
  initialCaption,
  initialHook,
  initialCta,
  initialHashtags,
  clientId,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"view" | "edit" | "reject" | "schedule">("view")
  const [loading, setLoading] = useState(false)

  const [caption, setCaption] = useState(initialCaption)
  const [hook, setHook] = useState(initialHook)
  const [cta, setCta] = useState(initialCta)
  const [hashtags, setHashtags] = useState(initialHashtags.join(", "))
  const [rejectReason, setRejectReason] = useState("")
  const [scheduleDate, setScheduleDate] = useState(toLocalDatetimeValue(scheduledAt))

  async function handleApproveWithDate(dateOverride?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/content/${postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: dateOverride ? new Date(dateOverride).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Post programado", description: "Quedó en la cola del calendario.", variant: "success" })
      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handlePublishNow() {
    if (!confirm("¿Publicar este post en Instagram ahora mismo?")) return
    setLoading(true)
    try {
      // Primero aprobar
      const approveRes = await fetch(`/api/content/${postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const approveData = await approveRes.json()
      if (!approveData.success) throw new Error(approveData.error?.message)

      // Luego publicar
      const publishRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })
      const publishData = await publishRes.json()
      if (!publishData.success) throw new Error(publishData.error?.message)

      toast({ title: "Publicado en Instagram", variant: "success" })
      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      toast({ title: "Error al publicar", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handlePublishApproved() {
    if (!confirm("¿Publicar este post en Instagram ahora mismo?")) return
    setLoading(true)
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Publicado en Instagram", variant: "success" })
      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      toast({ title: "Error al publicar", description: String(err), variant: "destructive" })
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

  // --- EDIT MODE ---
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
            <Label>Caption completo</Label>
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
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button variant="outline" onClick={() => setMode("view")} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- REJECT MODE ---
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
              placeholder="¿Por qué no sirve este post? El agente usará este feedback para mejorar en el futuro."
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

  // --- SCHEDULE MODE ---
  if (mode === "schedule") {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Programar publicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Fecha y hora de publicación</Label>
            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            El cron de Vercel publicará automáticamente a las 22:00 UTC (19:00 ARG)
          </p>
          <div className="flex gap-2">
            <Button onClick={() => handleApproveWithDate(scheduleDate)} disabled={loading}>
              <Check className="h-4 w-4 mr-1" />
              {loading ? "Programando..." : "Confirmar fecha"}
            </Button>
            <Button variant="outline" onClick={() => setMode("view")} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- VIEW MODE: APPROVED post ---
  if (currentStatus === ContentStatus.APPROVED) {
    return (
      <div className="space-y-3">
        <Button onClick={handlePublishApproved} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          {loading ? "Publicando..." : "Publicar en Instagram ahora"}
        </Button>
        <p className="text-sm text-gray-500">O esperá a que el cron lo publique en la fecha programada.</p>
      </div>
    )
  }

  // --- VIEW MODE: DRAFT / PENDING ---
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">¿Qué hacemos con este post?</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handlePublishNow}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? "Publicando..." : "Publicar en Instagram ahora"}
        </Button>

        <Button
          variant="outline"
          onClick={() => setMode("schedule")}
          disabled={loading}
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Programar para otra fecha
        </Button>

        <Button
          variant="outline"
          onClick={() => handleApproveWithDate()}
          disabled={loading}
        >
          <Check className="h-4 w-4 mr-2" />
          Aprobar (fecha del calendario)
        </Button>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={() => setMode("edit")} disabled={loading}>
          <Edit2 className="h-4 w-4 mr-1" />
          Editar contenido
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode("reject")}
          disabled={loading}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          <X className="h-4 w-4 mr-1" />
          Rechazar
        </Button>
      </div>
    </div>
  )
}
