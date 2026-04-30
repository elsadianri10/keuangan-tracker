"use client";

import { Eye, EyeOff, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Snackbar from "@/components/finance/shared/Snackbar";
import { auth } from "@/lib/firebase";
import { getFirebaseErrorCode, getFirebaseErrorMessage } from "@/lib/firebaseError";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSnackbarMessage("Akun berhasil dibuat");
      setSnackbarType("success");
      setSnackbarVisible(true);

      setTimeout(() => {
        setSnackbarVisible(false);
        router.push("/login");
      }, 1000);
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
          onSubmit={handleRegister}
          className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          {snackbarVisible ? (
            <Snackbar message={snackbarMessage} type={snackbarType} />
          ) : null}

          <h1 className="mb-6 mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Register
          </h1>

          <input
            type="email"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Register
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-brand-500 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
