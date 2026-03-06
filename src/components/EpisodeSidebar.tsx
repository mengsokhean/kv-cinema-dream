import { useState } from "react";
import { Lock, Play, Crown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isContentFree } from "@/components/ProtectedPlayer";
import PremiumModal from "@/components/PremiumModal";
import type { Tables } from "@/integrations/supabase/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EpisodeSidebarProps {
  episodes: Tables<"episodes">[];
  currentEpisodeId?: string;
  isPremium: boolean;
  onSelect: (episode: Tables<"episodes">) => void;
  movieTitle?: string;
}

const EpisodeSidebar = ({ episodes, currentEpisodeId, isPremium, onSelect, movieTitle }: EpisodeSidebarProps) => {
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
    <>
      <div className="flex flex-col h-full bg-card/50 border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-card/80">
          <h3 className="font-display text-sm tracking-wide text-foreground">Episodes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {movieTitle} · {sorted.length} episodes
          </p>
        </div>

        {/* Episode Grid */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            {sorted.map((ep) => {
              const canPlay = isContentFree(ep.episode_number) || isPremium;
              const isActive = ep.id === currentEpisodeId;

              return (
                <button
                  key={ep.id}
                  onClick={() => handleClick(ep)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all duration-150 group",
                    isActive
                      ? "bg-gold/15 border border-gold/30"
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  {/* Episode Number Circle */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                      isActive
                        ? "bg-gold text-primary-foreground"
                        : canPlay
                          ? "bg-muted text-foreground group-hover:bg-gold/20 group-hover:text-gold"
                          : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {canPlay ? ep.episode_number : <Lock className="h-3.5 w-3.5" />}
                  </div>

                  {/* Episode Info */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-xs font-medium truncate",
                      isActive ? "text-gold" : "text-foreground"
                    )}>
                      {ep.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      EP {ep.episode_number}
                    </p>
                  </div>

                  {/* Badge */}
                  {!canPlay ? (
                    <span className="flex items-center gap-0.5 text-[9px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-semibold shrink-0">
                      <Crown className="h-2.5 w-2.5" /> VIP
                    </span>
                  ) : isActive ? (
                    <Play className="h-3.5 w-3.5 text-gold shrink-0 fill-current" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer with episode count badge */}
        <div className="px-4 py-2.5 border-t border-border bg-card/80 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {sorted.filter(e => isContentFree(e.episode_number)).length} free · {sorted.filter(e => !isContentFree(e.episode_number)).length} premium
          </span>
          {!isPremium && sorted.some(e => !isContentFree(e.episode_number)) && (
            <button
              onClick={() => setShowModal(true)}
              className="text-[10px] text-gold font-semibold hover:underline"
            >
              Unlock All →
            </button>
          )}
        </div>
      </div>
      <PremiumModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default EpisodeSidebar;
