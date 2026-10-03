import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { Play } from "lucide-react";
import { socket } from "../../services/socket";

export default function VideoStage({ videoUrl, roomId, isAdmin, onSetVideo }) {
  const [kind, setKind] = useState("none"); // none | youtube | drive | native
  const [embedUrl, setEmbedUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [viewerLocallyPaused, setViewerLocallyPaused] = useState(false);
  // browsers block play() until the page has had a user gesture; when that
  // happens we show a "tap to join" overlay instead of a silently stuck video
  const [needsTap, setNeedsTap] = useState(false);

  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const lastYTApplyAtRef = useRef(0);
  const lastServerStateRef = useRef(null); // { isPlaying, positionSec, at }
  const ytAutoplayCheckRef = useRef(null);

  useEffect(() => {
    setNeedsTap(false);
    lastServerStateRef.current = null;
  }, [videoUrl]);

  useEffect(() => () => clearTimeout(ytAutoplayCheckRef.current), []);

  useEffect(() => {
    if (!videoUrl || !videoUrl.trim()) {
      setKind("none");
      setEmbedUrl("");
      setYoutubeId("");
      setViewerLocallyPaused(false);
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
          setViewerLocallyPaused(false);
          return;
        }
      }

      if (url.includes("drive.google.com")) {
        const match = url.match(/\/d\/(.*?)\//);
        if (match?.[1]) {
          setKind("drive");
          setEmbedUrl(`https://drive.google.com/file/d/${match[1]}/preview`);
          setYoutubeId("");
          setViewerLocallyPaused(false);
          return;
        }
      }

      setKind("native");
      setEmbedUrl(url);
      setYoutubeId("");
      setViewerLocallyPaused(false);
    } catch {
      setKind("native");
      setEmbedUrl(url);
      setYoutubeId("");
      setViewerLocallyPaused(false);
    }
  }, [videoUrl]);

  useEffect(() => {
    const handleVideoState = ({ isPlaying, positionSec }) => {
      const target = Number(positionSec || 0);
      lastServerStateRef.current = {
        isPlaying: Boolean(isPlaying),
        positionSec: target,
        at: Date.now(),
      };
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

        // viewer local pause should not auto-unpause on resync
        if (!isAdmin && viewerLocallyPaused) {
          el.pause();
        } else {
          if (isPlaying) {
            el.play().catch((err) => {
              if (err?.name === "NotAllowedError") setNeedsTap(true);
            });
            if (!isAdmin) setViewerLocallyPaused(false);
          } else {
            el.pause();
          }
        }
      }

      if (kind === "youtube") {
        const p = ytPlayerRef.current;
        if (!p) {
          applyingRemoteRef.current = false;
          return;
        }

        const now = Date.now();
        if (now - lastYTApplyAtRef.current < 1000) {
          setTimeout(() => (applyingRemoteRef.current = false), 0);
          return;
        }

        const YTState = window.YT?.PlayerState || {};
        const playerState = p.getPlayerState ? p.getPlayerState() : -1;
        const current = p.getCurrentTime ? p.getCurrentTime() : 0;
        const drift = Math.abs((current || 0) - target);

        if (drift > 1.0) {
          try {
            p.seekTo(target, true);
          } catch {}
        }

        // viewer local pause should not auto-unpause on resync
        if (!isAdmin && viewerLocallyPaused) {
          if (playerState === YTState.PLAYING) {
            try {
              p.pauseVideo();
            } catch {}
          }
        } else {
          try {
            if (isPlaying && playerState !== YTState.PLAYING) {
              p.playVideo();
              if (!isAdmin) setViewerLocallyPaused(false);

              // YouTube gives no error when autoplay is blocked, so check
              // shortly after whether it actually started
              clearTimeout(ytAutoplayCheckRef.current);
              ytAutoplayCheckRef.current = setTimeout(() => {
                const pl = ytPlayerRef.current;
                const st = pl?.getPlayerState ? pl.getPlayerState() : -1;
                const wanted = lastServerStateRef.current?.isPlaying;
                if (wanted && st !== YTState.PLAYING && st !== YTState.BUFFERING) {
                  setNeedsTap(true);
                }
              }, 1500);
            } else if (!isPlaying && playerState === YTState.PLAYING) {
              p.pauseVideo();
            }
          } catch {}
        }

        lastYTApplyAtRef.current = now;
      }

      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);
    };

    socket.on("video:state", handleVideoState);
    return () => socket.off("video:state", handleVideoState);
  }, [kind, isAdmin, viewerLocallyPaused]);

  const emitState = ({ isPlaying, positionSec }) => {
    if (!roomId || !isAdmin) return;
    if (applyingRemoteRef.current) return;

    socket.emit("video:state:update", {
      roomId,
      isPlaying: Boolean(isPlaying),
      positionSec: Number(positionSec || 0),
    });
  };

  // -------- Native controls --------
  const handleNativePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    setNeedsTap(false);

    if (isAdmin) {
      emitState({ isPlaying: true, positionSec: el.currentTime || 0 });
      return;
    }

    // viewer unpause -> request canonical state and resync
    if (viewerLocallyPaused) {
      socket.emit("video:state:request", { roomId });
      setViewerLocallyPaused(false);
    }
  };

  const handleNativePause = () => {
    const el = videoRef.current;
    if (!el) return;

    if (isAdmin) {
      emitState({ isPlaying: false, positionSec: el.currentTime || 0 });
      return;
    }

    // viewer local pause only
    setViewerLocallyPaused(true);
  };

  const handleNativeSeeked = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!isAdmin) return;
    emitState({ isPlaying: !el.paused, positionSec: el.currentTime || 0 });
  };

  // -------- YouTube controls --------
  const onYouTubeReady = (event) => {
    ytPlayerRef.current = event.target;
    if (roomId) socket.emit("video:state:request", { roomId });
  };

  const onYouTubeStateChange = (event) => {
    const state = event.data;
    const YTState = window.YT?.PlayerState || {};
    if (state === YTState.PLAYING) setNeedsTap(false);

    if (applyingRemoteRef.current) return;

    const p = event.target;
    const pos = p.getCurrentTime ? p.getCurrentTime() : 0;

    if (isAdmin) {
      if (state === YTState.PLAYING) {
        emitState({ isPlaying: true, positionSec: pos });
      } else if (state === YTState.PAUSED) {
        emitState({ isPlaying: false, positionSec: pos });
      }
      return;
    }

    // Viewer behavior: local pause allowed, unpause triggers resync
    if (state === YTState.PAUSED) {
      setViewerLocallyPaused(true);
    } else if (state === YTState.PLAYING && viewerLocallyPaused) {
      socket.emit("video:state:request", { roomId });
      setViewerLocallyPaused(false);
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

  // Runs inside the tap, so the browser allows playback. Jump to where the
  // room is now first, and keep the admin's player from echoing that jump back.
  const joinPlayback = () => {
    const last = lastServerStateRef.current;
    const target = last
      ? last.positionSec + (last.isPlaying ? (Date.now() - last.at) / 1000 : 0)
      : 0;

    applyingRemoteRef.current = true;
    try {
      if (kind === "native" && videoRef.current) {
        videoRef.current.currentTime = target;
        videoRef.current.play().catch(() => {});
      } else if (kind === "youtube" && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(target, true);
        ytPlayerRef.current.playVideo();
      }
    } catch {}
    setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 1000);

    setNeedsTap(false);
    setViewerLocallyPaused(false);
    socket.emit("video:state:request", { roomId });
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
      {kind === "none" ? (
        <div className="mx-auto flex max-w-sm flex-col items-center px-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-line text-muted">
            <Play size={20} />
          </div>
          <h2 className="mt-6 font-display text-3xl tracking-tight">
            Nothing playing yet
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {isAdmin
              ? "Paste a YouTube, Drive or direct video link to start the room."
              : "Waiting for the admin to pick a video."}
          </p>
          {isAdmin && onSetVideo ? (
            <button
              onClick={onSetVideo}
              className="eyebrow mt-8 text-accent transition-colors hover:text-fg"
            >
              Set video →
            </button>
          ) : null}
        </div>
      ) : kind === "youtube" ? (
        <YouTube
          videoId={youtubeId}
          className="h-full w-full"
          iframeClassName="h-full w-full"
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 0,
              controls: 1, // everyone gets controls
              disablekb: 0, // everyone gets keyboard controls
              fs: 1, // everyone can fullscreen
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
          className="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title="drive-player"
        />
      ) : (
        <video
          ref={videoRef}
          src={embedUrl}
          controls={true} // everyone gets controls incl fullscreen
          className="h-full w-full"
          onPlay={handleNativePlay}
          onPause={handleNativePause}
          onSeeked={handleNativeSeeked}
        />
      )}

      {needsTap && (kind === "youtube" || kind === "native") && (
        <button
          onClick={joinPlayback}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-bg/80 px-6 text-center backdrop-blur-sm"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full border border-accent text-accent">
            <Play size={20} />
          </span>
          <span className="font-display text-2xl tracking-tight sm:text-3xl">
            The room is playing
          </span>
          <span className="eyebrow text-accent">Tap to join in</span>
        </button>
      )}

      {!isAdmin && viewerLocallyPaused && kind !== "none" && (
        <div className="eyebrow pointer-events-none absolute left-4 top-4 rounded border border-line bg-bg/80 px-3 py-2 text-muted backdrop-blur-sm">
          Paused for you · resyncs when you resume
        </div>
      )}
    </div>
  );
}
