"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

const INITIAL = {
  name: "", industry: "", description: "", targetAudience: "",
  objectives: "", communicationTone: "", postFrequency: 3, instagramHandle: "",
}

export function NewClientButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(INITIAL)

  function set(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, postFrequency: Number(form.postFrequency) }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      toast({ title: "Cliente creado", variant: "success" })
      setOpen(false)
      setForm(INITIAL)
      router.refresh()
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Nuevo cliente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="industry">Industria *</Label>
                <Input id="industry" value={form.industry} onChange={(e) => set("industry", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Descripción del negocio *</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Qué hace el negocio, qué vende, qué lo diferencia..."
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="targetAudience">Público objetivo *</Label>
              <Textarea
                id="targetAudience"
                rows={2}
                value={form.targetAudience}
                onChange={(e) => set("targetAudience", e.target.value)}
                placeholder="Edad, intereses, dolor principal..."
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="objectives">Objetivos *</Label>
              <Textarea
                id="objectives"
                rows={2}
                value={form.objectives}
                onChange={(e) => set("objectives", e.target.value)}
                placeholder="Generar leads, aumentar ventas, construir autoridad..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="communicationTone">Tono de comunicación *</Label>
                <Input
                  id="communicationTone"
                  value={form.communicationTone}
                  onChange={(e) => set("communicationTone", e.target.value)}
                  placeholder="Cercano, profesional, divertido..."
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="postFrequency">Posts por semana *</Label>
                <Input
                  id="postFrequency"
                  type="number"
                  min={1}
                  max={7}
                  value={form.postFrequency}
                  onChange={(e) => set("postFrequency", Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="instagramHandle">Instagram (sin @)</Label>
              <Input
                id="instagramHandle"
                value={form.instagramHandle}
                onChange={(e) => set("instagramHandle", e.target.value)}
                placeholder="cuenta_instagram"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
