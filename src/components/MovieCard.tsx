import { useNavigate } from "react-router-dom";
import { Crown, Play, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface MovieCardProps {
  movie: Tables<"movies">;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const navigate = useNavigate();

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
