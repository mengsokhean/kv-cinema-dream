
-- Create public bucket for movie thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('movie-thumbnails', 'movie-thumbnails', true);

-- Allow authenticated admins to upload files
CREATE POLICY "Admins can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'movie-thumbnails'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to update files
CREATE POLICY "Admins can update thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'movie-thumbnails'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to delete files
CREATE POLICY "Admins can delete thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'movie-thumbnails'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'movie-thumbnails');
