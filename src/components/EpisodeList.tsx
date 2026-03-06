import { Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

interface EpisodeListProps {
  episodes: Tables<"episodes">[];
  currentEpisodeId?: string;
  isPremium: boolean;
  isLoggedIn: boolean;
  onSelect: (episode: Tables<"episodes">) => void;
}

const EpisodeList = ({ episodes, currentEpisodeId, isPremium, isLoggedIn, onSelect }: EpisodeListProps) => {
  const sorted = [...episodes].sort((a, b) => a.episode_number - b.episode_number);

  return (
    <div className="mt-8">
      <h3 className="font-display text-2xl tracking-wide mb-4">Episodes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((ep) => {
          const canPlay = ep.is_free || isPremium;
          const isActive = ep.id === currentEpisodeId;

          return (
            <button
              key={ep.id}
              onClick={() => onSelect(ep)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border text-left transition-all duration-200",
                isActive
                  ? "border-gold/50 bg-gold/10"
                  : "border-border bg-card hover:border-gold/30 hover:bg-card/80"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  canPlay ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
                )}
              >
                {canPlay ? (
                  <Play className="h-4 w-4 ml-0.5" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate text-foreground">
                  Ep {ep.episode_number}. {ep.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canPlay ? "Available" : !isLoggedIn ? "Sign up to watch" : "Premium only"}
                </p>
              </div>
              {!ep.is_free && (
                <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-semibold shrink-0">
                  Premium
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EpisodeList;
