"use client";

import { useCallback, useEffect, useState } from "react";

import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePermissions } from "@/hooks/use-permissions";
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
  onSuccess,
}: CambioGrupoModalProps) {
  const { hasPermission } = usePermissions();
  const puedeAvanzado = hasPermission("cambio-grupo.avanzado", "view");

  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<string>("");
  const [modoAvanzado, setModoAvanzado] = useState(false);
  const [incluirOtrosPlanes, setIncluirOtrosPlanes] = useState(false);

  const cuatriDeGrupo = (g: Group): number => {
    const c = g.codigoGrupo ? parseInt(g.codigoGrupo.charAt(0), 10) : NaN;
    return Number.isNaN(c) ? (g.consecutivoPeriodicidad ?? 0) : c;
  };

  const periodoConAnio = (g: Group): string => {
    const anio = g.periodoInicio ? g.periodoInicio.substring(0, 4) : g.periodoFin ? g.periodoFin.substring(0, 4) : "";
    return anio ? `${g.periodoAcademico} ${anio}` : g.periodoAcademico;
  };

  const loadGrupos = useCallback(async () => {
    setLoading(true);
    try {
      const filtros = modoAvanzado
        ? { idPlanEstudios: incluirOtrosPlanes ? undefined : idPlanEstudios }
        : { idPlanEstudios, numeroCuatrimestre };

      const result = await searchGroups(filtros);
      setGrupos(result.filter((g) => g.idGrupo !== idGrupoActual));
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Error al cargar los grupos disponibles");
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }, [modoAvanzado, incluirOtrosPlanes, idPlanEstudios, numeroCuatrimestre, idGrupoActual]);

  useEffect(() => {
    if (open) {
      setSelectedGrupo("");
      loadGrupos();
    }
  }, [open, loadGrupos]);

  useEffect(() => {
    if (!modoAvanzado) setIncluirOtrosPlanes(false);
  }, [modoAvanzado]);

  const handleSubmit = async () => {
    if (!selectedGrupo) return;

    setSubmitting(true);
    try {
      const result = await cambiarEstudianteDeGrupo({
        idEstudianteGrupo,
        idGrupoDestino: parseInt(selectedGrupo),
        avanzado: modoAvanzado,
      });

      if (result.exitoso) {
        toast.success(
          modoAvanzado && (result.materiasReinscritas ?? 0) > 0
            ? `${result.mensaje} · ${result.materiasReinscritas} materias reinscritas`
            : result.mensaje,
        );
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
  const cambiaCuatri = grupoSeleccionado ? cuatriDeGrupo(grupoSeleccionado) !== numeroCuatrimestre : false;
  const cambiaPlan = grupoSeleccionado ? grupoSeleccionado.idPlanEstudios !== idPlanEstudios : false;
  const mostrarAdvertencia = modoAvanzado && grupoSeleccionado && (cambiaCuatri || cambiaPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" style={{ color: "#14356F" }} />
            Cambiar de Grupo
          </DialogTitle>
          <DialogDescription>
            {modoAvanzado
              ? "Cambio avanzado: puedes mover al alumno a otro cuatrimestre o plan."
              : "Transferir estudiante a otro grupo del mismo cuatrimestre."}
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

          {puedeAvanzado && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-amber-900 cursor-pointer">
                <Checkbox
                  checked={modoAvanzado}
                  onCheckedChange={(v) => setModoAvanzado(v === true)}
                />
                Cambio avanzado (otro cuatrimestre / plan)
              </label>
              {modoAvanzado && (
                <label className="flex items-center gap-2 text-xs text-amber-800 cursor-pointer pl-6">
                  <Checkbox
                    checked={incluirOtrosPlanes}
                    onCheckedChange={(v) => setIncluirOtrosPlanes(v === true)}
                  />
                  Incluir grupos de otros planes de estudio
                </label>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Grupo destino</label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando grupos disponibles...
              </div>
            ) : grupos.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No hay otros grupos disponibles.</p>
            ) : (
              <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {grupos.map((g) => (
                    <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                      <div className="flex flex-col gap-0.5 py-0.5">
                        <span className="font-semibold">
                          {g.codigoGrupo} — {g.nombreGrupo}{" "}
                          <span className="font-normal text-gray-500">
                            ({g.estudiantesInscritos ?? 0}/{g.capacidadMaxima})
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {[
                            g.campus,
                            g.planEstudios,
                            `${cuatriDeGrupo(g)}° cuatri`,
                            g.turno,
                            periodoConAnio(g),
                          ]
                            .filter(Boolean)
                            .join("  ·  ")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {grupoSeleccionado && (
              <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
                <p className="font-semibold text-gray-900">
                  {grupoSeleccionado.codigoGrupo} — {grupoSeleccionado.nombreGrupo}
                </p>
                <p>Campus: {grupoSeleccionado.campus ?? "—"}</p>
                <p>Carrera: {grupoSeleccionado.planEstudios ?? "—"}</p>
                <p>Cuatrimestre: {cuatriDeGrupo(grupoSeleccionado)}°</p>
                <p>Turno: {grupoSeleccionado.turno ?? "—"}</p>
                <p>Período: {periodoConAnio(grupoSeleccionado)}</p>
                <p>
                  Ocupación: {grupoSeleccionado.estudiantesInscritos ?? 0}/{grupoSeleccionado.capacidadMaxima}
                </p>
              </div>
            )}
          </div>

          {mostrarAdvertencia && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                Se darán de baja las materias actuales y se inscribirán las del grupo destino.
                {cambiaPlan ? " Además, se cambiará la carrera del alumno al plan del grupo destino." : ""}
                {" "}Si el alumno tiene calificaciones o asistencia en el grupo actual, ese historial quedará inactivo.
              </p>
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
            style={{ backgroundColor: mostrarAdvertencia ? "#B91C1C" : "#14356F" }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cambiando...
              </>
            ) : mostrarAdvertencia ? (
              "Confirmar cambio avanzado"
            ) : (
              "Cambiar de grupo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
