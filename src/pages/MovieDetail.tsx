import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import PayToWatchOverlay from "@/components/PayToWatchOverlay";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Film } from "lucide-react";

const MovieDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Redirect non-premium users from premium movies
  useEffect(() => {
    if (!isLoading && movie?.is_premium_required && !profile?.is_premium) {
      toast({
        title: "Premium Required",
        description: "You need an active subscription to watch this movie.",
        variant: "destructive",
      });
      navigate("/pricing", { replace: true });
    }
  }, [isLoading, movie, profile, navigate, toast]);

  // Block dev tools on this page
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") e.preventDefault();
      // Ctrl+Shift+I / Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") e.preventDefault();
      // Ctrl+Shift+J / Cmd+Option+J
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") e.preventDefault();
      // Ctrl+U / Cmd+U (view source)
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

  const canWatch = !movie?.is_premium_required || profile?.is_premium;
  const watermark = user?.email || user?.id || undefined;

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
          <SecureVideoPlayer src={movie.video_url} poster={movie.thumbnail || undefined} watermarkText={watermark} />
        ) : movie.trailer_url && !movie.is_premium_required ? (
          <SecureVideoPlayer src={movie.trailer_url} poster={movie.thumbnail || undefined} watermarkText={watermark} />
        ) : (
          <PayToWatchOverlay />
        )}

        {/* Trailer for premium movies (always show) */}
        {movie.is_premium_required && movie.trailer_url && canWatch && (
          <div className="mt-6">
            <h3 className="font-display text-xl mb-3 text-muted-foreground">Trailer</h3>
            <SecureVideoPlayer src={movie.trailer_url} poster={movie.thumbnail || undefined} watermarkText={watermark} />
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
