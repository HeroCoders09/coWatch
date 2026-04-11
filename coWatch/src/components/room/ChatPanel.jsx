import { useMemo, useState } from "react";
import { MessageSquare, Smile, Send, Users } from "lucide-react";
import UsersList from "./UsersList";

export default function ChatPanel({ currentUserName = "You", roomId = "ROOMID", roomName = "Room" }) {
  const [activeTab, setActiveTab] = useState("chat");

  const users = useMemo(
    () => [
      { id: "me", name: currentUserName, isAdmin: true, isYou: true, online: true },
      // frontend-only placeholders for now
      { id: "u2", name: "Alex", isAdmin: false, isYou: false, online: true },
      { id: "u3", name: "Sarah", isAdmin: false, isYou: false, online: true },
    ],
    [currentUserName]
  );

  return (
    <aside className="border-l border-white/10 bg-[#0d1640]/70">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
            activeTab === "chat" ? "bg-cyan-500/20 text-white" : "text-white/70"
          }`}
        >
          <MessageSquare size={14} className="mr-1 inline" />
          Chat
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
            activeTab === "users" ? "bg-cyan-500/20 text-white" : "text-white/70"
          }`}
        >
          <Users size={14} className="mr-1 inline" />
          Users ({users.length})
        </button>
      </div>

      <div className="h-[calc(100%-128px)] overflow-y-auto p-4">
        {activeTab === "chat" ? (
          <div className="space-y-3">
            <div className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-white/50">
              Room "{roomName}" ready. Share Room ID: {roomId}
            </div>
          </div>
        ) : (
          <UsersList users={users} />
        )}
      </div>

      <div className="flex h-16 items-center gap-2 border-t border-white/10 px-3">
        <button className="text-white/60">
          <Smile size={18} />
        </button>
        <input
          placeholder="Type a message..."
          className="h-10 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 outline-none"
        />
        <button className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-r from-cyan-400 to-fuchsia-500">
          <Send size={15} />
        </button>
      </div>
    </aside>
  );
}