"use client";

import { useEffect, useState, useCallback } from "react";

import { CalendarDays, Pencil, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { getModalidades, getStudyPlans, getWeekDays } from "@/services/catalogs-service";
import {
  getAllPlanModalidadDias,
  getDiasForPlanModalidad,
  upsertPlanModalidadDia,
  type PlanModalidadDiaDto,
} from "@/services/plan-modalidad-dia-service";
import type { Modalidad, StudyPlan, WeekDay } from "@/types/catalog";

interface ConfigResumen {
  idPlanEstudios: number;
  nombrePlan: string;
  idModalidad: number;
  nombreModalidad: string;
  dias: { idDiaSemana: number; nombreDia: string }[];
}

function agruparConfiguraciones(datos: PlanModalidadDiaDto[]): ConfigResumen[] {
  const mapa = new Map<string, ConfigResumen>();

  for (const d of datos) {
    const key = `${d.idPlanEstudios}-${d.idModalidad}`;
    if (!mapa.has(key)) {
      mapa.set(key, {
        idPlanEstudios: d.idPlanEstudios,
        nombrePlan: d.nombrePlan,
        idModalidad: d.idModalidad,
        nombreModalidad: d.nombreModalidad,
        dias: [],
      });
    }
    mapa.get(key)!.dias.push({ idDiaSemana: d.idDiaSemana, nombreDia: d.nombreDia });
  }

  return Array.from(mapa.values());
}

export default function DiasImparticionPage() {
  const [planes, setPlanes] = useState<StudyPlan[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [diasSemana, setDiasSemana] = useState<WeekDay[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfigResumen[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedModalidad, setSelectedModalidad] = useState<string>("");
  const [selectedDias, setSelectedDias] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDias, setLoadingDias] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [planesData, modalidadesData, diasData, allConfig] = await Promise.all([
        getStudyPlans(),
        getModalidades(),
        getWeekDays(),
        getAllPlanModalidadDias(),
      ]);
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

  const loadDiasForSelection = useCallback(async (idPlan: number, idModalidad: number) => {
    setLoadingDias(true);
    try {
      const dias = await getDiasForPlanModalidad(idPlan, idModalidad);
      setSelectedDias(dias.map((d) => d.idDiaSemana));
    } catch {
      toast.error("Error al cargar días configurados");
      setSelectedDias([]);
    } finally {
      setLoadingDias(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPlan && selectedModalidad) {
      loadDiasForSelection(Number(selectedPlan), Number(selectedModalidad));
    } else {
      setSelectedDias([]);
    }
  }, [selectedPlan, selectedModalidad, loadDiasForSelection]);

  const handleDiaToggle = (idDia: number) => {
    setSelectedDias((prev) =>
      prev.includes(idDia) ? prev.filter((d) => d !== idDia) : [...prev, idDia]
    );
  };

  const handleSave = async () => {
    if (!selectedPlan || !selectedModalidad) {
      toast.error("Selecciona un plan y una modalidad");
      return;
    }

    setSaving(true);
    try {
      await upsertPlanModalidadDia({
        idPlanEstudios: Number(selectedPlan),
        idModalidad: Number(selectedModalidad),
        diasIds: selectedDias,
      });
      toast.success("Configuración guardada correctamente");

      const allConfig = await getAllPlanModalidadDias();
      setConfiguraciones(agruparConfiguraciones(allConfig));
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (config: ConfigResumen) => {
    setSelectedPlan(String(config.idPlanEstudios));
    setSelectedModalidad(String(config.idModalidad));
  };

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
            Selecciona un plan de estudios y una modalidad, luego marca los días de impartición
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan de Estudios</label>
              <Select value={selectedPlan} onValueChange={(v) => { setSelectedPlan(v); setSelectedModalidad(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan..." />
                </SelectTrigger>
                <SelectContent>
                  {planes.map((plan) => (
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
                onValueChange={setSelectedModalidad}
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
              <div className="space-y-3">
                <label className="text-sm font-medium">Días de la Semana</label>
                {loadingDias ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Cargando días...</span>
                  </div>
                ) : (
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
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Configuración
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle>Configuraciones Existentes</CardTitle>
          <CardDescription>
            Resumen de los días de impartición configurados por plan y modalidad
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow
                className="hover:bg-transparent"
                style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
              >
                <TableHead className="font-semibold text-white">Plan de Estudios</TableHead>
                <TableHead className="font-semibold text-white">Modalidad</TableHead>
                <TableHead className="font-semibold text-white">Días</TableHead>
                <TableHead className="font-semibold text-white text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configuraciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-8 w-8" />
                      <span>No hay configuraciones registradas</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                configuraciones.map((config, index) => (
                  <TableRow
                    key={`${config.idPlanEstudios}-${config.idModalidad}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-muted/30"}
                  >
                    <TableCell>
                      <span className="font-medium">{config.nombrePlan}</span>
                    </TableCell>
                    <TableCell>{config.nombreModalidad}</TableCell>
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
                      <div className="flex items-center justify-center">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
