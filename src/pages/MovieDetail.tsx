import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import ProtectedPlayer from "@/components/ProtectedPlayer";
import EpisodeSidebar from "@/components/EpisodeSidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Film, Bookmark, Crown, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { isContentFree } from "@/components/ProtectedPlayer";

const MovieDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toggle, isInWatchlist } = useWatchlist();
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";
  const [activeEpisode, setActiveEpisode] = useState<Tables<"episodes"> | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const { trackProgress } = useWatchProgress(id, activeEpisode?.id);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: episodes } = useQuery({
    queryKey: ["episodes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes").select("*").eq("movie_id", id!)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!movie?.is_series,
  });

  useEffect(() => {
    if (episodes && episodes.length > 0 && !activeEpisode) {
      setActiveEpisode(episodes[0]);
    }
  }, [episodes, activeEpisode]);

  // Block dev tools
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

  const handleEpisodeSelect = useCallback((episode: Tables<"episodes">) => {
    setActiveEpisode(episode);
    setVideoEnded(false);
  }, []);

  const nextEpisode = episodes && activeEpisode
    ? episodes.find(e => e.episode_number === activeEpisode.episode_number + 1)
    : null;

  const handleNextEpisode = useCallback(() => {
    if (nextEpisode) {
      const canPlay = isContentFree(nextEpisode.episode_number, undefined, nextEpisode.is_free) || isPremium;
      if (canPlay) {
        setActiveEpisode(nextEpisode);
        setVideoEnded(false);
      }
    }
  }, [nextEpisode, isPremium]);

  const handleTimeUpdate = useCallback((t: number, d: number) => {
    trackProgress(t, d);
    if (d > 0 && t >= d - 0.5) {
      setVideoEnded(true);
    }
  }, [trackProgress]);

  // Render the main player area
  const renderPlayer = () => {
    if (!movie) return null;

    // Series with active episode
    if (movie.is_series && activeEpisode) {
      return (
        <div className="relative">
          <ProtectedPlayer
            src={activeEpisode.video_url}
            poster={movie.thumbnail || undefined}
            episodeNumber={activeEpisode.episode_number}
            isEpisodeFree={activeEpisode.is_free}
            onTimeUpdate={handleTimeUpdate}
          />
          {/* Next Episode overlay */}
          {videoEnded && nextEpisode && (isContentFree(nextEpisode.episode_number, undefined, nextEpisode.is_free) || isPremium) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{t.upNext}</p>
                <p className="font-display text-lg mb-4">
                  EP {nextEpisode.episode_number}. {nextEpisode.title}
                </p>
                <Button
                  className="gradient-gold text-primary-foreground font-semibold gap-2"
                  onClick={handleNextEpisode}
                >
                  <SkipForward className="h-4 w-4" /> {t.playNextEpisode}
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Non-series: trailer or video
    if (!movie.is_series) {
      if (movie.video_url) {
        return (
          <ProtectedPlayer
            src={movie.video_url}
            poster={movie.thumbnail || undefined}
            isMoviePremium={movie.is_premium_required}
            onTimeUpdate={handleTimeUpdate}
          />
        );
      }
      if (movie.trailer_url) {
        return (
          <div>
            <SecureVideoPlayer
              src={movie.trailer_url}
              poster={movie.thumbnail || undefined}
              watermarkText={watermark}
              onTimeUpdate={handleTimeUpdate}
            />
            {movie.is_premium_required && !isPremium && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t.watchingTrailer}
              </p>
            )}
          </div>
        );
      }
    }

    return (
      <ProtectedPlayer src={null} poster={movie.thumbnail || undefined} isMoviePremium={true} />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="flex-1 aspect-video rounded-lg" />
            <Skeleton className="w-72 h-[400px] rounded-lg hidden lg:block" />
          </div>
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
          <h1 className="font-display text-3xl">{t.movieNotFound}</h1>
        </div>
      </div>
    );
  }

  const isSeries = movie.is_series && episodes && episodes.length > 0;

  return (
    <div className={`min-h-screen ${isKhmer ? "font-khmer" : ""}`}>
      <Navbar />
      <div className="container mx-auto px-4 pt-20 max-w-7xl pb-16">

        {/* === iQIYI-Style Layout: Player + Episode Sidebar === */}
        <div className={cn("flex gap-4", isSeries ? "flex-col lg:flex-row" : "")}>

          {/* Left: Video Player */}
          <div className={cn("flex-1 min-w-0", isSeries ? "" : "max-w-5xl mx-auto w-full")}>
            {renderPlayer()}

            {/* Episode number indicator for series */}
            {isSeries && activeEpisode && (
              <div className="flex items-center gap-3 mt-3 px-1">
                <span className="text-xs font-semibold bg-gold/15 text-gold px-2.5 py-1 rounded-md">
                  EP {activeEpisode.episode_number}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {activeEpisode.title}
                </span>
                {!isContentFree(activeEpisode.episode_number, undefined, activeEpisode.is_free) && (
                  <span className="flex items-center gap-1 text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded font-semibold ml-auto shrink-0">
                    <Crown className="h-3 w-3" /> VIP
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Episode Sidebar (series only) */}
          {isSeries && (
            <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:h-auto" style={{ maxHeight: "calc(56.25vw * 0.65)" }}>
              <div className="lg:sticky lg:top-20 h-full lg:max-h-[70vh]">
                <EpisodeSidebar
                  episodes={episodes!}
                  currentEpisodeId={activeEpisode?.id}
                  isPremium={isPremium}
                  onSelect={handleEpisodeSelect}
                  movieTitle={movie.title}
                />
              </div>
            </div>
          )}
        </div>

        {/* === Movie Info Section (Below Player) === */}
        <div className="mt-8 space-y-5">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-3xl md:text-4xl tracking-wide">{movie.title}</h1>
                {movie.is_premium_required && (
                  <span className="flex items-center gap-1 text-xs gradient-gold text-primary-foreground px-3 py-1 rounded-full font-bold">
                    <Crown className="h-3 w-3" /> PREMIUM
                  </span>
                )}
                {movie.is_series && (
                  <span className="text-xs bg-gold/15 text-gold px-2.5 py-1 rounded-full font-semibold">
                    {t.series}
                  </span>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {movie.release_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {movie.release_year}
                  </span>
                )}
                {movie.genre && (
                  <span className="flex items-center gap-1">
                    <Film className="h-3.5 w-3.5" /> {movie.genre}
                  </span>
                )}
                {movie.rating && (
                  <span className="flex items-center gap-1 text-gold">
                    <Star className="h-3.5 w-3.5 fill-current" /> {movie.rating}/10
                  </span>
                )}
                {isSeries && (
                  <span className="text-xs">{episodes!.length} {t.episodes}</span>
                )}
              </div>
            </div>

            {/* Watchlist button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "shrink-0 gap-1.5 mt-1",
                user && isInWatchlist(movie.id) && "border-gold/50 bg-gold/10 text-gold"
              )}
              onClick={() => {
                if (!user) {
                  toast.error(t.signInWatchlist);
                  return;
                }
                toggle(movie.id);
              }}
            >
              <Bookmark className={cn("h-4 w-4", user && isInWatchlist(movie.id) && "fill-current")} />
              {user && isInWatchlist(movie.id) ? t.saved : t.watchlist}
            </Button>
          </div>

          {/* Description */}
          {movie.description && (
            <p className="text-foreground/80 leading-relaxed max-w-3xl text-sm md:text-base">
              {movie.description}
            </p>
          )}

          {/* Trailer section for premium movies when user is premium */}
          {!movie.is_series && movie.is_premium_required && movie.trailer_url && isPremium && (
            <div className="mt-6">
              <h3 className="font-display text-xl mb-3 text-muted-foreground">{t.trailer}</h3>
              <div className="max-w-3xl">
                <SecureVideoPlayer
                  src={movie.trailer_url}
                  poster={movie.thumbnail || undefined}
                  watermarkText={watermark}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MovieDetail;
