import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, ChevronUp, ChevronDown } from "lucide-react";
import { useRoom } from "../context/RoomContext";
import { cn } from "../utils/cn";

export const ParticipantsOverlay = () => {
  const { room } = useRoom();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!room?.users.length) return null;

  const visibleUsers = isExpanded ? room.users : room.users.slice(0, 3);
  const remainingCount = room.users.length - 3;

  return (
    <div className="absolute top-4 left-4 z-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 w-full hover:bg-white/5 transition-colors"
        >
          <Users className="w-4 h-4 text-primary-400" />
          <span className="text-white text-sm font-medium">
            {room.users.length} Watching
          </span>
          {room.users.length > 3 &&
            (isExpanded ? (
              <ChevronUp className="w-4 h-4 text-dark-400 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 text-dark-400 ml-auto" />
            ))}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-dark-700"
            >
              <div className="max-h-48 overflow-y-auto">
                {room.users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold relative",
                        user.avatar
                      )}
                    >
                      {user.username[0].toUpperCase()}
                      {user.isAdmin && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-2 h-2 text-yellow-900" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-white truncate">{user.username}</span>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-auto" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isExpanded && room.users.length > 0 && (
          <div className="flex items-center px-3 pb-2 -space-x-1">
            {visibleUsers.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-dark-900",
                  user.avatar
                )}
                title={user.username}
              >
                {user.username[0].toUpperCase()}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="w-6 h-6 rounded-full bg-dark-700 border-2 border-dark-900 flex items-center justify-center text-dark-300 text-xs">
                +{remainingCount}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};