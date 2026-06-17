"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Company {
  id: string
  name: string
  industry: string
  description: string | null
  services: string | null
  brand_tone: string | null
  target_audience: string | null
  website: string | null
  posts_per_week: number
}

export default function CompanySettingsForm({ company }: { company: Company | null }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: company?.name ?? "",
    industry: company?.industry ?? "",
    description: company?.description ?? "",
    services: company?.services ?? "",
    brand_tone: company?.brand_tone ?? "",
    target_audience: company?.target_audience ?? "",
    website: company?.website ?? "",
    posts_per_week: company?.posts_per_week ?? 5,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const url = company ? `/api/companies/${company.id}` : "/api/companies"
    const method = company ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
    } else {
      const d = await res.json()
      alert(d?.error?.message ?? "Error al guardar")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de la empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la empresa</Label>
                <Input id="name" value={form.name} onChange={e => set("name", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="industry">Industria / Rubro</Label>
                <Input id="industry" value={form.industry} onChange={e => set("industry", e.target.value)} required placeholder="Ej: Gastronomía" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción del negocio</Label>
              <Textarea id="description" value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="¿Qué hace tu negocio?" />
            </div>
            <div>
              <Label htmlFor="services">Productos / Servicios</Label>
              <Textarea id="services" value={form.services} onChange={e => set("services", e.target.value)} rows={2} placeholder="Lista de productos o servicios principales" />
            </div>
            <div>
              <Label htmlFor="target_audience">Público objetivo</Label>
              <Input id="target_audience" value={form.target_audience} onChange={e => set("target_audience", e.target.value)} placeholder="Ej: Mujeres 25-40 años" />
            </div>
            <div>
              <Label htmlFor="brand_tone">Tono de marca</Label>
              <Input id="brand_tone" value={form.brand_tone} onChange={e => set("brand_tone", e.target.value)} placeholder="Ej: Profesional pero cercano" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Sitio web</Label>
                <Input id="website" type="url" value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://" />
              </div>
              <div>
                <Label htmlFor="posts_per_week">Posts por semana</Label>
                <Input id="posts_per_week" type="number" min={1} max={21} value={form.posts_per_week} onChange={e => set("posts_per_week", Number(e.target.value))} />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : saved ? "Guardado ✓" : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instagram</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Conectá tu cuenta de Instagram para que N8N pueda publicar los posts aprobados automáticamente.
          </p>
          {company ? (
            <Link href={`/settings/instagram`}>
              <Button variant="outline">Configurar Instagram →</Button>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">Primero guardá la información de la empresa.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
