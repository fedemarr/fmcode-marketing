import { type Client, ContentType } from "@prisma/client"
import { callMarketingAgent, parseAgentJSON } from "./agent"
import { type MonthlyStrategy, type ContentPillar } from "./strategy"

export interface GeneratedPost {
  objective: string
  hook: string
  caption: string
  cta: string
  hashtags: string[]
  imagePrompt: string
  contentType: ContentType
}

export async function generatePost(
  client: Client,
  strategy: MonthlyStrategy,
  pillar: ContentPillar,
  contentType: ContentType,
  scheduledDate: Date,
  previousPostsCaptions?: string[]
): Promise<GeneratedPost> {
  const dateStr = scheduledDate.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const formatGuide = getFormatGuide(contentType)

  const prompt = `
Generá un post de Instagram para el siguiente negocio.

## NEGOCIO
- Nombre: ${client.name}
- Industria: ${client.industry}
- Público objetivo: ${client.targetAudience}
- Tono: ${client.communicationTone}

## CONTEXTO DEL MES
- Estrategia general: ${strategy.mainMessage}
- Tono del mes: ${strategy.toneGuidelines}

## ESTE POST EN PARTICULAR
- Fecha de publicación: ${dateStr}
- Pilar de contenido: ${pillar.name}
- Objetivo del pilar: ${pillar.objective}
- Descripción del pilar: ${pillar.description}
- Formato: ${formatGuide}

## RESTRICCIONES
- NO repetir ideas de estos posts anteriores: ${previousPostsCaptions?.slice(-5).join(" | ") ?? "ninguno aún"}
- NO generar contenido genérico. Debe ser 100% específico para ${client.name}
- El hook DEBE generar curiosidad o identificación inmediata en los primeros 2 segundos
- El caption debe ser conversacional, no corporativo
- Máximo 5 hashtags, todos relevantes al nicho

## FORMATO DE RESPUESTA
Respondé ÚNICAMENTE con este JSON:
{
  "objective": "el objetivo concreto de este post (qué acción queremos que tome el usuario)",
  "hook": "las primeras 1-2 líneas del post que aparecen antes del 'ver más' — deben enganchar",
  "caption": "el caption completo, incluyendo el hook al principio, saltos de línea con \\n",
  "cta": "la llamada a la acción final (sin el hashtag)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "imagePrompt": "descripción detallada en inglés de la imagen ideal para este post, muy específica y visual",
  "contentType": "${contentType}"
}
`

  const raw = await callMarketingAgent(prompt)
  return parseAgentJSON<GeneratedPost>(raw)
}

function getFormatGuide(contentType: ContentType): string {
  const guides: Record<ContentType, string> = {
    FEED_POST: "Post de feed cuadrado 1:1. Una imagen impactante con caption. Ideal para tips, frases, ofertas o presentaciones de producto/servicio.",
    STORY: "Historia vertical 9:16. Contenido efímero, más informal y cercano. Puede incluir encuestas o preguntas. Texto breve.",
    REEL: "Video corto (15-60s). Necesita hook visual en los primeros 3 segundos. Caption corto. Muy alto alcance orgánico.",
    CAROUSEL: "Carrusel de 3-8 imágenes. Primera imagen = gancho. Últimas imágenes = CTA. Ideal para tutoriales, listas o antes/después.",
  }
  return guides[contentType]
}
