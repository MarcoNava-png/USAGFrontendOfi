"use client";

import { useEffect, useState } from "react";

import { Loader2, Search, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inscribirEstudianteDirecto, searchGroups } from "@/services/groups-service";
import { Group } from "@/types/group";

interface InscribirEnGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idEstudiante: number;
  nombreEstudiante: string;
  matricula: string;
  idPlanEstudios?: number;
  onSuccess: () => void;
}

export function InscribirEnGrupoModal({
  open,
  onOpenChange,
  idEstudiante,
  nombreEstudiante,
  matricula,
  idPlanEstudios,
  onSuccess,
}: InscribirEnGrupoModalProps) {
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<string>("");
  const [cuatrimestreFiltro, setCuatrimestreFiltro] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedGrupo("");
      setCuatrimestreFiltro("");
      setGrupos([]);
    }
  }, [open]);

  useEffect(() => {
    if (open && cuatrimestreFiltro) {
      buscarGrupos();
    }
  }, [cuatrimestreFiltro]);

  const buscarGrupos = async () => {
    setLoading(true);
    setSelectedGrupo("");
    try {
      const result = await searchGroups({
        idPlanEstudios,
        numeroCuatrimestre: cuatrimestreFiltro ? parseInt(cuatrimestreFiltro) : undefined,
      });
      setGrupos(result);
    } catch (error) {
      console.error("Error searching groups:", error);
      toast.error("Error al buscar grupos");
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGrupo) return;

    setSubmitting(true);
    try {
      const result = await inscribirEstudianteDirecto(
        parseInt(selectedGrupo),
        idEstudiante,
        "Reinscripción tras baja de grupo"
      );

      if (result.exitoso) {
        toast.success(`${nombreEstudiante} inscrito en ${result.nombreGrupo}`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.mensajeError ?? "Error al inscribir al estudiante");
      }
    } catch (error: unknown) {
      console.error("Error enrolling student:", error);
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err?.response?.data?.error ?? err?.message ?? "Error al inscribir al estudiante");
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
            <UserPlus className="w-5 h-5" style={{ color: "#14356F" }} />
            Inscribir en otro grupo
          </DialogTitle>
          <DialogDescription>
            Seleccione el grupo destino para el estudiante
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
              Cuatrimestre
            </label>
            <Select value={cuatrimestreFiltro} onValueChange={setCuatrimestreFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el cuatrimestre" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}° Cuatrimestre
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cuatrimestreFiltro && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Grupo destino
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando grupos...
                </div>
              ) : grupos.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  No se encontraron grupos para este cuatrimestre
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
                <div className="text-xs text-gray-500 space-y-0.5 rounded border p-2 bg-gray-50">
                  <p>Turno: {grupoSeleccionado.turno ?? "—"}</p>
                  <p>Período: {grupoSeleccionado.periodoAcademico ?? "—"}</p>
                  <p>Plan: {grupoSeleccionado.planEstudios ?? "—"}</p>
                </div>
              )}
            </div>
          )}
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
                Inscribiendo...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Inscribir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
