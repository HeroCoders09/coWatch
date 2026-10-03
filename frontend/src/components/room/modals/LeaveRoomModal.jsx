import ModalShell from "./ModalShell";
import Button from "../../ui/Button";

export default function LeaveRoomModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Leave room?"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Stay
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Leave
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        You can rejoin any time with the room link or code.
      </p>
    </ModalShell>
  );
}
