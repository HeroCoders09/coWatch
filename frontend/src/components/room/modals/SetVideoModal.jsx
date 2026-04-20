import { useState } from "react";
import ModalShell from "./ModalShell";

export default function SetVideoModal({ open, onClose, onSetVideo }) {
  const [url, setUrl] = useState("");

  const handleSet = () => {
    console.log("BUTTON CLICKED");

    if (!url.trim()) return;

    if (typeof onSetVideo !== "function") {
      console.error("onSetVideo is not a function");
      return;
    }

    onSetVideo(url.trim());
    setUrl("");
    onClose();
  };

  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Set Video URL">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Paste YouTube / Drive URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xl bg-white/10 p-4 text-white outline-none"
        />

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="text-white/70">
            Cancel
          </button>

          <button
            onClick={handleSet}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-2 text-white"
          >
            Set Video
          </button>
        </div>
      </div>
    </ModalShell>
  );
}