import { useEffect, useState } from "react";
import RoomTopBar from "../components/room/RoomTopBar";
import VideoStage from "../components/room/VideoStage";
import ChatPanel from "../components/room/ChatPanel";
import SetVideoModal from "../components/room/modals/SetVideoModal";
import LeaveRoomModal from "../components/room/modals/LeaveRoomModal";
import InviteModal from "../components/room/modals/InviteModal";
import {socket} from "../services/socket";

export default function RoomPage({ roomData, onLeaveRoom }) {
  const [setVideoOpen, setSetVideoOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");

  // ✅ ROOM ID
  const params = new URLSearchParams(window.location.search);
  const roomId =
    roomData?.roomId ||
    params.get("roomId") ||
    window.location.pathname.split("/").pop() ||
    "ROOMID";

  // 🔥 PERSISTENT USER ID (MAIN FIX)
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = Math.random().toString(36).slice(2);
    localStorage.setItem("userId", userId);
  }

  // ✅ USERNAME persistence
  const storedName = localStorage.getItem("username");
  const currentUserName = roomData?.name || storedName || "Guest";

  const roomName =
    roomData?.roomName || `Room-${roomId.slice(0, 4)}`;

  const isAdmin = users.some(
    (u) => u.socketId === socket.id && u.isAdmin
  );

  useEffect(() => {
    localStorage.setItem("username", currentUserName);

    const handleUsers = ({ users }) => {
      setUsers(users || []);
    };

    const handleVideoUpdate = ({ videoUrl }) => {
      setVideoUrl(videoUrl);
    };

    socket.on("presence:users", handleUsers);
    socket.on("video:update", handleVideoUpdate);

    // 🔥 JOIN FUNCTION (single source)
    const joinRoom = () => {
      socket.emit("room:join", {
        roomId,
        userName: currentUserName,
        userId, // 🔥 REQUIRED
      });
    };

    // 🔥 join immediately if already connected
    if (socket.connected) {
      joinRoom();
    }

    // 🔥 join on reconnect
    socket.on("connect", joinRoom);

    return () => {
      socket.off("presence:users", handleUsers);
      socket.off("video:update", handleVideoUpdate);
      socket.off("connect", joinRoom);
    };
  }, [roomId, currentUserName]);

  const handleConfirmLeave = () => {
    socket.emit("room:leave", { roomId });
    setLeaveOpen(false);
    onLeaveRoom?.();
  };

  return (
    <div className="min-h-screen text-white bg-[#020617]">

      <RoomTopBar
        onSetVideo={() => setSetVideoOpen(true)}
        onLeave={() => setLeaveOpen(true)}
        onInvite={() => setInviteOpen(true)}
        roomName={roomName}
        roomId={roomId}
        watcherCount={users.length}
        isAdmin={isAdmin}
      />

      <main className="grid h-[calc(100vh-72px)] grid-cols-[1fr_320px]">
        <VideoStage videoUrl={videoUrl} />

        <ChatPanel
          users={users}
          roomId={roomId}
          roomName={roomName}
          currentUserName={currentUserName}
        />
      </main>

      <SetVideoModal
        open={setVideoOpen}
        onClose={() => setSetVideoOpen(false)}
        onSetVideo={(url) => {
          socket.emit("video:set", {
            roomId,
            videoUrl: url,
          });
        }}
      />

      <LeaveRoomModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={handleConfirmLeave}
      />

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roomId={roomId}
      />
    </div>
  );
}