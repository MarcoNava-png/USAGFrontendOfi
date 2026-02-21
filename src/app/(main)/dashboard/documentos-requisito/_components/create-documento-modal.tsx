"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDocumentoRequisito } from "@/services/documento-requisito-service";
import type { DocumentoRequisito } from "@/types/documento-requisito";

interface CreateDocumentoModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (doc: DocumentoRequisito) => void;
}

export function CreateDocumentoModal({
  open,
  onClose,
  onCreate,
}: CreateDocumentoModalProps) {
  const [clave, setClave] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esObligatorio, setEsObligatorio] = useState(false);
  const [orden, setOrden] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setClave("");
    setDescripcion("");
    setEsObligatorio(false);
    setOrden("");
    setError(null);
  };

  const validate = () => {
    if (!clave.trim()) return "La clave es obligatoria";
    if (clave.trim().length > 50) return "La clave no puede exceder 50 caracteres";
    if (!descripcion.trim()) return "La descripción es obligatoria";
    if (descripcion.trim().length > 200)
      return "La descripción no puede exceder 200 caracteres";
    if (!orden.trim() || isNaN(Number(orden)) || Number(orden) < 1)
      return "El orden debe ser un número mayor a 0";
    return null;
  };

  const handleCreate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const doc = await createDocumentoRequisito({
        clave: clave.trim(),
        descripcion: descripcion.trim(),
        esObligatorio,
        orden: Number(orden),
      });
      resetForm();
      onCreate(doc);
      onClose();
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        if (axiosErr.response?.data?.message) {
          setError(axiosErr.response.data.message);
          return;
        }
      }
      setError("Error al crear documento requisito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby="create-documento-description"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Nuevo Documento Requisito</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {error && (
            <div className="text-destructive mb-2 text-sm">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Clave</Label>
            <Input
              placeholder="Ej: CURP, ACTA-NAC"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              placeholder="Ej: Acta de Nacimiento"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="esObligatorio"
                checked={esObligatorio}
                onCheckedChange={(checked) =>
                  setEsObligatorio(checked === true)
                }
              />
              <Label htmlFor="esObligatorio" className="cursor-pointer">
                Obligatorio por defecto
              </Label>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creando..." : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
