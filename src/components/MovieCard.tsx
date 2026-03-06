import { useNavigate } from "react-router-dom";
import { Crown, Play, Star, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

interface MovieCardProps {
  movie: Tables<"movies">;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggle, isInWatchlist } = useWatchlist();
  const saved = user ? isInWatchlist(movie.id) : false;

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save movies to your watchlist");
      navigate("/auth");
      return;
    }
    toggle(movie.id);
  };

  return (
    <div
      className="group relative rounded-lg overflow-hidden cursor-pointer bg-card border border-border transition-all duration-300 hover:border-gold/30 hover:shadow-[0_0_30px_-10px_hsl(45_100%_51%/0.2)]"
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={movie.thumbnail || "/placeholder.svg"}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <div className="w-full">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center">
              <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        className={cn(
          "absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 z-10",
          saved
            ? "bg-gold/90 text-primary-foreground"
            : "bg-background/60 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-gold/20 hover:text-gold"
        )}
        title={saved ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      </button>

      {/* Premium badge */}
      {movie.is_premium_required && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] gradient-gold text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
          <Crown className="h-2.5 w-2.5" /> Premium
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate text-foreground">{movie.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {movie.release_year && <span>{movie.release_year}</span>}
          {movie.genre && <span>• {movie.genre}</span>}
          {movie.rating && (
            <span className="flex items-center gap-0.5 text-gold">
              <Star className="h-3 w-3 fill-current" /> {movie.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
