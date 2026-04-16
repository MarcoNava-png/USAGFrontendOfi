import { useState } from "react";

import {
  login as loginService,
  logout as logoutService,
  forgotPassword as forgotPasswordService,
} from "@/services/auth-service";

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginService(data);
      setLoading(false);
      if (!res.success) setError(res.error ?? "Login failed");
      return res;
    } catch (err: unknown) {
      setLoading(false);
      let message = "Unknown error";
      if (err instanceof Error) message = err.message;
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    logoutService();
  };

  const forgotPassword = async (data: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await forgotPasswordService(data);
      setLoading(false);
      if (!res.success) setError(res.error ?? "Error al recuperar contraseña");
      return res;
    } catch (err: unknown) {
      setLoading(false);
      let message = "Unknown error";
      if (err instanceof Error) message = err.message;
      setError(message);
      return { success: false, error: message };
    }
  };

  return { login, logout, forgotPassword, loading, error };
}
