import {socket} from "../../services/socket";

function getInitial(name = "") {
  return name.charAt(0).toUpperCase();
}

export default function UsersList({
  users = [],
  currentUserName = "",
  roomId,
  isAdmin,
}) {
  return (
    <div className="space-y-3">
      {users.map((user) => {
        const isMe = user.userName === currentUserName;

        return (
          <div
            key={user.socketId}
            className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 flex items-center justify-center text-black font-bold">
                  {getInitial(user.userName)}
                </div>

                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border border-[#0d1640]" />
              </div>

              <div className="flex items-center gap-2">
                <span>{user.userName}</span>

                {isMe && (
                  <span className="text-xs text-cyan-400">(You)</span>
                )}

                {user.isAdmin && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-[2px] rounded-full">
                    👑 Admin
                  </span>
                )}
              </div>
            </div>

            {isAdmin && user.socketId !== socket.id && (
              <button
                onClick={() =>
                  socket.emit("admin:transfer", {
                    roomId,
                    targetSocketId: user.socketId,
                  })
                }
                className="text-xs bg-yellow-500 px-3 py-1 rounded"
              >
                Make Admin
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}