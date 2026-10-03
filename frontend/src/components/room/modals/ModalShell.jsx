import { useEffect } from "react";
import { X } from "lucide-react";

export default function ModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} rounded-xl border border-line bg-surface`}
      >
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-2xl tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="border-t border-line px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
