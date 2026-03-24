-- ============================================================
-- Remember App — Supabase Schema
-- Run this in the Supabase SQL Editor or as a migration
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── User Settings ──────────────────────────────────────────
create table if not exists public.user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text not null default '',
  node_label text not null default 'Node',
  person_label text not null default 'Person',
  place_label text not null default 'Place',
  context_label text not null default 'Context',
  accent_color text not null default '#3525cd',
  secondary_color text not null default '#4f46e5',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─── Map Nodes ──────────────────────────────────────────────
create table if not exists public.map_nodes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  parent_id uuid references public.map_nodes(id) on delete cascade,
  name text not null,
  type text not null default 'context' check (type in ('user', 'person', 'place', 'context')),
  hint text,
  description text,
  address text,
  relationship text,
  meta jsonb default '{}'::jsonb,
  position_x float,
  position_y float,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists idx_map_nodes_user_id on public.map_nodes(user_id);
create index if not exists idx_map_nodes_parent_id on public.map_nodes(parent_id);
create index if not exists idx_user_settings_user_id on public.user_settings(user_id);

-- ─── Row Level Security ─────────────────────────────────────
alter table public.user_settings enable row level security;
alter table public.map_nodes enable row level security;

-- Users can only access their own settings
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on public.user_settings for delete
  using (auth.uid() = user_id);

-- Users can only access their own nodes
create policy "Users can view own nodes"
  on public.map_nodes for select
  using (auth.uid() = user_id);

create policy "Users can insert own nodes"
  on public.map_nodes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own nodes"
  on public.map_nodes for update
  using (auth.uid() = user_id);

create policy "Users can delete own nodes"
  on public.map_nodes for delete
  using (auth.uid() = user_id);

-- ─── Auto-update updated_at ─────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_settings_updated
  before update on public.user_settings
  for each row execute function public.handle_updated_at();

create trigger on_map_nodes_updated
  before update on public.map_nodes
  for each row execute function public.handle_updated_at();

-- ─── Auto-create settings on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
