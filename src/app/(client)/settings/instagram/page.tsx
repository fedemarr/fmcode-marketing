import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InstagramConnectWidget from "@/components/settings/InstagramConnectWidget"

interface Props { searchParams: { success?: string; error?: string; username?: string } }

export default async function InstagramSettingsPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: companyRaw } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .single()

  const company = companyRaw as { id: string; name: string } | null
  if (!company) redirect("/settings")

  const { data: accountRaw } = await supabase
    .from("social_accounts")
    .select("id, username, is_active, token_expires_at")
    .eq("company_id", company.id)
    .eq("platform", "instagram")
    .single()

  const account = accountRaw as {
    id: string; username: string | null; is_active: boolean; token_expires_at: string | null
  } | null

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <a href="/settings" className="text-muted-foreground hover:text-foreground text-sm">← Configuración</a>
      </div>
      <h1 className="text-2xl font-bold mb-6">Conectar Instagram</h1>
      <InstagramConnectWidget
        company={company}
        account={account ?? null}
        flashSuccess={searchParams.success}
        flashError={searchParams.error}
        username={searchParams.username}
      />
    </div>
  )
}
