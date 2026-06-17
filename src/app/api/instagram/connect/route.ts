export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOAuthUrl } from "@/lib/instagram/oauth"

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } }, { status: 401 })

  const companyId = req.nextUrl.searchParams.get("company_id")
  if (!companyId) return Response.json({ success: false, error: { code: "MISSING_PARAM", message: "company_id requerido" } }, { status: 400 })

  // Verify user owns this company
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("owner_id", user.id)
    .single()

  if (!company) return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } }, { status: 404 })

  const state = Buffer.from(JSON.stringify({ company_id: companyId, user_id: user.id })).toString("base64")
  const url = getOAuthUrl(state)

  return Response.redirect(url)
}
