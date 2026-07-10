"use client";

import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
  submitting = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={submitting ? () => {} : onCancel} title={title}>
      <div className="flex flex-col gap-5">
        <div className="text-sm text-fg-muted">{message}</div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone}
            size="lg"
            fullWidth
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
