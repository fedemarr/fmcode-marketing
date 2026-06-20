-- Columnas nuevas en companies
alter table companies
  add column if not exists onboarding_completed boolean default false;

-- Columnas nuevas en social_accounts
alter table social_accounts
  add column if not exists profile_picture_url text,
  add column if not exists followers_count int default 0;

-- Columnas nuevas en posts
alter table posts
  add column if not exists thumbnail_url text,
  add column if not exists carousel_images text[] default '{}';

-- automation_errors: agregar workflow_name como alias de n8n_workflow
alter table automation_errors
  add column if not exists workflow_name text;

-- Copiar valores existentes si los hay
update automation_errors set workflow_name = n8n_workflow where workflow_name is null and n8n_workflow is not null;

-- Índice nuevo para scheduled_at (solo posts no borrados)
create index if not exists idx_posts_scheduled_active on posts(scheduled_at) where deleted_at is null;
