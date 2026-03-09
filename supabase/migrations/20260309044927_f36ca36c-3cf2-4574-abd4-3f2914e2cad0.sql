
-- Revoke direct SELECT access to video_url column on episodes table
-- This prevents anon/authenticated users from reading video_url directly via PostgREST
-- They must use the get_episode_video_url() RPC which enforces premium checks
REVOKE SELECT (video_url) ON public.episodes FROM anon, authenticated;

-- Create a similar secure function for movie video URLs
CREATE OR REPLACE FUNCTION public.get_movie_video_url(p_movie_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_premium_required boolean;
  v_video_url text;
  v_trailer_url text;
  v_user_premium boolean;
BEGIN
  SELECT is_premium_required, trailer_url
  INTO v_is_premium_required, v_trailer_url
  FROM public.movies WHERE id = p_movie_id;

  IF v_is_premium_required IS NULL THEN
    RETURN NULL;
  END IF;

  -- If not premium required, return trailer_url (movies don't have video_url column)
  IF v_is_premium_required = false THEN
    RETURN v_trailer_url;
  END IF;

  -- Check caller's premium status
  SELECT is_premium INTO v_user_premium
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_premium = true THEN
    RETURN v_trailer_url;
  END IF;

  -- Non-premium users get trailer for premium movies too (it's a preview)
  RETURN v_trailer_url;
END;
$$;
