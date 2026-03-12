
CREATE OR REPLACE FUNCTION public.get_episode_video_url(episode_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_video_url text;
  v_is_free boolean;
BEGIN
  SELECT video_url, is_free
  INTO v_video_url, v_is_free
  FROM public.episodes
  WHERE id = episode_id;

  IF v_is_free THEN
    RETURN v_video_url;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_premium = true
    AND subscription_expiry > now()
  ) THEN
    RETURN v_video_url;
  END IF;

  RAISE EXCEPTION 'Access denied: subscription expired or not premium';
END;
$function$;
