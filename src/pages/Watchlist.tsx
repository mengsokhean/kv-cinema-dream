import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Watchlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: movies, isLoading } = useQuery({
    queryKey: ["watchlist-movies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: watchlistItems, error: wErr } = await supabase
        .from("watchlist")
        .select("movie_id")
        .eq("user_id", user!.id);
      if (wErr) throw wErr;
      if (!watchlistItems.length) return [];

      const ids = watchlistItems.map((w) => w.movie_id);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="font-display text-4xl tracking-wide mb-8">
          My Watchlist
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-card animate-pulse" />
            ))}
          </div>
        ) : movies && movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <Bookmark className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <h2 className="font-display text-2xl text-muted-foreground">Your watchlist is empty</h2>
            <p className="text-sm text-muted-foreground/70">Browse movies and tap the bookmark icon to save them here.</p>
            <Button className="gradient-gold text-primary-foreground font-semibold" onClick={() => navigate("/movies")}>
              Browse Movies
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
