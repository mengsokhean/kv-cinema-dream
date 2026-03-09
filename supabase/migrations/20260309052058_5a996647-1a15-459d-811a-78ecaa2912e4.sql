
-- ============================================
-- 1. DROP ALL EXISTING RESTRICTIVE POLICIES
-- ============================================

-- episodes
DROP POLICY IF EXISTS "Allow public read episodes" ON public.episodes;

-- movies
DROP POLICY IF EXISTS "Allow public read movies" ON public.movies;

-- payment_requests
DROP POLICY IF EXISTS "Users can insert own requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins full access payment_requests" ON public.payment_requests;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- watch_history
DROP POLICY IF EXISTS "Users can view own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can update own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can delete own watch history" ON public.watch_history;

-- watchlist
DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can add to own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can remove from own watchlist" ON public.watchlist;

-- storage
DROP POLICY IF EXISTS "Admins can delete thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;

-- ============================================
-- 2. RECREATE ALL POLICIES AS PERMISSIVE
-- ============================================

-- === EPISODES ===
CREATE POLICY "Public can read episodes"
  ON public.episodes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage episodes"
  ON public.episodes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === MOVIES ===
CREATE POLICY "Public can read movies"
  ON public.movies FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage movies"
  ON public.movies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === PAYMENT_REQUESTS ===
CREATE POLICY "Users can view own requests"
  ON public.payment_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON public.payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access payment_requests"
  ON public.payment_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === PROFILES ===
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- === USER_ROLES ===
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === WATCH_HISTORY ===
CREATE POLICY "Users can view own watch history"
  ON public.watch_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history"
  ON public.watch_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history"
  ON public.watch_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch history"
  ON public.watch_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- === WATCHLIST ===
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON public.watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist"
  ON public.watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- === STORAGE ===
CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'movie-thumbnails');

CREATE POLICY "Admins can update thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'movie-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'movie-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. PROTECT PROFILE SENSITIVE COLUMNS VIA TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_premium := OLD.is_premium;
    NEW.subscription_expiry := OLD.subscription_expiry;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns_trigger ON public.profiles;
CREATE TRIGGER protect_profile_columns_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_columns();

-- ============================================
-- 4. FIX FUNCTION SEARCH PATHS
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_payment_success()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed')) THEN
    UPDATE public.profiles SET is_premium = true, subscription_expiry = now() + (NEW.duration_days || ' days')::interval WHERE id = NEW.user_id;
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_manual_approval()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved')) THEN
    UPDATE public.profiles 
    SET is_premium = true, 
        subscription_expiry = now() + (NEW.duration_days || ' days')::interval 
    WHERE id = NEW.user_id;
    NEW.processed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. FIX get_episode_video_url (profiles.id not user_id)
-- ============================================
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

  IF v_episode_number <= 3 THEN
    RETURN v_video_url;
  END IF;

  SELECT is_premium INTO v_is_premium
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_premium = true THEN
    RETURN v_video_url;
  END IF;

  RETURN NULL;
END;
$$;
