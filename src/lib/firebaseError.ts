export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
      return "Akun belum terdaftar. Silakan register terlebih dahulu.";
    case "auth/wrong-password":
      return "Password salah. Silakan coba lagi.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Silakan coba beberapa saat lagi.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}

export function getFirebaseErrorCode(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return "";
}
