-- Run this in the Supabase SQL Editor for the production project.
-- After it succeeds, go to the Control Room and click "Seed Defaults"
-- once to populate these tables from the app's fallback content.

CREATE TABLE IF NOT EXISTS public.practices (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  category text NOT NULL,
  duration text NOT NULL,
  level text NOT NULL,
  image text NOT NULL,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.practice_variants (
  id text PRIMARY KEY,
  parentId text NOT NULL,
  title text NOT NULL,
  sortDate timestamptz,
  category text NOT NULL,
  duration text NOT NULL,
  level text NOT NULL,
  image text NOT NULL,
  description text NOT NULL,
  startLabel text NOT NULL,
  subtitle text,
  body text,
  kind text,
  creator text,
  externalUrl text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  mediaUrl text,
  audioUrl text,
  mediaType text,
  supportState text,
  frequency text,
  credit text,
  sourceUrl text
);

CREATE INDEX IF NOT EXISTS practice_variants_parent_id_idx
  ON public.practice_variants (parentId);

CREATE INDEX IF NOT EXISTS practice_variants_sort_date_idx
  ON public.practice_variants (sortDate DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.spiral_modules (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  image text,
  image_feminine text,
  image_masculine text,
  description text NOT NULL,
  tier integer
);

CREATE INDEX IF NOT EXISTS spiral_modules_tier_idx
  ON public.spiral_modules (tier);
