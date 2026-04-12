import { X } from "lucide-react";

export default function ModalShell({ open, title, onClose, children, footer, maxWidth = "max-w-[700px]" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-140">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className={`w-full ${maxWidth} rounded-2xl border border-indigo-200/15 bg-linear-to-b from-[#0f1a43]/95 to-[#071333]/95 shadow-2xl`}>
          <div className="flex items-center justify-between px-6 pt-5">
            <h3 className="text-4xl font-bold text-white md:text-3xl">{title}</h3>
            <button onClick={onClose} className="rounded-lg p-2 text-white/70 hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
          <div className="px-6 pb-6 pt-4">{children}</div>
          {footer ? <div className="px-6 pb-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}