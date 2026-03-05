import { useEffect, useRef } from "react";

interface SecureVideoPlayerProps {
  src: string;
  poster?: string;
}

const SecureVideoPlayer = ({ src, poster }: SecureVideoPlayerProps) => {
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
    </div>
  );
};

export default SecureVideoPlayer;
