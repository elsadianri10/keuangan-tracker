"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

type BaseModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
};

export default function BaseModal({
  open,
  title,
  onClose,
  children,
  maxWidthClassName = "max-w-2xl",
}: BaseModalProps) {
  useEffect(() => {
    if (!open) return;

    const { body, documentElement } = document;
    const scrollBarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const currentCount = Number(body.dataset.modalOpenCount ?? "0");

    body.dataset.modalOpenCount = String(currentCount + 1);
    body.style.overflow = "hidden";

    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      const nextCount = Number(body.dataset.modalOpenCount ?? "1") - 1;

      if (nextCount <= 0) {
        delete body.dataset.modalOpenCount;
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPaddingRight;
      } else {
        body.dataset.modalOpenCount = String(nextCount);
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-900/70 p-4">
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 ${maxWidthClassName}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {title ? (
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        ) : null}

        {children}
      </div>
    </div>
  );
}
