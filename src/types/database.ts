export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ContentStatus = "draft" | "pending_approval" | "approved" | "scheduled" | "published" | "rejected" | "failed"
export type ContentType = "feed_post" | "story" | "reel" | "carousel"
export type Platform = "instagram" | "tiktok" | "linkedin" | "facebook"
export type SubscriptionPlan = "starter" | "pro" | "agency"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          owner_id: string
          name: string
          industry: string
          description: string | null
          services: string | null
          brand_tone: string | null
          target_audience: string | null
          logo_url: string | null
          brand_colors: Json
          website: string | null
          plan: SubscriptionPlan
          posts_per_week: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_id: string
          name: string
          industry: string
          description?: string | null
          services?: string | null
          brand_tone?: string | null
          target_audience?: string | null
          logo_url?: string | null
          brand_colors?: Json
          website?: string | null
          plan?: SubscriptionPlan
          posts_per_week?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          industry?: string
          description?: string | null
          services?: string | null
          brand_tone?: string | null
          target_audience?: string | null
          logo_url?: string | null
          brand_colors?: Json
          website?: string | null
          plan?: SubscriptionPlan
          posts_per_week?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          id: string
          company_id: string
          platform: Platform
          account_id: string
          username: string | null
          access_token: string
          token_expires_at: string | null
          is_active: boolean
          connected_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          platform: Platform
          account_id: string
          username?: string | null
          access_token: string
          token_expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          account_id?: string
          username?: string | null
          access_token?: string
          token_expires_at?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      content_strategies: {
        Row: {
          id: string
          company_id: string
          month: number
          year: number
          analysis: string | null
          strategy_json: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          month: number
          year: number
          analysis?: string | null
          strategy_json?: Json | null
        }
        Update: {
          analysis?: string | null
          strategy_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          company_id: string
          platform: Platform
          content_type: ContentType
          status: ContentStatus
          objective: string | null
          hook: string | null
          caption: string | null
          cta: string | null
          hashtags: string[]
          image_prompt: string | null
          image_url: string | null
          scheduled_at: string | null
          published_at: string | null
          platform_post_id: string | null
          approval_notes: string | null
          rejection_reason: string | null
          n8n_execution_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          company_id: string
          platform: Platform
          content_type: ContentType
          status?: ContentStatus
          objective?: string | null
          hook?: string | null
          caption?: string | null
          cta?: string | null
          hashtags?: string[]
          image_prompt?: string | null
          image_url?: string | null
          scheduled_at?: string | null
          published_at?: string | null
          platform_post_id?: string | null
          approval_notes?: string | null
          rejection_reason?: string | null
          n8n_execution_id?: string | null
          deleted_at?: string | null
        }
        Update: {
          status?: ContentStatus
          objective?: string | null
          hook?: string | null
          caption?: string | null
          cta?: string | null
          hashtags?: string[]
          image_prompt?: string | null
          image_url?: string | null
          scheduled_at?: string | null
          published_at?: string | null
          platform_post_id?: string | null
          approval_notes?: string | null
          rejection_reason?: string | null
          n8n_execution_id?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          id: string
          post_id: string
          likes: number
          comments: number
          shares: number
          saves: number
          reach: number
          impressions: number
          engagement_rate: number
          fetched_at: string
          updated_at: string
        }
        Insert: {
          post_id: string
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          reach?: number
          impressions?: number
          engagement_rate?: number
        }
        Update: {
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          reach?: number
          impressions?: number
          engagement_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      automation_errors: {
        Row: {
          id: string
          company_id: string | null
          post_id: string | null
          n8n_workflow: string | null
          n8n_execution_id: string | null
          error_message: string
          error_details: Json | null
          resolved: boolean
          created_at: string
        }
        Insert: {
          company_id?: string | null
          post_id?: string | null
          n8n_workflow?: string | null
          n8n_execution_id?: string | null
          error_message: string
          error_details?: Json | null
          resolved?: boolean
        }
        Update: {
          resolved?: boolean
        }
        Relationships: []
      }
      n8n_events: {
        Row: {
          id: string
          event_type: string
          company_id: string | null
          post_id: string | null
          payload: Json | null
          created_at: string
        }
        Insert: {
          event_type: string
          company_id?: string | null
          post_id?: string | null
          payload?: Json | null
        }
        Update: {
          payload?: Json | null
        }
        Relationships: []
      }
    }
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: {
      content_status: ContentStatus
      content_type: ContentType
      platform: Platform
      subscription_plan: SubscriptionPlan
    }
    CompositeTypes: Record<string, never>
  }
}
