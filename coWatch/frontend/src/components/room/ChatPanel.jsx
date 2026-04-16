import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Smile, Send, Users } from "lucide-react";
import UsersList from "./UsersList";
import { socket } from "../../services/socket";

function formatRelativeTime(iso) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleString();
}

export default function ChatPanel({
  users = [],
  roomId = "ROOMID",
  roomName = "Room",
  currentUserName = "",
}) {
  const [activeTab, setActiveTab] = useState("chat");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // array of names
  const [unreadCount, setUnreadCount] = useState(0);
  const boxRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const onHistory = ({ roomId: rid, messages }) => {
      if (rid !== roomId) return;
      setMessages(messages || []);
    };

    const onNew = (msg) => {
      if (msg.roomId !== roomId) return;
      setMessages((prev) => [...prev, msg]);

      // unread if not in chat tab and not my own message
      const isMine =
        msg.userName?.toLowerCase() === currentUserName?.toLowerCase();
      if (activeTab !== "chat" && !isMine) {
        setUnreadCount((c) => c + 1);
      }
    };

    const onTyping = ({ roomId: rid, userName, isTyping }) => {
      if (rid !== roomId) return;
      if (!userName || userName.toLowerCase() === currentUserName.toLowerCase()) return;

      setTypingUsers((prev) => {
        const has = prev.includes(userName);
        if (isTyping && !has) return [...prev, userName];
        if (!isTyping && has) return prev.filter((n) => n !== userName);
        return prev;
      });
    };

    socket.on("chat:history", onHistory);
    socket.on("chat:new", onNew);
    socket.on("chat:typing", onTyping);

    return () => {
      socket.off("chat:history", onHistory);
      socket.off("chat:new", onNew);
      socket.off("chat:typing", onTyping);
    };
  }, [roomId, activeTab, currentUserName]);

  useEffect(() => {
    if (!boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, typingUsers]);

  useEffect(() => {
    return () => {
      socket.emit("chat:typing", { roomId, isTyping: false });
    };
  }, [roomId]);

  const openChatTab = () => {
    setActiveTab("chat");
    setUnreadCount(0);
  };

  const openUsersTab = () => {
    setActiveTab("users");
  };

  const sendMessage = () => {
    const clean = text.trim();
    if (!clean) return;

    socket.emit("chat:send", { roomId, text: clean });
    socket.emit("chat:typing", { roomId, isTyping: false });
    setText("");
  };

  const handleTypingChange = (value) => {
    setText(value);

    // user started typing
    socket.emit("chat:typing", { roomId, isTyping: value.trim().length > 0 });

    // debounce stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:typing", { roomId, isTyping: false });
    }, 1200);
  };

  const uiMessages = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        isMe: m.userName?.toLowerCase() === currentUserName?.toLowerCase(),
      })),
    [messages, currentUserName]
  );

  const typingText =
    typingUsers.length === 0
      ? ""
      : typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.slice(0, 2).join(", ")} ${typingUsers.length > 2 ? `+${typingUsers.length - 2} others ` : ""}are typing...`;

  return (
    <aside className="border-l border-white/10 bg-[#0d1640]/70">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
        <button
          onClick={openChatTab}
          className={`relative flex-1 rounded-xl py-2 text-sm font-semibold ${
            activeTab === "chat" ? "bg-cyan-500/20 text-white" : "text-white/70"
          }`}
        >
          <MessageSquare size={14} className="mr-1 inline" /> Chat
          {unreadCount > 0 && activeTab !== "chat" && (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={openUsersTab}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
            activeTab === "users" ? "bg-cyan-500/20 text-white" : "text-white/70"
          }`}
        >
          <Users size={14} className="mr-1 inline" /> Users ({users.length})
        </button>

      </div>

      <div ref={boxRef} className="h-[calc(100%-128px)] overflow-y-auto p-4">
        {activeTab === "chat" ? (
          <div className="space-y-3">
            <div className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs text-white/60">
              Room "{roomName}" • ID: {roomId}
            </div>

            {uiMessages.length === 0 ? (
              <p className="text-sm text-white/45">No messages yet. Say hi 👋</p>
            ) : (
              uiMessages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                    m.isMe
                      ? "ml-auto border border-cyan-300/30 bg-cyan-500/20"
                      : "border border-white/10 bg-white/10"
                  }`}
                >
                  <p className="mb-1 text-xs text-white/60">
                    {m.userName} • {formatRelativeTime(m.createdAt)}
                  </p>
                  <p className="text-sm text-white">{m.text}</p>
                </div>
              ))
            )}

            {typingText && (
              <p className="text-xs italic text-cyan-300/90">{typingText}</p>
            )}
          </div>
        ) : (
          <UsersList users={users} currentUserName={currentUserName} />
        )}
      </div>

      <div className="flex h-16 items-center gap-2 border-t border-white/10 px-3">
        <button className="text-white/60">
          <Smile size={18} />
        </button>
        <input
          value={text}
          onChange={(e) => handleTypingChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="h-10 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 outline-none"
        />
        <button
          onClick={sendMessage}
          className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-r from-cyan-400 to-fuchsia-500"
        >
          <Send size={15} />
        </button>
      </div>
    </aside>
  );
}