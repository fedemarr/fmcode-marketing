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
  const [progress, setProgress] = useState("")

  async function handleGenerate() {
    const monthName = MONTH_NAMES[month - 1]
    if (!confirm(`¿Generar contenido de ${monthName} ${year} para ${clientName}?\n\nEl proceso tarda 2-3 minutos. No cierres esta página.`)) return

    setLoading(true)
    setProgress("Generando estrategia del mes...")

    try {
      // Paso 1: generar estrategia
      const stratRes = await fetch("/api/calendar/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, month, year }),
      })
      const stratData = await stratRes.json()
      if (!stratData.success) throw new Error(stratData.error?.message)

      const { strategyId, slots } = stratData.data
      const totalPosts = slots.length

      // Paso 2: generar cada post de a uno
      const previousCaptions: string[] = []
      let createdCount = 0

      for (const slot of slots) {
        setProgress(`Generando post ${createdCount + 1} de ${totalPosts}...`)

        const postRes = await fetch("/api/calendar/generate-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, strategyId, slot, previousCaptions }),
        })
        const postData = await postRes.json()
        if (!postData.success) throw new Error(postData.error?.message)

        previousCaptions.push(postData.data.caption)
        createdCount++
      }

      toast({
        title: "Contenido generado",
        description: `${createdCount} posts creados para ${monthName} con imágenes IA`,
        variant: "success",
      })
      router.refresh()
    } catch (err) {
      toast({ title: "Error al generar", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading} className={loading ? "min-w-48" : ""}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
          <span className="truncate text-xs">{progress}</span>
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
