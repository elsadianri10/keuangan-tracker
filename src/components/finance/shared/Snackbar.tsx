"use client";

interface SnackbarProps {
  message: string;
  type: "success" | "error";
}

export default function Snackbar({ message, type }: SnackbarProps) {
  return (
    <div
      className={`absolute left-0 right-0 top-0 z-10 rounded-t-xl py-2 text-center text-sm ${
        type === "success"
          ? "bg-green-500 text-white"
          : "bg-red-100 text-red-700"
      }`}
    >
      {message}
    </div>
  );
}
