import { useEffect, useMemo, useState } from "react";
import RoomTopBar from "../components/room/RoomTopBar";
import VideoStage from "../components/room/VideoStage";
import ChatPanel from "../components/room/ChatPanel";
import SetVideoModal from "../components/room/modals/SetVideoModal";
import LeaveRoomModal from "../components/room/modals/LeaveRoomModal";
import InviteModal from "../components/room/modals/InviteModal";
import { ReactionBar, ReactionLayer } from "../components/room/Reactions";
import { socket } from "../services/socket";

const CLIENT_ID_KEY = "cowatch_client_id";

export default function RoomPage({ roomData, onLeaveRoom, onRoomNotFound }) {
  const [setVideoOpen, setSetVideoOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [liveRoomName, setLiveRoomName] = useState(roomData?.roomName || "");
  const [connected, setConnected] = useState(socket.connected);
  const [sharedControl, setSharedControl] = useState(false); // admin lets everyone control playback
  // our id as other people see it (the server sends it; the real clientId stays private)
  const [selfId, setSelfId] = useState(null);

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

  const roomName =
    liveRoomName || roomData?.roomName || `Room-${roomId.slice(0, 4)}`;

  const isAdmin = Boolean(selfId) && users.some((u) => u.id === selfId && u.isAdmin);
  const canControl = isAdmin || sharedControl;

  useEffect(() => {
    localStorage.setItem("username", currentUserName);

    const handleUsers = ({ users }) => setUsers(users || []);
    const handleVideoUpdate = ({ videoUrl }) => setVideoUrl(videoUrl);
    const handleRoomMeta = ({ roomName, sharedControl }) => {
      if (roomName) setLiveRoomName(roomName);
      if (typeof sharedControl === "boolean") setSharedControl(sharedControl);
    };

    const handleYou = ({ id }) => setSelfId(id);

    socket.on("room:you", handleYou);
    socket.on("presence:users", handleUsers);
    socket.on("video:update", handleVideoUpdate);
    socket.on("room:meta", handleRoomMeta);

    const handleRoomError = ({ code, message }) => {
      if (code === "ROOM_NOT_FOUND") onRoomNotFound?.(roomId, message);
    };
    socket.on("room:error", handleRoomError);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);

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
      socket.off("room:you", handleYou);
      socket.off("presence:users", handleUsers);
      socket.off("video:update", handleVideoUpdate);
      socket.off("room:meta", handleRoomMeta);
      socket.off("room:error", handleRoomError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("connect", joinRoom);
    };
    // onRoomNotFound is intentionally left out: it must not re-run the join
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUserName, clientId]);

  const handleConfirmLeave = () => {
    socket.emit("room:leave", { roomId, clientId });
    setLeaveOpen(false);
    onLeaveRoom?.();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
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

      {!connected && (
        <div
          role="status"
          className="eyebrow flex shrink-0 items-center justify-center gap-2 border-b border-line bg-raised px-4 py-2.5 text-muted"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
          Connection lost · reconnecting…
        </div>
      )}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)]">
        {/* phones/tablets: fixed 16:9 video on top (capped for landscape), chat fills the rest */}
        <div className="flex min-h-0 min-w-0 shrink-0 flex-col lg:h-full lg:shrink">
          <div className="relative flex aspect-video max-h-[55dvh] w-full min-w-0 items-center justify-center bg-black lg:aspect-auto lg:min-h-0 lg:flex-1 lg:max-h-none">
            <VideoStage
              videoUrl={videoUrl}
              roomId={roomId}
              isAdmin={isAdmin}
              canControl={canControl}
              onSetVideo={() => setSetVideoOpen(true)}
            />
            <ReactionLayer />
          </div>
          <ReactionBar roomId={roomId} />
        </div>

        <div className="min-h-0 min-w-0 flex-1 border-t border-line lg:border-l lg:border-t-0">
          <ChatPanel
            users={users}
            roomId={roomId}
            roomName={roomName}
            currentUserName={currentUserName}
            selfId={selfId}
            isAdmin={isAdmin}
            sharedControl={sharedControl}
            onToggleControl={() =>
              socket.emit("room:control", { roomId, shared: !sharedControl })
            }
          />
        </div>
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
