
-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'aba',
  status TEXT NOT NULL DEFAULT 'pending',
  duration_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only service role (edge functions) can update payments
-- No update policy for regular users

-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Secure function to activate premium after payment
CREATE OR REPLACE FUNCTION public.activate_premium(p_payment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_duration INTEGER;
  v_status TEXT;
BEGIN
  SELECT user_id, duration_days, status
  INTO v_user_id, v_duration, v_status
  FROM public.payments
  WHERE id = p_payment_id;

  IF v_status != 'completed' THEN
    RAISE EXCEPTION 'Payment is not completed';
  END IF;

  UPDATE public.profiles
  SET is_premium = true,
      subscription_expiry = now() + (v_duration || ' days')::interval
  WHERE user_id = v_user_id;
END;
$$;
