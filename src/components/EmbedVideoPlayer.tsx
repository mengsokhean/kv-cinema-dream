import { AspectRatio } from "@/components/ui/aspect-ratio";

interface EmbedVideoPlayerProps {
  src: string;
  title?: string;
}

type VideoSource = "youtube" | "vimeo" | "unknown";

const detectSource = (url: string): VideoSource => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "unknown";
};

const getYouTubeEmbedUrl = (url: string): string => {
  // Already an embed URL
  if (url.includes("youtube.com/embed/")) return url;
  
  // Standard watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  
  // Short URL: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  
  return url;
};

const getVimeoEmbedUrl = (url: string): string => {
  // Already an embed URL
  if (url.includes("player.vimeo.com/video/")) return url;
  
  // Standard URL: vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  
  return url;
};

/** Check if URL is an embeddable video (YouTube or Vimeo) */
export const isEmbedUrl = (url: string): boolean => {
  return detectSource(url) !== "unknown";
};

const EmbedVideoPlayer = ({ src, title = "Video player" }: EmbedVideoPlayerProps) => {
  const source = detectSource(src);
  
  let embedUrl = src;
  if (source === "youtube") {
    embedUrl = getYouTubeEmbedUrl(src);
  } else if (source === "vimeo") {
    embedUrl = getVimeoEmbedUrl(src);
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-card">
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </AspectRatio>
    </div>
  );
};

export default EmbedVideoPlayer;
