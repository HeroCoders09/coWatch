import { useState } from "react";
import RoomTopBar from "../components/room/RoomTopBar";
import VideoStage from "../components/room/VideoStage";
import ChatPanel from "../components/room/ChatPanel";
import SetVideoModal from "../components/room/modals/SetVideoModal";
import LeaveRoomModal from "../components/room/modals/LeaveRoomModal";
import InviteModal from "../components/room/modals/InviteModal";

export default function RoomPage({ roomData, onLeaveRoom }) {
  const [setVideoOpen, setSetVideoOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // ✅ ALWAYS use backend roomId (no random generation)
  const roomId = roomData?.roomId;

  // optional safety (prevents crash)
  if (!roomId) return null;

  const currentUserName = roomData?.name || "Guest";
  const roomName =
    roomData?.roomName || `Room-${roomId.slice(0, 4)}`;

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_15%_10%,rgba(38,59,122,.35),transparent_38%),linear-gradient(120deg,#070f2d,#1a1c59_60%,#10163f)]">
      
      <RoomTopBar
        onSetVideo={() => setSetVideoOpen(true)}
        onLeave={() => setLeaveOpen(true)}
        onInvite={() => setInviteOpen(true)}
        roomName={roomName}
        roomId={roomId}
        watcherCount={1}
      />

      <main className="grid h-[calc(100vh-72px)] grid-cols-[1fr_320px]">
        <VideoStage />

        {/* ✅ ChatPanel gets correct roomId */}
        <ChatPanel
          currentUserName={currentUserName}
          roomId={roomId}
          roomName={roomName}
        />
      </main>

      <SetVideoModal
        open={setVideoOpen}
        onClose={() => setSetVideoOpen(false)}
      />

      <LeaveRoomModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          setLeaveOpen(false);
          onLeaveRoom?.();
        }}
      />

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roomId={roomId}
      />
    </div>
  );
}