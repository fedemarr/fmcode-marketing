"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Sparkles, Loader2 } from "lucide-react"

interface Props {
  clientId: string
  clientName: string
  month: number
  year: number
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function GenerateCalendarButton({ clientId, clientName, month, year }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!confirm(`¿Generar contenido de ${MONTH_NAMES[month - 1]} ${year} para ${clientName}?\n\nEsto puede tardar 1-2 minutos.`)) return

    setLoading(true)
    toast({ title: "Generando contenido...", description: "El agente IA está trabajando. No cierres esta página." })

    try {
      const res = await fetch("/api/calendar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, month, year }),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error?.message)

      toast({
        title: "Contenido generado",
        description: `${data.data.postsGenerated} posts creados para ${MONTH_NAMES[month - 1]}`,
        variant: "success",
      })
      router.refresh()
    } catch (err) {
      toast({ title: "Error al generar", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Generar {MONTH_NAMES[month - 1]}
        </>
      )}
    </Button>
  )
}
