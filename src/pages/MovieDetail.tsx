import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import PayToWatchOverlay from "@/components/PayToWatchOverlay";
import EpisodeList from "@/components/EpisodeList";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Film } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const MovieDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // For non-series premium movies: redirect non-premium users
  useEffect(() => {
    if (
      !isLoading &&
      movie &&
      !movie.is_series &&
      movie.is_premium_required &&
      !profile?.is_premium
    ) {
      // Still allow viewing the page if there's a trailer
      if (!movie.trailer_url) {
        toast({
          title: "Premium Required",
          description: "You need an active subscription to watch this movie.",
          variant: "destructive",
        });
        navigate("/pricing", { replace: true });
      }
    }
  }, [isLoading, movie, profile, navigate, toast]);

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
  const isLoggedIn = !!user;
  const watermark = user?.email || user?.id || undefined;

  const handleEpisodeSelect = (episode: Tables<"episodes">) => {
    const canPlay = episode.is_free || isPremium;
    if (!canPlay) {
      if (!isLoggedIn) {
        toast({
          title: "Sign Up Required",
          description: "Create an account and subscribe to watch premium episodes.",
          variant: "destructive",
        });
        navigate("/auth");
      } else {
        toast({
          title: "Premium Required",
          description: "Upgrade your subscription to watch this episode.",
          variant: "destructive",
        });
        navigate("/pricing");
      }
      return;
    }
    setActiveEpisode(episode);
  };

  // Determine what to show in the main player
  const getPlayerContent = () => {
    // Series logic
    if (movie?.is_series && activeEpisode) {
      const canPlayEpisode = activeEpisode.is_free || isPremium;
      if (canPlayEpisode && activeEpisode.video_url) {
        return { type: "video" as const, src: activeEpisode.video_url };
      }
      return { type: "locked" as const };
    }

    // Non-series logic
    if (!movie) return { type: "locked" as const };

    // Trailers are always accessible
    if (movie.trailer_url && (!movie.is_premium_required || !movie.video_url)) {
      return { type: "video" as const, src: movie.trailer_url };
    }

    // Premium check for full movie
    if (movie.video_url && (!movie.is_premium_required || isPremium)) {
      return { type: "video" as const, src: movie.video_url };
    }

    // Show trailer if available for premium content
    if (movie.trailer_url) {
      return { type: "trailer" as const, src: movie.trailer_url };
    }

    return { type: "locked" as const };
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

  const playerContent = getPlayerContent();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 max-w-5xl pb-16">
        {/* Main Video Player */}
        {playerContent.type === "video" ? (
          <SecureVideoPlayer
            src={playerContent.src}
            poster={movie.thumbnail || undefined}
            watermarkText={watermark}
          />
        ) : playerContent.type === "trailer" ? (
          <div>
            <SecureVideoPlayer
              src={playerContent.src}
              poster={movie.thumbnail || undefined}
              watermarkText={watermark}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Watching trailer — Subscribe for full access
            </p>
          </div>
        ) : (
          <PayToWatchOverlay />
        )}

        {/* Movie Info */}
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-4xl tracking-wide">{movie.title}</h1>
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
            isLoggedIn={isLoggedIn}
            onSelect={handleEpisodeSelect}
          />
        )}

        {/* Trailer section for premium non-series movies */}
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
