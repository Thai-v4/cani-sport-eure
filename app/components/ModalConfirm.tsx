import React from "react";
import { Button } from "@/app/components/button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalConfirm: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed z-9999 inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-md text-center">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="flex justify-center gap-4">
          <Button className="bg-blue-900 text-white px-4 py-2 rounded-full" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button className="bg-blue-900 text-white px-4 py-2 rounded-full" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;
