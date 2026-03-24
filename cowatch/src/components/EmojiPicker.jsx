import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES = {
  Smileys: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "🤪", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯"],
  Gestures: ["👍", "👎", "👏", "🙌", "🤝", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "🤙", "👋", "🖐️", "✋", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "🙏", "💪", "🦾", "🖖"],
  Hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  Objects: ["🎬", "🎥", "📽️", "🎞️", "📺", "📷", "📸", "🔊", "🔇", "📢", "🎵", "🎶", "🎤", "🎧", "🍿", "🎮", "🎲", "🎯", "🎪", "🎭", "🎨"],
  Reactions: ["🔥", "💯", "✨", "⭐", "🌟", "💫", "⚡", "💥", "💢", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "🎉", "🎊"],
};

export const EmojiPicker = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Smileys");

  const handleSelect = (emoji) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-400 hover:text-white"
      >
        <Smile className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full right-0 mb-2 w-72 glass rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex gap-1 p-2 border-b border-dark-700 overflow-x-auto">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeCategory === category ? "bg-primary-500/20 text-primary-400" : "text-dark-400 hover:bg-dark-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="p-2 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};