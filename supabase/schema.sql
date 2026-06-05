-- ============================================================================
-- Nara Baby replica — Supabase schema
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> paste -> Run.
-- It creates the tables, Row-Level Security policies, a realtime publication,
-- and a private storage bucket for baby photos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  language text not null default 'he',
  units jsonb not null default '{"volume":"ml","weight":"kg","length":"cm"}'::jsonb,
  active_baby_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birthdate date,
  sex text,
  photo_path text,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.baby_members (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'caregiver',
  created_at timestamptz not null default now(),
  unique (baby_id, user_id)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  type text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entries_baby_start_idx on public.entries (baby_id, start_time desc);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  kind text not null default 'wakeWindow',
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helper (SECURITY DEFINER avoids recursive RLS evaluation)
-- ----------------------------------------------------------------------------

create or replace function public.is_baby_member(b_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.baby_members m
    where m.baby_id = b_id and m.user_id = auth.uid()
  );
$$;

-- Add the creator as an owner member whenever a baby row is inserted.
create or replace function public.handle_new_baby()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.baby_members (baby_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (baby_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_baby_created on public.babies;
create trigger on_baby_created
  after insert on public.babies
  for each row execute function public.handle_new_baby();

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
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.babies enable row level security;
alter table public.baby_members enable row level security;
alter table public.entries enable row level security;
alter table public.reminders enable row level security;

-- profiles: each user manages only their own row
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- babies: visible/editable to members
drop policy if exists babies_select on public.babies;
create policy babies_select on public.babies
  for select using (public.is_baby_member(id));
drop policy if exists babies_insert on public.babies;
create policy babies_insert on public.babies
  for insert with check (owner_id = auth.uid());
drop policy if exists babies_update on public.babies;
create policy babies_update on public.babies
  for update using (public.is_baby_member(id));
drop policy if exists babies_delete on public.babies;
create policy babies_delete on public.babies
  for delete using (owner_id = auth.uid());

-- baby_members: a member can see the membership rows of babies they belong to;
-- a user can add themselves (used by the invite-join flow) or the owner can add.
drop policy if exists members_select on public.baby_members;
create policy members_select on public.baby_members
  for select using (public.is_baby_member(baby_id));
drop policy if exists members_insert on public.baby_members;
create policy members_insert on public.baby_members
  for insert with check (user_id = auth.uid());
drop policy if exists members_delete on public.baby_members;
create policy members_delete on public.baby_members
  for delete using (user_id = auth.uid() or public.is_baby_member(baby_id));

-- entries: full access to members of the baby
drop policy if exists entries_all on public.entries;
create policy entries_all on public.entries
  for all using (public.is_baby_member(baby_id))
  with check (public.is_baby_member(baby_id));

-- reminders: full access to members of the baby
drop policy if exists reminders_all on public.reminders;
create policy reminders_all on public.reminders
  for all using (public.is_baby_member(baby_id))
  with check (public.is_baby_member(baby_id));

-- ----------------------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.entries;
alter publication supabase_realtime add table public.babies;
alter publication supabase_realtime add table public.reminders;

-- ----------------------------------------------------------------------------
-- Storage bucket for baby photos (private; access via signed URLs)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('baby-photos', 'baby-photos', false)
on conflict (id) do nothing;

drop policy if exists baby_photos_rw on storage.objects;
create policy baby_photos_rw on storage.objects
  for all to authenticated
  using (bucket_id = 'baby-photos')
  with check (bucket_id = 'baby-photos');
