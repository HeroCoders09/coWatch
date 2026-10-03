import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/layout/Navbar";
import HeroSection from "./components/sections/HeroSection";
import FeaturesSection from "./components/sections/FeaturesSection";
import ReadySection from "./components/sections/ReadySection";
import Footer from "./components/layout/Footer";
import RoomAccessModal from "./components/modals/RoomAccessModal";
import RoomPage from "./pages/RoomPage";
import { socket } from "./services/socket";
import { generateRoomId } from "./utils/room";

const ROOM_STORAGE_KEY = "cowatch_active_room";
const CLIENT_ID_KEY = "cowatch_client_id";

// An invite link (?join=CODE) always wins over a saved room, so following a
// link never drops you back into whatever room you were in before.
function readSavedRoom() {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    if (!saved?.roomId || !saved?.name) return null;

    const invited = new URLSearchParams(window.location.search).get("join");
    if (invited && invited.toUpperCase() !== String(saved.roomId).toUpperCase()) {
      return null;
    }
    return saved;
  } catch (e) {
    console.error("Failed to restore room from storage", e);
    localStorage.removeItem(ROOM_STORAGE_KEY);
    return null;
  }
}

export default function App() {
  const [restored] = useState(readSavedRoom);
  const [modalMode, setModalMode] = useState(null);
  const [inRoom, setInRoom] = useState(Boolean(restored));
  const [roomData, setRoomData] = useState(restored);
  const [prefillRoomId, setPrefillRoomId] = useState("");
  const [joinError, setJoinError] = useState("");

  const clientId = useMemo(() => {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }, []);

  // auto-open join modal if invite param exists: /?join=ROOMID
  useEffect(() => {
    if (inRoom) return;
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get("join");
    if (joinId) {
      setPrefillRoomId(joinId.toUpperCase());
      setModalMode("join");
    }
  }, [inRoom]);

  // the server said the room doesn't exist: go back to the landing page and
  // reopen the join dialog with the code so it can be corrected
  const handleRoomNotFound = (roomId, message) => {
    localStorage.removeItem(ROOM_STORAGE_KEY);
    setInRoom(false);
    setRoomData(null);
    setJoinError(message || "That room doesn't exist or has ended.");
    setPrefillRoomId(roomId || "");
    setModalMode("join");
    window.history.replaceState({}, "", "/");
  };

  const handleSuccess = (payload, mode) => {
    if (mode === "create") {
      const roomId = generateRoomId();
      const next = { ...payload, roomId, mode: "create" };
      setRoomData(next);
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(next));

      socket.emit("room:create", {
        roomId,
        roomName: payload.roomName,
        userName: payload.name,
        clientId,
      });

      window.history.replaceState({}, "", `/?join=${encodeURIComponent(roomId)}`);
    } else {
      const normalizedRoomId = payload.roomId.toUpperCase();
      const next = { ...payload, roomId: normalizedRoomId, mode: "join" };
      setRoomData(next);
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(next));

      socket.emit("room:join", {
        roomId: normalizedRoomId,
        userName: payload.name,
        clientId,
      });

      window.history.replaceState({}, "", `/?join=${encodeURIComponent(normalizedRoomId)}`);
    }

    setJoinError("");
    setModalMode(null);
    setInRoom(true);
  };

  if (inRoom && roomData) {
    return (
      <RoomPage
        roomData={roomData}
        onRoomNotFound={handleRoomNotFound}
        onLeaveRoom={() => {
          localStorage.removeItem(ROOM_STORAGE_KEY);
          setInRoom(false);
          setRoomData(null);
          setPrefillRoomId("");
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Navbar
        onCreateRoom={() => setModalMode("create")}
        onJoinRoom={() => setModalMode("join")}
      />
      <HeroSection
        onCreateRoom={() => setModalMode("create")}
        onJoinRoom={() => setModalMode("join")}
      />
      <FeaturesSection />
      <ReadySection onCreateRoom={() => setModalMode("create")} />
      <Footer />

      <RoomAccessModal
        open={Boolean(modalMode)}
        mode={modalMode || "create"}
        onClose={() => {
          setModalMode(null);
          setJoinError("");
        }}
        onSuccess={handleSuccess}
        prefillRoomId={prefillRoomId}
        initialError={joinError}
      />
    </div>
  );
}
