<<<<<<< HEAD:coWatch/src/pages/RoomPage.jsx
import { useState } from "react";
=======
import { useEffect, useState } from "react";
>>>>>>> 04127f3 (feat: initialize backend with room sockets and live presence):coWatch/frontend/src/pages/RoomPage.jsx
import RoomTopBar from "../components/room/RoomTopBar";
import VideoStage from "../components/room/VideoStage";
import ChatPanel from "../components/room/ChatPanel";
import SetVideoModal from "../components/room/modals/SetVideoModal";
import LeaveRoomModal from "../components/room/modals/LeaveRoomModal";
import InviteModal from "../components/room/modals/InviteModal";
<<<<<<< HEAD:coWatch/src/pages/RoomPage.jsx
=======
import { socket } from "../services/socket";
>>>>>>> 04127f3 (feat: initialize backend with room sockets and live presence):coWatch/frontend/src/pages/RoomPage.jsx

export default function RoomPage({ roomData, onLeaveRoom }) {
  const [setVideoOpen, setSetVideoOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [users, setUsers] = useState([]);

<<<<<<< HEAD:coWatch/src/pages/RoomPage.jsx
  // ✅ ALWAYS use backend roomId (no random generation)
  const roomId = roomData?.roomId;

  // optional safety (prevents crash)
  if (!roomId) return null;

  const currentUserName = roomData?.name || "Guest";
  const roomName =
    roomData?.roomName || `Room-${roomId.slice(0, 4)}`;
=======
  const roomId = roomData?.roomId || "ROOMID";
  const roomName = roomData?.roomName || `Room-${roomId.slice(0, 4)}`;
  const currentUserName = roomData?.name || "Guest";

  useEffect(() => {
    const handleUsers = ({ users: incomingUsers }) => {
      setUsers(incomingUsers || []);
    };

    const handleRoomError = ({ message }) => {
      alert(message || "Room error");
      onLeaveRoom?.();
    };

    socket.on("presence:users", handleUsers);
    socket.on("room:error", handleRoomError);

    socket.emit("room:get-users", { roomId });

    return () => {
      socket.off("presence:users", handleUsers);
      socket.off("room:error", handleRoomError);
    };
  }, [roomId, onLeaveRoom]);

  const handleConfirmLeave = () => {
    socket.emit("room:leave", { roomId, userName: currentUserName });
    setLeaveOpen(false);
    onLeaveRoom?.();
  };
>>>>>>> 04127f3 (feat: initialize backend with room sockets and live presence):coWatch/frontend/src/pages/RoomPage.jsx

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_15%_10%,rgba(38,59,122,.35),transparent_38%),linear-gradient(120deg,#070f2d,#1a1c59_60%,#10163f)]">
      
      <RoomTopBar
        onSetVideo={() => setSetVideoOpen(true)}
        onLeave={() => setLeaveOpen(true)}
        onInvite={() => setInviteOpen(true)}
        roomName={roomName}
        roomId={roomId}
        watcherCount={users.length}
      />

      <main className="grid h-[calc(100vh-72px)] grid-cols-[1fr_320px]">
        <VideoStage />
<<<<<<< HEAD:coWatch/src/pages/RoomPage.jsx

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
=======
        <ChatPanel users={users} roomId={roomId} roomName={roomName} currentUserName={currentUserName} />
      </main>

      <SetVideoModal open={setVideoOpen} onClose={() => setSetVideoOpen(false)} />
      <LeaveRoomModal open={leaveOpen} onClose={() => setLeaveOpen(false)} onConfirm={handleConfirmLeave} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} roomId={roomId} />
>>>>>>> 04127f3 (feat: initialize backend with room sockets and live presence):coWatch/frontend/src/pages/RoomPage.jsx
    </div>
  );
}