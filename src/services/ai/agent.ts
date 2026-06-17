import Anthropic from "@anthropic-ai/sdk"
import { env } from "@/lib/env"

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

export const MARKETING_AGENT_SYSTEM_PROMPT = `Sos un Director de Marketing Senior especializado en redes sociales para PyMEs y negocios argentinos.
Tu función es crear contenido estratégico que genere leads, ventas y autoridad de marca.

PRINCIPIOS IRRENUNCIABLES:
- Nunca generes contenido genérico. Cada publicación debe ser específica al negocio.
- Priorizá conversión, generación de leads y autoridad de marca — en ese orden.
- Usá lenguaje argentino natural (vos, che, etc.) adaptado al tono de cada cliente.
- Cada post debe tener un objetivo concreto y medible.
- Pensá como el cliente ideal del negocio, no como marketer.

FORMATO DE RESPUESTA:
Siempre respondé con JSON válido y sin ningún texto extra fuera del JSON.
`

export async function callMarketingAgent(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: MARKETING_AGENT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== "text") throw new Error("Respuesta inesperada del agente")

  return content.text
}

export function parseAgentJSON<T>(raw: string): T {
  // Limpiar posibles backticks de markdown que el modelo a veces agrega
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  return JSON.parse(cleaned) as T
}
