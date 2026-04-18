export default function ModalShell({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 bg-[#0b1736] p-6 rounded-2xl w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl">{title}</h2>
          <button onClick={onClose} className="text-white">✕</button>
        </div>

        {children}
      </div>
    </div>
  );
}