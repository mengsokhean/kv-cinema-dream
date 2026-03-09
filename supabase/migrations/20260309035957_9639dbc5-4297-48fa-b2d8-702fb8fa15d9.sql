
CREATE OR REPLACE FUNCTION public.admin_reject_payment_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  UPDATE public.payment_requests SET status = 'rejected' WHERE id = p_request_id AND status = 'pending';
END;
$$;
