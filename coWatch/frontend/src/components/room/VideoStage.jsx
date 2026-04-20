import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { socket } from "../../services/socket";

export default function VideoStage({ videoUrl, roomId, isAdmin }) {
  const [kind, setKind] = useState("none"); // none | youtube | drive | native
  const [embedUrl, setEmbedUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState("");

  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const lastYTApplyAtRef = useRef(0);

  useEffect(() => {
    if (!videoUrl || !videoUrl.trim()) {
      setKind("none");
      setEmbedUrl("");
      setYoutubeId("");
      return;
    }

    const url = videoUrl.trim();

    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let id = "";

        if (url.includes("youtu.be/")) {
          id = url.split("youtu.be/")[1]?.split("?")[0] || "";
        } else if (url.includes("/live/")) {
          id = url.split("/live/")[1]?.split("?")[0] || "";
        } else {
          const params = new URL(url).searchParams;
          id = params.get("v") || "";
        }

        if (id) {
          setKind("youtube");
          setYoutubeId(id);
          setEmbedUrl("");
          return;
        }
      }

      if (url.includes("drive.google.com")) {
        const match = url.match(/\/d\/(.*?)\//);
        if (match?.[1]) {
          setKind("drive");
          setEmbedUrl(`https://drive.google.com/file/d/${match[1]}/preview`);
          setYoutubeId("");
          return;
        }
      }

      setKind("native");
      setEmbedUrl(url);
      setYoutubeId("");
    } catch {
      setKind("native");
      setEmbedUrl(url);
      setYoutubeId("");
    }
  }, [videoUrl]);

  useEffect(() => {
    const handleVideoState = ({ isPlaying, positionSec }) => {
      const target = Number(positionSec || 0);
      applyingRemoteRef.current = true;

      if (kind === "native") {
        const el = videoRef.current;
        if (!el) {
          applyingRemoteRef.current = false;
          return;
        }

        const drift = Math.abs((el.currentTime || 0) - target);
        if (drift > 0.7) {
          try {
            el.currentTime = target;
          } catch {}
        }

        if (isPlaying) el.play().catch(() => {});
        else el.pause();
      }

      if (kind === "youtube") {
        const p = ytPlayerRef.current;
        if (!p) {
          applyingRemoteRef.current = false;
          return;
        }

        const now = Date.now();
        if (now - lastYTApplyAtRef.current < 1500) {
          setTimeout(() => (applyingRemoteRef.current = false), 0);
          return;
        }

        const YTState = window.YT?.PlayerState || {};
        const playerState = p.getPlayerState ? p.getPlayerState() : -1;
        const current = p.getCurrentTime ? p.getCurrentTime() : 0;
        const drift = Math.abs((current || 0) - target);

        // Only seek on meaningful drift
        if (drift > 2.5) {
          try {
            p.seekTo(target, true);
          } catch {}
        }

        // Only transition if needed
        try {
          if (isPlaying && playerState !== YTState.PLAYING) {
            p.playVideo();
          } else if (!isPlaying && playerState === YTState.PLAYING) {
            p.pauseVideo();
          }
        } catch {}

        lastYTApplyAtRef.current = now;
      }

      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);
    };

    socket.on("video:state", handleVideoState);
    return () => socket.off("video:state", handleVideoState);
  }, [kind]);

  const emitState = ({ isPlaying, positionSec }) => {
    if (!roomId || !isAdmin) return;
    if (applyingRemoteRef.current) return;

    socket.emit("video:state:update", {
      roomId,
      isPlaying: Boolean(isPlaying),
      positionSec: Number(positionSec || 0),
    });
  };

  // Native: admin can control, viewers read-only
  const handleNativePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!isAdmin) return;
    emitState({ isPlaying: true, positionSec: el.currentTime || 0 });
  };

  const handleNativePause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!isAdmin) return;
    emitState({ isPlaying: false, positionSec: el.currentTime || 0 });
  };

  const handleNativeSeeked = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!isAdmin) return;
    emitState({ isPlaying: !el.paused, positionSec: el.currentTime || 0 });
  };

  const onYouTubeReady = (event) => {
    ytPlayerRef.current = event.target;
    if (roomId) socket.emit("video:state:request", { roomId });
  };

  const onYouTubeStateChange = (event) => {
    if (!isAdmin) return; // viewers cannot control
    if (applyingRemoteRef.current) return;

    const p = event.target;
    const state = event.data;
    const YTState = window.YT?.PlayerState || {};
    const pos = p.getCurrentTime ? p.getCurrentTime() : 0;

    if (state === YTState.PLAYING) {
      emitState({ isPlaying: true, positionSec: pos });
    } else if (state === YTState.PAUSED) {
      emitState({ isPlaying: false, positionSec: pos });
    }
  };

  // Admin-only YouTube seek detection
  useEffect(() => {
    if (kind !== "youtube" || !isAdmin) return;

    let prev = 0;
    const id = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || applyingRemoteRef.current) return;

      const current = p.getCurrentTime ? p.getCurrentTime() : 0;
      const playing =
        p.getPlayerState && window.YT
          ? p.getPlayerState() === window.YT.PlayerState.PLAYING
          : false;

      if (Math.abs(current - prev) > 2.0) {
        emitState({ isPlaying: playing, positionSec: current });
      }
      prev = current;
    }, 1000);

    return () => clearInterval(id);
  }, [kind, isAdmin]);

  return (
    <div className="h-[70vh] flex items-center justify-center bg-black rounded-xl overflow-hidden">
      {kind === "none" ? (
        <p className="text-white/50">No video selected</p>
      ) : kind === "youtube" ? (
        <YouTube
          videoId={youtubeId}
          className="w-full h-full"
          iframeClassName="w-full h-full rounded-xl"
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 0,
              controls: isAdmin ? 1 : 0, // viewers read-only
              disablekb: isAdmin ? 0 : 1,
              rel: 0,
              modestbranding: 1,
            },
          }}
          onReady={onYouTubeReady}
          onStateChange={onYouTubeStateChange}
        />
      ) : kind === "drive" ? (
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-xl"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="drive-player"
        />
      ) : (
        <video
          ref={videoRef}
          src={embedUrl}
          controls={isAdmin}
          className="w-full h-full rounded-xl"
          onPlay={handleNativePlay}
          onPause={handleNativePause}
          onSeeked={handleNativeSeeked}
        />
      )}
    </div>
  );
}