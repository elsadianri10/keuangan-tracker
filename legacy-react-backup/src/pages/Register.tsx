import { useState, FormEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff , UserPlus } from "lucide-react";
import Snackbar from "../utils/Snackbar";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSnackbarMessage("Akun berhasil dibuat");
      setSnackbarType("success");
      setSnackbarVisible(true);
      setTimeout(() => {
        setSnackbarVisible(false);
        navigate("/login");
      }, 1000);
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
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md relative"
      >
        {snackbarVisible && (
          <Snackbar message={snackbarMessage} type={snackbarType} />
        )}

        <h2 className="text-2xl font-bold mb-4 mt-6">Register</h2>

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

        {/* Button - Register */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded mb-2 flex items-center justify-center gap-2 hover:bg-blue-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Register
        </button>

        {/* Text Button - Login */}
        <p className="text-sm text-center">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
