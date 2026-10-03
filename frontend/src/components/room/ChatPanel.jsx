import { useState, useEffect, useRef } from "react";
import { socket } from "../../services/socket";

export default function ChatPanel({
  users = [],
  roomId,
  currentUserName,
  selfId,
  isAdmin = false,
  sharedControl = false,
  onToggleControl,
}) {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0); // messages that arrived while on the People tab
  const activeTabRef = useRef("chat");

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const selfIdRef = useRef(selfId);
  selfIdRef.current = selfId;

  const listRef = useRef(null);
  const messagesEndRef = useRef(null);

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

    const append = (msg) => {
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

    const handleMessage = (msg) => {
      append(msg);
      if (activeTabRef.current !== "chat" && msg.senderId !== selfIdRef.current) {
        setUnread((n) => n + 1);
      }
    };
    // "Asha joined", "Ravi is now the admin": a quiet line, not a chat message
    const handleNotice = (n) => append({ system: true, message: n.message, time: n.time });

    socket.on("chat:history", handleHistory);
    socket.on("chat:history:more", handleHistoryMore);
    socket.on("chat:message", handleMessage);
    socket.on("room:notice", handleNotice);

    return () => {
      socket.off("chat:history", handleHistory);
      socket.off("chat:history:more", handleHistoryMore);
      socket.off("chat:message", handleMessage);
      socket.off("room:notice", handleNotice);
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

    // the server knows who we are from our joined session, so only send the text
    socket.emit("chat:message", { roomId, message: input });

    setInput("");
  };

  const openTab = (id) => {
    activeTabRef.current = id;
    setActiveTab(id);
    if (id === "chat") setUnread(0);
  };

  const formatTime = (t) =>
    t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const tab = (id) =>
    `eyebrow relative flex-1 py-4 transition-colors ${
      activeTab === id
        ? "text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-accent"
        : "text-muted hover:text-fg"
    }`;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-surface">
      <div className="flex shrink-0 border-b border-line">
        <button className={tab("chat")} onClick={() => openTab("chat")}>
          Chat
          {unread > 0 && (
            <span
              className="ml-2 inline-grid min-w-4 place-items-center rounded-full bg-accent px-1 py-0.5 text-[10px] font-semibold leading-none tracking-normal text-bg"
              aria-label={`${unread} unread`}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
        <button className={tab("users")} onClick={() => openTab("users")}>
          People · {users.length}
        </button>
      </div>

      {activeTab === "chat" && (
        <>
          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4"
          >
            {hasMore && (
              <button
                onClick={loadOlderMessages}
                disabled={loadingMore}
                className="eyebrow mb-2 w-full py-2 text-muted transition-colors hover:text-accent disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load older messages"}
              </button>
            )}

            {messages.length === 0 && (
              <p className="mt-10 text-center text-sm text-muted">
                No messages yet.
              </p>
            )}

            {messages.map((msg, idx) => {
              if (msg.system) {
                return (
                  <p
                    key={`n-${msg.time}-${idx}`}
                    className="py-1 text-center text-xs text-muted"
                  >
                    {msg.message}
                  </p>
                );
              }
              // new messages carry the sender's public id; older rows only have a name
              const mine = msg.senderId
                ? msg.senderId === selfId
                : msg.userName === currentUserName;
              return (
                <div
                  key={msg.id ?? `${msg.time}-${msg.userName}-${idx}`}
                  className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed"
                >
                  <span
                    className={`mr-2 break-all text-xs font-medium ${
                      mine ? "text-accent" : "text-muted"
                    }`}
                  >
                    {mine ? "You" : msg.userName}
                  </span>
                  <span className="mr-2 text-[10px] text-muted/60">
                    {formatTime(msg.time)}
                  </span>
                  <span className="text-fg/90">{msg.message}</span>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex shrink-0 gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message"
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3.5 py-2.5 text-base text-fg sm:text-sm placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="eyebrow shrink-0 rounded-lg px-3 text-accent transition-colors hover:text-fg disabled:text-muted/50"
            >
              Send
            </button>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm">Everyone controls playback</p>
            <p className="mt-1 text-xs text-muted">
              {sharedControl
                ? "Anyone can play, pause and seek."
                : "Only the admin can play, pause and seek."}
            </p>
          </div>
          {isAdmin ? (
            <button
              role="switch"
              aria-checked={sharedControl}
              aria-label="Everyone controls playback"
              onClick={onToggleControl}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                sharedControl ? "border-accent bg-accent/20" : "border-line bg-bg"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full transition-transform ${
                  sharedControl ? "translate-x-5 bg-accent" : "translate-x-0 bg-muted"
                }`}
              />
            </button>
          ) : (
            <span className="eyebrow shrink-0 text-muted">
              {sharedControl ? "On" : "Off"}
            </span>
          )}
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overflow-x-hidden">
          {users.map((user) => {
            const isMe = user.id === selfId;
            return (
              <li
                key={user.id ?? user.userName}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-raised text-xs font-medium uppercase">
                    {user.userName?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {user.userName}
                      {isMe && <span className="ml-2 text-xs text-muted">you</span>}
                    </p>
                    {user.isAdmin && (
                      <p className="eyebrow mt-1 text-accent">Admin</p>
                    )}
                  </div>
                </div>

                {isAdmin && !user.isAdmin && !isMe && (
                  <button
                    onClick={() =>
                      socket.emit("admin:transfer", {
                        roomId,
                        targetId: user.id,
                      })
                    }
                    className="eyebrow shrink-0 text-muted transition-colors hover:text-accent"
                  >
                    Make admin
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </div>
  );
}
