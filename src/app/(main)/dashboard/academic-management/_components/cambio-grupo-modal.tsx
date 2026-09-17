"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AlertTriangle, ArrowRight, Loader2, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/use-permissions";
import { formatPeriodoLabel } from "@/services/academic-period-service";
import { getCampusList } from "@/services/campus-service";
import { getAcademicPeriods, getStudyPlans } from "@/services/catalogs-service";
import { cambiarEstudianteDeGrupo, searchGroups } from "@/services/groups-service";
import { Campus } from "@/types/campus";
import { AcademicPeriod, StudyPlan } from "@/types/catalog";
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
  const { hasPermission } = usePermissions();
  const puedeAvanzado = hasPermission("cambio-grupo.avanzado", "view");

  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<string>("");
  const [modoAvanzado, setModoAvanzado] = useState(false);

  // Catálogos para los filtros
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [planes, setPlanes] = useState<StudyPlan[]>([]);
  const [periodos, setPeriodos] = useState<AcademicPeriod[]>([]);

  // Filtros del grupo destino
  const [filtroCampus, setFiltroCampus] = useState<string>("all");
  const [filtroPlan, setFiltroPlan] = useState<string>(String(idPlanEstudios));
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>(idPeriodoAcademico ? String(idPeriodoAcademico) : "all");
  const [busqueda, setBusqueda] = useState<string>("");

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
      const result = await searchGroups({
        idPlanEstudios: filtroPlan !== "all" ? Number(filtroPlan) : undefined,
        idPeriodoAcademico: filtroPeriodo !== "all" ? Number(filtroPeriodo) : undefined,
        numeroCuatrimestre: modoAvanzado ? undefined : numeroCuatrimestre,
      });
      let lista = result.filter((g) => g.idGrupo !== idGrupoActual);
      if (filtroCampus !== "all") lista = lista.filter((g) => String(g.idCampus ?? "") === filtroCampus);
      setGrupos(lista);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Error al cargar los grupos disponibles");
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }, [modoAvanzado, filtroPlan, filtroPeriodo, filtroCampus, numeroCuatrimestre, idGrupoActual]);

  useEffect(() => {
    if (!open) return;
    setSelectedGrupo("");
    setBusqueda("");
    setFiltroCampus("all");
    setFiltroPlan(String(idPlanEstudios));
    setFiltroPeriodo(idPeriodoAcademico ? String(idPeriodoAcademico) : "all");
    (async () => {
      try {
        const [camp, pl, per] = await Promise.all([getCampusList(), getStudyPlans(), getAcademicPeriods()]);
        setCampusList(camp.items ?? []);
        setPlanes(pl);
        setPeriodos(per);
      } catch {
        /* catálogos opcionales */
      }
    })();
  }, [open, idPlanEstudios, idPeriodoAcademico]);

  useEffect(() => {
    if (open) loadGrupos();
  }, [open, loadGrupos]);

  const planesFiltrados = useMemo(() => {
    if (filtroCampus === "all") return planes;
    return planes.filter((p) => p.idCampus?.toString() === filtroCampus);
  }, [planes, filtroCampus]);

  const gruposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return grupos;
    return grupos.filter(
      (g) =>
        (g.codigoGrupo ?? "").toLowerCase().includes(q) ||
        (g.nombreGrupo ?? "").toLowerCase().includes(q) ||
        (g.planEstudios ?? "").toLowerCase().includes(q),
    );
  }, [grupos, busqueda]);

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-amber-900 cursor-pointer">
                <Checkbox checked={modoAvanzado} onCheckedChange={(v) => setModoAvanzado(v === true)} />
                Cambio avanzado (otro cuatrimestre / plan)
              </label>
            </div>
          )}

          {/* Filtros del grupo destino */}
          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filtrar grupos destino</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select
                value={filtroCampus}
                onValueChange={(v) => {
                  setFiltroCampus(v);
                  setFiltroPlan("all");
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Campus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los campus</SelectItem>
                  {campusList.map((c) => (
                    <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroPlan} onValueChange={setFiltroPlan}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  {planesFiltrados.map((p) => (
                    <SelectItem key={p.idPlanEstudios} value={String(p.idPlanEstudios)}>
                      {p.nombrePlanEstudios}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los periodos</SelectItem>
                  {periodos.map((p) => (
                    <SelectItem key={p.idPeriodoAcademico} value={String(p.idPeriodoAcademico)}>
                      {formatPeriodoLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupo por código o nombre…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Grupo destino</label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando grupos disponibles...
              </div>
            ) : gruposFiltrados.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No hay grupos que coincidan con los filtros.</p>
            ) : (
              <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {gruposFiltrados.map((g) => (
                    <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                      <div className="flex flex-col gap-0.5 py-0.5">
                        <span className="font-semibold">
                          {g.codigoGrupo} — {g.nombreGrupo}{" "}
                          <span className="font-normal text-gray-500">
                            ({g.estudiantesInscritos ?? 0}/{g.capacidadMaxima})
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {[g.campus, g.planEstudios, `${cuatriDeGrupo(g)}° cuatri`, g.turno, periodoConAnio(g)]
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
                {cambiaPlan ? " Además, se cambiará la carrera del alumno al plan del grupo destino." : ""}{" "}
                Si el alumno tiene calificaciones o asistencia en el grupo actual, ese historial quedará inactivo.
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
