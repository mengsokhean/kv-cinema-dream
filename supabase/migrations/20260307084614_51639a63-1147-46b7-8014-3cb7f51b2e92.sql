
CREATE TRIGGER on_payment_status_change
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_success();
