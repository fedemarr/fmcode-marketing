import type { Database, ContentStatus, ContentType, Platform, SubscriptionPlan } from "./database"

export type { ContentStatus, ContentType, Platform, SubscriptionPlan }

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Company = Database["public"]["Tables"]["companies"]["Row"]
export type SocialAccount = Database["public"]["Tables"]["social_accounts"]["Row"]
export type Post = Database["public"]["Tables"]["posts"]["Row"]
export type PostMetrics = Database["public"]["Tables"]["post_metrics"]["Row"]
export type AutomationError = Database["public"]["Tables"]["automation_errors"]["Row"]
export type N8NEvent = Database["public"]["Tables"]["n8n_events"]["Row"]
export type ContentStrategy = Database["public"]["Tables"]["content_strategies"]["Row"]

export type PostWithCompany = Post & { company: Company }
export type PostWithMetrics = Post & { post_metrics: PostMetrics | null }
export type CompanyWithAccounts = Company & { social_accounts: SocialAccount[] }

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export type N8NWebhookPayload =
  | { event: "content_generated"; data: { company_id: string; posts: GeneratedPost[] } }
  | { event: "post_published"; data: { post_id: string; platform_post_id: string } }
  | { event: "post_failed"; data: { post_id: string; error: string; execution_id: string; workflow: string } }
  | { event: "metrics_updated"; data: { post_id: string; metrics: MetricsData } }

export interface GeneratedPost {
  company_id: string
  platform: Platform
  content_type: ContentType
  objective: string
  hook: string
  caption: string
  cta: string
  hashtags: string[]
  image_prompt: string
  image_url: string
  scheduled_at: string
  n8n_execution_id?: string
}

export interface MetricsData {
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  engagement_rate: number
}

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Borrador",
  pending_approval: "Para aprobar",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
  rejected: "Rechazado",
  failed: "Falló",
}

export const STATUS_VARIANTS: Record<ContentStatus, "default" | "warning" | "success" | "destructive" | "secondary" | "info" | "outline"> = {
  draft: "secondary",
  pending_approval: "warning",
  approved: "success",
  scheduled: "info",
  published: "default",
  rejected: "destructive",
  failed: "destructive",
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  feed_post: "Post de feed",
  story: "Historia",
  reel: "Reel",
  carousel: "Carrusel",
}
