import { useMemo, useState } from "react";
import { X, Link2, Copy, Check, Mail } from "lucide-react";
import ModalShell from "./ModalShell";

export default function InviteModal({ open, onClose, roomId = "ADAF77CF" }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = useMemo(() => {
    // frontend-only link
    const base = window.location.origin;
    return `${base}/join/${roomId}`;
  }, [roomId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // no-op fallback for now
    }
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent("Join my CoWatch room");
    const body = encodeURIComponent(
      `Hey! Join my room on CoWatch.\n\nRoom ID: ${roomId}\nInvite Link: ${inviteLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Invite People"
      maxWidth="max-w-[560px]"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-white/85 hover:bg-white/10"
          >
            Close
          </button>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-400 to-fuchsia-500 px-5 py-2.5 font-semibold text-white"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-white/70">
        Share this room link with friends so they can join directly.
      </p>

      <label className="mb-2 block text-sm text-white/80">Room Invite Link</label>
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 p-2">
        <div className="flex min-h-10.5 flex-1 items-center gap-2 rounded-lg bg-black/20 px-3">
          <Link2 size={16} className="text-cyan-300" />
          <span className="truncate text-sm text-white/90">{inviteLink}</span>
        </div>
        <button
          onClick={copyLink}
          className="inline-flex h-10.5 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm text-white hover:bg-white/15"
        >
          {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-4">
        <button
          onClick={shareByEmail}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/4 px-4 py-2.5 text-sm text-white/90 hover:bg-white/8"
        >
          <Mail size={15} />
          Share via Email
        </button>
      </div>
    </ModalShell>
  );
}