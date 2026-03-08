
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS rating numeric,
  ADD COLUMN IF NOT EXISTS is_premium_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trailer_url text,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
