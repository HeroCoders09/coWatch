import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, LogOut, Users, Shield, Video, Link as LinkIcon } from "lucide-react";
import { useRoom } from "../context/RoomContext";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { cn } from "../utils/cn";

export const RoomHeader = () => {
  const { room, currentUser, leaveRoom, setVideoUrl } = useRoom();
  const [copied, setCopied] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${room?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomId = () => {
    if (!room?.id) return;
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetVideo = () => {
    if (!videoUrlInput.trim()) return;
    setVideoUrl(videoUrlInput.trim());
    setShowVideoModal(false);
    setVideoUrlInput("");
  };

  const handleLeave = () => {
    leaveRoom();
    setShowLeaveConfirm(false);
  };

  const sampleVideos = [
    { name: "Big Buck Bunny", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { name: "Elephant Dream", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
    { name: "Sintel", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
    { name: "Tears of Steel", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" },
  ];

  return (
    <>
      <header className="glass border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                CoWatch
              </span>
            </motion.div>

            <div className="h-8 w-px bg-dark-700" />

            <div className="flex items-center gap-3">
              <div className="glass-light px-4 py-2 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-dark-400">Room:</span>
                  <span className="font-semibold text-white">{room?.name}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyRoomId}
                className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 rounded-xl text-sm transition-colors group"
              >
                <span className="text-dark-400">ID:</span>
                <code className="text-primary-400 font-mono">{room?.id}</code>
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-dark-400 group-hover:text-white transition-colors" />
                )}
              </motion.button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-xl text-sm">
              <Users className="w-4 h-4 text-primary-400" />
              <span className="text-white font-medium">{room?.users.length}</span>
              <span className="text-dark-400">watching</span>
            </div>

            {currentUser?.isAdmin && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm">
                <Shield className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500 font-medium">Admin</span>
              </div>
            )}

            <Button variant="secondary" size="sm" leftIcon={<LinkIcon className="w-4 h-4" />} onClick={copyRoomLink}>
              {copied ? "Copied!" : "Invite"}
            </Button>

            {currentUser?.isAdmin && (
              <Button variant="primary" size="sm" leftIcon={<Video className="w-4 h-4" />} onClick={() => setShowVideoModal(true)}>
                Set Video
              </Button>
            )}

            <Button variant="danger" size="sm" leftIcon={<LogOut className="w-4 h-4" />} onClick={() => setShowLeaveConfirm(true)}>
              Leave
            </Button>
          </div>
        </div>
      </header>

      <Modal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} title="Set Video URL" size="lg">
        <div className="space-y-6">
          <Input
            label="Video URL"
            placeholder="Enter video URL (MP4, WebM, etc.)"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            leftIcon={<Video className="w-5 h-5" />}
          />

          <div>
            <p className="text-sm text-dark-400 mb-3">Or choose a sample video:</p>
            <div className="grid grid-cols-2 gap-2">
              {sampleVideos.map((video) => (
                <button
                  key={video.name}
                  onClick={() => setVideoUrlInput(video.url)}
                  className={cn(
                    "p-3 rounded-xl text-left text-sm transition-all",
                    videoUrlInput === video.url
                      ? "bg-primary-500/20 border border-primary-500/50 text-primary-400"
                      : "bg-dark-800 hover:bg-dark-700 text-dark-300 border border-transparent"
                  )}
                >
                  {video.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowVideoModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSetVideo} disabled={!videoUrlInput.trim()}>
              Set Video
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} title="Leave Room?" size="sm">
        <p className="text-dark-300 mb-6">
          Are you sure you want to leave this room? {currentUser?.isAdmin && "As the admin, leaving will end the session for everyone."}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLeave}>
            Leave Room
          </Button>
        </div>
      </Modal>
    </>
  );
};