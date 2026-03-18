import { AspectRatio } from "@/components/ui/aspect-ratio";

interface EmbedVideoPlayerProps {
  src: string;
  title?: string;
}

// បន្ថែម "vadoo" ទៅក្នុង VideoSource Type
type VideoSource = "youtube" | "vimeo" | "googledrive" | "dailymotion" | "facebook" | "vadoo" | "direct" | "unknown";

const detectSource = (url: string): VideoSource => {
  if (!url) return "unknown";
  if (url.includes("vadoo.tv")) return "vadoo";
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
  // ប្រសិនបើជា Link Embed រួចហើយ គ្រាន់តែបន្ថែម Parameters
  if (url.includes("youtube.com/embed/")) {
    const baseUrl = url.split("?")[0];
    return `${baseUrl}?modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1`;
  }

  let videoId = "";
  // ប្រើ Regex ខ្លាំងជាងមុន ដើម្បីចាប់យក ID ១១ខ្ទង់ ទោះមាន ?si=... ក៏ដោយ
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    videoId = match[2];
  }

  if (videoId) {
    // ប្រើ youtube-nocookie.com ដើម្បីការពារការបិទ Embed និងលាក់ Logo
    return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1&fs=1&enablejsapi=1`;
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
          <video
            src={src}
            className="w-full h-full"
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          />
        </AspectRatio>
      </div>
    );
  }

  let embedUrl = src;
  if (source === "vadoo") {
    // សម្រាប់ Vadoo.tv យើងប្រើ Link ដើមដែលបានមកពីកន្លែង Share > Embed
    embedUrl = src;
  } else if (source === "youtube") {
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
    <div className="w-full rounded-lg overflow-hidden bg-card" key={src}>
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          // បន្ថែម Permissions ឱ្យគ្រប់គ្រាន់សម្រាប់គ្រប់ Player
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </AspectRatio>
    </div>
  );
};

export default EmbedVideoPlayer;
