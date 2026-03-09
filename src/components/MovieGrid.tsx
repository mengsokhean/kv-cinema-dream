import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Movie } from "@/types/database";
import MovieCard from "./MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface MovieGridProps {
  title?: string;
  genre?: string;
  featured?: boolean;
  limit?: number;
  search?: string;
}

const MovieGrid = ({ title, genre, featured, limit, search }: MovieGridProps) => {
  const { t } = useLanguage();

  const { data: movies, isLoading } = useQuery({
    queryKey: ["movies", genre, featured, limit, search],
    queryFn: async () => {
      let q = supabase.from("movies").select("*").order("created_at", { ascending: false });
      if (genre) q = q.eq("genre", genre);
      if (featured) q = q.eq("is_featured", true);
      if (search) q = q.ilike("title", `%${search}%`);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Movie[];
    },
  });

  return (
    <section className="py-10">
      {title && (
        <h2 className="font-display text-3xl tracking-wide mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: limit || 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          : movies?.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
      {!isLoading && (!movies || movies.length === 0) && (
        <p className="text-center text-muted-foreground py-12">{t.noMoviesFound}</p>
      )}
    </section>
  );
};

export default MovieGrid;
