import React from "react";
import { motion } from "framer-motion";
import { RoomHeader } from "./RoomHeader";
import { VideoPlayer } from "./VideoPlayer";
import { Chat } from "./Chat";
import { useRoom } from "../context/RoomContext";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export const WatchRoom = () => {
  const { connectionStatus } = useRoom();

  return (
    <div className="min-h-screen flex flex-col">
      <RoomHeader />
      <div className="flex-1 flex overflow-hidden">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <VideoPlayer className="mb-6" />
            <div className="flex items-center justify-center gap-2 text-sm">
              {connectionStatus === "connected" ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-400">Connected • Real-time sync active</span>
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                  <span className="text-yellow-400">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-400">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-96 border-l border-dark-700 flex flex-col">
          <Chat />
        </motion.div>
      </div>
    </div>
  );
};