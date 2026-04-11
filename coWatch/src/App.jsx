import { useState } from "react";
import Navbar from "./components/layout/Navbar";
import HeroSection from "./components/sections/HeroSection";
import FeaturesSection from "./components/sections/FeaturesSection";
import DemoSection from "./components/sections/DemoSection";
import ReadySection from "./components/sections/ReadySection";
import Footer from "./components/layout/Footer";
import RoomAccessModal from "./components/modals/RoomAccessModal";
import RoomPage from "./pages/RoomPage";

export default function App() {
  const [modalMode, setModalMode] = useState(null); // "create" | "join" | null
  const [inRoom, setInRoom] = useState(false);
  const [roomData, setRoomData] = useState(null);

  const handleSuccess = (payload, mode) => {
    setRoomData({ ...payload, mode });
    setModalMode(null);
    setInRoom(true);
  };

  if (inRoom) {
    return (
      <RoomPage
        roomData={roomData}
        onLeaveRoom={() => {
          setInRoom(false);
          setRoomData(null);
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
      />
    </div>
  );
}