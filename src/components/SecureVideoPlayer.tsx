import { useEffect, useRef, useState } from "react";

interface SecureVideoPlayerProps {
  src: string;
  poster?: string;
  watermarkText?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

const SecureVideoPlayer = ({ src, poster, watermarkText, onTimeUpdate }: SecureVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watermarkPos, setWatermarkPos] = useState({ x: 20, y: 20 });

  // ✅ Block right click
  useEffect(() => {
    const handleContextMenu = (e: Event) => e.preventDefault();
    const el = containerRef.current;
    el?.addEventListener("contextmenu", handleContextMenu);
    return () => el?.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // ✅ Block keyboard shortcuts (F12, Ctrl+S, Ctrl+U, Ctrl+Shift+I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.shiftKey && e.key === "C")
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ✅ Block drag video
  useEffect(() => {
    const handleDragStart = (e: Event) => e.preventDefault();
    const video = videoRef.current;
    video?.addEventListener("dragstart", handleDragStart);
    return () => video?.removeEventListener("dragstart", handleDragStart);
  }, []);

  // ✅ Watermark moves randomly every 3 seconds
  useEffect(() => {
    if (!watermarkText) return;
    const interval = setInterval(() => {
      setWatermarkPos({
        x: Math.random() * 70 + 5,
        y: Math.random() * 70 + 5,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [watermarkText]);

  // ✅ Track video time
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && onTimeUpdate) {
      onTimeUpdate(video.currentTime, video.duration);
    }
  };

  // ✅ Pause when tab is hidden (prevent screen recording tricks)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-card select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* ✅ Transparent overlay blocks right-click save on video */}
      <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }} />

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        disableRemotePlayback
        poster={poster}
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        style={{ pointerEvents: "auto" }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* ✅ Moving watermark — hard to remove */}
      {watermarkText && (
        <div
          className="absolute z-20 pointer-events-none transition-all duration-1000"
          style={{
            left: `${watermarkPos.x}%`,
            top: `${watermarkPos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="text-white/20 text-xs font-mono select-none whitespace-nowrap"
            style={{
              textShadow: "0 0 4px rgba(0,0,0,0.5)",
              transform: "rotate(-15deg)",
            }}
          >
            {watermarkText}
          </div>
        </div>
      )}

      {/* ✅ Second watermark bottom right — always visible */}
      {watermarkText && (
        <div className="absolute bottom-10 right-4 z-20 pointer-events-none">
          <div className="text-white/15 text-xs font-mono select-none">{watermarkText}</div>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
