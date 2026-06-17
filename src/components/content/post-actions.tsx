"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Check, X, Edit2, Save, Send, Calendar, Clock, ImagePlus } from "lucide-react"
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
  hasImage: boolean
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
  hasImage,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"view" | "edit" | "reject" | "schedule" | "image">("view")
  const [loading, setLoading] = useState(false)

  const [caption, setCaption] = useState(initialCaption)
  const [hook, setHook] = useState(initialHook)
  const [cta, setCta] = useState(initialCta)
  const [hashtags, setHashtags] = useState(initialHashtags.join(", "))
  const [rejectReason, setRejectReason] = useState("")
  const [scheduleDate, setScheduleDate] = useState(toLocalDatetimeValue(scheduledAt))
  const [imageUrl, setImageUrl] = useState("")
  const [imageLoading, setImageLoading] = useState(false)

  async function handlePublishNow() {
    if (!hasImage) {
      toast({
        title: "Falta la imagen",
        description: 'Primero subí una imagen con el botón "Agregar imagen".',
        variant: "destructive",
      })
      setMode("image")
      return
    }

    if (!confirm("¿Publicar este post en Instagram ahora mismo?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/content/${postId}/publish-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  async function handleSaveImage() {
    if (!imageUrl.trim()) return
    setImageLoading(true)
    try {
      const res = await fetch(`/api/content/${postId}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "url", imageUrl: imageUrl.trim() }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Imagen guardada", variant: "success" })
      setMode("view")
      router.refresh()
    } catch (err) {
      toast({ title: "Error al guardar imagen", description: String(err), variant: "destructive" })
    } finally {
      setImageLoading(false)
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

  // --- IMAGE MODE ---
  if (mode === "image") {
    return (
      <Card className="border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-purple-600" />
            Agregar imagen al post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>URL de la imagen</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Generá la imagen en <strong>DALL-E</strong> (chat.openai.com) o <strong>Midjourney</strong> usando el prompt de imagen,
            subila a Cloudinary o Imgur y pegá la URL acá.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleSaveImage} disabled={imageLoading || !imageUrl.trim()}>
              <Save className="h-4 w-4 mr-1" />
              {imageLoading ? "Guardando..." : "Guardar imagen"}
            </Button>
            <Button variant="outline" onClick={() => setMode("view")} disabled={imageLoading}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
            El cron de Vercel publica automáticamente a las 22:00 UTC (19:00 ARG)
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
        <Button onClick={handlePublishNow} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          {loading ? "Publicando..." : "Publicar en Instagram ahora"}
        </Button>
        {!hasImage && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            ⚠ Necesitás agregar una imagen antes de publicar.
            <button className="underline" onClick={() => setMode("image")}>Agregar imagen</button>
          </p>
        )}
        <p className="text-sm text-gray-500">O esperá a que el cron lo publique en la fecha programada.</p>
      </div>
    )
  }

  // --- VIEW MODE: DRAFT / PENDING ---
  return (
    <div className="space-y-4">
      {!hasImage && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠ Este post no tiene imagen todavía.
          <button className="underline font-medium" onClick={() => setMode("image")}>Agregar imagen</button>
        </div>
      )}

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
        <Button variant="outline" size="sm" onClick={() => setMode("image")} disabled={loading}>
          <ImagePlus className="h-4 w-4 mr-1" />
          Agregar imagen
        </Button>
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
