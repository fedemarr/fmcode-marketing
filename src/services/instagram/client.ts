// Instagram Graph API client
// Docs: https://developers.facebook.com/docs/instagram-api

export interface InstagramMediaResponse {
  id: string
}

export interface InstagramInsights {
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  engagementRate: number
}

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

async function graphRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${GRAPH_API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok || data.error) {
    throw new Error(
      `Instagram API error: ${data.error?.message ?? response.statusText}`
    )
  }

  return data as T
}

// Paso 1: Crear el media container
export async function createMediaContainer(
  accountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  })

  const response = await graphRequest<InstagramMediaResponse>(
    `/${accountId}/media?${params.toString()}`,
    { method: "POST" }
  )

  return response.id
}

// Paso 2: Publicar el container
export async function publishMedia(
  accountId: string,
  accessToken: string,
  creationId: string
): Promise<string> {
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  })

  const response = await graphRequest<InstagramMediaResponse>(
    `/${accountId}/media_publish?${params.toString()}`,
    { method: "POST" }
  )

  return response.id
}

// Obtener métricas de un post publicado
export async function getPostInsights(
  mediaId: string,
  accessToken: string
): Promise<InstagramInsights> {
  const metrics = "likes,comments,shares,saved,reach,impressions"
  const params = new URLSearchParams({
    fields: metrics,
    access_token: accessToken,
  })

  const data = await graphRequest<Record<string, number>>(
    `/${mediaId}?${params.toString()}`
  )

  const reach = data.reach ?? 0
  const impressions = data.impressions ?? 0
  const engagement = data.likes + data.comments + data.shares + data.saved

  return {
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    saves: data.saved ?? 0,
    reach,
    impressions,
    engagementRate: impressions > 0 ? (engagement / impressions) * 100 : 0,
  }
}

// Verificar que el token sigue siendo válido
export async function verifyToken(accessToken: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      input_token: accessToken,
      access_token: accessToken,
    })
    await graphRequest(`/debug_token?${params.toString()}`)
    return true
  } catch {
    return false
  }
}
