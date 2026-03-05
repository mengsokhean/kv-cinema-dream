import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import PayToWatchOverlay from "@/components/PayToWatchOverlay";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Film } from "lucide-react";

const MovieDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();

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

  const canWatch = !movie?.is_premium_required || profile?.is_premium;

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
      <div className="container mx-auto px-4 pt-24 max-w-5xl">
        {/* Video Player or Pay Overlay */}
        {canWatch && movie.video_url ? (
          <SecureVideoPlayer src={movie.video_url} poster={movie.thumbnail || undefined} />
        ) : movie.trailer_url && !movie.is_premium_required ? (
          <SecureVideoPlayer src={movie.trailer_url} poster={movie.thumbnail || undefined} />
        ) : (
          <PayToWatchOverlay />
        )}

        {/* Trailer for premium movies (always show) */}
        {movie.is_premium_required && movie.trailer_url && (
          <div className="mt-6">
            <h3 className="font-display text-xl mb-3 text-muted-foreground">Trailer</h3>
            <SecureVideoPlayer src={movie.trailer_url} poster={movie.thumbnail || undefined} />
          </div>
        )}

        {/* Movie Info */}
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-4xl tracking-wide">{movie.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {movie.release_year && (
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {movie.release_year}</span>
            )}
            {movie.genre && (
              <span className="flex items-center gap-1"><Film className="h-4 w-4" /> {movie.genre}</span>
            )}
            {movie.rating && (
              <span className="flex items-center gap-1 text-gold"><Star className="h-4 w-4 fill-current" /> {movie.rating}/10</span>
            )}
          </div>
          {movie.description && (
            <p className="text-foreground/80 leading-relaxed max-w-2xl">{movie.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
