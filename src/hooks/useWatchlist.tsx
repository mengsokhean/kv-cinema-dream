import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlistIds = [], isLoading } = useQuery({
    queryKey: ["watchlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("movie_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((w) => w.movie_id);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (movieId: string) => {
      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: user!.id, movie_id: movieId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Added to watchlist");
    },
    onError: () => toast.error("Failed to add to watchlist"),
  });

  const removeMutation = useMutation({
    mutationFn: async (movieId: string) => {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user!.id)
        .eq("movie_id", movieId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Removed from watchlist");
    },
    onError: () => toast.error("Failed to remove from watchlist"),
  });

  const toggle = (movieId: string) => {
    if (!user) return;
    if (watchlistIds.includes(movieId)) {
      removeMutation.mutate(movieId);
    } else {
      addMutation.mutate(movieId);
    }
  };

  const isInWatchlist = (movieId: string) => watchlistIds.includes(movieId);

  return { watchlistIds, isLoading, toggle, isInWatchlist };
};
