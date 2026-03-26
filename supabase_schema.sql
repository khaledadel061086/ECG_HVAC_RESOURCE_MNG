-- ═══════════════════════════════════════════════════════════════════════════
--  HVAC FLOW — Supabase SQL Schema
--  Run this entire script once in the Supabase SQL Editor
--  (Dashboard → SQL Editor → New Query → paste → Run)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. ENGINEERS TABLE ──────────────────────────────────────────────────────
create table if not exists public.engineers (
  id          text        primary key,          -- e.g. "e_5288"
  serial      text        not null,             -- e.g. "5288", "A797"
  name        text        not null,
  position    text        not null,             -- Section Head | Principal | Senior | Junior | Draftsman
  option      text        not null,             -- Team Leader | Team Member
  branch      text        not null,             -- HQ | SV | ALX | AST
  grad_year   integer     not null default 2000,
  notes       text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── 2. PROJECTS TABLE ───────────────────────────────────────────────────────
create table if not exists public.projects (
  id               text        primary key,     -- e.g. "p1", or uuid generated client-side
  number           text        not null default '',
  name             text        not null,
  scope            text        not null default 'Design',
  status           text        not null default 'Not Started Yet',
  type             text        not null default 'Commercial',
  stage            text        not null default 'Concept',
  branch           text        not null default 'HQ',
  submission_date  text        not null default '',   -- stored as "YYYY-MM-DD" string
  finalization_date text       not null default '',
  leader_id        text        not null default '',   -- FK → engineers.id (soft ref)
  leader_load      integer     not null default 0,    -- percentage 0-100
  notes            text        not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── 3. PROJECT MEMBERS TABLE ────────────────────────────────────────────────
-- Each row = one engineer assigned to one project, with their workload %.
-- This replaces the nested "members" array that lived inside each project object.
create table if not exists public.project_members (
  id          bigserial   primary key,
  project_id  text        not null references public.projects(id) on delete cascade,
  eng_id      text        not null references public.engineers(id) on delete cascade,
  load        integer     not null default 0,   -- percentage 0-100
  created_at  timestamptz not null default now(),
  unique(project_id, eng_id)                    -- one entry per engineer per project
);

-- ─── 4. APP STATE TABLE ──────────────────────────────────────────────────────
-- Stores a single row with global metadata (last saved by, timestamp, etc.)
create table if not exists public.app_state (
  id          integer     primary key default 1,    -- always row 1
  saved_by    text        not null default '',
  saved_at    text        not null default '',       -- Cairo datetime string
  app_version text        not null default '2.0.0'
);

-- Insert the single default row so upsert always has something to update:
insert into public.app_state (id, saved_by, saved_at)
values (1, '', '')
on conflict (id) do nothing;

-- ─── 5. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────
-- Enable RLS on all tables but allow full public read/write via the anon key.
-- In a production system you would add auth-based policies instead.

alter table public.engineers      enable row level security;
alter table public.projects       enable row level security;
alter table public.project_members enable row level security;
alter table public.app_state      enable row level security;

-- Allow any visitor (anon key) to read and write all tables:
create policy "public_read_engineers"
  on public.engineers for select using (true);
create policy "public_write_engineers"
  on public.engineers for all using (true) with check (true);

create policy "public_read_projects"
  on public.projects for select using (true);
create policy "public_write_projects"
  on public.projects for all using (true) with check (true);

create policy "public_read_project_members"
  on public.project_members for select using (true);
create policy "public_write_project_members"
  on public.project_members for all using (true) with check (true);

create policy "public_read_app_state"
  on public.app_state for select using (true);
create policy "public_write_app_state"
  on public.app_state for all using (true) with check (true);

-- ─── 6. AUTO-UPDATE updated_at TRIGGER ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger engineers_updated_at
  before update on public.engineers
  for each row execute function public.set_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
