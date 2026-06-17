export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET() {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 50,
      messages: [{ role: "user", content: 'Respondé solo con el JSON: {"ok": true}' }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : "no text"
    return Response.json({ ok: true, response: text })
  } catch (error) {
    return Response.json({ ok: false, error: String(error) })
  }
}
