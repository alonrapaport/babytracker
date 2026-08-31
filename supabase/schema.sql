-- ============================================================================
-- RecipeBox — Supabase schema
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> paste -> Run.
-- It creates the tables, Row-Level Security policies, the realtime
-- publication, and a private storage bucket for recipe photos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  language text not null default 'he',
  unit_system text not null default 'original',
  custom_aisles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text,
  image_path text,
  image_url text,
  source_url text,
  source_name text,
  prep_min int,
  cook_min int,
  total_min int,
  servings numeric,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  notes text,
  tags text[] not null default '{}',
  nutrition jsonb,
  favorite boolean not null default false,
  is_public boolean not null default false,
  lang text not null default 'he',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recipes_owner_idx on public.recipes (owner_id, created_at desc);
create index if not exists recipes_public_idx on public.recipes (is_public) where is_public;

create table if not exists public.cookbooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  emoji text,
  invite_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.cookbook_members (
  id uuid primary key default gen_random_uuid(),
  cookbook_id uuid not null references public.cookbooks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (cookbook_id, user_id)
);

create table if not exists public.cookbook_recipes (
  id uuid primary key default gen_random_uuid(),
  cookbook_id uuid not null references public.cookbooks (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cookbook_id, recipe_id)
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  normalized_name text not null,
  qty numeric,
  unit text,
  aisle text not null default 'other',
  recipe_id uuid references public.recipes (id) on delete set null,
  recipe_title text,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists grocery_user_idx on public.grocery_items (user_id, checked, aisle);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_date date not null,
  slot text not null,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  servings numeric,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date, slot, recipe_id)
);
create index if not exists meal_plans_user_date_idx on public.meal_plans (user_id, plan_date);

-- ----------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER avoids recursive RLS evaluation)
-- ----------------------------------------------------------------------------

create or replace function public.is_cookbook_member(c_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.cookbook_members m
    where m.cookbook_id = c_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.recipe_shared_with_me(r_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.cookbook_recipes cr
    join public.cookbook_members m on m.cookbook_id = cr.cookbook_id
    where cr.recipe_id = r_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.owns_recipe(r_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.recipes r where r.id = r_id and r.owner_id = auth.uid()
  );
$$;

-- Join a shared cookbook by its (secret) invite token.
create or replace function public.join_cookbook(token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_id uuid;
begin
  select id into c_id from public.cookbooks where invite_token = token;
  if c_id is null or auth.uid() is null then
    return null;
  end if;
  insert into public.cookbook_members (cookbook_id, user_id, role)
  values (c_id, auth.uid(), 'member')
  on conflict (cookbook_id, user_id) do nothing;
  return c_id;
end;
$$;

grant execute on function public.join_cookbook(uuid) to authenticated;

-- Add the creator as an owner member whenever a cookbook row is inserted.
create or replace function public.handle_new_cookbook()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cookbook_members (cookbook_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (cookbook_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_cookbook_created on public.cookbooks;
create trigger on_cookbook_created
  after insert on public.cookbooks
  for each row execute function public.handle_new_cookbook();

-- Create a profile row automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_touch on public.recipes;
create trigger recipes_touch before update on public.recipes
  for each row execute function public.touch_updated_at();

drop trigger if exists grocery_touch on public.grocery_items;
create trigger grocery_touch before update on public.grocery_items
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.cookbooks enable row level security;
alter table public.cookbook_members enable row level security;
alter table public.cookbook_recipes enable row level security;
alter table public.grocery_items enable row level security;
alter table public.meal_plans enable row level security;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "recipes select" on public.recipes;
create policy "recipes select" on public.recipes
  for select using (
    owner_id = auth.uid() or is_public or public.recipe_shared_with_me(id)
  );

drop policy if exists "recipes insert" on public.recipes;
create policy "recipes insert" on public.recipes
  for insert with check (owner_id = auth.uid());

drop policy if exists "recipes update" on public.recipes;
create policy "recipes update" on public.recipes
  for update using (owner_id = auth.uid());

drop policy if exists "recipes delete" on public.recipes;
create policy "recipes delete" on public.recipes
  for delete using (owner_id = auth.uid());

drop policy if exists "cookbooks select" on public.cookbooks;
create policy "cookbooks select" on public.cookbooks
  for select using (public.is_cookbook_member(id));

drop policy if exists "cookbooks insert" on public.cookbooks;
create policy "cookbooks insert" on public.cookbooks
  for insert with check (owner_id = auth.uid());

drop policy if exists "cookbooks update" on public.cookbooks;
create policy "cookbooks update" on public.cookbooks
  for update using (owner_id = auth.uid());

drop policy if exists "cookbooks delete" on public.cookbooks;
create policy "cookbooks delete" on public.cookbooks
  for delete using (owner_id = auth.uid());

drop policy if exists "cookbook members select" on public.cookbook_members;
create policy "cookbook members select" on public.cookbook_members
  for select using (public.is_cookbook_member(cookbook_id));

drop policy if exists "cookbook members delete" on public.cookbook_members;
create policy "cookbook members delete" on public.cookbook_members
  for delete using (user_id = auth.uid() or public.is_cookbook_member(cookbook_id));

drop policy if exists "cookbook recipes select" on public.cookbook_recipes;
create policy "cookbook recipes select" on public.cookbook_recipes
  for select using (public.is_cookbook_member(cookbook_id));

drop policy if exists "cookbook recipes insert" on public.cookbook_recipes;
create policy "cookbook recipes insert" on public.cookbook_recipes
  for insert with check (
    public.is_cookbook_member(cookbook_id) and public.owns_recipe(recipe_id)
  );

drop policy if exists "cookbook recipes delete" on public.cookbook_recipes;
create policy "cookbook recipes delete" on public.cookbook_recipes
  for delete using (public.is_cookbook_member(cookbook_id));

drop policy if exists "grocery own" on public.grocery_items;
create policy "grocery own" on public.grocery_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "meal plans own" on public.meal_plans;
create policy "meal plans own" on public.meal_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------------------

do $$ begin
  alter publication supabase_realtime add table public.recipes;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.grocery_items;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.meal_plans;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.cookbook_recipes;
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Storage: private bucket for recipe photos
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', false)
on conflict (id) do nothing;

drop policy if exists "recipe photos rw" on storage.objects;
create policy "recipe photos rw" on storage.objects
  for all to authenticated
  using (bucket_id = 'recipe-photos')
  with check (bucket_id = 'recipe-photos');
