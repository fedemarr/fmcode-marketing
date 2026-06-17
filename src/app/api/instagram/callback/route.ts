export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { exchangeCodeForToken, getLongLivedToken, getInstagramBusinessAccountId } from "@/lib/instagram/oauth"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const stateB64 = searchParams.get("state")
  const errorParam = searchParams.get("error")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""

  if (errorParam) return Response.redirect(`${appUrl}/settings/instagram?error=oauth_denied`)
  if (!code || !stateB64) return Response.redirect(`${appUrl}/settings/instagram?error=invalid_callback`)

  let state: { company_id: string; user_id: string }
  try {
    state = JSON.parse(Buffer.from(stateB64, "base64").toString())
  } catch {
    return Response.redirect(`${appUrl}/settings/instagram?error=invalid_state`)
  }

  try {
    const { access_token: shortToken } = await exchangeCodeForToken(code)
    const { access_token: longToken, expires_in } = await getLongLivedToken(shortToken)
    const { instagram_business_account_id, page_id, username } = await getInstagramBusinessAccountId(longToken)

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()
    const supabase = createServiceClient()

    await supabase.from("social_accounts").upsert(
      {
        company_id: state.company_id,
        platform: "instagram",
        account_id: instagram_business_account_id,
        username,
        access_token: longToken,
        token_expires_at: expiresAt,
        is_active: true,
      } as never,
      { onConflict: "company_id,platform" }
    )

    return Response.redirect(`${appUrl}/settings/instagram?success=connected&username=${encodeURIComponent(username ?? "")}`)
  } catch (error) {
    console.error("[instagram/callback]", error)
    return Response.redirect(`${appUrl}/settings/instagram?error=token_exchange_failed`)
  }
}
