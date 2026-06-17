const APP_ID = process.env.INSTAGRAM_APP_ID!
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: `${APP_URL}/api/instagram/callback`,
    scope: "instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list",
    response_type: "code",
    state,
  })
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string }> {
  const res = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      redirect_uri: `${APP_URL}/api/instagram/callback`,
      code,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error("No se pudo obtener el token de acceso corto")
  return { access_token: data.access_token }
}

export async function getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`
  )
  const data = await res.json()
  if (!data.access_token) throw new Error("No se pudo obtener el token de larga duración")
  return { access_token: data.access_token, expires_in: data.expires_in ?? 5183944 }
}

export async function getInstagramBusinessAccountId(pageAccessToken: string): Promise<{
  instagram_business_account_id: string
  page_id: string
  username: string | null
}> {
  const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${pageAccessToken}`)
  const pages = await pagesRes.json()
  if (!pages.data?.length) throw new Error("No se encontraron páginas de Facebook vinculadas")

  const page = pages.data[0]

  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
  )
  const igData = await igRes.json()
  if (!igData.instagram_business_account?.id) {
    throw new Error("No hay cuenta de Instagram Business conectada a esta página de Facebook")
  }

  const igId = igData.instagram_business_account.id
  const userRes = await fetch(`https://graph.facebook.com/v18.0/${igId}?fields=username&access_token=${page.access_token}`)
  const userData = await userRes.json()

  return {
    instagram_business_account_id: igId,
    page_id: page.id,
    username: userData.username ?? null,
  }
}
