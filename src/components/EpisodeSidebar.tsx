import { useState } from "react";
import { Lock, Crown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { isContentFree } from "@/components/ProtectedPlayer";
import PremiumModal from "@/components/PremiumModal";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Episode metadata without sensitive video_url */
type EpisodeMeta = {
  id: string;
  movie_id: string | null;
  title: string | null;
  episode_number: number;
  is_free: boolean | null;
  created_at: string | null;
};

interface EpisodeSidebarProps {
  episodes: EpisodeMeta[];
  currentEpisodeId?: string;
  isPremium: boolean;
  onSelect: (episode: EpisodeMeta) => void;
  movieTitle?: string;
}

type Tab = "episodes" | "highlights";

const EpisodeSidebar = ({ episodes, currentEpisodeId, isPremium, onSelect, movieTitle }: EpisodeSidebarProps) => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("episodes");
  const sorted = [...episodes].sort((a, b) => a.episode_number - b.episode_number);

  const handleClick = (ep: EpisodeMeta) => {
    const free = isContentFree(ep.episode_number, undefined, ep.is_free);
    if (free || isPremium) {
      onSelect(ep);
    } else {
      setShowModal(true);
    }
  };

  const activeEp = sorted.find(ep => ep.id === currentEpisodeId);

  return (
    <>
      <div className="flex flex-col h-full bg-[hsl(var(--surface))] border border-border rounded-xl overflow-hidden">
        {/* Tabs Header */}
        <div className="flex items-center border-b border-border">
          <button
            onClick={() => setActiveTab("episodes")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold tracking-wide transition-colors relative",
              activeTab === "episodes"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            Episodes
            {activeTab === "episodes" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[hsl(var(--ep-active))] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("highlights")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold tracking-wide transition-colors relative",
              activeTab === "highlights"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            Highlights
            {activeTab === "highlights" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[hsl(var(--ep-active))] rounded-full" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === "episodes" ? (
          <>
            {/* Now Playing indicator */}
            {activeEp && (
              <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
                <Play className="h-3 w-3 text-[hsl(var(--ep-active))] fill-current shrink-0" />
                <span className="text-xs text-muted-foreground">Now playing:</span>
                <span className="text-xs font-medium text-foreground truncate">
                  EP {activeEp.episode_number} · {activeEp.title}
                </span>
              </div>
            )}

            {/* Episode Number Grid */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                <p className="text-[11px] text-muted-foreground mb-3 font-medium">
                  {movieTitle} · {sorted.length} episodes
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {sorted.map((ep) => {
                    const canPlay = isContentFree(ep.episode_number, undefined, ep.is_free) || isPremium;
                    const isActive = ep.id === currentEpisodeId;

                    return (
                      <button
                        key={ep.id}
                        onClick={() => handleClick(ep)}
                        className={cn(
                          "relative aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-150",
                          isActive
                            ? "bg-[hsl(var(--ep-active))] text-[hsl(var(--background))] shadow-[0_0_12px_hsl(var(--ep-active)/0.4)]"
                            : canPlay
                              ? "bg-[hsl(var(--surface-hover))] text-foreground hover:bg-[hsl(var(--muted))] hover:scale-105"
                              : "bg-[hsl(var(--surface-hover))] text-muted-foreground hover:bg-[hsl(var(--muted))]"
                        )}
                        title={ep.title}
                      >
                        {ep.episode_number}

                        {/* VIP badge */}
                        {!canPlay && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-gold text-[7px] font-black text-[hsl(var(--background))]">
                            <Lock className="h-2.5 w-2.5" />
                          </span>
                        )}

                        {/* Active playing indicator dot */}
                        {isActive && (
                          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[hsl(var(--background))]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border/50 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {sorted.filter(e => isContentFree(e.episode_number, undefined, e.is_free)).length} free · {sorted.filter(e => !isContentFree(e.episode_number, undefined, e.is_free)).length} VIP
              </span>
              {!isPremium && sorted.some(e => !isContentFree(e.episode_number, undefined, e.is_free)) && (
                <button
                  onClick={() => setShowModal(true)}
                  className="text-[10px] font-bold text-[hsl(var(--ep-active))] hover:underline flex items-center gap-1"
                >
                  <Crown className="h-3 w-3" /> Unlock All
                </button>
              )}
            </div>
          </>
        ) : (
          /* Highlights Tab */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Play className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No highlights yet</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Best moments will appear here
              </p>
            </div>
          </div>
        )}
      </div>
      <PremiumModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default EpisodeSidebar;
