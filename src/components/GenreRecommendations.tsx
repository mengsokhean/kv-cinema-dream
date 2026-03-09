import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MovieCard from "./MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const GenreRecommendations = () => {
  const { data: genres } = useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("genre")
        .not("genre", "is", null);
      if (error) throw error;
      const unique = [...new Set(data.map((m) => m.genre).filter(Boolean))] as string[];
      return unique.sort();
    },
  });

  if (!genres || genres.length === 0) return null;

  return (
    <div className="space-y-10">
      {genres.map((genre) => (
        <GenreRow key={genre} genre={genre} />
      ))}
    </div>
  );
};

const GenreRow = ({ genre }: { genre: string }) => {
  const { data: movies, isLoading } = useQuery({
    queryKey: ["genre-movies", genre],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("genre", genre)
        .order("rating", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  if (!isLoading && (!movies || movies.length === 0)) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl tracking-wide">{genre}</h2>
        <Link
          to={`/movies?genre=${encodeURIComponent(genre)}`}
          className="flex items-center gap-1 text-sm text-gold hover:underline shrink-0"
        >
          See All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-40">
                <Skeleton className="aspect-[2/3] rounded-lg" />
              </div>
            ))
          : movies?.map((movie) => (
              <div key={movie.id} className="shrink-0 w-40">
                <MovieCard movie={movie} />
              </div>
            ))}
      </div>
    </section>
  );
};

export default GenreRecommendations;
