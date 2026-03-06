
-- 1. Add FK constraint on episodes.movie_id -> movies.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'episodes_movie_id_fkey'
    AND table_name = 'episodes'
  ) THEN
    ALTER TABLE public.episodes
      ADD CONSTRAINT episodes_movie_id_fkey
      FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Fix the handle_payment_success function (was using profiles.id instead of profiles.user_id)
CREATE OR REPLACE FUNCTION public.handle_payment_success()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.profiles
    SET is_premium = true,
        subscription_expiry = now() + (NEW.duration_days || ' days')::interval,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_payment_completed ON public.payments;
CREATE TRIGGER on_payment_completed
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_success();

-- 4. Also trigger on INSERT with status='completed' (edge case)
DROP TRIGGER IF EXISTS on_payment_insert_completed ON public.payments;
CREATE TRIGGER on_payment_insert_completed
  AFTER INSERT ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.handle_payment_success();

-- 5. Create a secure function to get video_url only for authorized users
CREATE OR REPLACE FUNCTION public.get_episode_video_url(p_episode_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_episode_number integer;
  v_video_url text;
  v_is_premium boolean;
BEGIN
  SELECT episode_number, video_url INTO v_episode_number, v_video_url
  FROM public.episodes WHERE id = p_episode_id;

  IF v_episode_number IS NULL THEN
    RETURN NULL;
  END IF;

  -- Episodes 1-3 are free
  IF v_episode_number <= 3 THEN
    RETURN v_video_url;
  END IF;

  -- Check premium status
  SELECT is_premium INTO v_is_premium
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF v_is_premium = true THEN
    RETURN v_video_url;
  END IF;

  RETURN NULL;
END;
$$;

-- 6. Create admin function to manually verify payments
CREATE OR REPLACE FUNCTION public.admin_verify_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  UPDATE public.payments
  SET status = 'completed',
      completed_at = now()
  WHERE id = p_payment_id AND status != 'completed';
END;
$$;

-- 7. Create admin function to list premium users
CREATE OR REPLACE FUNCTION public.admin_list_premium_users()
RETURNS TABLE(
  user_id uuid,
  username text,
  email text,
  is_premium boolean,
  subscription_expiry timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.username, p.email, p.is_premium, p.subscription_expiry, p.created_at
  FROM public.profiles p
  WHERE p.is_premium = true
  ORDER BY p.subscription_expiry DESC;
END;
$$;

-- 8. Create admin function to list all payments
CREATE OR REPLACE FUNCTION public.admin_list_payments()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  email text,
  plan_name text,
  amount numeric,
  payment_method text,
  status text,
  duration_days integer,
  created_at timestamptz,
  completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  RETURN QUERY
  SELECT pay.id, pay.user_id, pr.username, pr.email, pay.plan_name, pay.amount,
         pay.payment_method, pay.status, pay.duration_days, pay.created_at, pay.completed_at
  FROM public.payments pay
  LEFT JOIN public.profiles pr ON pr.user_id = pay.user_id
  ORDER BY pay.created_at DESC;
END;
$$;
