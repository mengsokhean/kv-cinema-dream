
-- Admin function to list pending payment requests with receipt
CREATE OR REPLACE FUNCTION public.admin_list_payment_requests()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  email text,
  amount numeric,
  receipt_url text,
  status text,
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
  SELECT pr.id, pr.user_id, p.full_name, p.email, pr.amount, pr.receipt_url, pr.status, pr.created_at
  FROM public.payment_requests pr
  LEFT JOIN public.profiles p ON p.id = pr.user_id
  ORDER BY pr.created_at DESC;
END;
$$;

-- Admin function to approve a payment request and activate premium
CREATE OR REPLACE FUNCTION public.admin_approve_payment_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.payment_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;

  UPDATE public.payment_requests SET status = 'approved' WHERE id = p_request_id;

  UPDATE public.profiles SET is_premium = true, subscription_expiry = now() + interval '30 days'
  WHERE id = v_user_id;
END;
$$;
