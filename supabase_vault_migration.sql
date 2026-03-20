-- Run this in Supabase SQL Editor to create Vault tables.
-- Requires: public.users table (from MoonSync setup)

-- Spiral Notes: one row per user per module
CREATE TABLE IF NOT EXISTS public.spiral_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  content text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Personal Writings: journal entries
CREATE TABLE IF NOT EXISTS public.vault_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  type text DEFAULT 'text',
  created_at timestamptz DEFAULT now()
);

-- RLS: users can only access their own data
ALTER TABLE public.spiral_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_entries ENABLE ROW LEVEL SECURITY;

-- Policy: service role bypasses RLS (backend uses service role)
-- For direct client access: allow authenticated users to read/write own rows
CREATE POLICY "Users can manage own spiral_notes"
  ON public.spiral_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own vault_entries"
  ON public.vault_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
