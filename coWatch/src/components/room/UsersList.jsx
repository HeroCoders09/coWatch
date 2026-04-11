import { Crown, UserCircle2, Wifi } from "lucide-react";

export default function UsersList({ users = [] }) {
  if (!users.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-white/50">
        No users joined yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <UserCircle2 size={18} className="text-cyan-300" />
            <div>
              <p className="text-sm font-semibold text-white">{u.name}</p>
              <p className="text-xs text-white/45">{u.isYou ? "You" : "Participant"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {u.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/15 px-2 py-1 text-[11px] text-yellow-300">
                <Crown size={12} />
                Admin
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
                u.online
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-slate-500/20 text-slate-300"
              }`}
            >
              <Wifi size={12} />
              {u.online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}