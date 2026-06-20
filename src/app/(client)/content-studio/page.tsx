import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ContentStudio from "@/components/content-studio/ContentStudio"

export default async function ContentStudioPage() {
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
  if (!company) redirect("/onboarding")

  // Instagram account
  const { data: igRaw } = await supabase
    .from("social_accounts")
    .select("username, is_active")
    .eq("company_id", company.id)
    .eq("platform", "instagram")
    .single()

  const ig = igRaw as { username: string | null; is_active: boolean } | null

  // Posts (últimos 60 días + futuros)
  const since = new Date()
  since.setDate(since.getDate() - 60)

  const { data: postsRaw } = await supabase
    .from("posts")
    .select("id, content_type, status, hook, caption, image_url, scheduled_at")
    .eq("company_id", company.id)
    .is("deleted_at", null)
    .gte("created_at", since.toISOString())
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .limit(100)

  type PostRow = {
    id: string; content_type: string; status: string
    hook: string | null; caption: string | null
    image_url: string | null; scheduled_at: string | null
  }
  const posts = (postsRaw as PostRow[] | null) ?? []

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-xs text-gray-400">Content Studio</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ContentStudio
          company={{
            id: company.id,
            name: company.name,
            instagram_username: ig?.username ?? null,
            instagram_connected: !!(ig?.is_active),
          }}
          initialPosts={posts}
        />
      </div>
    </div>
  )
}
