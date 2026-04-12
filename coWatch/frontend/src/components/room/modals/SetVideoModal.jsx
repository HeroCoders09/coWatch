import { useState } from "react";
import { Video } from "lucide-react";
import ModalShell from "./ModalShell";

export default function SetVideoModal({ open, onClose }) {
  const [url, setUrl] = useState("");
  const samples = ["Big Buck Bunny", "Elephant Dream", "Sintel", "Tears of Steel"];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Set Video URL"
      footer={
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 text-lg text-white/85">Cancel</button>
          <button className="rounded-2xl bg-linear-to-r from-cyan-400 to-fuchsia-500 px-8 py-3 text-lg font-semibold text-white">
            Set Video
          </button>
        </div>
      }
    >
      <label className="mb-2 block text-2xl text-white/85 md:text-base">Video URL</label>
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/20 bg-white/3 px-4">
        <Video size={18} className="text-white/55" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter video URL (MP4, WebM, etc.)"
          className="h-full w-full bg-transparent text-white placeholder:text-white/45 outline-none"
        />
      </div>

      <p className="mt-5 text-xl text-white/55 md:text-sm">Or choose a sample video:</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {samples.map((s) => (
          <button key={s} className="rounded-2xl bg-slate-600/40 px-4 py-4 text-left text-xl text-white/80 hover:bg-slate-500/50 md:text-base">
            {s}
          </button>
        ))}
      </div>
    </ModalShell>
  );
}