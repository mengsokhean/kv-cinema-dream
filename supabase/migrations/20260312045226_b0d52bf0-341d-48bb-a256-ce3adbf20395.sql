
-- Drop the existing protect_profile_columns trigger if it exists
DROP TRIGGER IF EXISTS protect_profile_columns_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_columns();

-- Create a stricter trigger that raises an exception
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Allow service-role / SECURITY DEFINER context (postgres, supabase_admin)
  -- These are used by handle_manual_approval, admin_approve_payment_request, etc.
  IF current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Block any attempt to change is_premium or is_admin
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'Cannot modify is_premium directly. Use the payment approval flow.';
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'Cannot modify is_admin directly.';
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach as BEFORE UPDATE trigger
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
