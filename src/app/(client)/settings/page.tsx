import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CompanySettingsForm from "@/components/settings/CompanySettingsForm"

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: companyRaw } = await supabase
    .from("companies")
    .select("id, name, industry, description, services, brand_tone, target_audience, website, posts_per_week")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .single()

  type CompanyData = {
    id: string; name: string; industry: string; description: string | null
    services: string | null; brand_tone: string | null; target_audience: string | null
    website: string | null; posts_per_week: number
  }
  const company = companyRaw as CompanyData | null

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <CompanySettingsForm company={company} />
    </div>
  )
}
