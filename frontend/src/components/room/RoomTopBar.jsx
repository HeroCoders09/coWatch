import { useState } from "react";
import { Users, Link2, LogOut, Copy, Check, Video } from "lucide-react";
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

  const action =
    "inline-flex items-center gap-1.5 rounded-md p-2.5 text-sm text-muted transition-colors hover:bg-raised hover:text-fg md:px-3 md:py-2";

  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-bg px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-5">
        <span className="font-display text-xl tracking-tight text-accent">
          CoWatch
        </span>

        <span className="hidden h-4 w-px bg-line sm:block" />

        <div className="flex min-w-0 items-baseline gap-3">
          <span className="truncate text-sm font-medium">{roomName}</span>
          <button
            onClick={handleCopyRoomId}
            title="Copy room ID"
            className="eyebrow hidden items-center gap-1.5 text-muted transition-colors hover:text-accent sm:inline-flex"
          >
            {roomId}
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-2 inline-flex items-center gap-1.5 text-sm text-muted">
          <Users size={14} /> {watcherCount}
        </span>

        {isAdmin && (
          <span className="eyebrow mr-2 hidden rounded border border-accent/30 px-2 py-1.5 text-accent md:inline-block">
            Admin
          </span>
        )}

        <button onClick={onInvite} className={action}>
          <Link2 size={14} /> <span className="hidden md:inline">Invite</span>
        </button>

        {isAdmin && (
          <button onClick={onSetVideo} className={action}>
            <Video size={14} /> <span className="hidden md:inline">Set video</span>
          </button>
        )}

        <button
          onClick={onLeave}
          className="inline-flex items-center gap-1.5 rounded-md p-2.5 text-sm text-danger/90 transition-colors hover:bg-danger/10 hover:text-danger md:px-3 md:py-2"
        >
          <LogOut size={14} /> <span className="hidden md:inline">Leave</span>
        </button>
      </div>
    </header>
  );
}
