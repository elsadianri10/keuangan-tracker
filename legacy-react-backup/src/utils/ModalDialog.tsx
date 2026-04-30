import React from "react";

interface WarningModalProps {
  show: boolean;
  message: string;
  subMessage?: string;
  onClose: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  show,
  message,
  subMessage,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold text-yellow-600 mb-4">Peringatan</h2>
        <p className="mb-4">{message}</p>
        {subMessage && (
          <p className="text-gray-500 text-sm mb-4">{subMessage}</p>
        )}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  show: boolean;
  message: string;
  subMessage?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  message,
  subMessage,
  onClose,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold text-blue-600 mb-4">Konfirmasi</h2>
        <p className="mb-4">{message}</p>
        {subMessage && (
          <p className="text-gray-500 text-sm mb-4">{subMessage}</p>
        )}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-gray-500 transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
