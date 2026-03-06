-- Create watchlist table
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

-- Enable RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Users can only see their own watchlist
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their own watchlist
CREATE POLICY "Users can add to own watchlist"
  ON public.watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own watchlist
CREATE POLICY "Users can remove from own watchlist"
  ON public.watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);