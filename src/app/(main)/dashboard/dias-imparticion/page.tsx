"use client";

import { useEffect, useState, useCallback } from "react";

import { CalendarDays, Pencil, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCampusList } from "@/services/campus-service";
import { getModalidades, getStudyPlans, getWeekDays } from "@/services/catalogs-service";
import {
  getAllPlanModalidadDias,
  getDiasForPlanModalidad,
  upsertPlanModalidadDia,
  eliminarGrupoDias,
  type PlanModalidadDiaDto,
} from "@/services/plan-modalidad-dia-service";
import type { Campus } from "@/types/campus";
import type { Modalidad, StudyPlan, WeekDay } from "@/types/catalog";

interface ConfigResumen {
  idPlanEstudios: number;
  nombrePlan: string;
  idModalidad: number;
  nombreModalidad: string;
  grupo: number;
  dias: { idDiaSemana: number; nombreDia: string }[];
}

function agruparConfiguraciones(datos: PlanModalidadDiaDto[]): ConfigResumen[] {
  const mapa = new Map<string, ConfigResumen>();

  for (const d of datos) {
    const key = `${d.idPlanEstudios}-${d.idModalidad}-${d.grupo}`;
    if (!mapa.has(key)) {
      mapa.set(key, {
        idPlanEstudios: d.idPlanEstudios,
        nombrePlan: d.nombrePlan,
        idModalidad: d.idModalidad,
        nombreModalidad: d.nombreModalidad,
        grupo: d.grupo,
        dias: [],
      });
    }
    mapa.get(key)!.dias.push({ idDiaSemana: d.idDiaSemana, nombreDia: d.nombreDia });
  }

  return Array.from(mapa.values());
}

export default function DiasImparticionPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [planes, setPlanes] = useState<StudyPlan[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [diasSemana, setDiasSemana] = useState<WeekDay[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfigResumen[]>([]);

  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedModalidad, setSelectedModalidad] = useState<string>("");
  const [selectedDias, setSelectedDias] = useState<number[]>([]);
  const [editingGrupo, setEditingGrupo] = useState<number>(0); // 0 = nuevo grupo
  const [filtroCampus, setFiltroCampus] = useState<string>("TODOS");
  const [filtroPlan, setFiltroPlan] = useState<string>("TODOS");

  const [loading, setLoading] = useState(true);
  const [loadingDias, setLoadingDias] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConfigResumen | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [campusData, planesData, modalidadesData, diasData, allConfig] = await Promise.all([
        getCampusList(),
        getStudyPlans(),
        getModalidades(),
        getWeekDays(),
        getAllPlanModalidadDias(),
      ]);
      setCampuses(campusData.items ?? []);
      setPlanes(planesData);
      setModalidades(modalidadesData);
      setDiasSemana(diasData);
      setConfiguraciones(agruparConfiguraciones(allConfig));
    } catch {
      toast.error("Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const refreshConfiguraciones = async () => {
    try {
      const allConfig = await getAllPlanModalidadDias();
      setConfiguraciones(agruparConfiguraciones(allConfig));
    } catch {
      toast.error("Error al refrescar configuraciones");
    }
  };

  const handleDiaToggle = (idDia: number) => {
    setSelectedDias((prev) =>
      prev.includes(idDia) ? prev.filter((d) => d !== idDia) : [...prev, idDia]
    );
  };

  const handleNuevo = () => {
    if (!selectedPlan || !selectedModalidad) {
      toast.error("Selecciona un plan y una modalidad primero");
      return;
    }
    setEditingGrupo(0);
    setSelectedDias([]);
  };

  const handleSave = async () => {
    if (!selectedPlan || !selectedModalidad) {
      toast.error("Selecciona un plan y una modalidad");
      return;
    }
    if (selectedDias.length === 0) {
      toast.error("Selecciona al menos un día");
      return;
    }

    setSaving(true);
    try {
      await upsertPlanModalidadDia({
        idPlanEstudios: Number(selectedPlan),
        idModalidad: Number(selectedModalidad),
        grupo: editingGrupo,
        diasIds: selectedDias,
      });
      toast.success(editingGrupo > 0 ? "Horario actualizado" : "Nuevo horario creado");
      await refreshConfiguraciones();
      // Limpiar para nuevo registro
      setEditingGrupo(0);
      setSelectedDias([]);
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (config: ConfigResumen) => {
    setSelectedPlan(String(config.idPlanEstudios));
    setSelectedModalidad(String(config.idModalidad));
    setEditingGrupo(config.grupo);
    setSelectedDias(config.dias.map((d) => d.idDiaSemana));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await eliminarGrupoDias(deleteTarget.idPlanEstudios, deleteTarget.idModalidad, deleteTarget.grupo);
      toast.success("Horario eliminado");
      await refreshConfiguraciones();
      // Si estaba editando este grupo, limpiar
      if (
        editingGrupo === deleteTarget.grupo &&
        selectedPlan === String(deleteTarget.idPlanEstudios) &&
        selectedModalidad === String(deleteTarget.idModalidad)
      ) {
        setEditingGrupo(0);
        setSelectedDias([]);
      }
    } catch {
      toast.error("Error al eliminar el horario");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingGrupo(0);
    setSelectedDias([]);
  };

  // Filtrar planes del formulario por campus seleccionado
  const planesFiltradosPorCampus = selectedCampus
    ? planes.filter((p) => String(p.idCampus) === selectedCampus)
    : planes;

  // Filtrar configuraciones de la tabla por campus y plan
  const configuracionesFiltradas = configuraciones.filter((c) => {
    if (filtroCampus !== "TODOS") {
      const plan = planes.find((p) => p.idPlanEstudios === c.idPlanEstudios);
      if (!plan || String(plan.idCampus) !== filtroCampus) return false;
    }
    if (filtroPlan !== "TODOS" && String(c.idPlanEstudios) !== filtroPlan) return false;
    return true;
  });

  // Planes que tienen configuraciones (filtrados por campus si aplica)
  const planesConConfig = planes.filter((p) => {
    if (filtroCampus !== "TODOS" && String(p.idCampus) !== filtroCampus) return false;
    return configuraciones.some((c) => c.idPlanEstudios === p.idPlanEstudios);
  });

  // Campuses que tienen configuraciones
  const campusesConConfig = campuses.filter((c) =>
    configuraciones.some((conf) => {
      const plan = planes.find((p) => p.idPlanEstudios === conf.idPlanEstudios);
      return plan && plan.idCampus === c.idCampus;
    })
  );

  // Grupos existentes para el plan+modalidad seleccionado
  const gruposExistentes = configuraciones.filter(
    (c) => String(c.idPlanEstudios) === selectedPlan && String(c.idModalidad) === selectedModalidad
  );

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))" }}
            >
              <CalendarDays className="h-8 w-8" style={{ color: "#14356F" }} />
            </div>
            Días de Impartición
          </h1>
          <p className="text-muted-foreground mt-1">
            Configura qué días de la semana se imparte cada combinación de Plan de Estudios y Modalidad
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle>Configurar Días</CardTitle>
          <CardDescription>
            Selecciona un plan de estudios y una modalidad, luego marca los días de impartición.
            Puedes crear múltiples horarios para la misma combinación.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campus</label>
              <Select value={selectedCampus} onValueChange={(v) => { setSelectedCampus(v); setSelectedPlan(""); setSelectedModalidad(""); setEditingGrupo(0); setSelectedDias([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un campus..." />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                      {c.claveCampus} - {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plan de Estudios</label>
              <Select value={selectedPlan} onValueChange={(v) => { setSelectedPlan(v); setSelectedModalidad(""); setEditingGrupo(0); setSelectedDias([]); }} disabled={!selectedCampus}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCampus ? "Selecciona un plan..." : "Primero selecciona un campus"} />
                </SelectTrigger>
                <SelectContent>
                  {planesFiltradosPorCampus.map((plan) => (
                    <SelectItem key={plan.idPlanEstudios} value={String(plan.idPlanEstudios)}>
                      {plan.clavePlanEstudios} - {plan.nombrePlanEstudios}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Modalidad</label>
              <Select
                value={selectedModalidad}
                onValueChange={(v) => { setSelectedModalidad(v); setEditingGrupo(0); setSelectedDias([]); }}
                disabled={!selectedPlan}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedPlan ? "Selecciona una modalidad..." : "Primero selecciona un plan"} />
                </SelectTrigger>
                <SelectContent>
                  {modalidades.map((mod) => (
                    <SelectItem key={mod.idModalidad} value={String(mod.idModalidad)}>
                      {mod.descModalidad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPlan && selectedModalidad && (
            <>
              {/* Horarios existentes para esta combinación */}
              {gruposExistentes.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Horarios existentes para esta combinación</label>
                  <div className="space-y-2">
                    {gruposExistentes.map((g) => (
                      <div
                        key={g.grupo}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          editingGrupo === g.grupo ? "border-blue-500 bg-blue-50" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Horario {g.grupo}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {g.dias.map((dia) => (
                              <Badge
                                key={dia.idDiaSemana}
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                              >
                                {dia.nombreDia}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={editingGrupo === g.grupo ? "default" : "ghost"}
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditar(g)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                  onClick={() => setDeleteTarget(g)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {editingGrupo > 0
                      ? `Editando Horario ${editingGrupo}`
                      : "Nuevo Horario"}
                  </label>
                  {editingGrupo > 0 && (
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <Plus className="h-4 w-4 mr-1" />
                      Crear Nuevo Horario
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  {diasSemana.map((dia) => (
                    <label
                      key={dia.idDiaSemana}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={selectedDias.includes(dia.idDiaSemana)}
                        onCheckedChange={() => handleDiaToggle(dia.idDiaSemana)}
                      />
                      <span className="text-sm">{dia.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving || selectedDias.length === 0}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingGrupo > 0 ? "Actualizar Horario" : "Guardar Nuevo Horario"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Configuraciones Existentes</CardTitle>
              <CardDescription>
                Resumen de los días de impartición configurados por plan y modalidad
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <Select value={filtroCampus} onValueChange={(v) => { setFiltroCampus(v); setFiltroPlan("TODOS"); }}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Filtrar por campus..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los Campus</SelectItem>
                  {campusesConConfig.map((c) => (
                    <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                      {c.claveCampus} - {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroPlan} onValueChange={setFiltroPlan}>
                <SelectTrigger className="w-full md:w-[320px]">
                  <SelectValue placeholder="Filtrar por plan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los Planes</SelectItem>
                  {planesConConfig.map((plan) => (
                    <SelectItem key={plan.idPlanEstudios} value={String(plan.idPlanEstudios)}>
                      {plan.clavePlanEstudios} - {plan.nombrePlanEstudios}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow
                className="hover:bg-transparent"
                style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
              >
                <TableHead className="font-semibold text-white">Campus</TableHead>
                <TableHead className="font-semibold text-white">Plan de Estudios</TableHead>
                <TableHead className="font-semibold text-white">Modalidad</TableHead>
                <TableHead className="font-semibold text-white">Horario</TableHead>
                <TableHead className="font-semibold text-white">Días</TableHead>
                <TableHead className="font-semibold text-white text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configuracionesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-8 w-8" />
                      <span>
                        {filtroCampus !== "TODOS" || filtroPlan !== "TODOS"
                          ? "No hay configuraciones para los filtros seleccionados"
                          : "No hay configuraciones registradas"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                configuracionesFiltradas.map((config, index) => (
                  <TableRow
                    key={`${config.idPlanEstudios}-${config.idModalidad}-${config.grupo}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-muted/30"}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {(() => {
                        const plan = planes.find((p) => p.idPlanEstudios === config.idPlanEstudios);
                        return plan?.nombreCampus || "-";
                      })()}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{config.nombrePlan}</span>
                    </TableCell>
                    <TableCell>{config.nombreModalidad}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {config.grupo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {config.dias.map((dia) => (
                          <Badge
                            key={dia.idDiaSemana}
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                          >
                            {dia.nombreDia}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                onClick={() => handleEditar(config)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                onClick={() => setDeleteTarget(config)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Horario</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  ¿Estás seguro de eliminar el Horario {deleteTarget.grupo} de{" "}
                  <strong>{deleteTarget.nombrePlan}</strong> ({deleteTarget.nombreModalidad})?
                  <br />
                  Días: {deleteTarget.dias.map((d) => d.nombreDia).join(", ")}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
