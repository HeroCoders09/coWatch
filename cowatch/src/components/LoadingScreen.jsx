import React from "react";
import { motion } from "framer-motion";
import { Video } from "lucide-react";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-linear-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-primary-500/20 border-t-primary-500 mx-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-linear-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-2">CoWatch</h2>
          <p className="text-dark-400">Connecting to room...</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-primary-500 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};