
-- Create payment_requests table
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own payment requests"
  ON public.payment_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can insert own payment requests"
  ON public.payment_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all payment requests"
  ON public.payment_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Allow authenticated users to upload to receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts');

-- Allow public read access to receipts
CREATE POLICY "Public read access to receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');
