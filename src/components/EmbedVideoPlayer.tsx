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
  if (url.includes("facebook.com/watch") || url.includes("facebook.com/video") || url.includes("fb.watch"))
    return "facebook";
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return "direct";
  return "unknown";
};

const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = "";

  // ប្រើ RegExp ដើម្បីទាញយក ID ១១ខ្ទង់ ពីគ្រប់ទម្រង់ Link YouTube (ទោះមាន ?si=... ក៏ដោយ)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    videoId = match[2];
  }

  if (videoId) {
    // បន្ថែម parameters ដើម្បីលាក់ Logo និងវីដេអូដែលមិនពាក់ព័ន្ធ
    return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1`;
  }

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
  const videoMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (videoMatch) return `https://www.dailymotion.com/embed/video/${videoMatch[1]}`;
  const shortMatch = url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
  if (shortMatch) return `https://www.dailymotion.com/embed/video/${shortMatch[1]}`;
  return url;
};

const getFacebookEmbedUrl = (url: string): string => {
  if (url.includes("facebook.com/plugins/video.php")) return url;
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
};

export const isEmbedUrl = (url: string): boolean => {
  const source = detectSource(url);
  return source !== "unknown";
};

const EmbedVideoPlayer = ({ src, title = "Video player" }: EmbedVideoPlayerProps) => {
  const source = detectSource(src);

  if (source === "direct") {
    return (
      <div className="w-full rounded-lg overflow-hidden bg-card">
        <AspectRatio ratio={16 / 9}>
          <video src={src} className="w-full h-full" controls controlsList="nodownload" />
        </AspectRatio>
      </div>
    );
  }

  let embedUrl = src;
  if (source === "youtube") {
    embedUrl = getYouTubeEmbedUrl(src);
  } else if (source === "vimeo") {
    embedUrl = getVimeoEmbedUrl(src);
  } else if (source === "googledrive") {
    embedUrl = getGoogleDriveEmbedUrl(src);
  } else if (source === "dailymotion") {
    embedUrl = getDailymotionEmbedUrl(src);
  } else if (source === "facebook") {
    embedUrl = getFacebookEmbedUrl(src);
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-card">
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </AspectRatio>
    </div>
  );
};

export default EmbedVideoPlayer;
