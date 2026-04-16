"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearEmpresa, actualizarEmpresa } from "@/services/empresas-service";
import { EmpresaDto } from "@/types/empresa";

interface EmpresaModalProps {
  open: boolean;
  onClose: () => void;
  empresaToEdit?: EmpresaDto | null;
  onSaved: () => void;
}

export function EmpresaModal({ open, onClose, empresaToEdit, onSaved }: EmpresaModalProps) {
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (empresaToEdit) {
      setNombre(empresaToEdit.nombre);
      setActivo(empresaToEdit.activo);
    } else {
      setNombre("");
      setActivo(true);
    }
  }, [empresaToEdit, open]);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setSaving(true);
    try {
      if (empresaToEdit) {
        await actualizarEmpresa(empresaToEdit.idEmpresa, { nombre: nombre.trim(), activo });
        toast.success("Empresa actualizada exitosamente");
      } else {
        await crearEmpresa({ nombre: nombre.trim(), activo });
        toast.success("Empresa creada exitosamente");
      }
      onSaved();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message ?? "Error al guardar la empresa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{empresaToEdit ? "Editar Empresa" : "Nueva Empresa"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Empresa</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la empresa"
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label className="text-sm font-medium">Activo</Label>
            <button
              type="button"
              role="switch"
              aria-checked={activo}
              onClick={() => setActivo(!activo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${activo ? "bg-primary" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${activo ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : empresaToEdit ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
