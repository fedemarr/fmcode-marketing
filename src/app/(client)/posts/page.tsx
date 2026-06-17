import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PostCard from "@/components/posts/PostCard"
import { Badge } from "@/components/ui/badge"
import type { ContentStatus } from "@/types"
import { STATUS_LABELS } from "@/types"

const FILTER_TABS: { value: ContentStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending_approval", label: "Para aprobar" },
  { value: "approved", label: "Aprobados" },
  { value: "scheduled", label: "Programados" },
  { value: "published", label: "Publicados" },
  { value: "rejected", label: "Rechazados" },
]

interface Props { searchParams: { status?: string } }

export default async function PostsPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: companyRaw } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single()

  const company = companyRaw as { id: string } | null
  if (!company) {
    return <p className="text-muted-foreground">No hay empresa configurada.</p>
  }

  const statusFilter = searchParams.status as string | undefined
  let query = supabase
    .from("posts")
    .select("id, content_type, status, caption, hook, scheduled_at, image_url, created_at")
    .eq("company_id", company.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true })

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data: postsRaw } = await query.limit(50)
  const posts = postsRaw as Array<{
    id: string; content_type: string; status: string; caption: string | null;
    hook: string | null; scheduled_at: string | null; image_url: string | null
  }> | null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Posts</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_TABS.map(tab => (
          <a key={tab.value} href={tab.value === "all" ? "/posts" : `/posts?status=${tab.value}`}>
            <Badge
              variant={(!statusFilter && tab.value === "all") || statusFilter === tab.value ? "default" : "outline"}
              className="cursor-pointer"
            >
              {tab.label}
            </Badge>
          </a>
        ))}
      </div>

      {!posts || (posts as unknown[]).length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground text-sm">
          No hay posts en esta categoría
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
