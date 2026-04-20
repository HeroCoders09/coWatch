import ModalShell from "./ModalShell";

export default function LeaveRoomModal({
  open,
  onClose,
  onConfirm,
  isAdmin,
}) {
  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Leave Room?">
      <div className="space-y-4 text-white">
        
        <p>
          Are you sure you want to leave this room?
        </p>

        {isAdmin && (
          <p className="text-red-400">
            As the admin, leaving will end the session for everyone.
          </p>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            className="text-white/70 px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="bg-red-500 px-5 py-2 rounded-lg text-white"
          >
            Leave
          </button>
        </div>
      </div>
    </ModalShell>
  );
}