
-- Add is_series column to movies
ALTER TABLE public.movies ADD COLUMN is_series boolean NOT NULL DEFAULT false;

-- Create episodes table
CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  title text NOT NULL,
  episode_number integer NOT NULL,
  video_url text,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(movie_id, episode_number)
);

-- Enable RLS
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Everyone can view episodes
CREATE POLICY "Episodes are viewable by everyone"
ON public.episodes FOR SELECT
USING (true);

-- Admins can manage episodes
CREATE POLICY "Admins can insert episodes"
ON public.episodes FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update episodes"
ON public.episodes FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete episodes"
ON public.episodes FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
