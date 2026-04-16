"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Clock, LogOut } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { logout, refreshToken } from "@/services/auth-service";

function getTokenExpiration(): number | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

const INACTIVITY_WARNING_MS = 5 * 60 * 1000;
const COUNTDOWN_SECONDS = 60;
const TOKEN_RENEW_THRESHOLD_MS = 10 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

export function SessionExpirationModal() {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const isSuperAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard/super-admin");
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silentRefreshDoneRef = useRef(false);
  const modalOpenedAtRef = useRef<number | null>(null);
  const isLoggingOutRef = useRef(false);

  const doLogout = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setOpen(false);
    logout();
    router.push("/auth/v2/login");
  }, [router]);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetActivity, { passive: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetActivity);
      }
    };
  }, [resetActivity]);

  useEffect(() => {
    const handler = () => {
      if (isSuperAdmin) return;
      if (!open) {
        modalOpenedAtRef.current = Date.now();
        setRemaining(COUNTDOWN_SECONDS);
        setOpen(true);
      }
    };
    window.addEventListener("session-expired", handler);
    return () => window.removeEventListener("session-expired", handler);
  }, [open, isSuperAdmin]);

  const silentRefresh = useCallback(async () => {
    if (silentRefreshDoneRef.current) return;
    silentRefreshDoneRef.current = true;
    const result = await refreshToken();
    if (result.success) {
      silentRefreshDoneRef.current = false;
    }
  }, []);

  const check = useCallback(() => {
    if (isLoggingOutRef.current) return;
    if (isSuperAdmin) return;

    const exp = getTokenExpiration();
    if (!exp) return;

    const tokenRemaining = exp - Date.now();
    const inactiveMs = Date.now() - lastActivityRef.current;

    if (tokenRemaining <= 0) {
      if (!open) {
        modalOpenedAtRef.current = Date.now();
        setRemaining(COUNTDOWN_SECONDS);
        setOpen(true);
      }
      return;
    }

    if (inactiveMs < INACTIVITY_WARNING_MS && tokenRemaining <= TOKEN_RENEW_THRESHOLD_MS) {
      silentRefresh();
      return;
    }

    if (inactiveMs >= INACTIVITY_WARNING_MS && !open) {
      modalOpenedAtRef.current = Date.now();
      setRemaining(COUNTDOWN_SECONDS);
      setOpen(true);
      return;
    }

    if (open && modalOpenedAtRef.current) {
      const elapsed = Math.floor((Date.now() - modalOpenedAtRef.current) / 1000);
      const left = Math.max(0, COUNTDOWN_SECONDS - elapsed);
      setRemaining(left);

      if (left <= 0) {
        doLogout();
      }
    }
  }, [open, silentRefresh, doLogout]);

  useEffect(() => {
    intervalRef.current = setInterval(check, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await refreshToken();
    setRefreshing(false);

    if (result.success) {
      setOpen(false);
      modalOpenedAtRef.current = null;
      resetActivity();
      silentRefreshDoneRef.current = false;
      isLoggingOutRef.current = false;
      toast.success("Sesion renovada exitosamente");
    } else {
      toast.error("No se pudo renovar la sesion. Inicia sesion nuevamente.");
      doLogout();
    }
  };

  const handleLogout = () => {
    doLogout();
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            Sesion inactiva
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block text-sm">
              No hemos detectado actividad reciente. Tu sesion se cerrara automaticamente en:
            </span>
            <span className="block text-center text-3xl font-bold text-amber-600 font-mono">
              {remaining}s
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesion
          </Button>
          <AlertDialogAction
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto text-white"
            style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
          >
            {refreshing ? "Renovando..." : "Continuar trabajando"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
