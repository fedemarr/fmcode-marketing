-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- ENUM types
create type content_status as enum (
  'draft', 'pending_approval', 'approved', 'scheduled', 'published', 'rejected', 'failed'
);
create type content_type as enum (
  'feed_post', 'story', 'reel', 'carousel'
);
create type platform as enum (
  'instagram', 'tiktok', 'linkedin', 'facebook'
);
create type subscription_plan as enum (
  'starter', 'pro', 'agency'
);

-- Tabla de perfiles (extiende auth.users de Supabase)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'client',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de empresas/clientes
create table companies (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  industry text not null,
  description text,
  services text,
  brand_tone text,
  target_audience text,
  logo_url text,
  brand_colors jsonb default '[]',
  website text,
  plan subscription_plan default 'starter',
  posts_per_week int default 3,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de cuentas de redes sociales conectadas
create table social_accounts (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  platform platform not null,
  account_id text not null,
  username text,
  access_token text not null,
  token_expires_at timestamptz,
  is_active boolean default true,
  connected_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, platform)
);

-- Tabla de estrategias mensuales
create table content_strategies (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  month int not null,
  year int not null,
  analysis text,
  strategy_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, month, year)
);

-- Tabla principal de posts
create table posts (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade not null,
  platform platform default 'instagram',
  content_type content_type default 'feed_post',
  status content_status default 'draft',
  objective text,
  hook text,
  caption text,
  cta text,
  hashtags text[] default '{}',
  image_prompt text,
  image_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  platform_post_id text,
  approval_notes text,
  rejection_reason text,
  n8n_execution_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Tabla de métricas
create table post_metrics (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade unique not null,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  saves int default 0,
  reach int default 0,
  impressions int default 0,
  engagement_rate float default 0,
  fetched_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de errores de automatización
create table automation_errors (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references companies(id) on delete cascade,
  post_id uuid references posts(id) on delete set null,
  n8n_workflow text,
  n8n_execution_id text,
  error_message text not null,
  error_details jsonb,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- Tabla de eventos N8N (audit log)
create table n8n_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null,
  company_id uuid references companies(id) on delete set null,
  post_id uuid references posts(id) on delete set null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Índices
create index idx_posts_company_id on posts(company_id);
create index idx_posts_status on posts(status);
create index idx_posts_scheduled_at on posts(scheduled_at);
create index idx_posts_company_status on posts(company_id, status);
create index idx_social_accounts_company on social_accounts(company_id);
create index idx_automation_errors_company on automation_errors(company_id);
create index idx_n8n_events_company on n8n_events(company_id);
