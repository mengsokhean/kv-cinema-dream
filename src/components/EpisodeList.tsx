import { useState } from "react";
import { Lock, Play, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isContentFree } from "@/components/ProtectedPlayer";
import PremiumModal from "@/components/PremiumModal";
import type { Tables } from "@/integrations/supabase/types";

interface EpisodeListProps {
  episodes: Tables<"episodes">[];
  currentEpisodeId?: string;
  isPremium: boolean;
  isLoggedIn: boolean;
  onSelect: (episode: Tables<"episodes">) => void;
}

const EpisodeList = ({ episodes, currentEpisodeId, isPremium, onSelect }: EpisodeListProps) => {
  const [showModal, setShowModal] = useState(false);
  const sorted = [...episodes].sort((a, b) => a.episode_number - b.episode_number);

  const handleClick = (ep: Tables<"episodes">) => {
    const free = isContentFree(ep.episode_number);
    if (free || isPremium) {
      onSelect(ep);
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="font-display text-2xl tracking-wide mb-4">Episodes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((ep) => {
          const canPlay = isContentFree(ep.episode_number) || isPremium;
          const isActive = ep.id === currentEpisodeId;

          return (
            <button
              key={ep.id}
              onClick={() => handleClick(ep)}
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
                  {canPlay ? "Available" : "Premium only"}
                </p>
              </div>
              {isContentFree(ep.episode_number) ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold shrink-0">
                  Free
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-semibold shrink-0">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              )}
            </button>
          );
        })}
      </div>
      <PremiumModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default EpisodeList;
