-- Fix handle_new_user search_path
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';

-- Fix handle_manual_approval search_path
ALTER FUNCTION public.handle_manual_approval() SET search_path = 'public';