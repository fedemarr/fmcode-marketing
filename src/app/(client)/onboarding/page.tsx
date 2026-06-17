"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    industry: "",
    description: "",
    services: "",
    target_audience: "",
    brand_tone: "",
    website: "",
    posts_per_week: 5,
  })

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function finish() {
    setLoading(true)
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      router.push("/dashboard")
      router.refresh()
    } else {
      const d = await res.json()
      alert(d?.error?.message ?? "Error al crear empresa")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Bienvenido a FMCODE</h1>
          <p className="text-muted-foreground mt-1">Configurá tu empresa para empezar a generar contenido con IA</p>
        </div>

        <div className="flex gap-1 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-primary" : "bg-gray-200"}`} />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Sobre tu negocio</CardTitle>
              <CardDescription>Esta información se usa para generar contenido relevante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre de la empresa *</Label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: La Pizzería del Centro" />
              </div>
              <div>
                <Label>Rubro / Industria *</Label>
                <Input value={form.industry} onChange={e => set("industry", e.target.value)} placeholder="Ej: Gastronomía, Moda, Tecnología..." />
              </div>
              <div>
                <Label>Descripción del negocio</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="¿Qué hacés? ¿Qué te diferencia?" />
              </div>
              <div>
                <Label>Productos o servicios principales</Label>
                <Textarea value={form.services} onChange={e => set("services", e.target.value)} rows={2} placeholder="Ej: Pizzas artesanales, empanadas, delivery..." />
              </div>
              <Button onClick={() => setStep(2)} disabled={!form.name || !form.industry} className="w-full">
                Continuar →
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Estrategia de contenido</CardTitle>
              <CardDescription>El agente IA usará esto para generar posts alineados a tu marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Público objetivo</Label>
                <Input value={form.target_audience} onChange={e => set("target_audience", e.target.value)} placeholder="Ej: Mujeres de 25-40 años, familias..." />
              </div>
              <div>
                <Label>Tono de comunicación</Label>
                <Input value={form.brand_tone} onChange={e => set("brand_tone", e.target.value)} placeholder="Ej: Informal y cercano, Profesional, Divertido..." />
              </div>
              <div>
                <Label>Sitio web (opcional)</Label>
                <Input type="url" value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Posts por semana</Label>
                <Input type="number" min={1} max={21} value={form.posts_per_week} onChange={e => set("posts_per_week", Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Recomendado: 5 posts/semana</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>← Volver</Button>
                <Button onClick={finish} disabled={loading} className="flex-1">
                  {loading ? "Creando empresa..." : "Empezar →"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
