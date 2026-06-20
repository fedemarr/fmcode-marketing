import { createServiceClient } from "@/lib/supabase/server"
import type { ContentType } from "@/types"

const TOGETHER_API = "https://api.together.xyz/v1/images/generations"
const FREE_MODEL = "black-forest-labs/FLUX.1-schnell-Free"
const PAID_MODEL = "black-forest-labs/FLUX.1-dev"

const DIMENSIONS: Record<ContentType, { width: number; height: number }> = {
  feed_post: { width: 1024, height: 1024 },
  carousel: { width: 1024, height: 1024 },
  story: { width: 1024, height: 1820 },
  reel: { width: 1024, height: 1820 },
}

export async function generatePostImage(
  imagePrompt: string,
  contentType: ContentType,
  companyName: string,
  usePaid = false
): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY
  const dims = DIMENSIONS[contentType]

  // Sin Together API key → usar Pollinations como fallback (free, no auth)
  if (!apiKey) {
    const encoded = encodeURIComponent(`${imagePrompt}, professional photography, no text, clean`)
    return `https://image.pollinations.ai/prompt/${encoded}?width=${dims.width}&height=${dims.height}&nologo=true&enhance=true`
  }

  const model = usePaid ? PAID_MODEL : FREE_MODEL

  const res = await fetch(TOGETHER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: `${imagePrompt}, professional photography, ${companyName} brand, no text, no watermark`,
      width: dims.width,
      height: dims.height,
      steps: usePaid ? 20 : 4,
      n: 1,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Together AI error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json as string | undefined
  const url = data.data?.[0]?.url as string | undefined

  if (url) return url
  if (!b64) throw new Error("Together AI: no image data in response")

  // Subir a Supabase Storage si tenemos base64
  return await uploadToStorage(b64, contentType)
}

async function uploadToStorage(b64: string, contentType: ContentType): Promise<string> {
  const supabase = createServiceClient()
  const buffer = Buffer.from(b64, "base64")
  const filename = `${contentType}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`

  const { data, error } = await supabase.storage
    .from("post-images")
    .upload(filename, buffer, { contentType: "image/png", upsert: false })

  if (error) throw new Error(`Storage upload error: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(data.path)
  return publicUrl
}
