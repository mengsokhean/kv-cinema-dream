
-- Security definer function to get user's subscription_expiry without triggering RLS
CREATE OR REPLACE FUNCTION public.get_subscription_expiry(_user_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subscription_expiry FROM public.profiles WHERE id = _user_id
$$;

-- Drop the problematic UPDATE policy
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- Recreate without self-referencing subquery
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_admin = false
  AND is_premium = false
  AND NOT (subscription_expiry IS DISTINCT FROM public.get_subscription_expiry(auth.uid()))
);
