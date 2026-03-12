
-- ============================================================
-- FIX 1 & 3: Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- Also replace raw_user_meta_data admin checks with has_role()
-- ============================================================

-- === PROFILES ===
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System insert profiles only" ON public.profiles;

-- Users can view own profile (PERMISSIVE)
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles (PERMISSIVE, uses has_role)
CREATE POLICY "Admin view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all profiles (PERMISSIVE, uses has_role)
CREATE POLICY "Admin manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FIX 2: Users update own profile — block is_premium, is_admin, subscription_expiry
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = false
    AND is_premium IS NOT DISTINCT FROM (SELECT p.is_premium FROM public.profiles p WHERE p.id = auth.uid())
    AND subscription_expiry IS NOT DISTINCT FROM (SELECT p.subscription_expiry FROM public.profiles p WHERE p.id = auth.uid())
  );

-- System insert (PERMISSIVE)
CREATE POLICY "System insert profiles only"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND is_premium = false AND is_admin = false);

-- === MOVIES ===
DROP POLICY IF EXISTS "Authenticated read movies" ON public.movies;

CREATE POLICY "Authenticated read movies"
  ON public.movies FOR SELECT
  TO authenticated
  USING (true);

-- === EPISODES ===
DROP POLICY IF EXISTS "Anon read free episodes" ON public.episodes;
DROP POLICY IF EXISTS "Users read episodes" ON public.episodes;

CREATE POLICY "Anon read free episodes"
  ON public.episodes FOR SELECT
  TO anon
  USING (is_free = true);

CREATE POLICY "Users read episodes"
  ON public.episodes FOR SELECT
  TO authenticated
  USING (
    is_free = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_premium = true
        AND profiles.subscription_expiry > now()
    )
  );

-- === PAYMENT_REQUESTS ===
DROP POLICY IF EXISTS "Users insert own payment" ON public.payment_requests;
DROP POLICY IF EXISTS "Users view own payment" ON public.payment_requests;
DROP POLICY IF EXISTS "Admin manage payments" ON public.payment_requests;

CREATE POLICY "Users insert own payment"
  ON public.payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own payment"
  ON public.payment_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin manage payments (uses has_role instead of raw_user_meta_data)
CREATE POLICY "Admin manage payments"
  ON public.payment_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

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
DROP POLICY IF EXISTS "Users can view own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can update own watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can delete own watch history" ON public.watch_history;

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
DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can add to own watchlist" ON public.watchlist;
DROP POLICY IF EXISTS "Users can remove from own watchlist" ON public.watchlist;

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

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
