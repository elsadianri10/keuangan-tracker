import React from "react";

interface SnackbarProps {
  message: string;
  type: "success" | "error";
}

const Snackbar: React.FC<SnackbarProps> = ({ message, type }) => {
  return (
    <div
      className={`absolute top-0 left-0 right-0 text-sm text-center py-2 rounded-t-xl z-10
        ${type === "success" ? "bg-green-500 text-white" : "bg-red-100 text-red-700"}`}
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
};

export default Snackbar;
