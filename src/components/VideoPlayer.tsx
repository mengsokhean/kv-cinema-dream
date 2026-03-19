// File: src/components/VideoPlayer.tsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoType: string;  // 'file', 'youtube', 'gdrive', 'vimeo'
  title?: string;
  thumbnail?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  videoType, 
  title, 
  thumbnail 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Convert Google Drive URL
  const convertGDriveUrl = (url: string): string => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      return `https://drive.google.com/uc?id=${match[1]}&export=download`;
    }
    return url;
  };

  // Convert YouTube URL
  const convertYouTubeUrl = (url: string): string => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0`;
    }
    return url;
  };

  // Convert Vimeo URL
  const convertVimeoUrl = (url: string): string => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return url;
  };

  // Get embed URL based on video type
  const getEmbedUrl = (): string => {
    switch (videoType) {
      case 'gdrive':
        return convertGDriveUrl(videoUrl);
      case 'youtube':
        return convertYouTubeUrl(videoUrl);
      case 'vimeo':
        return convertVimeoUrl(videoUrl);
      default:
        return videoUrl;
    }
  };

  const embedUrl = getEmbedUrl();

  // Render YouTube/Vimeo (iframe)
  if (videoType === 'youtube' || videoType === 'vimeo') {
    return (
      <div 
        className="relative w-full bg-black rounded-lg overflow-hidden" 
        style={{ aspectRatio: '16/9' }}
      >
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={title || 'Video Player'}
        />
      </div>
    );
  }

  // Render Google Drive/Direct file (video element)
  return (
    <div 
      className="relative w-full bg-black rounded-lg overflow-hidden group" 
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={videoRef}
        src={embedUrl}
        poster={thumbnail}
        className="w-full h-full object-contain"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        controls
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;