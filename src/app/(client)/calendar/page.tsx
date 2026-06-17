import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ContentCalendar from "@/components/calendar/ContentCalendar"

export default async function CalendarPage() {
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
  if (!company) {
    return <p className="text-muted-foreground">No hay empresa configurada.</p>
  }

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const { data: postsRaw } = await supabase
    .from("posts")
    .select("id, content_type, status, hook, caption, image_url, scheduled_at")
    .eq("company_id", company.id)
    .is("deleted_at", null)
    .gte("scheduled_at", firstDay)
    .lte("scheduled_at", lastDay)
    .order("scheduled_at", { ascending: true })

  const posts = postsRaw as Array<{
    id: string; content_type: string; status: string; hook: string | null
    caption: string | null; image_url: string | null; scheduled_at: string | null
  }> | null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calendario</h1>
      <ContentCalendar posts={posts ?? []} />
    </div>
  )
}
