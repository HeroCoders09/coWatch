import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/layout/Navbar";
import HeroSection from "./components/sections/HeroSection";
import FeaturesSection from "./components/sections/FeaturesSection";
import DemoSection from "./components/sections/DemoSection";
import ReadySection from "./components/sections/ReadySection";
import Footer from "./components/layout/Footer";
import RoomAccessModal from "./components/modals/RoomAccessModal";
import RoomPage from "./pages/RoomPage";
import { socket } from "./services/socket";
import { generateRoomId } from "./utils/room";

const ROOM_STORAGE_KEY = "cowatch_active_room";
const CLIENT_ID_KEY = "cowatch_client_id";

export default function App() {
  const [modalMode, setModalMode] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [prefillRoomId, setPrefillRoomId] = useState("");

  const clientId = useMemo(() => {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }, []);

  // restore active room
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ROOM_STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (saved?.roomId && saved?.name) {
        setRoomData(saved);
        setInRoom(true);
      }
    } catch (e) {
      console.error("Failed to restore room from storage", e);
      localStorage.removeItem(ROOM_STORAGE_KEY);
    }
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

      // keep URL shareable
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

      // normalize URL
      window.history.replaceState({}, "", `/?join=${encodeURIComponent(normalizedRoomId)}`);
    }

    setModalMode(null);
    setInRoom(true);
  };

  if (inRoom && roomData) {
    return (
      <RoomPage
        roomData={roomData}
        onLeaveRoom={() => {
          localStorage.removeItem(ROOM_STORAGE_KEY);
          setInRoom(false);
          setRoomData(null);
          setPrefillRoomId("");
          // clear invite query when leaving
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_12%_8%,rgba(35,62,128,.45)_0%,transparent_36%),radial-gradient(circle_at_88%_18%,rgba(78,49,146,.32)_0%,transparent_32%),linear-gradient(130deg,#0a1130_0%,#171a56_55%,#0a1438_100%)]">
      <Navbar
        onCreateRoom={() => setModalMode("create")}
        onJoinRoom={() => setModalMode("join")}
      />
      <HeroSection
        onCreateRoom={() => setModalMode("create")}
        onJoinRoom={() => setModalMode("join")}
      />
      <FeaturesSection />
      <DemoSection />
      <ReadySection onCreateRoom={() => setModalMode("create")} />
      <Footer />

      <RoomAccessModal
        open={Boolean(modalMode)}
        mode={modalMode || "create"}
        onClose={() => setModalMode(null)}
        onSuccess={handleSuccess}
        prefillRoomId={prefillRoomId}
      />
    </div>
  );
}