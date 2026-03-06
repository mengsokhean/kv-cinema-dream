import { useEffect, useRef } from "react";

interface SecureVideoPlayerProps {
  src: string;
  poster?: string;
  watermarkText?: string;
}

const SecureVideoPlayer = ({ src, poster, watermarkText }: SecureVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: Event) => e.preventDefault();
    const el = containerRef.current;
    el?.addEventListener("contextmenu", handleContextMenu);
    return () => el?.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-lg overflow-hidden bg-card select-none">
      <video
        className="w-full h-full"
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        poster={poster}
        onContextMenu={(e) => e.preventDefault()}
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
