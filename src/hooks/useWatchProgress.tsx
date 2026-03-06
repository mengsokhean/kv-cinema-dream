import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook that saves viewing progress to the database.
 * Call `trackProgress` periodically from a video's `onTimeUpdate` event.
 */
export const useWatchProgress = (movieId?: string, episodeId?: string | null) => {
  const { user } = useAuth();
  const lastSavedRef = useRef(0);

  const trackProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!user || !movieId || !duration || duration <= 0) return;
      // Only save every 10 seconds to avoid excessive writes
      if (Math.abs(currentTime - lastSavedRef.current) < 10) return;
      lastSavedRef.current = currentTime;

      supabase
        .from("watch_history")
        .upsert(
          {
            user_id: user.id,
            movie_id: movieId,
            episode_id: episodeId || null,
            progress_seconds: Math.floor(currentTime),
            duration_seconds: Math.floor(duration),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,movie_id,episode_id" }
        )
        .then(() => {});
    },
    [user, movieId, episodeId]
  );

  return { trackProgress };
};
