import { AspectRatio } from "@/components/ui/aspect-ratio";

interface YouTubePlayerProps {
  src: string;
  title?: string;
}

const YouTubePlayer = ({ src, title = "Video player" }: YouTubePlayerProps) => {
  // Convert various YouTube URL formats to embed format
  const getEmbedUrl = (url: string): string => {
    // Already an embed URL
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
    
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    
    // Short URL: youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(src);

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

export default YouTubePlayer;
