import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ContinueWatching = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: items } = useQuery({
    queryKey: ["continue-watching", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select("movie_id, episode_id, progress_seconds, duration_seconds, updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;

      // Filter out completed items (>95%) and items with no real progress
      const inProgress = data.filter(
        (d) => d.duration_seconds > 0 && d.progress_seconds / d.duration_seconds > 0.02 && d.progress_seconds / d.duration_seconds < 0.95
      );
      if (!inProgress.length) return [];

      // Fetch movie details
      const movieIds = [...new Set(inProgress.map((d) => d.movie_id))];
      const { data: movies } = await supabase
        .from("movies")
        .select("id, title, thumbnail, is_series")
        .in("id", movieIds);

      // Fetch episode titles if needed
      const episodeIds = inProgress.filter((d) => d.episode_id).map((d) => d.episode_id!);
      let episodeMap: Record<string, { title: string; episode_number: number }> = {};
      if (episodeIds.length) {
        const { data: eps } = await supabase
          .from("episodes")
          .select("id, title, episode_number")
          .in("id", episodeIds);
        if (eps) {
          episodeMap = Object.fromEntries(eps.map((e) => [e.id, { title: e.title, episode_number: e.episode_number }]));
        }
      }

      const movieMap = Object.fromEntries((movies || []).map((m) => [m.id, m]));

      return inProgress.map((item) => ({
        ...item,
        movie: movieMap[item.movie_id],
        episode: item.episode_id ? episodeMap[item.episode_id] : null,
        percent: Math.round((item.progress_seconds / item.duration_seconds) * 100),
      }));
    },
    refetchOnWindowFocus: true,
  });

  if (!user || !items || items.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl tracking-wide mb-5">Continue Watching</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <button
            key={`${item.movie_id}-${item.episode_id || "main"}`}
            onClick={() => navigate(`/movie/${item.movie_id}`)}
            className="shrink-0 w-56 rounded-lg overflow-hidden bg-card border border-border hover:border-gold/30 transition-all duration-200 text-left group"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={item.movie?.thumbnail || "/placeholder.svg"}
                alt={item.movie?.title || ""}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                  <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm font-semibold truncate text-foreground">
                {item.movie?.title || "Unknown"}
              </p>
              {item.episode && (
                <p className="text-xs text-muted-foreground truncate">
                  Ep {item.episode.episode_number}. {item.episode.title}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Progress value={item.percent} className="h-1 flex-1" />
                <span className="text-[10px] text-muted-foreground shrink-0">{item.percent}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ContinueWatching;
