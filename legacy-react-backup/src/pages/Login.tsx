import { useState, FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff , LogIn } from "lucide-react";
import { getFirebaseErrorMessage } from "../utils/firebaseError";
import Snackbar from "../utils/Snackbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSnackbarMessage("Berhasil Login");
      setSnackbarType("success");
      setSnackbarVisible(true);
      setTimeout(() => {
        setSnackbarVisible(false);
        navigate("/");
      }, 1000);
    } catch (error: any) {
      const message = getFirebaseErrorMessage(error.code);
      setSnackbarMessage(message);
      setSnackbarType("error");
      setSnackbarVisible(true);
      setTimeout(() => setSnackbarVisible(false), 4000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md relative"
      >
        {snackbarVisible && (
          <Snackbar message={snackbarMessage} type={snackbarType} />
        )}

        <h2 className="text-2xl font-bold mb-4 mt-6">Login</h2>

        {/* Text Field - E-Mail */}
        <input
          type="email"
          className="w-full border p-2 mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Text Field - Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border p-2 pr-10"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* Icon Button - Visibility */}
          <button
            type="button"
            className="absolute right-2 top-2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Text Button - Forgot Password */}
        <p className="text-sm text-center mb-2">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">
            Lupa Password?
          </Link>
        </p>

        {/* Button - Log In */}
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded mb-2 flex items-center justify-center gap-2 hover:bg-green-700 transition"
        >
          <LogIn className="w-4 h-4" />
          Login
        </button>

        {/* Text Button - Register */}
        <p className="text-sm text-center">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
