"use client";

import { useEffect, useState } from "react";

import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cambiarEstudianteDeGrupo, searchGroups } from "@/services/groups-service";
import { Group } from "@/types/group";

interface CambioGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idEstudianteGrupo: number;
  nombreEstudiante: string;
  matricula: string;
  idGrupoActual: number;
  numeroCuatrimestre: number;
  idPlanEstudios: number;
  idPeriodoAcademico?: number;
  onSuccess: () => void;
}

export function CambioGrupoModal({
  open,
  onOpenChange,
  idEstudianteGrupo,
  nombreEstudiante,
  matricula,
  idGrupoActual,
  numeroCuatrimestre,
  idPlanEstudios,
  idPeriodoAcademico,
  onSuccess,
}: CambioGrupoModalProps) {
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedGrupo("");
      loadGrupos();
    }
  }, [open]);

  const loadGrupos = async () => {
    setLoading(true);
    try {
      const result = await searchGroups({
        idPlanEstudios,
        numeroCuatrimestre,
      });

      const filtered = result.filter((g) => {
        if (g.idGrupo === idGrupoActual) return false;
        return true;
      });

      setGrupos(filtered);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Error al cargar los grupos disponibles");
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGrupo) return;

    setSubmitting(true);
    try {
      const result = await cambiarEstudianteDeGrupo({
        idEstudianteGrupo,
        idGrupoDestino: parseInt(selectedGrupo),
      });

      if (result.exitoso) {
        toast.success(result.mensaje);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.mensaje);
      }
    } catch (error: unknown) {
      console.error("Error changing group:", error);
      const err = error as { response?: { data?: { mensaje?: string } }; message?: string };
      const errorMessage = err?.response?.data?.mensaje ?? err?.message ?? "Error al cambiar de grupo";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const grupoSeleccionado = grupos.find((g) => g.idGrupo.toString() === selectedGrupo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" style={{ color: "#14356F" }} />
            Cambiar de Grupo
          </DialogTitle>
          <DialogDescription>
            Transferir estudiante a otro grupo del mismo cuatrimestre
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="font-semibold text-gray-900">{nombreEstudiante}</p>
            <Badge
              variant="outline"
              className="font-mono"
              style={{
                background: "rgba(20, 53, 111, 0.05)",
                color: "#14356F",
                borderColor: "rgba(20, 53, 111, 0.2)",
              }}
            >
              {matricula}
            </Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Grupo destino
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando grupos disponibles...
              </div>
            ) : grupos.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                No hay otros grupos disponibles en este cuatrimestre
              </p>
            ) : (
              <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                      {g.nombreGrupo} — {g.codigoGrupo} ({g.estudiantesInscritos ?? 0}/{g.capacidadMaxima})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {grupoSeleccionado && (
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>Turno: {grupoSeleccionado.turno ?? "—"}</p>
                <p>Período: {grupoSeleccionado.periodoAcademico ?? "—"}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedGrupo || submitting}
            style={{ backgroundColor: "#14356F" }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cambiando...
              </>
            ) : (
              "Cambiar de grupo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
