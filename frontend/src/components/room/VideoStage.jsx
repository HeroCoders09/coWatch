import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { Play } from "lucide-react";
import { socket } from "../../services/socket";

// ---- Google Drive ----------------------------------------------------------
// Drive's /preview iframe is a cross-origin player we can't control, so it can
// never be synced. Instead we stream the file into a normal <video> element.
// If VITE_DRIVE_API_KEY is set we use the official Drive API (most reliable);
// otherwise the public download endpoint. If neither works the player falls
// back to the iframe (watchable, but not synced).
const DRIVE_API_KEY = import.meta.env.VITE_DRIVE_API_KEY;

function extractDriveId(url) {
  if (!url || !url.includes("drive.google.com")) return "";
  const m = url.match(/\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  return m?.[1] || "";
}

const driveStreamUrl = (id) =>
  DRIVE_API_KEY
    ? `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${DRIVE_API_KEY}`
    : `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

// Pulls the video id out of the YouTube link shapes people actually paste:
// watch?v=, youtu.be/, /shorts/, /embed/, /live/, music.youtube.com, m.youtube.com.
// (A start time like &t=90 is ignored on purpose: the room's shared position decides where playback starts.)
function extractYouTubeId(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return "";
  }
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  const parts = u.pathname.split("/").filter(Boolean);

  let id = "";
  if (host === "youtu.be") {
    id = parts[0] || "";
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") id = u.searchParams.get("v") || "";
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) id = parts[1] || "";
  }
  // YouTube ids are always 11 characters
  return /^[\w-]{11}$/.test(id) ? id : "";
}

const drivePreviewUrl = (id) => `https://drive.google.com/file/d/${id}/preview`;

export default function VideoStage({
  videoUrl,
  roomId,
  isAdmin,
  canControl,
  onSetVideo,
}) {
  // Who drives playback: the admin, or everyone while the admin has shared control.
  // Everyone else follows the room (and may pause locally).
  const canDrive = Boolean(canControl ?? isAdmin);

  const [kind, setKind] = useState("none"); // none | youtube | drive | native
  const [embedUrl, setEmbedUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [viewerLocallyPaused, setViewerLocallyPaused] = useState(false);
  // browsers block play() until the page has had a user gesture; when that
  // happens we show a "tap to join" overlay instead of a silently stuck video
  const [needsTap, setNeedsTap] = useState(false);
  // the Drive URL that failed to stream; for that URL we use the iframe instead
  const [driveFailedFor, setDriveFailedFor] = useState("");

  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const lastYTApplyAtRef = useRef(0);
  const lastServerStateRef = useRef(null); // { isPlaying, positionSec, at }
  const ytAutoplayCheckRef = useRef(null);

  // The pause flag drives sync decisions, so it lives in a ref: handlers that
  // run between a state change and the next render must not see a stale value.
  // (The useState copy is only for the "Paused for you" pill.)
  const locallyPausedRef = useRef(false);
  const setLocalPause = (v) => {
    locallyPausedRef.current = v;
    setViewerLocallyPaused(v);
  };

  // When *we* pause/play the player to follow the room, the player fires its
  // own pause/play event a moment later. That event must not be mistaken for
  // the viewer pressing pause, so programmatic changes open a short window
  // in which viewer pause/play events are ignored.
  const ignoreMediaEventsUntilRef = useRef(0);
  const markProgrammatic = () => {
    ignoreMediaEventsUntilRef.current = Date.now() + 800;
  };
  const isProgrammatic = () => Date.now() < ignoreMediaEventsUntilRef.current;

  useEffect(() => {
    setNeedsTap(false);
    lastServerStateRef.current = null;
  }, [videoUrl]);

  useEffect(() => () => clearTimeout(ytAutoplayCheckRef.current), []);

  // switching between follower and controller starts from a clean slate
  useEffect(() => {
    setLocalPause(false);
  }, [canDrive]);

  useEffect(() => {
    if (!videoUrl || !videoUrl.trim()) {
      setKind("none");
      setEmbedUrl("");
      setYoutubeId("");
      setLocalPause(false);
      return;
    }

    const url = videoUrl.trim();

    try {
      const ytId = extractYouTubeId(url);
      if (ytId) {
        setKind("youtube");
        setYoutubeId(ytId);
        setEmbedUrl("");
        setLocalPause(false);
        return;
      }

      const driveId = extractDriveId(url);
      if (driveId) {
        if (driveFailedFor === videoUrl) {
          setKind("drive");
          setEmbedUrl(drivePreviewUrl(driveId));
        } else {
          setKind("native");
          setEmbedUrl(driveStreamUrl(driveId));
        }
        setYoutubeId("");
        setLocalPause(false);
        return;
      }

      setKind("native");
      setEmbedUrl(url);
      setYoutubeId("");
      setLocalPause(false);
    } catch {
      setKind("native");
      setEmbedUrl(url);
      setYoutubeId("");
      setLocalPause(false);
    }
  }, [videoUrl, driveFailedFor]);

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
          markProgrammatic();
          try {
            el.currentTime = target;
          } catch {
            /* the player may not be ready yet; the next state update retries */
          }
        }

        // viewer local pause should not auto-unpause on resync
        if (!canDrive && locallyPausedRef.current) {
          if (!el.paused) el.pause();
        } else if (isPlaying) {
          if (el.paused) {
            markProgrammatic();
            el.play().catch((err) => {
              if (err?.name === "NotAllowedError") setNeedsTap(true);
            });
          }
        } else if (!el.paused) {
          markProgrammatic();
          el.pause();
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
          markProgrammatic();
          try {
            p.seekTo(target, true);
          } catch {
            /* the player may not be ready yet; the next state update retries */
          }
        }

        // viewer local pause should not auto-unpause on resync
        if (!canDrive && locallyPausedRef.current) {
          if (playerState === YTState.PLAYING) {
            try {
              p.pauseVideo();
            } catch {
            /* the player may not be ready yet; the next state update retries */
          }
          }
        } else {
          try {
            if (isPlaying && playerState !== YTState.PLAYING) {
              markProgrammatic();
              p.playVideo();

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
              markProgrammatic();
              p.pauseVideo();
            }
          } catch {
            /* the player may not be ready yet; the next state update retries */
          }
        }

        lastYTApplyAtRef.current = now;
      }

      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);
    };

    socket.on("video:state", handleVideoState);
    return () => socket.off("video:state", handleVideoState);
  }, [kind, canDrive]);

  const emitState = ({ isPlaying, positionSec }) => {
    if (!roomId || !canDrive) return;
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

    if (canDrive) {
      // our own play() to follow the room must not be echoed back to everyone
      if (isProgrammatic()) return;
      emitState({ isPlaying: true, positionSec: el.currentTime || 0 });
      return;
    }

    // our own play() to follow the room is not the viewer pressing play
    if (isProgrammatic()) return;

    // viewer unpause -> request canonical state and resync
    if (locallyPausedRef.current) {
      socket.emit("video:state:request", { roomId });
      setLocalPause(false);
    }
  };

  const handleNativePause = () => {
    const el = videoRef.current;
    if (!el) return;

    if (canDrive) {
      if (isProgrammatic()) return;
      emitState({ isPlaying: false, positionSec: el.currentTime || 0 });
      return;
    }

    // pause caused by following the room is not a viewer pause
    if (isProgrammatic()) return;

    // viewer local pause only
    setLocalPause(true);
  };

  // a Drive file that can't be streamed (private, too large, quota hit,
  // unsupported format) drops back to the iframe preview
  const handleNativeError = () => {
    if (extractDriveId(videoUrl) && driveFailedFor !== videoUrl) {
      setDriveFailedFor(videoUrl);
    }
  };

  const handleNativeEnded = () => {
    const el = videoRef.current;
    if (!el || !canDrive || isProgrammatic()) return;
    emitState({ isPlaying: false, positionSec: el.currentTime || 0 });
  };

  const handleNativeSeeked = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!canDrive || isProgrammatic()) return;
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

    if (canDrive) {
      if (isProgrammatic()) return;
      if (state === YTState.PLAYING) {
        emitState({ isPlaying: true, positionSec: pos });
      } else if (state === YTState.PAUSED || state === YTState.ENDED) {
        // ENDED counts as paused at the end, otherwise the room's clock keeps
        // running past the end of the video
        emitState({ isPlaying: false, positionSec: pos });
      }
      return;
    }

    // our own pause/play to follow the room is not the viewer's doing
    if (isProgrammatic()) return;

    // Viewer behavior: local pause allowed, unpause triggers resync
    if (state === YTState.PAUSED) {
      setLocalPause(true);
    } else if (state === YTState.PLAYING && locallyPausedRef.current) {
      socket.emit("video:state:request", { roomId });
      setLocalPause(false);
    }
  };

  // YouTube seek detection for whoever can control playback
  useEffect(() => {
    if (kind !== "youtube" || !canDrive) return;

    let prev = 0;
    const id = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p) return;

      const current = p.getCurrentTime ? p.getCurrentTime() : 0;
      // a jump we caused ourselves (following the room) is not a user seek
      if (applyingRemoteRef.current || isProgrammatic()) {
        prev = current;
        return;
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, canDrive]);

  // Viewer asks to catch up with the room: drop any local pause and ask the
  // server for the current position (the normal state handler then applies it).
  const syncNow = () => {
    lastYTApplyAtRef.current = 0; // let the YouTube throttle through
    setLocalPause(false);
    socket.emit("video:state:request", { roomId });
  };

  // Runs inside the tap, so the browser allows playback. Jump to where the
  // room is now first, and keep the admin's player from echoing that jump back.
  const joinPlayback = () => {
    const last = lastServerStateRef.current;
    const target = last
      ? last.positionSec + (last.isPlaying ? (Date.now() - last.at) / 1000 : 0)
      : 0;

    applyingRemoteRef.current = true;
    markProgrammatic();
    try {
      if (kind === "native" && videoRef.current) {
        videoRef.current.currentTime = target;
        videoRef.current.play().catch(() => {});
      } else if (kind === "youtube" && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(target, true);
        ytPlayerRef.current.playVideo();
      }
    } catch {
            /* the player may not be ready yet; the next state update retries */
          }
    setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 1000);

    setNeedsTap(false);
    setLocalPause(false);
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
          onEnded={handleNativeEnded}
          onError={handleNativeError}
          playsInline
          preload="metadata"
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

      {kind === "drive" && (
        <div className="eyebrow pointer-events-none absolute left-4 top-4 rounded border border-line bg-bg/80 px-3 py-2 text-muted backdrop-blur-sm">
          Drive couldn&apos;t stream this file · playback isn&apos;t synced
        </div>
      )}

      {!isAdmin && (kind === "youtube" || kind === "native") && !needsTap && (
        <button
          onClick={syncNow}
          className="eyebrow absolute right-4 top-4 z-[5] rounded border border-line bg-bg/80 px-3 py-2 text-muted backdrop-blur-sm transition-colors hover:text-accent"
        >
          Sync with room
        </button>
      )}

      {!canDrive && viewerLocallyPaused && kind !== "none" && (
        <div className="eyebrow pointer-events-none absolute left-4 top-4 rounded border border-line bg-bg/80 px-3 py-2 text-muted backdrop-blur-sm">
          Paused for you · resyncs when you resume
        </div>
      )}
    </div>
  );
}
