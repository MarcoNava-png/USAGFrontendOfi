"use client";

import { useState } from "react";

import { AlertTriangle, Loader2, LogOut, UserPlus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BajaEstudianteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombreEstudiante: string;
  matricula: string;
  nombreGrupo: string;
  onConfirmBaja: () => Promise<void>;
  onConfirmBajaEInscribir: () => Promise<void>;
}

export function BajaEstudianteDialog({
  open,
  onOpenChange,
  nombreEstudiante,
  matricula,
  nombreGrupo,
  onConfirmBaja,
  onConfirmBajaEInscribir,
}: BajaEstudianteDialogProps) {
  const [processing, setProcessing] = useState(false);

  const handleSoloBaja = async () => {
    setProcessing(true);
    try {
      await onConfirmBaja();
    } finally {
      setProcessing(false);
    }
  };

  const handleBajaEInscribir = async () => {
    setProcessing(true);
    try {
      await onConfirmBajaEInscribir();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Dar de baja del grupo
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-center space-y-3">
              <p>
                Se dará de baja al siguiente estudiante del grupo{" "}
                <span className="font-semibold text-foreground">{nombreGrupo}</span>:
              </p>
              <div className="rounded-lg border bg-gray-50 p-3 text-left">
                <p className="font-semibold text-foreground">{nombreEstudiante}</p>
                <Badge
                  variant="outline"
                  className="mt-1 font-mono"
                  style={{
                    background: "rgba(20, 53, 111, 0.05)",
                    color: "#14356F",
                    borderColor: "rgba(20, 53, 111, 0.2)",
                  }}
                >
                  {matricula}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Puede dar de baja al estudiante y opcionalmente inscribirlo en otro grupo.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleBajaEInscribir}
            disabled={processing}
            className="w-full"
            style={{ backgroundColor: "#14356F" }}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Dar de baja e inscribir en otro grupo
          </Button>
          <Button
            variant="destructive"
            onClick={handleSoloBaja}
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Solo dar de baja
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="w-full"
          >
            Cancelar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
