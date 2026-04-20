import { useState } from "react";
import { Video, Users, Crown, Link2, LogOut, Copy, Check } from "lucide-react";
import { copyText } from "../../utils/clipboard";

export default function RoomTopBar({
  onSetVideo,
  onLeave,
  onInvite,
  roomName = "Room",
  roomId = "ROOMID",
  watcherCount = 1,
  isAdmin = false, 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyRoomId = async () => {
    const ok = await copyText(roomId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } else {
      alert("Copy failed. Please copy manually: " + roomId);
    }
  };

  return (
    <header className="flex h-18 items-center justify-between border-b border-white/10 bg-[#12183f]/70 px-5 backdrop-blur-md">
      
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-r from-cyan-400 to-fuchsia-500">
            <Video size={16} />
          </div>
          <span className="text-2xl font-bold text-sky-300">CoWatch</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85">
          Room: <span className="font-semibold">{roomName}</span>
        </div>

        <button
          onClick={handleCopyRoomId}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-300 hover:bg-white/10"
          title="Copy room ID"
        >
          ID: {roomId} {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/85">
          <Users size={14} /> {watcherCount} watching
        </span>

        {/* ✅ SHOW ONLY FOR ADMIN */}
        {isAdmin && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
            <Crown size={14} /> Admin
          </span>
        )}

        <button
          onClick={onInvite}
          className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
        >
          <Link2 size={14} /> Invite
        </button>

        <button
          onClick={onSetVideo}
          className="inline-flex items-center gap-1 rounded-xl bg-linear-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold"
        >
          <Video size={14} /> Set Video
        </button>

        <button
          onClick={onLeave}
          className="inline-flex items-center gap-1 rounded-xl bg-linear-to-r from-rose-500 to-pink-500 px-4 py-2 text-sm font-semibold"
        >
          <LogOut size={14} /> Leave
        </button>
      </div>
    </header>
  );
}