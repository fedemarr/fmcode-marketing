"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  companyId: string
  companyName: string
  onGenerated: () => void
}

const CONTENT_TYPES = [
  { value: "feed_post", label: "Feed (foto 1:1)" },
  { value: "carousel", label: "Carrusel" },
  { value: "story", label: "Story (9:16)" },
  { value: "reel", label: "Reel" },
]

const PILLARS = [
  { value: "educativo", label: "Educativo" },
  { value: "conversión", label: "Conversión / Venta" },
  { value: "autoridad", label: "Autoridad / Expertise" },
  { value: "branding", label: "Branding / Comunidad" },
  { value: "entretenimiento", label: "Entretenimiento" },
]

export default function GeneratePanel({ companyId, companyName, onGenerated }: Props) {
  const [contentType, setContentType] = useState("feed_post")
  const [pillar, setPillar] = useState("educativo")
  const [scheduledDate, setScheduledDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "generating-copy" | "generating-image" | "saving" | "done" | "error">("idle")
  const [error, setError] = useState("")

  async function handleGenerate() {
    setLoading(true)
    setError("")
    setStatus("generating-copy")

    try {
      // 1. Generar copy con Claude
      const contentRes = await fetch("/api/generate/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          content_type: contentType,
          pillar,
          scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        }),
      })
      const contentData = await contentRes.json()
      if (!contentData.success) throw new Error(contentData.error?.message ?? "Error generando copy")

      const generated = contentData.data

      // 2. Generar imagen
      setStatus("generating-image")
      const imageRes = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_prompt: generated.imagePrompt,
          content_type: contentType,
          company_name: companyName,
        }),
      })
      const imageData = await imageRes.json()
      const imageUrl = imageData.success ? imageData.data.image_url : null

      // 3. Guardar post como pending_approval via webhook interno
      setStatus("saving")
      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          content_type: contentType,
          status: "pending_approval",
          objective: generated.objective,
          hook: generated.hook,
          caption: generated.caption,
          cta: generated.cta,
          hashtags: generated.hashtags,
          image_prompt: generated.imagePrompt,
          image_url: imageUrl,
          scheduled_at: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        }),
      })

      const saveData = await saveRes.json()
      if (!saveData.success) throw new Error(saveData.error?.message ?? "Error guardando post")

      setStatus("done")
      onGenerated()

      setTimeout(() => setStatus("idle"), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const statusMessage: Record<typeof status, string> = {
    idle: "",
    "generating-copy": "Generando copy con Claude...",
    "generating-image": "Generando imagen con IA...",
    saving: "Guardando post...",
    done: "✓ Post generado correctamente",
    error: error,
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Generar nuevo post</h2>
      <p className="text-sm text-gray-500 mb-6">Claude va a crear el copy y la imagen automáticamente.</p>

      <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Tipo de contenido</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Pilar de contenido</Label>
            <Select value={pillar} onValueChange={setPillar}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PILLARS.map(p => (
                  <SelectItem key={p.value} value={p.value} className="text-sm">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Fecha de publicación (opcional)</Label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={e => setScheduledDate(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {statusMessage[status]}
            </span>
          ) : "✨ Generar post con IA"}
        </Button>

        {status === "done" && (
          <p className="text-sm text-green-600 text-center">{statusMessage.done}</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-500 text-center">{statusMessage.error}</p>
        )}
      </div>
    </div>
  )
}
