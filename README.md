# ⟨ HVAC_FLOW ⟩ — Full-Stack Deployment Guide

## What This Project Is
A React + Vite app that stores all engineer and project data in **Supabase** (PostgreSQL).
Every user visiting the URL sees the **same live data**. Save syncs to the cloud instantly.

---

## 📁 Project Structure

```
hvacflow/
├── index.html
├── vite.config.js
├── package.json
├── vercel.json               ← SPA routing for Vercel
├── .env.example              ← Copy to .env and fill in your keys
├── supabase_schema.sql       ← Run this ONCE in Supabase SQL Editor
└── src/
    ├── main.jsx              ← React entry point
    ├── App.jsx               ← Full application (all modules + Supabase logic)
    └── lib/
        └── supabaseClient.js ← Supabase client (reads env vars)
```

---

## STEP 1 — Create Supabase Project

1. Go to **https://supabase.com** → New Project
2. Choose a name, set a strong password, pick a region near Egypt (e.g. EU West)
3. Wait for the project to finish setting up (~1 min)

---

## STEP 2 — Run the SQL Schema

1. In your Supabase dashboard: **SQL Editor → New Query**
2. Open `supabase_schema.sql` from this project
3. **Paste the entire file** into the editor
4. Click **Run** (green button)

This creates 4 tables:
- `engineers` — all engineer records
- `projects` — all project records
- `project_members` — which engineers are on which project
- `app_state` — last-saved metadata (who saved, when)

It also enables **Row Level Security** with public read/write policies
(safe for an internal team app — tighten with auth if needed later).

---

## STEP 3 — Get Your API Keys

In Supabase dashboard: **Project Settings → API**

Copy these two values:

| Key | Where to find it |
|-----|-----------------|
| `VITE_SUPABASE_URL` | "Project URL" field |
| `VITE_SUPABASE_ANON_KEY` | "anon / public" key under "Project API keys" |

---

## STEP 4 — Local Development

```bash
# Clone / download the project, then:
cd hvacflow
npm install

# Create your .env file:
cp .env.example .env
# Edit .env and paste your Supabase URL and anon key

npm run dev
# Open http://localhost:5173
```

On first load, the app detects an empty database and **automatically seeds**
all 86 engineers from the Excel file into Supabase.

---

## STEP 5 — Deploy to Vercel

### Option A: GitHub → Vercel (recommended)

1. Push this project to a **GitHub repository**
2. Go to **https://vercel.com** → New Project → Import from GitHub
3. Select your repo
4. Framework: **Vite** (auto-detected)
5. **Environment Variables** — add these two:

   ```
   VITE_SUPABASE_URL       = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY  = eyJ...
   ```

6. Click **Deploy**
7. Vercel gives you a public URL like `https://hvacflow.vercel.app`

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel
# Follow prompts — set env vars when asked
```

---

## STEP 6 — How Saves Work

| Action | What Happens |
|--------|-------------|
| Add/edit engineer | Updates **local React state** only (● Unsaved) |
| Add/edit project | Updates **local React state** only (● Unsaved) |
| Click **💾 Save to Cloud** | Syncs everything to Supabase · All other users see it |
| Another user opens the URL | Fetches latest data from Supabase on load |
| Click **↓ Export** | Downloads a `.json` backup file |
| Click **↑ Import** | Loads engineers+projects from a backup file into local state |
| Click **⟳ Clear** | Deletes everything from Supabase |

---

## Environment Variables Reference

```bash
# .env  (local)  — never commit this file!
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...long_key_here...

# Vercel — add under:
# Project → Settings → Environment Variables
# Name:  VITE_SUPABASE_URL        Value: https://...
# Name:  VITE_SUPABASE_ANON_KEY   Value: eyJ...
```

> ⚠️ The `VITE_` prefix is **required** — Vite only exposes env vars
> that start with `VITE_` to the browser bundle.

---

## Supabase Table Schema Summary

```sql
engineers (
  id TEXT PRIMARY KEY,     -- e.g. "e_5288"
  serial TEXT,             -- display serial number
  name TEXT,
  position TEXT,           -- Section Head | Principal | Senior | Junior | Draftsman
  option TEXT,             -- Team Leader | Team Member
  branch TEXT,             -- HQ | SV | ALX | AST
  grad_year INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

projects (
  id TEXT PRIMARY KEY,
  number TEXT,
  name TEXT,
  scope TEXT,
  status TEXT,
  type TEXT,
  stage TEXT,
  branch TEXT,
  submission_date TEXT,    -- "YYYY-MM-DD"
  finalization_date TEXT,
  leader_id TEXT,          -- references engineers.id
  leader_load INTEGER,     -- workload percentage
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

project_members (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  eng_id TEXT REFERENCES engineers(id) ON DELETE CASCADE,
  load INTEGER,            -- workload percentage
  UNIQUE(project_id, eng_id)
)

app_state (
  id INTEGER PRIMARY KEY DEFAULT 1,   -- always row 1
  saved_by TEXT,           -- auto-detected identity of last saver
  saved_at TEXT,           -- Cairo datetime string
  app_version TEXT
)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Missing Supabase env vars" | Check `.env` file has `VITE_` prefix and no spaces around `=` |
| Data not loading | Check Supabase → SQL Editor → confirm tables exist |
| RLS blocking writes | Re-run the `supabase_schema.sql` — it creates the public policies |
| Vercel build fails | Check env vars are set under Project Settings → Environment Variables |
| Engineers not seeding | Open browser console → look for Supabase error message |
