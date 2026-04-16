import { LoginResponse } from "@/types/auth";

import apiClient, { rawAxios } from "./api-client";

export async function login({ email, password }: { email: string; password: string }) {
  if (!email || !password) {
    return { success: false, error: "Invalid credentials" };
  }
  try {
    const { data }: { data: LoginResponse } = await apiClient.post("/auth/login", { email, password });
    if (data.isSuccess && data.data?.token) {
      localStorage.setItem("access_token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));
      document.cookie = `access_token=${data.data.token}; path=/; max-age=86400; SameSite=Strict; Secure`;
      if (data.data.mustChangePassword) {
        document.cookie = "must_change_password=1; path=/; max-age=86400; SameSite=Strict; Secure";
      }
      return { success: true, token: data.data.token, user: data.data };
    }
    return { success: false, error: data.messageError ?? "Credenciales incorrectas" };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { messageError?: string }; status?: number }; message?: string };
    if (err?.response?.data?.messageError) {
      return { success: false, error: err.response.data.messageError };
    }
    if (err?.response?.status === 429) {
      return { success: false, error: "Demasiados intentos. Espere un momento antes de intentar de nuevo." };
    }
    return { success: false, error: "Error de conexion. Verifique su red e intente de nuevo." };
  }
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Strict; Secure";
  document.cookie = "must_change_password=; path=/; max-age=0; SameSite=Strict; Secure";
}

export async function refreshToken(): Promise<{ success: boolean; error?: string }> {
  try {
    const currentToken = localStorage.getItem("access_token");
    if (!currentToken) return { success: false, error: "No hay token" };

    const { data }: { data: LoginResponse } = await rawAxios.post("/auth/refresh", null, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (data.isSuccess && data.data?.token) {
      localStorage.setItem("access_token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));
      document.cookie = `access_token=${data.data.token}; path=/; max-age=86400; SameSite=Strict; Secure`;
      return { success: true };
    }
    return { success: false, error: "No se pudo renovar la sesión" };
  } catch {
    return { success: false, error: "Error al renovar la sesión" };
  }
}

export async function changePassword({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) {
  const response = await apiClient.post("/auth/change-password", { currentPassword, newPassword });
  return response.data;
}

export async function forgotPassword({ email }: { email: string }) {
  if (!email) return { success: false, error: "El correo es requerido" };
  try {
    const { data } = await rawAxios.post("/auth/forgot-password", { email });
    return { success: data.success, message: data.message };
  } catch {
    return { success: false, error: "Error al procesar la solicitud" };
  }
}
