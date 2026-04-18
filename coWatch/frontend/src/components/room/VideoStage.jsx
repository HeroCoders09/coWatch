import { useEffect, useState } from "react";

export default function VideoStage({ videoUrl }) {
  const [embedUrl, setEmbedUrl] = useState("");

  useEffect(() => {
    if (!videoUrl) return;

    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let videoId = "";

      if (videoUrl.includes("youtu.be")) {
        videoId = videoUrl.split("/").pop();
      } else if (videoUrl.includes("/live/")) {
        videoId = videoUrl.split("/live/")[1].split("?")[0];
      } else {
        const params = new URL(videoUrl).searchParams;
        videoId = params.get("v");
      }

      setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
    } else if (videoUrl.includes("drive.google.com")) {
      const match = videoUrl.match(/\/d\/(.*?)\//);
      if (match) {
        setEmbedUrl(`https://drive.google.com/file/d/${match[1]}/preview`);
      }
    } else {
      setEmbedUrl(videoUrl);
    }
  }, [videoUrl]);

  return (
    <div className="h-[70vh] flex items-center justify-center bg-black rounded-xl">
      {!embedUrl ? (
        <p className="text-white/50">No video selected</p>
      ) : embedUrl.includes("youtube") || embedUrl.includes("drive") ? (
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-xl"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <video
          src={embedUrl}
          controls
          className="w-full h-full rounded-xl"
        />
      )}
    </div>
  );
}