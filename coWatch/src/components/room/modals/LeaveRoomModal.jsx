import ModalShell from "./ModalShell";

export default function LeaveRoomModal({ open, onClose, onConfirm }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Leave Room?"
      maxWidth="max-w-[540px]"
      footer={
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 text-lg text-white/85">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 px-8 py-3 text-lg font-semibold text-white shadow-[0_0_24px_rgba(255,66,103,.45)]"
          >
            Leave Room
          </button>
        </div>
      }
    >
      <p className="max-w-115 text-2xl leading-relaxed text-white/80 md:text-base">
        Are you sure you want to leave this room?
        <br />
        As the admin, leaving will end the session for everyone.
      </p>
    </ModalShell>
  );
}