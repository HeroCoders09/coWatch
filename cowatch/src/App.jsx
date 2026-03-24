import React from "react";
import { RoomProvider, useRoom } from "./context/RoomContext";
import { ToastProvider } from "./components/ui/Toast";
import { LandingPage } from "./components/LandingPage";
import { WatchRoom } from "./components/WatchRoom";
import { LoadingScreen } from "./components/LoadingScreen";
import { AnimatePresence, motion } from "framer-motion";

const AppContent = () => {
  const { room, connectionStatus } = useRoom();

  // Show loading screen while connecting
  if (connectionStatus === "connecting") {
    return <LoadingScreen />;
  }

  return (
    <AnimatePresence mode="wait">
      {room ? (
        <motion.div
          key="room"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          <WatchRoom />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          <LandingPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <RoomProvider>
        <div
          className="min-h-screen text-white antialiased"
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
        >
          <AppContent />
        </div>
      </RoomProvider>
    </ToastProvider>
  );
};

export default App;