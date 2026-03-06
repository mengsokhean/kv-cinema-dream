import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import Navbar from "@/components/Navbar";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import ProtectedPlayer from "@/components/ProtectedPlayer";
import EpisodeList from "@/components/EpisodeList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Film, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { isContentFree } from "@/components/ProtectedPlayer";

const MovieDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toggle, isInWatchlist } = useWatchlist();
  const [activeEpisode, setActiveEpisode] = useState<Tables<"episodes"> | null>(null);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: episodes } = useQuery({
    queryKey: ["episodes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("movie_id", id!)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!movie?.is_series,
  });

  // Auto-select first episode when episodes load
  useEffect(() => {
    if (episodes && episodes.length > 0 && !activeEpisode) {
      setActiveEpisode(episodes[0]);
    }
  }, [episodes, activeEpisode]);

  // Block dev tools on this page
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === "F12") e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.key === "u") e.preventDefault();
    };
    const blockContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", blockContext);
    return () => {
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", blockContext);
    };
  }, []);

  const isPremium = !!profile?.is_premium;
  const watermark = user?.email || user?.id || undefined;

  const handleEpisodeSelect = (episode: Tables<"episodes">) => {
    setActiveEpisode(episode);
  };

  // Determine what to show in the main player
  const renderPlayer = () => {
    if (!movie) return null;

    // Series logic
    if (movie.is_series && activeEpisode) {
      return (
        <ProtectedPlayer
          src={activeEpisode.video_url}
          poster={movie.thumbnail || undefined}
          episodeNumber={activeEpisode.episode_number}
          onTimeUpdate={(t, d) => trackProgress(t, d)}
        />
      );
    }

    // Non-series: trailer always accessible
    if (movie.trailer_url && !movie.is_premium_required) {
      return (
        <SecureVideoPlayer
          src={movie.trailer_url}
          poster={movie.thumbnail || undefined}
          watermarkText={watermark}
        />
      );
    }

    // Non-series premium movie: use ProtectedPlayer for full video
    if (movie.video_url) {
      return (
        <ProtectedPlayer
          src={movie.video_url}
          poster={movie.thumbnail || undefined}
          isMoviePremium={movie.is_premium_required}
        />
      );
    }

    // Trailer for premium movie (show trailer freely, full content locked)
    if (movie.trailer_url) {
      return (
        <div>
          <SecureVideoPlayer
            src={movie.trailer_url}
            poster={movie.thumbnail || undefined}
            watermarkText={watermark}
          />
          {movie.is_premium_required && !isPremium && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Watching trailer — Subscribe for full access
            </p>
          )}
        </div>
      );
    }

    // No video at all — show locked state
    return (
      <ProtectedPlayer
        src={null}
        poster={movie.thumbnail || undefined}
        isMoviePremium={true}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 space-y-4">
          <Skeleton className="w-full aspect-video rounded-lg" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="font-display text-3xl">Movie not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 max-w-5xl pb-16">
        {renderPlayer()}

        {/* Movie Info */}
        <div className="mt-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-4xl tracking-wide">{movie.title}</h1>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "shrink-0 gap-1.5 mt-1",
                user && isInWatchlist(movie.id) && "border-gold/50 bg-gold/10 text-gold"
              )}
              onClick={() => {
                if (!user) {
                  toast.error("Sign in to save movies to your watchlist");
                  return;
                }
                toggle(movie.id);
              }}
            >
              <Bookmark className={cn("h-4 w-4", user && isInWatchlist(movie.id) && "fill-current")} />
              {user && isInWatchlist(movie.id) ? "Saved" : "Watchlist"}
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {movie.release_year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {movie.release_year}
              </span>
            )}
            {movie.genre && (
              <span className="flex items-center gap-1">
                <Film className="h-4 w-4" /> {movie.genre}
              </span>
            )}
            {movie.rating && (
              <span className="flex items-center gap-1 text-gold">
                <Star className="h-4 w-4 fill-current" /> {movie.rating}/10
              </span>
            )}
            {movie.is_series && (
              <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full font-semibold">
                Series
              </span>
            )}
          </div>
          {movie.description && (
            <p className="text-foreground/80 leading-relaxed max-w-2xl">
              {movie.description}
            </p>
          )}
        </div>

        {/* Episode List for Series */}
        {movie.is_series && episodes && episodes.length > 0 && (
          <EpisodeList
            episodes={episodes}
            currentEpisodeId={activeEpisode?.id}
            isPremium={isPremium}
            isLoggedIn={!!user}
            onSelect={handleEpisodeSelect}
          />
        )}

        {/* Trailer section for premium non-series movies when user is premium */}
        {!movie.is_series &&
          movie.is_premium_required &&
          movie.trailer_url &&
          isPremium && (
            <div className="mt-6">
              <h3 className="font-display text-xl mb-3 text-muted-foreground">
                Trailer
              </h3>
              <SecureVideoPlayer
                src={movie.trailer_url}
                poster={movie.thumbnail || undefined}
                watermarkText={watermark}
              />
            </div>
          )}
      </div>
    </div>
  );
};

export default MovieDetail;
