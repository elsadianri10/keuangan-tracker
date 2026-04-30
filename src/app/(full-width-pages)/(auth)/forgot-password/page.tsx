"use client";

import { SendHorizontal } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import Snackbar from "@/components/finance/shared/Snackbar";
import { auth } from "@/lib/firebase";
import { getFirebaseErrorCode, getFirebaseErrorMessage } from "@/lib/firebaseError";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success"
  );

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, email);
      setSnackbarMessage("Link reset password telah dikirim ke email Anda.");
      setSnackbarType("success");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 4000);
    } catch (error: unknown) {
      setSnackbarMessage(getFirebaseErrorMessage(getFirebaseErrorCode(error)));
      setSnackbarType("error");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 4000);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center lg:w-1/2">
      <div className="w-full max-w-md p-6">
        <form
          onSubmit={handleResetPassword}
          className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          {snackbarVisible ? (
            <Snackbar message={snackbarMessage} type={snackbarType} />
          ) : null}

          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h1>

          <input
            type="email"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            placeholder="Masukkan email Anda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            <SendHorizontal className="h-4 w-4" />
            Kirim Link Reset
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            <Link href="/login" className="text-brand-500 hover:underline">
              Kembali ke Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
