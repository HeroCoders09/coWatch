import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button";

function Field({ label, placeholder, value, onChange, autoFocus, maxLength }) {
  return (
    <div>
      <label className="eyebrow mb-3 block text-muted">{label}</label>
      <input
        autoFocus={autoFocus}
        maxLength={maxLength}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-bg px-3.5 py-3 text-sm text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}

function RoomAccessModalContent({
  mode = "create",
  onClose,
  onSuccess,
  prefillRoomId = "",
  initialError = "",
}) {
  const isCreate = mode === "create";

  const [name, setName] = useState("");
  const [roomNameOrId, setRoomNameOrId] = useState(
    isCreate ? "" : prefillRoomId
  );
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (!isCreate) setRoomNameOrId(prefillRoomId || "");
  }, [isCreate, prefillRoomId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = () => {
    if (!name.trim() || !roomNameOrId.trim()) {
      setError("Please fill in both fields.");
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
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-xl border border-line bg-surface"
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-3xl tracking-tight">
            {isCreate ? "Create a room" : "Join a room"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="space-y-5 px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Field
            autoFocus
            label="Your name"
            placeholder="How should others see you?"
            value={name}
            onChange={setName}
            maxLength={40}
          />
          <Field
            label={isCreate ? "Room name" : "Room code"}
            placeholder={isCreate ? "Friday movie night" : "Paste the room code"}
            value={roomNameOrId}
            onChange={setRoomNameOrId}
            maxLength={isCreate ? 60 : 64}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isCreate ? "Create room" : "Join room"}</Button>
          </div>
        </form>
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
  initialError = "",
}) {
  if (!open) return null;
  return (
    <RoomAccessModalContent
      key={`${mode}-${open ? "open" : "closed"}-${prefillRoomId}`}
      mode={mode}
      onClose={onClose}
      onSuccess={onSuccess}
      prefillRoomId={prefillRoomId}
      initialError={initialError}
    />
  );
}
