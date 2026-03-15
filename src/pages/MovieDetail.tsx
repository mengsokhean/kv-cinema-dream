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
import ProtectedPlayer from "@/components/ProtectedPlayer";
import EmbedVideoPlayer, { isEmbedUrl } from "@/components/EmbedVideoPlayer";
import EpisodeSidebar from "@/components/EpisodeSidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Film, Bookmark, Crown, SkipForward, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types/database";
import { isContentFree } from "@/components/ProtectedPlayer";

type EpisodeMeta = {
  id: string;
  movie_id: string | null;
  title: string | null;
  episode_number: number;
  is_free: boolean | null;
  created_at: string | null;
};

// ✅ FIX: Track what is currently playing
type PlayMode = "trailer" | "episode";

const MovieDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toggle, isInWatchlist } = useWatchlist();
  const { lang, t } = useLanguage();
  const isKhmer = lang === "kh";
  const [activeEpisode, setActiveEpisode] = useState<EpisodeMeta | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  // ✅ FIX: Default to trailer first
  const [playMode, setPlayMode] = useState<PlayMode>("trailer");
  const { trackProgress } = useWatchProgress(id, activeEpisode?.id);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("movies").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as unknown as Movie;
    },
    enabled: !!id,
  });

  const { data: episodes } = useQuery({
    queryKey: ["episodes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("id, movie_id, title, episode_number, is_free, created_at")
        .eq("movie_id", id!)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!movie?.is_series,
  });

  // ✅ FIX: Don't auto-select episode — show trailer first
  useEffect(() => {
    if (movie) {
      if (movie.trailer_url) {
        // Has trailer → show trailer first
        setPlayMode("trailer");
      } else if (episodes && episodes.length > 0) {
        // No trailer → show first episode
        setPlayMode("episode");
        setActiveEpisode(episodes[0]);
      }
    }
  }, [movie, episodes]);

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

  const isPremium =
    !!profile?.is_premium && !!profile?.subscription_expiry && new Date(profile.subscription_expiry) > new Date();
  const watermark = user?.email || user?.id || undefined;

  const handleEpisodeSelect = useCallback((episode: EpisodeMeta) => {
    setActiveEpisode(episode);
    setPlayMode("episode");
    setVideoEnded(false);
  }, []);

  const nextEpisode =
    episodes && activeEpisode ? episodes.find((e) => e.episode_number === activeEpisode.episode_number + 1) : null;

  const handleNextEpisode = useCallback(() => {
    if (nextEpisode) {
      const canPlay = isContentFree(nextEpisode.episode_number, undefined, nextEpisode.is_free) || isPremium;
      if (canPlay) {
        setActiveEpisode(nextEpisode);
        setPlayMode("episode");
        setVideoEnded(false);
      }
    }
  }, [nextEpisode, isPremium]);

  const handleTimeUpdate = useCallback(
    (t: number, d: number) => {
      trackProgress(t, d);
      if (d > 0 && t >= d - 0.5) {
        setVideoEnded(true);
      }
    },
    [trackProgress],
  );

  // ✅ FIX: Render player based on playMode
  const renderPlayer = () => {
    if (!movie) return null;

    // ✅ Show trailer first if available and in trailer mode
    if (playMode === "trailer" && movie.trailer_url) {
      return (
        <div className="w-full rounded-lg overflow-hidden">
          {isEmbedUrl(movie.trailer_url) ? (
            <EmbedVideoPlayer src={movie.trailer_url} title={movie.title} />
          ) : (
            <video
              src={movie.trailer_url}
              className="w-full aspect-video rounded-lg"
              controls
              controlsList="nodownload"
              poster={movie.thumbnail || undefined}
            />
          )}
        </div>
      );
    }

    // ✅ Series with active episode
    if (movie.is_series && activeEpisode && playMode === "episode") {
      return (
        <div className="relative">
          <ProtectedPlayer
            poster={movie.thumbnail || undefined}
            episodeId={activeEpisode.id}
            episodeNumber={activeEpisode.episode_number}
            isEpisodeFree={activeEpisode.is_free}
            onTimeUpdate={handleTimeUpdate}
          />
          {/* Next Episode overlay */}
          {videoEnded &&
            nextEpisode &&
            (isContentFree(nextEpisode.episode_number, undefined, nextEpisode.is_free) || isPremium) && (
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

    // ✅ Non-series movie — use secure RPC
    if (!movie.is_series) {
      return (
        <ProtectedPlayer
          movieId={movie.id}
          poster={movie.thumbnail || undefined}
          isMoviePremium={movie.is_premium_required}
          onTimeUpdate={handleTimeUpdate}
        />
      );
    }

    // Fallback — no trailer, no episode selected
    if (episodes && episodes.length > 0) {
      return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-4">Select an episode to watch</p>
            <Button
              className="gradient-gold text-primary-foreground font-semibold gap-2"
              onClick={() => handleEpisodeSelect(episodes[0])}
            >
              <Play className="h-4 w-4" /> Watch Episode 1
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No video available yet</p>
      </div>
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
        <div className={cn("flex gap-4", isSeries ? "flex-col lg:flex-row" : "")}>
          {/* Left: Video Player */}
          <div className={cn("flex-1 min-w-0", isSeries ? "" : "max-w-5xl mx-auto w-full")}>
            {renderPlayer()}

            {/* ✅ Trailer/Episode toggle buttons for series */}
            {isSeries && movie.trailer_url && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant={playMode === "trailer" ? "default" : "outline"}
                  className={playMode === "trailer" ? "gradient-gold text-primary-foreground" : ""}
                  onClick={() => setPlayMode("trailer")}
                >
                  🎬 Trailer
                </Button>
                <Button
                  size="sm"
                  variant={playMode === "episode" ? "default" : "outline"}
                  className={playMode === "episode" ? "gradient-gold text-primary-foreground" : ""}
                  onClick={() => {
                    setPlayMode("episode");
                    if (!activeEpisode && episodes && episodes.length > 0) {
                      setActiveEpisode(episodes[0]);
                    }
                  }}
                >
                  ▶ Episodes
                </Button>
              </div>
            )}

            {/* Episode number indicator for series */}
            {isSeries && activeEpisode && playMode === "episode" && (
              <div className="flex items-center gap-3 mt-3 px-1">
                <span className="text-xs font-semibold bg-gold/15 text-gold px-2.5 py-1 rounded-md">
                  EP {activeEpisode.episode_number}
                </span>
                <span className="text-sm font-medium text-foreground truncate">{activeEpisode.title}</span>
                {!isContentFree(activeEpisode.episode_number, undefined, activeEpisode.is_free) && (
                  <span className="flex items-center gap-1 text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded font-semibold ml-auto shrink-0">
                    <Crown className="h-3 w-3" /> VIP
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Episode Sidebar */}
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

        {/* Movie Info */}
        <div className="mt-8 space-y-5">
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
                {isPremium && (
                  <span className="flex items-center gap-1 text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-bold">
                    <Crown className="h-3 w-3" /> VIP Member
                  </span>
                )}
              </div>

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
                  <span className="text-xs">
                    {episodes!.length} {t.episodes}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "shrink-0 gap-1.5 mt-1",
                user && isInWatchlist(movie.id) && "border-gold/50 bg-gold/10 text-gold",
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

          {movie.description && (
            <p className="text-foreground/80 leading-relaxed max-w-3xl text-sm md:text-base">{movie.description}</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MovieDetail;
