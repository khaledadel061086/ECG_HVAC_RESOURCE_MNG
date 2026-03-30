-- ═══════════════════════════════════════════════════════════════════════════
--  HVAC FLOW — Supabase SQL Schema  (v3 — with Auth)
--  Run this entire script in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. ENGINEERS TABLE ──────────────────────────────────────────────────────
create table if not exists public.engineers (
  id          text        primary key,
  serial      text        not null,
  name        text        not null,
  position    text        not null,
  option      text        not null,
  branch      text        not null,
  grad_year   integer     not null default 2000,
  notes       text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── 2. PROJECTS TABLE ───────────────────────────────────────────────────────
create table if not exists public.projects (
  id               text        primary key,
  number           text        not null default '',
  name             text        not null,
  scope            text        not null default 'Design',
  status           text        not null default 'Not Started Yet',
  type             text        not null default 'Commercial',
  stage            text        not null default 'Concept',
  branch           text        not null default 'HQ',
  submission_date  text        not null default '',
  finalization_date text       not null default '',
  leader_id        text        not null default '',
  leader_load      integer     not null default 0,
  notes            text        not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── 3. PROJECT MEMBERS TABLE ────────────────────────────────────────────────
create table if not exists public.project_members (
  id          bigserial   primary key,
  project_id  text        not null references public.projects(id) on delete cascade,
  eng_id      text        not null references public.engineers(id) on delete cascade,
  load        integer     not null default 0,
  created_at  timestamptz not null default now(),
  unique(project_id, eng_id)
);

-- ─── 4. APP STATE TABLE ──────────────────────────────────────────────────────
create table if not exists public.app_state (
  id          integer     primary key default 1,
  saved_by    text        not null default '',
  saved_at    text        not null default '',
  app_version text        not null default '3.0.0'
);
insert into public.app_state (id, saved_by, saved_at)
values (1, '', '') on conflict (id) do nothing;

-- ─── 5. APP USERS TABLE ──────────────────────────────────────────────────────
-- Passwords stored as SHA-256 hex hashes — never plaintext.
-- is_admin = true  → full access + Admin Console (user management)
-- is_admin = false → read/write app data only
create table if not exists public.app_users (
  id           bigserial   primary key,
  username     text        not null unique,
  pass_hash    text        not null,
  is_admin     boolean     not null default false,
  display_name text        not null default '',
  created_at   timestamptz not null default now(),
  last_login   timestamptz
);
-- Admin seed row (hash will be corrected on first app startup)
insert into public.app_users (username, pass_hash, is_admin, display_name)
values ('Khaled.adel', 'SEED_ON_STARTUP', true, 'Khaled Adel')
on conflict (username) do nothing;

-- ─── 6. ROW LEVEL SECURITY ───────────────────────────────────────────────────
alter table public.engineers        enable row level security;
alter table public.projects         enable row level security;
alter table public.project_members  enable row level security;
alter table public.app_state        enable row level security;
alter table public.app_users        enable row level security;

create policy "public_read_engineers"        on public.engineers        for select using (true);
create policy "public_write_engineers"       on public.engineers        for all    using (true) with check (true);
create policy "public_read_projects"         on public.projects         for select using (true);
create policy "public_write_projects"        on public.projects         for all    using (true) with check (true);
create policy "public_read_project_members"  on public.project_members  for select using (true);
create policy "public_write_project_members" on public.project_members  for all    using (true) with check (true);
create policy "public_read_app_state"        on public.app_state        for select using (true);
create policy "public_write_app_state"       on public.app_state        for all    using (true) with check (true);
create policy "public_read_users"            on public.app_users        for select using (true);
create policy "public_write_users"           on public.app_users        for all    using (true) with check (true);

-- ─── 7. TRIGGERS ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger engineers_updated_at
  before update on public.engineers
  for each row execute function public.set_updated_at();
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
