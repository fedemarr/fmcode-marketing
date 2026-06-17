import { type Client } from "@prisma/client"
import { callMarketingAgent, parseAgentJSON } from "./agent"

export interface ContentPillar {
  name: string
  percentage: number // % del calendario que ocupa
  description: string
  objective: string
  examples: string[]
}

export interface MonthlyStrategy {
  analysis: string
  mainMessage: string
  contentPillars: ContentPillar[]
  toneGuidelines: string
  doList: string[]
  dontList: string[]
  keyDates: Array<{ date: string; reason: string; contentIdea: string }>
}

export async function generateMonthlyStrategy(
  client: Client,
  month: number,
  year: number,
  previousMetrics?: string
): Promise<MonthlyStrategy> {
  const monthName = new Date(year, month - 1).toLocaleString("es-AR", { month: "long" })

  const prompt = `
Analizá el siguiente negocio y creá la estrategia de contenido de Instagram para ${monthName} ${year}.

## DATOS DEL NEGOCIO
- Nombre: ${client.name}
- Industria: ${client.industry}
- Descripción: ${client.description}
- Público objetivo: ${client.targetAudience}
- Objetivos: ${client.objectives}
- Tono de comunicación: ${client.communicationTone}
- Frecuencia: ${client.postFrequency} posts por semana

${previousMetrics ? `## MÉTRICAS DEL MES ANTERIOR\n${previousMetrics}` : ""}

## LO QUE NECESITO
1. Analizá el negocio, su nicho y su audiencia en detalle
2. Definí los pilares de contenido para el mes (máximo 5 pilares)
3. Indicá el % del calendario que ocupa cada pilar
4. Dá lineamientos de tono específicos para este negocio
5. Listá qué SÍ hacer y qué NO hacer en el contenido
6. Identificá fechas clave del mes que se pueden aprovechar (feriados, días especiales del rubro, etc.)

## FORMATO DE RESPUESTA
Respondé ÚNICAMENTE con este JSON, sin texto adicional:
{
  "analysis": "análisis detallado del negocio, nicho, audiencia y oportunidades",
  "mainMessage": "el mensaje central que debe transmitir toda la comunicación del mes",
  "contentPillars": [
    {
      "name": "nombre del pilar",
      "percentage": 30,
      "description": "qué tipo de contenido incluye este pilar",
      "objective": "qué objetivo cumple (leads / autoridad / branding / ventas / educación)",
      "examples": ["ejemplo 1 de post", "ejemplo 2 de post"]
    }
  ],
  "toneGuidelines": "cómo debe sonar la voz de la marca en este mes específico",
  "doList": ["cosa que sí hacer 1", "cosa que sí hacer 2"],
  "dontList": ["cosa que NO hacer 1", "cosa que NO hacer 2"],
  "keyDates": [
    {
      "date": "YYYY-MM-DD",
      "reason": "por qué es relevante",
      "contentIdea": "idea concreta de contenido para esa fecha"
    }
  ]
}
`

  const raw = await callMarketingAgent(prompt)
  return parseAgentJSON<MonthlyStrategy>(raw)
}
