import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import PremiumModal from "@/components/PremiumModal";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedPlayerProps {
  src: string | null | undefined;
  poster?: string;
  episodeNumber?: number;
  isMoviePremium?: boolean;
}

/** Returns true if content is free to play */
const isContentFree = (episodeNumber?: number, isMoviePremium?: boolean) => {
  // Standalone premium movie
  if (isMoviePremium && episodeNumber === undefined) return false;
  // Episode-based: episodes 1-3 are free
  if (episodeNumber !== undefined) return episodeNumber <= 3;
  // Non-premium standalone movie
  return true;
};

const ProtectedPlayer = ({ src, poster, episodeNumber, isMoviePremium }: ProtectedPlayerProps) => {
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isPremiumUser = !!profile?.is_premium;
  const free = isContentFree(episodeNumber, isMoviePremium);
  const canPlay = free || isPremiumUser;

  if (!canPlay || !src) {
    return (
      <>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-background/80" />
          {poster && (
            <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <div className="relative text-center p-8">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-gold" />
            </div>
            <h3 className="font-display text-2xl tracking-wide mb-2">Premium Content</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              {episodeNumber !== undefined
                ? `Episode ${episodeNumber} is available exclusively for premium members.`
                : "This movie is available exclusively for premium members."}
            </p>
            <Button
              className="gradient-gold text-primary-foreground font-semibold gap-2"
              onClick={() => setShowModal(true)}
            >
              <Crown className="h-4 w-4" /> Upgrade to Premium
            </Button>
          </div>
        </div>
        <PremiumModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <SecureVideoPlayer
      src={src}
      poster={poster}
      watermarkText={user?.email || user?.id || undefined}
    />
  );
};

export { isContentFree };
export default ProtectedPlayer;
