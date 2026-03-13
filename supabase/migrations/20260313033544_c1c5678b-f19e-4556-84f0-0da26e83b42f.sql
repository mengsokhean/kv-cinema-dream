
-- Remove the trigger since pg_net is not available
DROP TRIGGER IF EXISTS trg_notify_telegram_payment_request ON public.payment_requests;
DROP FUNCTION IF EXISTS public.notify_telegram_on_payment_request();
