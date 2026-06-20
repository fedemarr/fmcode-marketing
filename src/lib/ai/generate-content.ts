import Anthropic from "@anthropic-ai/sdk"
import type { ContentType } from "@/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ContentPillar = "educativo" | "conversión" | "autoridad" | "branding" | "entretenimiento"

export interface CompanyContext {
  name: string
  industry: string
  description: string | null
  services: string | null
  brand_tone: string | null
  target_audience: string | null
  brand_colors?: unknown
}

export interface GeneratedContent {
  objective: string
  hook: string
  caption: string
  cta: string
  hashtags: string[]
  imagePrompt: string
  contentType: ContentType
}

export async function generateInstagramPost(
  company: CompanyContext,
  contentType: ContentType,
  pillar: ContentPillar,
  scheduledDate: Date,
  previousCaptions: string[] = []
): Promise<GeneratedContent> {
  const dayName = scheduledDate.toLocaleDateString("es-AR", { weekday: "long" })
  const dateStr = scheduledDate.toLocaleDateString("es-AR", { day: "numeric", month: "long" })

  const system = `Sos un experto en marketing de contenidos para Instagram en Argentina.
Generás contenido persuasivo, auténtico y estratégico para marcas locales.
SIEMPRE respondés con JSON válido y nada más.`

  const avoidList = previousCaptions.length > 0
    ? `\n\nCaption anteriores a NO repetir (ni el estilo):\n${previousCaptions.slice(-5).map(c => `- "${c.slice(0, 80)}..."`).join("\n")}`
    : ""

  const prompt = `Generá un post de Instagram para la siguiente marca:

MARCA: ${company.name}
INDUSTRIA: ${company.industry}
DESCRIPCIÓN: ${company.description ?? "N/A"}
SERVICIOS: ${company.services ?? "N/A"}
TONO: ${company.brand_tone ?? "profesional y cercano"}
PÚBLICO: ${company.target_audience ?? "adultos en Argentina"}

CONFIGURACIÓN DEL POST:
- Tipo: ${contentType}
- Pilar: ${pillar}
- Fecha de publicación: ${dayName} ${dateStr}${avoidList}

Respondé SOLO con este JSON (sin markdown, sin explicaciones):
{
  "objective": "objetivo específico del post en una oración",
  "hook": "primera línea que para el scroll (máx 10 palabras, sin emojis al inicio)",
  "caption": "caption completo de 150-300 palabras. Incluir 1-2 emojis relevantes. Tono ${company.brand_tone ?? "cercano"}. Lenguaje argentino natural.",
  "cta": "llamada a la acción corta y específica",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8"],
  "imagePrompt": "prompt en inglés para generar imagen con IA. Describir composición, colores, estilo, sin texto en la imagen. Máx 100 palabras."
}`

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    system,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const json = JSON.parse(text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, ""))

  return {
    objective: json.objective,
    hook: json.hook,
    caption: json.caption,
    cta: json.cta,
    hashtags: json.hashtags ?? [],
    imagePrompt: json.imagePrompt,
    contentType,
  }
}
