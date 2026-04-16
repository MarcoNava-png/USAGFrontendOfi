"use client";

import { useState, useEffect } from "react";

import { toast } from "sonner";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { getStudyPlansList } from "@/services/study-plans-service";
import type { StudyPlan } from "@/types/study-plan";

interface SelectPlanEstudiosProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function SelectPlanEstudios({ value, onChange }: SelectPlanEstudiosProps) {
  const [loading, setLoading] = useState(false);
  const [planes, setPlanes] = useState<StudyPlan[]>([]);

  useEffect(() => {
    loadPlanes();
  }, []);

  const loadPlanes = async () => {
    setLoading(true);
    try {
      const result = await getStudyPlansList();
      setPlanes(result.items);
    } catch (error) {
      console.error("Error loading planes de estudio:", error);
      toast.error("Error al cargar los planes de estudio");
    } finally {
      setLoading(false);
    }
  };

  const options = planes.map((p) => ({
    value: p.idPlanEstudios.toString(),
    label: `${p.clavePlanEstudios} - ${p.nombrePlanEstudios}`,
  }));

  return (
    <SearchableSelect
      options={options}
      value={value?.toString() ?? ""}
      onValueChange={(v) => onChange(parseInt(v))}
      placeholder={loading ? "Cargando..." : "Buscar plan de estudios..."}
      searchPlaceholder="Buscar por nombre o clave..."
      disabled={loading}
    />
  );
}
