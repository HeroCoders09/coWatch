import { useMemo, useState } from "react";
import { Copy, Check, Mail, Share2 } from "lucide-react";
import ModalShell from "./ModalShell";
import Button from "../../ui/Button";
import { copyText } from "../../../utils/clipboard";

export default function InviteModal({ open, onClose, roomId = "" }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = useMemo(() => {
    const base = window.location.origin;
    return `${base}/?join=${encodeURIComponent(roomId)}`;
  }, [roomId]);

  const copyLink = async () => {
    const ok = await copyText(inviteLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // phones and some desktops open their own share sheet (WhatsApp, Messages...)
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nativeShare = async () => {
    try {
      await navigator.share({
        title: "Join my CoWatch room",
        text: "Watch together with me on CoWatch.",
        url: inviteLink,
      });
    } catch {
      // the user closed the share sheet: nothing to do
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
      title="Invite people"
      maxWidth="max-w-lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            {canShare && (
              <Button variant="ghost" onClick={nativeShare} icon={Share2}>
                Share
              </Button>
            )}
            <Button variant="ghost" onClick={shareByEmail} icon={Mail}>
              Email
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button onClick={copyLink} icon={copied ? Check : Copy}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Anyone with this link can join the room.
      </p>
      <div className="rounded-lg border border-line bg-bg px-3.5 py-3">
        <span className="block truncate text-sm text-fg">{inviteLink}</span>
      </div>
      <p className="eyebrow mt-5 text-muted">
        Room code <span className="ml-2 text-accent">{roomId}</span>
      </p>
    </ModalShell>
  );
}
