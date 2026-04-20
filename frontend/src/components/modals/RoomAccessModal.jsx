import { useEffect, useState } from "react";
import { X, User, Video } from "lucide-react";

function Field({ label, icon, placeholder, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-white/85">{label}</label>
      <div className="flex h-12 items-center gap-3 rounded-xl border border-indigo-200/20 bg-white/3 px-3">
        <span className="text-white/55">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-base text-white placeholder:text-white/45 outline-none"
        />
      </div>
    </div>
  );
}

function RoomAccessModalContent({
  mode = "create",
  onClose,
  onSuccess,
  prefillRoomId = "",
}) {
  const isCreate = mode === "create";

  const [name, setName] = useState("");
  const [roomNameOrId, setRoomNameOrId] = useState(
    isCreate ? "" : prefillRoomId
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isCreate) setRoomNameOrId(prefillRoomId || "");
  }, [isCreate, prefillRoomId]);

  const handleSubmit = () => {
    if (!name.trim() || !roomNameOrId.trim()) {
      setError("Please fill all fields.");
      return;
    }

    setError("");

    const payload = {
      name: name.trim(),
      ...(isCreate
        ? { roomName: roomNameOrId.trim() }
        : { roomId: roomNameOrId.trim().toUpperCase() }),
    };

    onSuccess?.(payload, mode);
  };

  return (
    <div className="fixed inset-0 z-120">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-115 rounded-2xl border border-indigo-200/20 bg-linear-to-b from-[#101a44]/95 to-[#081433]/95 p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">
              {isCreate ? "Create a Room" : "Join a Room"}
            </h2>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <Field
              label="Your Name"
              icon={<User size={18} />}
              placeholder="Enter your display name"
              value={name}
              onChange={setName}
            />
            <Field
              label={isCreate ? "Room Name" : "Room ID"}
              icon={<Video size={18} />}
              placeholder={isCreate ? "Give your room a name" : "Enter the room ID"}
              value={roomNameOrId}
              onChange={setRoomNameOrId}
            />
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="w-[42%] rounded-xl px-4 py-3 text-lg font-medium text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="w-[58%] rounded-xl bg-linear-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-lg font-semibold text-white"
            >
              {isCreate ? "Create Room" : "Join Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomAccessModal({
  open,
  mode = "create",
  onClose,
  onSuccess,
  prefillRoomId = "",
}) {
  if (!open) return null;
  return (
    <RoomAccessModalContent
      key={`${mode}-${open ? "open" : "closed"}-${prefillRoomId}`}
      mode={mode}
      onClose={onClose}
      onSuccess={onSuccess}
      prefillRoomId={prefillRoomId}
    />
  );
}