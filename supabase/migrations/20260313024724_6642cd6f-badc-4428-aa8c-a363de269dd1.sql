
-- Add video_url column to movies for storing actual full movie URLs (separate from trailer)
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS video_url text;

-- Update get_movie_video_url to properly gate premium content
CREATE OR REPLACE FUNCTION public.get_movie_video_url(p_movie_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_premium_required boolean;
  v_video_url text;
  v_trailer_url text;
  v_user_premium boolean;
  v_subscription_expiry timestamptz;
BEGIN
  SELECT is_premium_required, video_url, trailer_url
  INTO v_is_premium_required, v_video_url, v_trailer_url
  FROM public.movies WHERE id = p_movie_id;

  IF v_is_premium_required IS NULL THEN
    RETURN NULL;
  END IF;

  -- Free movie: return video_url (or trailer_url as fallback)
  IF v_is_premium_required = false THEN
    RETURN COALESCE(v_video_url, v_trailer_url);
  END IF;

  -- Premium movie: check caller's premium status AND expiry
  SELECT is_premium, subscription_expiry
  INTO v_user_premium, v_subscription_expiry
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_premium = true AND v_subscription_expiry > now() THEN
    RETURN COALESCE(v_video_url, v_trailer_url);
  END IF;

  RAISE EXCEPTION 'Access denied: subscription expired or not premium';
END;
$function$;
