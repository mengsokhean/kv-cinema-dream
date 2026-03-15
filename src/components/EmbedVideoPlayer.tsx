import { AspectRatio } from "@/components/ui/aspect-ratio";

interface EmbedVideoPlayerProps {
  src: string;
  title?: string;
}

type VideoSource = "youtube" | "vimeo" | "googledrive" | "dailymotion" | "facebook" | "direct" | "unknown";

const detectSource = (url: string): VideoSource => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  if (url.includes("drive.google.com")) return "googledrive";
  if (url.includes("dailymotion.com") || url.includes("dai.ly")) return "dailymotion";
  if (url.includes("facebook.com/watch") || url.includes("facebook.com/video") || url.includes("fb.watch")) return "facebook";
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return "direct";
  return "unknown";
};

const getYouTubeEmbedUrl = (url: string): string => {
  // Already embed URL
  if (url.includes("youtube.com/embed/")) return url;
  // Standard: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // Short: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return url;
};

const getVimeoEmbedUrl = (url: string): string => {
  if (url.includes("player.vimeo.com/video/")) return url;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const getGoogleDriveEmbedUrl = (url: string): string => {
  if (url.includes("/preview")) return url;
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  const openMatch = url.match(/[?&]id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  return url;
};

const getDailymotionEmbedUrl = (url: string): string => {
  if (url.includes("dailymotion.com/embed/video/")) return url;
  // Standard: dailymotion.com/video/VIDEO_ID
  const videoMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (videoMatch) return `https://www.dailymotion.com/embed/video/${videoMatch[1]}`;
  // Short: dai.ly/VIDEO_ID
  const shortMatch = url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
  if (shortMatch) return `https://www.dailymotion.com/embed/video/${shortMatch[1]}`;
  return url;
};

const getFacebookEmbedUrl = (url: string): string => {
  if (url.includes("facebook.com/plugins/video.php")) return url;
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
};

/** Check if URL is an embeddable video */
export const isEmbedUrl = (url: string): boolean => {
  const source = detectSource(url);
  return source !== "unknown";
};

const EmbedVideoPlayer = ({ src, title = "Video player" }: EmbedVideoPlayerProps) => {
  const source = detectSource(src);

  // Direct video file (.mp4, .webm, etc.)
  if (source === "direct") {
    return (
      <div className="w-full rounded-lg overflow-hidden bg-card">
        <AspectRatio ratio={16 / 9}>
          <video src={src} className="w-full h-full" controls controlsList="nodownload" />
        </AspectRatio>
      </div>
    );
  }

  // Get embed URL based on source
  let embedUrl = src;
  if (source === "youtube") {
    embedUrl = getYouTubeEmbedUrl(src);
  } else if (source === "vimeo") {
    embedUrl = getVimeoEmbedUrl(src);
  } else if (source === "googledrive") {
    embedUrl = getGoogleDriveEmbedUrl(src);
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
