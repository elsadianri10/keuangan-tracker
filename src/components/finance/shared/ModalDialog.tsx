"use client";

type WarningModalProps = {
  show: boolean;
  message: string;
  subMessage?: string;
  onClose: () => void;
};

export const WarningModal = ({
  show,
  message,
  subMessage,
  onClose,
}: WarningModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-yellow-600">Peringatan</h2>
        <p className="mb-4 text-gray-800 dark:text-gray-100">{message}</p>
        {subMessage ? (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {subMessage}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

type ConfirmModalProps = {
  show: boolean;
  message: string;
  subMessage?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export const ConfirmModal = ({
  show,
  message,
  subMessage,
  onClose,
  onConfirm,
}: ConfirmModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-blue-600">Konfirmasi</h2>
        <p className="mb-4 text-gray-800 dark:text-gray-100">{message}</p>
        {subMessage ? (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {subMessage}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-500"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
