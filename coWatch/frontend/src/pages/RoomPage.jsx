import { useEffect, useMemo, useState } from "react";
import RoomTopBar from "../components/room/RoomTopBar";
import VideoStage from "../components/room/VideoStage";
import ChatPanel from "../components/room/ChatPanel";
import SetVideoModal from "../components/room/modals/SetVideoModal";
import LeaveRoomModal from "../components/room/modals/LeaveRoomModal";
import InviteModal from "../components/room/modals/InviteModal";
import { socket } from "../services/socket";

const CLIENT_ID_KEY = "cowatch_client_id";

export default function RoomPage({ roomData, onLeaveRoom }) {
  const [setVideoOpen, setSetVideoOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");

  const roomId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      roomData?.roomId ||
      params.get("roomId") ||
      window.location.pathname.split("/").pop() ||
      "ROOMID"
    );
  }, [roomData?.roomId]);

  const currentUserName = useMemo(() => {
    const storedName = localStorage.getItem("username");
    return roomData?.name || storedName || "Guest";
  }, [roomData?.name]);

  const clientId = useMemo(() => {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }, []);

  const roomName = roomData?.roomName || `Room-${roomId.slice(0, 4)}`;

  const isAdmin = users.some(
    (u) => u.userName === currentUserName && u.isAdmin
  );

  useEffect(() => {
    localStorage.setItem("username", currentUserName);

    const handleUsers = ({ users }) => setUsers(users || []);
    const handleVideoUpdate = ({ videoUrl }) => setVideoUrl(videoUrl);

    socket.on("presence:users", handleUsers);
    socket.on("video:update", handleVideoUpdate);

    const joinRoom = () => {
      socket.emit("room:join", {
        roomId,
        userName: currentUserName,
        clientId,
      });
    };

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    return () => {
      socket.off("presence:users", handleUsers);
      socket.off("video:update", handleVideoUpdate);
      socket.off("connect", joinRoom);
    };
  }, [roomId, currentUserName, clientId]);

  const handleConfirmLeave = () => {
    socket.emit("room:leave", { roomId, clientId });
    setLeaveOpen(false);
    onLeaveRoom?.();
  };

  return (
    <div className="min-h-screen text-white bg-[#020617]">
      <RoomTopBar
        onSetVideo={() => {
          if (!isAdmin) return;
          setSetVideoOpen(true);
        }}
        onLeave={() => setLeaveOpen(true)}
        onInvite={() => setInviteOpen(true)}
        roomName={roomName}
        roomId={roomId}
        watcherCount={users.length}
        isAdmin={isAdmin}
      />

      <main className="grid h-[calc(100vh-72px)] grid-cols-[1fr_320px]">
        <VideoStage videoUrl={videoUrl} roomId={roomId} isAdmin={isAdmin} />
        <ChatPanel
          users={users}
          roomId={roomId}
          roomName={roomName}
          currentUserName={currentUserName}
        />
      </main>

      <SetVideoModal
        open={setVideoOpen && isAdmin}
        onClose={() => setSetVideoOpen(false)}
        onSetVideo={(url) => {
          if (!isAdmin) return;
          socket.emit("video:set", { roomId, videoUrl: url });
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