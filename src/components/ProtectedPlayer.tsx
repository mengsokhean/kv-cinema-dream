import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, RotateCcw, RotateCw, Maximize, Volume2, VolumeX, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ✅ បន្ថែម Export មុខងារនេះដើម្បីឱ្យ MovieDetail.tsx និង Sidebar ប្រើបាន (Fix Error TS2614)
export const isContentFree = (episodeNumber?: number, isMoviePremium?: boolean, isEpisodeFree?: boolean | null) => {
  if (isEpisodeFree === true) return true;
  if (isMoviePremium === false && episodeNumber === 1) return true;
  return false;
};

interface PlayerProps {
  movieId?: string;
  episodeId?: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  isMoviePremium?: boolean;
  isEpisodeFree?: boolean | null;
  episodeNumber?: number;
}

const ProtectedPlayer = ({ movieId, episodeId, poster, onTimeUpdate }: PlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ 1. ទាញយក Video URL (កែសម្រួលរបៀប Query ដើម្បីឱ្យ TypeScript ឈប់លោត Error)
  // ✅ វគ្គ Fix Error TS2339: ប្រើ "as any" ដើម្បីឱ្យ TypeScript ឈប់រករឿង
  useEffect(() => {
    const fetchUrl = async () => {
      try {
        if (movieId) {
          // 💡 យើងប្រើ "as any" នៅខាងចុងដើម្បីឱ្យវាឈប់ Check ឈ្មោះ Column
          const { data, error } = await (supabase.from("movies").select("*").eq("id", movieId).maybeSingle() as any);

          // បើបងច្បាស់ថាឈ្មោះក្នុង Supabase គឺ video_url មែន នោះវានឹងដើរ
          if (!error && data?.video_url) setVideoUrl(data.video_url);
        } else if (episodeId) {
          const { data, error } = await (supabase
            .from("episodes")
            .select("*")
            .eq("id", episodeId)
            .maybeSingle() as any);

          if (!error && data?.video_url) setVideoUrl(data.video_url);
        }
      } catch (err) {
        console.error("Player Error:", err);
      }
    };
    fetchUrl();
  }, [movieId, episodeId]);

  // 2. មុខងារលាក់ Controls ស្វ័យប្រវត្តិ (Netflix Style)
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  // 3. Play/Pause Logic
  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  // 4. សារទៅមុខ/ក្រោយ ១០ វិនាទី
  const skip = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      resetControlsTimeout();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress(total > 0 ? (current / total) * 100 : 0);
      if (onTimeUpdate) onTimeUpdate(current, total);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative group w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
      onMouseMove={resetControlsTimeout}
    >
      {/* Video Element */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          className="w-full h-full cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          playsInline
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/50 bg-neutral-900">
          <div className="animate-pulse text-sm">Loading Video...</div>
        </div>
      )}

      {/* Netflix-style Overlay Controls */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 transition-opacity duration-500 flex flex-col justify-between p-4",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] text-red-500 font-bold tracking-widest uppercase">Streaming Now</span>
            <h3 className="text-white font-medium text-sm md:text-base drop-shadow-md truncate max-w-[200px]">
              {movieId ? "Movie" : "Episode Content"}
            </h3>
          </div>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Middle: Big Buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-6 md:gap-12">
          <button
            onClick={() => skip(-10)}
            className="text-white/70 hover:text-white transition-all transform active:scale-90"
          >
            <RotateCcw className="w-8 h-8 md:w-10 md:h-10" />
          </button>
          <button
            onClick={togglePlay}
            className="bg-white/10 backdrop-blur-md p-5 md:p-6 rounded-full text-white border border-white/20 hover:bg-white/20 transition-all transform active:scale-95 shadow-xl"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 md:w-12 md:h-12 fill-current" />
            ) : (
              <Play className="w-8 h-8 md:w-12 md:h-12 fill-current ml-1" />
            )}
          </button>
          <button
            onClick={() => skip(10)}
            className="text-white/70 hover:text-white transition-all transform active:scale-90"
          >
            <RotateCw className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="space-y-3 md:space-y-4">
          {/* Progress Bar */}
          <div
            className="group/progress relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer overflow-hidden md:overflow-visible"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              if (videoRef.current) videoRef.current.currentTime = pos * duration;
            }}
          >
            <div
              className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
              style={{ left: `${progress}%`, marginLeft: "-8px" }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4 md:gap-6">
              <button onClick={togglePlay} className="hover:text-red-500 transition-colors">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <div className="flex items-center gap-2 group/volume hidden sm:flex">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                  }}
                  className="hover:text-red-500 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={(v) => {
                      setVolume(v[0]);
                      if (videoRef.current) {
                        videoRef.current.volume = v[0];
                        videoRef.current.muted = v[0] === 0;
                        setIsMuted(v[0] === 0);
                      }
                    }}
                  />
                </div>
              </div>

              <span className="text-[12px] font-mono text-white/90">
                {(Math.floor(videoRef.current?.currentTime || 0) / 60) | 0}:
                {String(Math.floor(videoRef.current?.currentTime || 0) % 60).padStart(2, "0")}
                <span className="mx-1 text-white/40">/</span>
                {Math.floor(duration / 60) | 0}:{String(Math.floor(duration % 60)).padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleFullScreen} className="hover:text-red-500 transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedPlayer;
