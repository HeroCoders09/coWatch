import { useState } from "react";
import ModalShell from "./ModalShell";
import Button from "../../ui/Button";

export default function SetVideoModal({ open, onClose, onSetVideo }) {
  const [url, setUrl] = useState("");

  const handleSet = () => {
    if (!url.trim()) return;
    if (typeof onSetVideo !== "function") return;

    onSetVideo(url.trim());
    setUrl("");
    onClose();
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Set video"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSet} disabled={!url.trim()}>
            Set video
          </Button>
        </div>
      }
    >
      <label className="eyebrow mb-3 block text-muted">Video URL</label>
      <input
        autoFocus
        type="text"
        placeholder="YouTube, Drive or direct video link"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSet()}
        className="w-full rounded-lg border border-line bg-bg px-3.5 py-3 text-sm text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-accent"
      />
    </ModalShell>
  );
}
