
-- Create a trigger function that calls the telegram-notify edge function via pg_net
CREATE OR REPLACE FUNCTION public.notify_telegram_on_payment_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
  payload jsonb;
BEGIN
  edge_function_url := current_setting('app.settings.supabase_url', true) 
    || '/functions/v1/telegram-notify';
  
  -- Build the webhook-style payload
  payload := jsonb_build_object(
    'type', 'INSERT',
    'record', row_to_json(NEW)::jsonb
  );

  -- Use pg_net to make async HTTP call
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger on payment_requests INSERT
DROP TRIGGER IF EXISTS trg_notify_telegram_payment_request ON public.payment_requests;
CREATE TRIGGER trg_notify_telegram_payment_request
  AFTER INSERT ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram_on_payment_request();
