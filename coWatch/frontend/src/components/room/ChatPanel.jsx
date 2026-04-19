import { useState, useEffect } from "react";
import { socket } from "../../services/socket";

export default function ChatPanel({
  users = [],
  roomId,
  currentUserName,
}) {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const isAdmin = users.some(
    (u) => u.userName === currentUserName && u.isAdmin
  );

  useEffect(() => {
    // ✅ replace full list on join/rejoin
    const handleHistory = (items) => {
      setMessages(Array.isArray(items) ? items : []);
    };

    // ✅ append only new incoming message
    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat:history", handleHistory);
    socket.on("chat:message", handleMessage);

    return () => {
      socket.off("chat:history", handleHistory);
      socket.off("chat:message", handleMessage);
    };
  }, []);

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
    <div className="flex flex-col h-full bg-[#0b1024] border-l border-white/10">
      <div className="flex p-3 border-b border-white/10 gap-2">
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
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-white/40 text-sm mt-10">
                No messages yet
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className="text-sm">
                <span className="text-cyan-400 font-medium">
                  {msg.userName === currentUserName ? "You" : msg.userName}:
                </span>{" "}
                {msg.message}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-cyan-400"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              onClick={sendMessage}
              className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Send
            </button>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.userName}
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition p-3 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 flex items-center justify-center font-bold text-black">
                  {user.userName[0].toUpperCase()}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.userName}</span>

                    {user.userName === currentUserName && (
                      <span className="text-cyan-400 text-xs">(You)</span>
                    )}

                    {user.isAdmin && (
                      <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                        👑 Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin &&
                !user.isAdmin &&
                user.userName !== currentUserName && (
                  <button
                    onClick={() =>
                      socket.emit("admin:transfer", {
                        roomId,
                        targetUserName: user.userName,
                      })
                    }
                    className="text-xs bg-yellow-500 hover:bg-yellow-400 px-3 py-1 rounded-lg font-medium"
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