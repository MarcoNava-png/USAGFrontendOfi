"use client";

import { useEffect, useState } from "react";

import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import apiClient from "@/services/api-client";

export default function SsoPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      let token = "";
      if (typeof window !== "undefined") {
        const match = window.location.hash.match(/token=([^&]+)/);
        token = match ? decodeURIComponent(match[1]) : "";
      }

      if (!token) {
        setError("Enlace de acceso inválido o expirado.");
        return;
      }

      try {
        localStorage.setItem("access_token", token);
        document.cookie = `access_token=${token}; path=/; max-age=7200; SameSite=Strict; Secure`;
        window.history.replaceState(null, "", window.location.pathname);

        const { data } = await apiClient.post("/auth/refresh", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data?.isSuccess && data.data?.token) {
          localStorage.setItem("access_token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data));
          document.cookie = `access_token=${data.data.token}; path=/; max-age=86400; SameSite=Strict; Secure`;
        } else if (data?.data?.token) {
          localStorage.setItem("access_token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data));
          document.cookie = `access_token=${data.data.token}; path=/; max-age=86400; SameSite=Strict; Secure`;
        } else {
          localStorage.setItem("user", JSON.stringify({ token }));
        }

        window.location.replace("/dashboard");
      } catch {
        setError("No se pudo iniciar la sesión de soporte. El enlace pudo expirar.");
      }
    }

    run();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          {error ? (
            <>
              <ShieldAlert className="h-10 w-10 text-destructive" />
              <p className="text-lg font-semibold">No se pudo acceder</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => window.location.replace("/auth/v1/login")}>
                Ir al inicio de sesión
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg font-semibold">Ingresando a la escuela…</p>
              <p className="text-sm text-muted-foreground">Un momento, preparando tu sesión de soporte.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
