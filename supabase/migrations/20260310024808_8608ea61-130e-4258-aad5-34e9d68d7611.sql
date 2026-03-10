
-- 1. PROFILES: Ensure the trigger protecting sensitive columns exists
-- (It was created in a previous migration, but let's be safe with IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'protect_profile_columns_trigger'
  ) THEN
    CREATE TRIGGER protect_profile_columns_trigger
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.protect_profile_columns();
  END IF;
END $$;

-- 2. EPISODES: Revoke SELECT on video_url from anon and authenticated roles
-- The RPC get_episode_video_url (SECURITY DEFINER) can still read it
REVOKE SELECT (video_url) ON public.episodes FROM anon;
REVOKE SELECT (video_url) ON public.episodes FROM authenticated;

-- Grant SELECT on all other columns explicitly
GRANT SELECT (id, title, episode_number, is_free, created_at, movie_id) ON public.episodes TO anon;
GRANT SELECT (id, title, episode_number, is_free, created_at, movie_id) ON public.episodes TO authenticated;
