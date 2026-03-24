import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Loader2 } from "lucide-react";
import { useRoom } from "../context/RoomContext";
import { ParticipantsOverlay } from "./ParticipantsOverlay";
import { cn } from "../utils/cn";

export const VideoPlayer = ({ className }) => {
  const { room, currentUser, updateVideoState, syncVideoTime } = useRoom();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const controlsTimeoutRef = useRef(null);

  const isAdmin = currentUser?.isAdmin;
  const videoState = room?.videoState;
  const videoUrl = room?.videoUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoState) return;

    if (videoState.isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!videoState.isPlaying && !video.paused) {
      video.pause();
    }

    const timeDiff = Math.abs(video.currentTime - videoState.currentTime);
    if (timeDiff > 2) {
      video.currentTime = videoState.currentTime;
    }
  }, [videoState?.isPlaying, videoState?.currentTime, videoState?.lastUpdated]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isAdmin && Math.floor(video.currentTime) % 5 === 0) {
        syncVideoTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [isAdmin, syncVideoTime]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

      if (videoState?.isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    container?.addEventListener("mousemove", handleMouseMove);
    container?.addEventListener("mouseenter", handleMouseMove);

    return () => {
      container?.removeEventListener("mousemove", handleMouseMove);
      container?.removeEventListener("mouseenter", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [videoState?.isPlaying]);

  const togglePlay = () => {
    if (!isAdmin) return;
    updateVideoState({ isPlaying: !videoState?.isPlaying });
  };

  const handleSeek = (e) => {
    if (!isAdmin || !videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    videoRef.current.currentTime = newTime;
    syncVideoTime(newTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const skip = (seconds) => {
    if (!isAdmin || !videoRef.current) return;

    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    syncVideoTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!videoUrl) {
    return (
      <div className={cn("relative aspect-video bg-dark-900 rounded-2xl overflow-hidden flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
            <Play className="w-10 h-10 text-dark-400" />
          </div>
          <p className="text-dark-400 text-lg">
            {isAdmin ? "Upload or select a video to start watching" : "Waiting for admin to start video..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative aspect-video bg-black rounded-2xl overflow-hidden group cursor-pointer", className)} onClick={togglePlay}>
      <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" playsInline />

      <ParticipantsOverlay />

      <AnimatePresence>
        {isBuffering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={cn("w-20 h-20 rounded-full flex items-center justify-center", "bg-white/20 backdrop-blur-sm", !isAdmin && "opacity-50")}
            >
              {videoState?.isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4 pt-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn("h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group/progress", isAdmin ? "hover:h-2.5 transition-all" : "cursor-not-allowed")}
              onClick={handleSeek}
            >
              <div className="h-full bg-linear-to-r from-primary-500 to-secondary-500 rounded-full relative" style={{ width: `${progress}%` }}>
                {isAdmin && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <>
                    <button onClick={() => skip(-10)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <SkipBack className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={togglePlay} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                      {videoState?.isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                    </button>
                    <button onClick={() => skip(10)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <SkipForward className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-primary-500"
                  />
                </div>

                <span className="text-white text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isAdmin && <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">Admin controls only</span>}
                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};