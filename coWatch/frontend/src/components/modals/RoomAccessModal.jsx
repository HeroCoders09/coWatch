import { useState } from "react";
import { X, User, Video, Lock, Shield } from "lucide-react";

function randomCaptcha() {
  const a = Math.floor(Math.random() * 8) + 1;
  const b = Math.floor(Math.random() * 8) + 1;
  return { a, b, answer: a + b };
}

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

function RoomAccessModalContent({ mode = "create", onClose, onSuccess }) {
  const isCreate = mode === "create";

  const [captcha] = useState(() => randomCaptcha());
  const [name, setName] = useState("");
  const [roomNameOrId, setRoomNameOrId] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const verifyCaptcha = () => {
    if (Number(captchaInput) === captcha.answer) {
      setVerified(true);
      setError("");
    } else {
      setVerified(false);
      setError("Incorrect answer. Please try again.");
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !roomNameOrId.trim() || !password.trim()) {
      setError("Please fill all fields.");
      return;
    }
    if (!verified) {
      setError("Please complete security verification.");
      return;
    }

    const payload = {
      name: name.trim(),
      password: password.trim(),
      ...(isCreate ? { roomName: roomNameOrId.trim() } : { roomId: roomNameOrId.trim().toUpperCase() }),
    };

    onSuccess?.(payload, mode);
  };

  return (
    <div className="fixed inset-0 z-120">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-115 rounded-2xl border border-indigo-200/20 bg-linear-to-b from-[#101a44]/95 to-[#081433]/95 p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">{isCreate ? "Create a Room" : "Join a Room"}</h2>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <Field label="Your Name" icon={<User size={18} />} placeholder="Enter your display name" value={name} onChange={setName} />
            <Field
              label={isCreate ? "Room Name" : "Room ID"}
              icon={<Video size={18} />}
              placeholder={isCreate ? "Give your room a name" : "Enter the room ID"}
              value={roomNameOrId}
              onChange={setRoomNameOrId}
            />
            <Field
              label="Room Password"
              icon={<Lock size={18} />}
              placeholder={isCreate ? "Set a password for your room" : "Enter the room password"}
              value={password}
              onChange={setPassword}
              type="password"
            />

            <div className="rounded-xl border border-indigo-200/20 bg-white/3 p-4">
              <div className="mb-3 flex items-center gap-2 text-white/90">
                <Shield size={17} />
                <span className="text-sm font-medium">Security Verification</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="min-w-25 text-3xl text-white">{captcha.a} + {captcha.b} = ?</p>
                <input
                  type="number"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="h-11 w-20 rounded-lg border border-indigo-200/20 bg-slate-700/60 px-2 text-center text-white outline-none focus:border-fuchsia-400/60"
                />
                <button onClick={verifyCaptcha} className="h-11 rounded-lg bg-slate-600 px-4 text-sm font-semibold text-white hover:bg-slate-500">
                  Verify
                </button>
              </div>
              {verified && <p className="mt-2 text-xs text-emerald-400">Verified ✓</p>}
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={onClose} className="w-[42%] rounded-xl px-4 py-3 text-lg font-medium text-white/80 hover:bg-white/10">Cancel</button>
            <button onClick={handleSubmit} className="w-[58%] rounded-xl bg-linear-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-lg font-semibold text-white">
              {isCreate ? "Create Room" : "Join Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomAccessModal({ open, mode = "create", onClose, onSuccess }) {
  if (!open) return null;
  return <RoomAccessModalContent key={`${mode}-${open ? "open" : "closed"}`} mode={mode} onClose={onClose} onSuccess={onSuccess} />;
}