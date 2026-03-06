import { useEffect, useRef } from "react";

interface SecureVideoPlayerProps {
  src: string;
  poster?: string;
  watermarkText?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

const SecureVideoPlayer = ({ src, poster, watermarkText, onTimeUpdate }: SecureVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: Event) => e.preventDefault();
    const el = containerRef.current;
    el?.addEventListener("contextmenu", handleContextMenu);
    return () => el?.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && onTimeUpdate) {
      onTimeUpdate(video.currentTime, video.duration);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-lg overflow-hidden bg-card select-none">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        poster={poster}
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Floating watermark */}
      {watermarkText && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="animate-watermark-drift whitespace-nowrap text-foreground/10 text-sm font-mono select-none">
            {watermarkText}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
