// src/lib/supabaseClient.js
// ─────────────────────────────────────────────────────────────────────────────
// Single shared Supabase client used across the entire app.
// The two env vars are injected by Vite at build time (VITE_ prefix required).
// In local dev:  put them in a .env file at the project root.
// In Vercel:     add them under Project → Settings → Environment Variables.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌  Missing Supabase env vars.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file (local) ' +
    'or Vercel Environment Variables (production).'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
