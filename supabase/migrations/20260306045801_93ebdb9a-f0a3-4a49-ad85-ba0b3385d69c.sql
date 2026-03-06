CREATE POLICY "Users can delete own watch history"
  ON public.watch_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);