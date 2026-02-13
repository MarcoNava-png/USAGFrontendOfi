"use client";

import { Building2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campus } from "@/types/campus";
import { AcademicPeriod, StudyPlan } from "@/types/catalog";

interface FiltersSectionProps {
  campusList: Campus[];
  studyPlans: StudyPlan[];
  academicPeriods: AcademicPeriod[];
  selectedCampusId: string;
  setSelectedCampusId: (value: string) => void;
  selectedPlanId: string;
  setSelectedPlanId: (value: string) => void;
  selectedPeriodId: string;
  setSelectedPeriodId: (value: string) => void;
  cuatrimestreFilter: string;
  setCuatrimestreFilter: (value: string) => void;
  periodoLabel: string;
  maxPeriodos: number;
  loading: boolean;
  loadAvailableGroups: () => void;
}

export function FiltersSection({
  campusList,
  studyPlans,
  academicPeriods,
  selectedCampusId,
  setSelectedCampusId,
  selectedPlanId,
  setSelectedPlanId,
  selectedPeriodId,
  setSelectedPeriodId,
  cuatrimestreFilter,
  setCuatrimestreFilter,
  periodoLabel,
  maxPeriodos,
  loading,
  loadAvailableGroups,
}: FiltersSectionProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Campus */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Campus</Label>
        <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
          <SelectTrigger className="w-full">
            <Building2 className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Selecciona un campus" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {campusList.map((c) => (
              <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Plan de Estudios (full width for long names) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Plan de Estudios</Label>
        <Select value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={!selectedCampusId}>
          <SelectTrigger className="w-full min-w-0">
            <span className="truncate">
              <SelectValue placeholder={selectedCampusId ? "Selecciona un plan" : "Primero selecciona un campus"} />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {studyPlans.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {selectedCampusId ? "No hay planes en este campus" : "Selecciona un campus"}
              </div>
            ) : (
              studyPlans.map((plan) => (
                <SelectItem key={plan.idPlanEstudios} value={plan.idPlanEstudios.toString()}>
                  {plan.clavePlanEstudios} - {plan.nombrePlanEstudios}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {selectedPlanId && studyPlans.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {studyPlans.find((p) => p.idPlanEstudios.toString() === selectedPlanId)?.periodicidad ?? ""}
          </p>
        )}
      </div>

      {/* Row 3: Periodo, Cuatrimestre/Semestre, Buscar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Periodo Acad&eacute;mico</Label>
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona periodo" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {academicPeriods.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No hay periodos disponibles</div>
              ) : (
                academicPeriods.map((period) => (
                  <SelectItem key={period.idPeriodoAcademico} value={period.idPeriodoAcademico.toString()}>
                    {period.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{periodoLabel}</Label>
          <Select value={cuatrimestreFilter} onValueChange={setCuatrimestreFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {Array.from({ length: maxPeriodos }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}&deg; {periodoLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={loadAvailableGroups}
            disabled={!selectedPlanId || !selectedPeriodId || loading}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
