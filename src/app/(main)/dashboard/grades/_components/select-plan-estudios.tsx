"use client";

import { useState, useEffect, useMemo } from "react";

import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getCampusList } from "@/services/campus-service";
import { getStudyPlansList } from "@/services/study-plans-service";
import type { Campus } from "@/types/campus";
import type { StudyPlan } from "@/types/study-plan";

interface SelectPlanEstudiosProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onPlanChange?: (plan: StudyPlan | null) => void;
}

export function SelectPlanEstudios({ value, onChange, onPlanChange }: SelectPlanEstudiosProps) {
  const [loading, setLoading] = useState(false);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [planes, setPlanes] = useState<StudyPlan[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campusResult, planesResult] = await Promise.all([
        getCampusList(),
        getStudyPlansList(),
      ]);
      setCampusList(campusResult.items || []);
      setPlanes(planesResult.items || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlanes = useMemo(() => {
    if (!selectedCampus) return planes;
    return planes.filter((p) => p.idCampus === selectedCampus);
  }, [planes, selectedCampus]);

  const campusOptions = campusList.map((c) => ({ value: c.idCampus.toString(), label: c.nombre }));
  const planOptions = filteredPlanes.map((p) => ({ value: p.idPlanEstudios.toString(), label: `${p.clavePlanEstudios} - ${p.nombrePlanEstudios}` }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Campus</Label>
        <SearchableSelect
          options={campusOptions}
          value={selectedCampus?.toString() ?? ""}
          onValueChange={(v) => { setSelectedCampus(parseInt(v)); onChange(null); }}
          placeholder={loading ? "Cargando..." : "Todos los campus"}
          searchPlaceholder="Buscar campus..."
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Plan de Estudios</Label>
        <SearchableSelect
          options={planOptions}
          value={value?.toString() ?? ""}
          onValueChange={(v) => {
            const id = parseInt(v);
            onChange(id);
            const plan = planes.find((p) => p.idPlanEstudios === id) ?? null;
            onPlanChange?.(plan);
          }}
          placeholder={loading ? "Cargando..." : "Buscar plan de estudios..."}
          searchPlaceholder="Buscar por nombre o clave..."
          disabled={loading}
        />
      </div>
    </div>
  );
}
