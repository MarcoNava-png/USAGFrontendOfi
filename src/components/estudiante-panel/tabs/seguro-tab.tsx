"use client";

import { useEffect, useState } from "react";

import { SeguroCard } from "@/components/seguro/seguro-card";
import { obtenerSeguroEstudiante, type SeguroEstudianteDto } from "@/services/seguro-service";

export function SeguroTab({ idEstudiante }: { idEstudiante: number }) {
  const [seguro, setSeguro] = useState<SeguroEstudianteDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    obtenerSeguroEstudiante(idEstudiante)
      .then((data) => {
        if (activo) setSeguro(data);
      })
      .catch(() => {
        if (activo) setSeguro(null);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, [idEstudiante]);

  return (
    <div className="max-w-xl">
      <SeguroCard seguro={seguro} loading={loading} />
    </div>
  );
}
