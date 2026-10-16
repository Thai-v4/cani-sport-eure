"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Action irréversible (suppression) : bouton rouge. Vrai par défaut, la modale sert surtout aux suppressions. */
  destructive?: boolean;
}

// Confirmation avant une action : le message dit ce qui va se passer, Échap annule
export default function ModalConfirm({
  isOpen,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  destructive = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-titre"
        aria-describedby="confirmation-message"
        className="w-full max-w-md border border-rule bg-paper p-6 shadow-overlay"
      >
        <h2 id="confirmation-titre" className="text-xl font-bold">
          {title}
        </h2>
        <p id="confirmation-message" className="mt-3 text-ink-2">
          {message}
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" autoFocus onClick={onCancel} className="btn-quiet">
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className={destructive ? "btn-danger" : "btn-line"}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
