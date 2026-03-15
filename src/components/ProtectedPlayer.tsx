import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import EmbedVideoPlayer, { isEmbedUrl } from "@/components/EmbedVideoPlayer";
import PremiumModal from "@/components/PremiumModal";
import { Lock, Crown, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedPlayerProps {
  src?: string | null;
  poster?: string;
  episodeId?: string;
  episodeNumber?: number;
  isEpisodeFree?: boolean;
  movieId?: string;
  isMoviePremium?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

// ✅ FIXED: Single clean function — uses is_free flag from database
const isContentFree = (episodeNumber?: number, isMoviePremium?: boolean, isEpisodeFree?: boolean): boolean => {
  // Use is_free flag from database first
  if (isEpisodeFree === true) return true;
  if (isEpisodeFree === false) return false;
  // Fallback for movies
  if (isMoviePremium && episodeNumber === undefined) return false;
  return true;
};

const ProtectedPlayer = ({
  src,
  poster,
  episodeId,
  episodeNumber,
  isEpisodeFree,
  movieId,
  isMoviePremium,
  onTimeUpdate,
}: ProtectedPlayerProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Check both is_premium AND subscription_expiry not expired
  const isPremiumUser =
    !!profile?.is_premium && !!profile?.subscription_expiry && new Date(profile.subscription_expiry) > new Date();

  const free = isContentFree(episodeNumber, isMoviePremium, isEpisodeFree);
  const canPlay = free || isPremiumUser;

  useEffect(() => {
    setVideoUrl(null);
    if (!canPlay) return;

    if (episodeId) {
      setLoading(true);
      supabase.rpc("get_episode_video_url", { episode_id: episodeId }).then(({ data, error }) => {
        if (!error && data) setVideoUrl(data);
        setLoading(false);
      });
      return;
    }

    if (movieId) {
      setLoading(true);
      supabase.rpc("get_movie_video_url", { p_movie_id: movieId }).then(({ data, error }) => {
        if (!error && data) setVideoUrl(data);
        setLoading(false);
      });
      return;
    }

    if (src) setVideoUrl(src);
  }, [episodeId, movieId, src, canPlay]);

  // Not logged in + premium content
  if (!canPlay && !user) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/80" />
        {poster && <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
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

  // Logged in but not premium
  if (!canPlay) {
    return (
      <>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-background/80" />
          {poster && <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
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

  if (loading) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-card flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/80" />
        {poster && <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <p className="relative text-muted-foreground text-sm">No video available yet</p>
      </div>
    );
  }

  if (isEmbedUrl(videoUrl)) {
    return <EmbedVideoPlayer src={videoUrl} />;
  }

  return (
    <SecureVideoPlayer
      src={videoUrl}
      poster={poster}
      watermarkText={user?.email || user?.id || undefined}
      onTimeUpdate={onTimeUpdate}
    />
  );
};

export { isContentFree };
export default ProtectedPlayer;
