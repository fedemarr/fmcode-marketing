import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StatsCards from "@/components/dashboard/StatsCards"
import PendingPostsWidget from "@/components/dashboard/PendingPostsWidget"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user's companies
  const { data: companiesRaw } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .limit(10)

  const companies = companiesRaw as Array<{ id: string; name: string }> | null
  if (!companies || companies.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Bienvenido a FMCODE Marketing</p>
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-muted-foreground mb-4">No tenés ninguna empresa configurada todavía.</p>
          <a href="/onboarding" className="underline text-primary">Configurá tu primera empresa →</a>
        </div>
      </div>
    )
  }

  const companyId = companies[0].id

  // Stats: count posts by status
  const { data: postStatsRaw } = await supabase
    .from("posts")
    .select("status")
    .eq("company_id", companyId)
    .is("deleted_at", null)

  const postStats = postStatsRaw as Array<{ status: string }> | null
  const stats = {
    pending: postStats?.filter(p => p.status === "pending_approval").length ?? 0,
    scheduled: postStats?.filter(p => p.status === "scheduled").length ?? 0,
    published: postStats?.filter(p => p.status === "published").length ?? 0,
    total: postStats?.length ?? 0,
  }

  // Pending posts
  const { data: pendingPostsRaw } = await supabase
    .from("posts")
    .select("id, content_type, caption, hook, scheduled_at, image_url, status")
    .eq("company_id", companyId)
    .eq("status", "pending_approval")
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(5)

  const pendingPosts = pendingPostsRaw as Array<{
    id: string; content_type: string; caption: string | null; hook: string | null;
    scheduled_at: string | null; image_url: string | null; status: string
  }> | null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{companies[0].name}</p>
        </div>
      </div>
      <StatsCards stats={stats} />
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Posts para aprobar</h2>
        <PendingPostsWidget posts={(pendingPosts as Parameters<typeof PendingPostsWidget>[0]["posts"]) ?? []} />
      </div>
    </div>
  )
}
