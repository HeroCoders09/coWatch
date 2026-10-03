import { useEffect, useRef, useState } from "react";
import { socket } from "../../services/socket";

// Must match the set the server accepts (the server ignores anything else).
const REACTIONS = ["❤️", "😂", "😮", "👏", "🔥", "😢"];
const LIFETIME_MS = 2600; // matches the cw-reaction animation length
const MAX_ON_SCREEN = 30;

// Row of emoji buttons under the video.
export function ReactionBar({ roomId }) {
  const lastSentAt = useRef(0);

  const send = (emoji) => {
    // tiny local cooldown so a double-tap doesn't count twice
    const now = Date.now();
    if (now - lastSentAt.current < 120) return;
    lastSentAt.current = now;
    socket.emit("reaction:send", { roomId, emoji });
  };

  return (
    <div className="flex shrink-0 items-center gap-1 border-t border-line bg-surface px-2 py-1.5 sm:px-3">
      <span className="eyebrow mr-2 hidden text-muted sm:block">React</span>
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => send(emoji)}
          aria-label={`Send ${emoji} reaction`}
          className="grid h-10 w-10 place-items-center rounded-md text-xl transition hover:bg-raised active:scale-90"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Transparent layer over the video where reactions float up and fade out.
export function ReactionLayer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const timers = new Set();

    const handleReaction = ({ id, emoji, userName }) => {
      const item = { id, emoji, userName, left: 8 + Math.random() * 80 };
      setItems((prev) => [...prev.slice(-(MAX_ON_SCREEN - 1)), item]);

      const t = setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        timers.delete(t);
      }, LIFETIME_MS);
      timers.add(t);
    };

    socket.on("reaction", handleReaction);
    return () => {
      socket.off("reaction", handleReaction);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="cw-reaction absolute bottom-[6%] text-3xl sm:text-4xl"
          style={{ left: `${item.left}%` }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}
