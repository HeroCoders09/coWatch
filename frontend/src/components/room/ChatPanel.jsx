import { useState, useEffect, useRef } from "react";
import { socket } from "../../services/socket";

export default function ChatPanel({ users = [], roomId, currentUserName }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const listRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isAdmin = users.some(
    (u) => u.userName === currentUserName && u.isAdmin
  );

  useEffect(() => {
    const handleHistory = (payload) => {
      const items = Array.isArray(payload) ? payload : payload?.items || [];
      setMessages(items);
      setHasMore(Boolean(payload?.hasMore));
      setNextCursor(payload?.nextCursor ?? null);

      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
    };

    const handleHistoryMore = (payload) => {
      const older = payload?.items || [];
      const scroller = listRef.current;
      const prevHeight = scroller?.scrollHeight ?? 0;
      const prevTop = scroller?.scrollTop ?? 0;

      setMessages((prev) => [...older, ...prev]);
      setHasMore(Boolean(payload?.hasMore));
      setNextCursor(payload?.nextCursor ?? null);

      requestAnimationFrame(() => {
        if (scroller) {
          const newHeight = scroller.scrollHeight;
          scroller.scrollTop = prevTop + (newHeight - prevHeight);
        }
        setLoadingMore(false);
      });
    };

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);

      requestAnimationFrame(() => {
        const scroller = listRef.current;
        if (!scroller) return;
        const nearBottom =
          scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;
        if (nearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      });
    };

    socket.on("chat:history", handleHistory);
    socket.on("chat:history:more", handleHistoryMore);
    socket.on("chat:message", handleMessage);

    return () => {
      socket.off("chat:history", handleHistory);
      socket.off("chat:history:more", handleHistoryMore);
      socket.off("chat:message", handleMessage);
    };
  }, []);

  const loadOlderMessages = () => {
    if (!roomId || !hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    socket.emit("chat:history:more", {
      roomId,
      beforeId: nextCursor,
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("chat:message", {
      roomId,
      message: input,
      userName: currentUserName,
    });

    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-[#0b1024]">
      <div className="shrink-0 flex p-3 border-b border-white/10 gap-2">
        <button
          className={`flex-1 py-2 rounded-lg text-sm transition ${
            activeTab === "chat"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          💬 Chat
        </button>

        <button
          className={`flex-1 py-2 rounded-lg text-sm transition ${
            activeTab === "users"
              ? "bg-cyan-600 text-white"
              : "text-white/60 hover:bg-white/5"
          }`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({users.length})
        </button>
      </div>

      {activeTab === "chat" && (
        <>
          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-2"
          >
            {hasMore && (
              <button
                onClick={loadOlderMessages}
                disabled={loadingMore}
                className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Load older messages"}
              </button>
            )}

            {messages.length === 0 && (
              <div className="text-center text-white/40 text-sm mt-10">
                No messages yet
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id ?? `${msg.time}-${msg.userName}-${idx}`}
                className="text-sm wrap-break-words whitespace-pre-wrap"
              >
                <span className="text-cyan-400 font-medium break-all">
                  {msg.userName === currentUserName ? "You" : msg.userName}:
                </span>{" "}
                <span className="wrap-break-words">{msg.message}</span>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="min-w-0 flex-1 bg-white/5 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-cyan-400"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              onClick={sendMessage}
              className="shrink-0 bg-linear-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Send
            </button>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-3">
          {users.map((user) => (
            <div
              key={user.userName}
              className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 transition p-3 rounded-xl"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-linear-to-r from-cyan-400 to-fuchsia-500 flex items-center justify-center font-bold text-black">
                  {user.userName[0].toUpperCase()}
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{user.userName}</span>

                    {user.userName === currentUserName && (
                      <span className="text-cyan-400 text-xs shrink-0">(You)</span>
                    )}

                    {user.isAdmin && (
                      <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full shrink-0">
                        👑 Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && !user.isAdmin && user.userName !== currentUserName && (
                <button
                  onClick={() =>
                    socket.emit("admin:transfer", {
                      roomId,
                      targetUserName: user.userName,
                    })
                  }
                  className="text-xs bg-yellow-500 hover:bg-yellow-400 px-3 py-1 rounded-lg font-medium shrink-0"
                >
                  Make Admin
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}