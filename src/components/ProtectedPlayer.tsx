import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import EmbedVideoPlayer, { isEmbedUrl } from "@/components/EmbedVideoPlayer";
import PremiumModal from "@/components/PremiumModal";
import { Lock, Crown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedPlayerProps {
  src: string | null | undefined;
  poster?: string;
  episodeNumber?: number;
  isEpisodeFree?: boolean;
  isMoviePremium?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

/** Returns true if content is free to play */
const isContentFree = (episodeNumber?: number, isMoviePremium?: boolean, isEpisodeFree?: boolean) => {
  // Explicit is_free flag from database takes priority
  if (isEpisodeFree === true) return true;
  if (isMoviePremium && episodeNumber === undefined) return false;
  if (episodeNumber !== undefined) return episodeNumber <= 3;
  return true;
};

const ProtectedPlayer = ({ src, poster, episodeNumber, isEpisodeFree, isMoviePremium, onTimeUpdate }: ProtectedPlayerProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const isPremiumUser = !!profile?.is_premium;
  const free = isContentFree(episodeNumber, isMoviePremium, isEpisodeFree);
  const canPlay = free || isPremiumUser;

  // Not logged in + premium content → prompt login
  if (!canPlay && !user) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/80" />
        {poster && (
          <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="relative text-center p-8">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-7 w-7 text-gold" />
          </div>
          <h3 className="font-display text-2xl tracking-wide mb-2">Sign In Required</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Sign in or create an account to watch premium content.
          </p>
          <Button
            className="gradient-gold text-primary-foreground font-semibold gap-2"
            onClick={() => navigate("/auth")}
          >
            <LogIn className="h-4 w-4" /> Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  // Logged in but not premium → show upgrade modal
  if (!canPlay) {
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

  if (!src) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/80" />
        {poster && (
          <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <p className="relative text-muted-foreground text-sm">No video available yet</p>
      </div>
    );
  }

  // Auto-detect YouTube/Vimeo embeds
  if (isEmbedUrl(src)) {
    return <EmbedVideoPlayer src={src} />;
  }

  // Default: use secure video player for direct video files
  return (
    <SecureVideoPlayer
      src={src}
      poster={poster}
      watermarkText={user?.email || user?.id || undefined}
      onTimeUpdate={onTimeUpdate}
    />
  );
};

export { isContentFree };
export default ProtectedPlayer;
