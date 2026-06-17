-- Row Level Security

-- profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- companies
alter table companies enable row level security;
create policy "Owners can manage own companies" on companies
  using (owner_id = auth.uid());
create policy "Admins can see all companies" on companies for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- posts
alter table posts enable row level security;
create policy "Clients see own company posts" on posts for select
  using (company_id in (select id from companies where owner_id = auth.uid()));
create policy "Clients manage own company posts" on posts for all
  using (company_id in (select id from companies where owner_id = auth.uid()));
create policy "Admins see all posts" on posts for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- social_accounts
alter table social_accounts enable row level security;
create policy "Clients manage own social accounts" on social_accounts
  using (company_id in (select id from companies where owner_id = auth.uid()));

-- post_metrics
alter table post_metrics enable row level security;
create policy "Clients see own post metrics" on post_metrics for select
  using (post_id in (select id from posts where company_id in (select id from companies where owner_id = auth.uid())));

-- automation_errors
alter table automation_errors enable row level security;
create policy "Admins see all errors" on automation_errors for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- n8n_events
alter table n8n_events enable row level security;
create policy "Admins see all events" on n8n_events for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- content_strategies
alter table content_strategies enable row level security;
create policy "Clients see own strategies" on content_strategies for select
  using (company_id in (select id from companies where owner_id = auth.uid()));
create policy "Admins see all strategies" on content_strategies for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Función para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
