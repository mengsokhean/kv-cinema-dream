import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, RotateCcw, RotateCw, Maximize, Volume2, VolumeX, Settings, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  // 1. ទាញយក Video URL ពី Supabase
  useEffect(() => {
    const fetchUrl = async () => {
      let query = supabase.from(movieId ? "movies" : "episodes").select("video_url");
      if (movieId) query = query.eq("id", movieId);
      else if (episodeId) query = query.eq("id", episodeId);

      const { data, error } = await query.single();
      if (!error && data?.video_url) {
        setVideoUrl(data.video_url);
      }
    };
    fetchUrl();
  }, [movieId, episodeId]);

  // 2. មុខងារលាក់ Controls ស្វ័យប្រវត្តិ (ដូច Netflix)
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
      setProgress((current / total) * 100);
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
        <div className="w-full h-full flex items-center justify-center text-white/50">Loading Video...</div>
      )}

      {/* Netflix-style Overlay Controls */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-500 flex flex-col justify-between p-4",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-white font-medium drop-shadow-md">Now Playing</h3>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Middle: Big Play Button */}
        <div className="absolute inset-0 flex items-center justify-center gap-12">
          <button
            onClick={() => skip(-10)}
            className="text-white/80 hover:text-white transition-transform hover:scale-110"
          >
            <RotateCcw className="w-10 h-10" />
          </button>
          <button
            onClick={togglePlay}
            className="bg-white/20 backdrop-blur-md p-6 rounded-full text-white hover:bg-white/30 transition-all"
          >
            {isPlaying ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current" />}
          </button>
          <button
            onClick={() => skip(10)}
            className="text-white/80 hover:text-white transition-transform hover:scale-110"
          >
            <RotateCw className="w-10 h-10" />
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="group/progress relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer">
            <div
              className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: "-8px" }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay}>{isPlaying ? <Pause /> : <Play />}</button>
              <div className="flex items-center gap-2 group/volume">
                <button onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX /> : <Volume2 />}</button>
                <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
                  <Slider defaultValue={[volume]} max={1} step={0.1} onValueChange={(v) => setVolume(v[0])} />
                </div>
              </div>
              <span className="text-sm font-mono">
                {(Math.floor(videoRef.current?.currentTime || 0) / 60) | 0}:
                {String(Math.floor(videoRef.current?.currentTime || 0) % 60).padStart(2, "0")}/{" "}
                {Math.floor(duration / 60) | 0}:{String(Math.floor(duration % 60)).padStart(2, "0")}
              </span>
            </div>
            <button onClick={toggleFullScreen}>
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedPlayer;
