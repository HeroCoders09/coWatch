import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Users, Crown, LogOut, Info } from "lucide-react";
import { useRoom } from "../context/RoomContext";
import { EmojiPicker } from "./EmojiPicker";
import { cn } from "../utils/cn";

export const Chat = () => {
  const { room, currentUser, messages, sendMessage } = useRoom();
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(newMessage.trim());
    setNewMessage("");
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message) => {
    const isOwn = message.userId === currentUser?.id;
    const isSystem = message.type === "system" || message.type === "join" || message.type === "leave";

    if (isSystem) {
      return (
        <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-2">
          <span className="text-xs text-dark-400 bg-dark-800/50 px-3 py-1.5 rounded-full flex items-center gap-2">
            {message.type === "join" && <Users className="w-3 h-3 text-green-400" />}
            {message.type === "leave" && <LogOut className="w-3 h-3 text-red-400" />}
            {message.type === "system" && <Info className="w-3 h-3 text-primary-400" />}
            {message.content}
          </span>
        </motion.div>
      );
    }

    return (
      <motion.div key={message.id} initial={{ opacity: 0, x: isOwn ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={cn("flex gap-3 mb-3", isOwn && "flex-row-reverse")}>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", message.avatar)}>
          {message.username[0].toUpperCase()}
        </div>

        <div className={cn("max-w-[75%]", isOwn && "text-right")}>
          <div className={cn("flex items-center gap-2 mb-1", isOwn && "flex-row-reverse")}>
            <span className="text-xs font-medium text-dark-300">{message.username}</span>
            <span className="text-xs text-dark-500">{formatTime(message.timestamp)}</span>
          </div>
          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl text-sm",
              isOwn
                ? "bg-linear-to-r from-primary-500 to-secondary-500 text-white rounded-tr-md"
                : "bg-dark-700 text-dark-100 rounded-tl-md"
            )}
          >
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col glass rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-dark-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === "chat" ? "bg-primary-500/20 text-primary-400" : "text-dark-400 hover:bg-dark-700"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === "users" ? "bg-primary-500/20 text-primary-400" : "text-dark-400 hover:bg-dark-700"
            )}
          >
            <Users className="w-4 h-4" />
            Users ({room?.users.length || 0})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "chat" ? (
            <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-dark-400 text-sm">
                    <div className="text-center">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-700">
                <div className="flex items-center gap-2">
                  <EmojiPicker onSelect={(emoji) => setNewMessage((prev) => prev + emoji)} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-dark-800/50 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-dark-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-linear-to-r from-primary-500 to-secondary-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full overflow-y-auto p-4">
              <div className="space-y-2">
                {room?.users.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      user.id === currentUser?.id ? "bg-primary-500/10 border border-primary-500/20" : "bg-dark-800/50 hover:bg-dark-700/50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold relative", user.avatar)}>
                      {user.username[0].toUpperCase()}
                      {user.isAdmin && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-yellow-900" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{user.username}</span>
                        {user.id === currentUser?.id && <span className="text-xs text-primary-400">(You)</span>}
                      </div>
                      <span className="text-xs text-dark-400">{user.isAdmin ? "Room Admin" : "Viewer"}</span>
                    </div>

                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};