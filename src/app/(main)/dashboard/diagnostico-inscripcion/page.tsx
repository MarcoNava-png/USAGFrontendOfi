"use client";

import { useCallback, useEffect, useState } from "react";

import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAcademicPeriodsList, formatPeriodoLabel } from "@/services/academic-period-service";
import { getInconsistencias, repararInconsistencia, InconsistenciaInscripcion } from "@/services/diagnostico-inscripcion-service";
import { AcademicPeriod } from "@/types/academic-period";

const TIPOS: Record<string, { label: string; clase: string }> = {
  MateriasSinVinculo: { label: "Sin vínculo al grupo", clase: "bg-red-100 text-red-800 border-red-200" },
  VinculoSinMaterias: { label: "Sin materias", clase: "bg-orange-100 text-orange-800 border-orange-200" },
  PlanCruzado: { label: "Plan/campus cruzado", clase: "bg-amber-100 text-amber-800 border-amber-200" },
  ApartadoColgado: { label: "Apartado colgado", clase: "bg-blue-100 text-blue-800 border-blue-200" },
  PartidoEntreGrupos: { label: "Partido entre 2 grupos", clase: "bg-purple-100 text-purple-800 border-purple-200" },
};

const keyOf = (i: InconsistenciaInscripcion) => `${i.idEstudiante}-${i.tipo}-${i.idGrupo ?? 0}`;

export default function DiagnosticoInscripcionPage() {
  const [periodos, setPeriodos] = useState<AcademicPeriod[]>([]);
  const [periodoId, setPeriodoId] = useState<string>("");
  const [items, setItems] = useState<InconsistenciaInscripcion[]>([]);
  const [loading, setLoading] = useState(false);
  const [reparando, setReparando] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const data = await getAcademicPeriodsList();
        setPeriodos(data.items);
        const actual = data.items.find((p) => p.esPeriodoActual) ?? data.items[0];
        if (actual) setPeriodoId(actual.idPeriodoAcademico.toString());
      } catch {
        toast.error("Error al cargar periodos");
      }
    })();
  }, []);

  const cargar = useCallback(async () => {
    if (!periodoId) return;
    setLoading(true);
    try {
      const data = await getInconsistencias(parseInt(periodoId));
      setItems(data);
    } catch {
      toast.error("Error al detectar inconsistencias");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [periodoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reparar = async (i: InconsistenciaInscripcion) => {
    const k = keyOf(i);
    setReparando((prev) => new Set(prev).add(k));
    try {
      const r = await repararInconsistencia({ idEstudiante: i.idEstudiante, tipo: i.tipo, idGrupo: i.idGrupo, idGrupoSobrante: i.idGrupoSobrante });
      if (r.exitoso) {
        toast.success(`${i.matricula}: ${r.mensaje}`);
        setItems((prev) => prev.filter((x) => keyOf(x) !== k));
      } else {
        toast.error(`${i.matricula}: ${r.mensaje}`);
      }
    } catch {
      toast.error(`Error al reparar ${i.matricula}`);
    } finally {
      setReparando((prev) => {
        const n = new Set(prev);
        n.delete(k);
        return n;
      });
    }
  };

  const repararTodo = async () => {
    for (const i of [...items]) {
      await reparar(i);
    }
    await cargar();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wrench className="w-7 h-7" style={{ color: "#14356F" }} />
          Diagnóstico de Inscripciones
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Detecta y repara alumnos con inconsistencias (sin vínculo, sin materias, plan/campus cruzado o apartados colgados).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Periodo a revisar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={periodoId} onValueChange={setPeriodoId}>
            <SelectTrigger className="w-[320px]">
              <SelectValue placeholder="Selecciona un periodo" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.idPeriodoAcademico} value={p.idPeriodoAcademico.toString()}>
                  {formatPeriodoLabel(p)}
                  {p.esPeriodoActual ? " — Actual" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={cargar} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Revisar
          </Button>
          {items.length > 0 && (
            <Button onClick={repararTodo} disabled={reparando.size > 0} style={{ backgroundColor: "#14356F" }}>
              <Wrench className="w-4 h-4 mr-2" />
              Reparar todo ({items.length})
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {items.length === 0 && !loading ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
            {loading ? "Revisando..." : `${items.length} inconsistencia(s) encontrada(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Revisando inscripciones del periodo...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="font-medium text-gray-800">¡Todo en orden!</p>
              <p className="text-sm">No se encontraron inconsistencias en este periodo.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => {
                  const k = keyOf(i);
                  const t = TIPOS[i.tipo] ?? { label: i.tipo, clase: "" };
                  return (
                    <TableRow key={k}>
                      <TableCell className="font-mono">{i.matricula}</TableCell>
                      <TableCell>{i.nombreCompleto}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.clase}>
                          {t.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[360px]">{i.descripcion}</TableCell>
                      <TableCell>
                        {i.tipo === "PartidoEntreGrupos" ? (
                          <span className="text-sm">
                            <span className="text-green-700 font-medium">{i.codigoGrupo}</span>
                            {i.codigoGrupoSobrante ? (
                              <span className="text-gray-400"> · quita {i.codigoGrupoSobrante}</span>
                            ) : null}
                          </span>
                        ) : (
                          i.codigoGrupo ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => reparar(i)} disabled={reparando.has(k)} style={{ backgroundColor: "#14356F" }}>
                          {reparando.has(k) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Wrench className="w-4 h-4 mr-1" />
                              Reparar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
