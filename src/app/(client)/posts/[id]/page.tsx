import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import PostApproval from "@/components/posts/PostApproval"

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: postRaw } = await supabase
    .from("posts")
    .select("id, content_type, status, objective, hook, caption, cta, hashtags, image_url, image_prompt, scheduled_at, companies!inner(owner_id, name, brand_colors)")
    .eq("id", params.id)
    .is("deleted_at", null)
    .single()

  type PostDetail = {
    id: string; content_type: string; status: string; objective: string | null
    hook: string | null; caption: string | null; cta: string | null; hashtags: string[]
    image_url: string | null; image_prompt: string | null; scheduled_at: string | null
    companies: { owner_id: string; name: string; brand_colors: Record<string, string> | null }
  }
  const post = postRaw as PostDetail | null

  if (!post) notFound()
  if (post.companies.owner_id !== user.id) notFound()

  return <PostApproval post={post} />
}
