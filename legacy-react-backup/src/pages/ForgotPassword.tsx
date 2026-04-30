import { useState, FormEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";
import Snackbar from "../utils/Snackbar";

export default function ForgotPassword() {
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
    } catch (error: any) {
      setSnackbarMessage(error.message);
      setSnackbarType("error");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 4000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleResetPassword}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md relative"
      >
        {snackbarVisible && (
          <Snackbar message={snackbarMessage} type={snackbarType} />
        )}
        
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

        {/* Text Field - E-Mail */}
        <input
          type="email"
          className="w-full border p-2 mb-4"
          placeholder="Masukkan email Anda"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Button - Send E-Mail */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded mb-2 flex items-center justify-center gap-2 hover:bg-blue-700 transition"
        >
          <SendHorizonal className="w-4 h-4" />
          Kirim Link Reset
        </button>

        {/* Text Button - Back To Login */}
        <p className="text-sm text-center">
          <Link to="/login" className="text-blue-500 hover:underline">
            Kembali ke Login
          </Link>
        </p>
      </form>
    </div>
  );
}