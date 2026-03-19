
ALTER TABLE public.episodes 
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS quality text DEFAULT 'HD',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
