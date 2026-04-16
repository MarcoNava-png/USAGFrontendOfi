"use client";

import { useEffect, useMemo, useState } from "react";

import { BookOpen, CalendarCheck, ClipboardCheck, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCampusList } from "@/services/campus-service";
import { getStudyPlansList } from "@/services/study-plans-service";
import { getAcademicPeriods } from "@/services/catalogs-service";
import type { Campus } from "@/types/campus";
import type { StudyPlan } from "@/types/study-plan";
import type { AcademicPeriod } from "@/types/academic-period";

import { GruposAcordeonAsistencias } from "./_components/grupos-acordeon-asistencias";

export default function AttendancesPage() {
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [planes, setPlanes] = useState<StudyPlan[]>([]);
  const [periodos, setPeriodos] = useState<AcademicPeriod[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [campusRes, planesRes, periodosRes] = await Promise.all([
        getCampusList(),
        getStudyPlansList(),
        getAcademicPeriods(),
      ]);
      setCampusList(campusRes?.items || []);
      setPlanes(planesRes?.items || []);
      setPeriodos((periodosRes as any) || []);

      const activo = periodosRes?.find((p: any) => p.esPeriodoActual);
      if (activo) setSelectedPeriodo(activo.idPeriodoAcademico);
    } catch {
      toast.error("Error al cargar los datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlanes = useMemo(() => {
    if (!selectedCampus) return planes;
    return planes.filter((p) => p.idCampus === selectedCampus);
  }, [planes, selectedCampus]);

  const handleCampusChange = (v: string) => {
    const campusId = parseInt(v);
    setSelectedCampus(campusId);
    if (selectedPlan) {
      const planActual = planes.find((p) => p.idPlanEstudios === selectedPlan);
      if (planActual && planActual.idCampus !== campusId) {
        setSelectedPlan(null);
      }
    }
  };

  const handlePlanChange = (v: string) => {
    setSelectedPlan(parseInt(v));
  };

  const handlePeriodoChange = (v: string) => {
    setSelectedPeriodo(parseInt(v));
  };

  const ready = selectedPlan && selectedPeriodo;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            Control de Asistencias
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro y seguimiento de asistencias por materia y grupo
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Plan Seleccionado
            </CardDescription>
            <CardTitle className="text-lg text-blue-700 truncate">
              {selectedPlan ? "Activo" : "Ninguno"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              Estado
            </CardDescription>
            <CardTitle className="text-lg text-green-700">
              Presente / Falta / Justificado
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-600 flex items-center gap-1">
              <CalendarCheck className="h-4 w-4" />
              Días de Clase
            </CardDescription>
            <CardTitle className="text-4xl text-purple-700">
              L-D
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-600 flex items-center gap-1">
              <Users className="h-4 w-4" />
              Mín. Asistencia
            </CardDescription>
            <CardTitle className="text-4xl text-orange-700">
              80%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Filtros
          </CardTitle>
          <CardDescription>
            Selecciona campus, plan de estudios y periodo para ver los grupos disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Campus</Label>
              <Select
                value={selectedCampus?.toString() ?? ""}
                onValueChange={handleCampusChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Cargando..." : "Todos los campus"} />
                </SelectTrigger>
                <SelectContent>
                  {campusList.map((c) => (
                    <SelectItem key={c.idCampus} value={c.idCampus.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plan de Estudios</Label>
              <Select
                value={selectedPlan?.toString() ?? ""}
                onValueChange={handlePlanChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPlanes.map((p) => (
                    <SelectItem key={p.idPlanEstudios} value={p.idPlanEstudios.toString()}>
                      {p.clavePlanEstudios} - {p.nombrePlanEstudios}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Periodo Académico</Label>
              <Select
                value={selectedPeriodo?.toString() ?? ""}
                onValueChange={handlePeriodoChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p: any) => (
                    <SelectItem key={p.idPeriodoAcademico} value={p.idPeriodoAcademico.toString()}>
                      {p.nombre} {p.esPeriodoActual && "(Actual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {ready ? (
        <GruposAcordeonAsistencias
          planEstudiosId={selectedPlan!}
          periodoAcademicoId={selectedPeriodo!}
        />
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted rounded-full">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-muted-foreground">
                  Selecciona campus, plan y periodo para comenzar
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Los grupos se organizarán por cuatrimestre y podrás tomar asistencia por materia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
