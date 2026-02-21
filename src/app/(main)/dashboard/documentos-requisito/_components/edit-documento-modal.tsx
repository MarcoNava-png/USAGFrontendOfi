"use client";

import React, { useEffect, useState } from "react";

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
import { updateDocumentoRequisito } from "@/services/documento-requisito-service";
import type { DocumentoRequisito } from "@/types/documento-requisito";

interface EditDocumentoModalProps {
  open: boolean;
  documento: DocumentoRequisito;
  onClose: () => void;
  onUpdate: (doc: DocumentoRequisito) => void;
}

export function EditDocumentoModal({
  open,
  documento,
  onClose,
  onUpdate,
}: EditDocumentoModalProps) {
  const [clave, setClave] = useState(documento.clave);
  const [descripcion, setDescripcion] = useState(documento.descripcion);
  const [esObligatorio, setEsObligatorio] = useState(documento.esObligatorio);
  const [orden, setOrden] = useState(String(documento.orden));
  const [activo, setActivo] = useState(documento.activo);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setClave(documento.clave);
    setDescripcion(documento.descripcion);
    setEsObligatorio(documento.esObligatorio);
    setOrden(String(documento.orden));
    setActivo(documento.activo);
    setError(null);
  }, [documento]);

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

  const handleUpdate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await updateDocumentoRequisito({
        idDocumentoRequisito: documento.idDocumentoRequisito,
        clave: clave.trim(),
        descripcion: descripcion.trim(),
        esObligatorio,
        orden: Number(orden),
        activo,
      });
      onUpdate(updated);
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
      setError("Error al actualizar documento requisito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby="edit-documento-description"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Editar Documento Requisito</DialogTitle>
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
                id="editEsObligatorio"
                checked={esObligatorio}
                onCheckedChange={(checked) =>
                  setEsObligatorio(checked === true)
                }
              />
              <Label htmlFor="editEsObligatorio" className="cursor-pointer">
                Obligatorio por defecto
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="editActivo"
              checked={activo}
              onCheckedChange={(checked) => setActivo(checked === true)}
            />
            <Label htmlFor="editActivo" className="cursor-pointer">
              Activo
            </Label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
