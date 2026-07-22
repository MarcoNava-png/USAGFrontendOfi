"use client";

import { CalendarClock, Check, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PreInscripcionDto } from "@/services/pre-inscripcion-service";

interface PendingPreinscripcionesListProps {
  preinscripciones: PreInscripcionDto[];
  selectedPreinscripcionId: number | null;
  onSelectPreinscripcion: (id: number) => void;
  onCancelPreinscripcion: (id: number) => void;
  cancelingId: number | null;
}

export function PendingPreinscripcionesList({
  preinscripciones,
  selectedPreinscripcionId,
  onSelectPreinscripcion,
  onCancelPreinscripcion,
  cancelingId,
}: PendingPreinscripcionesListProps) {
  const grupos = preinscripciones.reduce<Record<string, Record<number, PreInscripcionDto[]>>>((acc, pre) => {
    const planKey = `${pre.clavePlan} - ${pre.planEstudios}`;
    acc[planKey] ??= {};
    acc[planKey][pre.numeroCuatrimestreObjetivo] ??= [];
    acc[planKey][pre.numeroCuatrimestreObjetivo].push(pre);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Inscripci&oacute;n pendiente para periodo futuro</h2>
        <p className="text-sm text-gray-600 mt-1">
          {preinscripciones.length} alumno{preinscripciones.length !== 1 ? "s" : ""} apartado
          {preinscripciones.length !== 1 ? "s" : ""}
        </p>
      </div>

      {preinscripciones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No hay alumnos apartados</p>
          <p className="text-gray-500 text-sm mt-1">
            A&uacute;n no hay inscripciones pendientes. Usa &quot;Apartar para periodo&quot; desde el panel de un alumno.
          </p>
        </div>
      ) : (
        <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
          {Object.entries(grupos).map(([planKey, cuatrimestres]) => (
            <div key={planKey} className="space-y-3">
              <div className="sticky top-0 bg-white z-10 pb-1">
                <p className="text-sm font-semibold truncate" style={{ color: "#14356F" }}>
                  {planKey}
                </p>
              </div>
              {Object.entries(cuatrimestres)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([cuatri, items]) => (
                  <div key={cuatri} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        {cuatri}° Cuatrimestre objetivo
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {items.length} alumno{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {items.map((pre) => (
                      <div
                        key={pre.idPreInscripcion}
                        className={`w-full rounded-lg border transition-all ${
                          selectedPreinscripcionId === pre.idPreInscripcion
                            ? "bg-blue-50 border-blue-300 shadow-sm"
                            : "bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectPreinscripcion(pre.idPreInscripcion)}
                          className="w-full text-left p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                selectedPreinscripcionId === pre.idPreInscripcion ? "bg-blue-100" : "bg-gray-100"
                              }`}
                            >
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-gray-900 truncate">{pre.nombreCompleto}</p>
                                {selectedPreinscripcionId === pre.idPreInscripcion && (
                                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">Matrícula: {pre.matricula}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <CalendarClock className="w-3 h-3" />
                                <span className="truncate">
                                  {pre.periodoClave} · {pre.periodoNombre}
                                </span>
                              </div>
                              {pre.nota && (
                                <p className="text-xs text-gray-500 mt-1 italic truncate">{pre.nota}</p>
                              )}
                            </div>
                          </div>
                        </button>
                        <div className="px-3 pb-2 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                            disabled={cancelingId === pre.idPreInscripcion}
                            onClick={() => onCancelPreinscripcion(pre.idPreInscripcion)}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            {cancelingId === pre.idPreInscripcion ? "Cancelando..." : "Cancelar apartado"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
