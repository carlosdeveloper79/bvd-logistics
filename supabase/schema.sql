create extension if not exists pgcrypto;

create table if not exists public.driver_profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  role text not null default 'driver',
  email text not null unique,
  phone text not null,
  status text not null default 'invited',
  created_at timestamptz not null default now()
);

alter table public.driver_profiles add column if not exists role text not null default 'driver';
alter table public.driver_profiles drop constraint if exists driver_profiles_role_check;
alter table public.driver_profiles
add constraint driver_profiles_role_check
check (role in ('driver', 'helper'));

alter table public.driver_profiles enable row level security;

drop policy if exists driver_profiles_service_role_all on public.driver_profiles;

create policy driver_profiles_service_role_all
on public.driver_profiles
for all
to service_role
using (true)
with check (true);

create table if not exists public.driver_invites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.driver_profiles(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.driver_invites enable row level security;

drop policy if exists driver_invites_service_role_all on public.driver_invites;

create policy driver_invites_service_role_all
on public.driver_invites
for all
to service_role
using (true)
with check (true);

create index if not exists idx_driver_invites_token_hash on public.driver_invites(token_hash);
create index if not exists idx_driver_invites_profile_id on public.driver_invites(profile_id);

create table if not exists public.driver_applications (
  id uuid primary key,
  profile_id uuid not null references public.driver_profiles(id) on delete cascade,
  invite_id uuid not null references public.driver_invites(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  dob date not null,
  addresses jsonb not null,
  consent_name text not null,
  consent_date date not null,
  submitted_at timestamptz not null,
  document_path text not null,
  created_at timestamptz not null default now()
);

alter table public.driver_applications enable row level security;

drop policy if exists driver_applications_service_role_all on public.driver_applications;

create policy driver_applications_service_role_all
on public.driver_applications
for all
to service_role
using (true)
with check (true);

create index if not exists idx_driver_applications_profile_id on public.driver_applications(profile_id);

create table if not exists public.team_assignments (
  id uuid primary key default gen_random_uuid(),
  driver_profile_id uuid not null references public.driver_profiles(id) on delete cascade,
  helper_profile_id uuid not null references public.driver_profiles(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint team_assignments_status_check check (status in ('active', 'inactive')),
  constraint team_assignments_different_members check (driver_profile_id <> helper_profile_id)
);

create index if not exists idx_team_assignments_driver on public.team_assignments(driver_profile_id);
create index if not exists idx_team_assignments_helper on public.team_assignments(helper_profile_id);

alter table public.team_assignments enable row level security;

drop policy if exists team_assignments_service_role_all on public.team_assignments;

create policy team_assignments_service_role_all
on public.team_assignments
for all
to service_role
using (true)
with check (true);

-- ── Admin users (allowlist — auth handled by Supabase Auth) ──
create table if not exists public.admins (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists admins_service_role_all on public.admins;
create policy admins_service_role_all
  on public.admins for all to service_role
  using (true) with check (true);

-- Seed admin email (user must exist in Supabase Auth with this email)
insert into public.admins (email)
values ('c_ramirez23@icloud.com')
on conflict (email) do nothing;

-- ── Supabase Storage: private onboarding documents bucket ────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'onboarding-documents',
  'onboarding-documents',
  false,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Only the service-role key may read/write objects in this bucket
drop policy if exists "onboarding_docs_service_role" on storage.objects;
create policy "onboarding_docs_service_role"
  on storage.objects for all
  to service_role
  using  (bucket_id = 'onboarding-documents')
  with check (bucket_id = 'onboarding-documents');
