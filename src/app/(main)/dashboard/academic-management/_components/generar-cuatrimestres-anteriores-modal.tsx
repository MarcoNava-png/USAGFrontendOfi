"use client";

import { useEffect, useMemo, useState } from "react";

import { CalendarClock, Loader2, CheckCircle2, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAcademicPeriodsList, formatPeriodoLabel } from "@/services/academic-period-service";
import {
  getCuatrimestresAnterioresPreview,
  generarCuatrimestresAnteriores,
} from "@/services/groups-service";
import type { AcademicPeriod } from "@/types/academic-period";
import type {
  CuatrimestresAnterioresPreview,
  CuatrimestreAGenerar,
  GenerarCuatrimestresAnterioresResultado,
} from "@/types/group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idGrupo: number;
  nombreGrupo: string;
  onSuccess?: () => void;
}

interface FilaEstado {
  numeroCuatrimestre: number;
  totalMaterias: number;
  yaExiste: boolean;
  grupoExistenteInfo?: string | null;
  alumnosInscritos: number;
  faltanAlumnos: number;
  seleccionado: boolean;
  modo: "existente" | "nuevo";
  idPeriodo: string;
  nuevoNombre: string;
  nuevoFechaInicio: string;
  nuevoFechaFin: string;
}

export function GenerarCuatrimestresAnterioresModal({
  open,
  onOpenChange,
  idGrupo,
  nombreGrupo,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [preview, setPreview] = useState<CuatrimestresAnterioresPreview | null>(null);
  const [periodos, setPeriodos] = useState<AcademicPeriod[]>([]);
  const [filas, setFilas] = useState<FilaEstado[]>([]);
  const [copiarEstudiantes, setCopiarEstudiantes] = useState(true);
  const [resultado, setResultado] = useState<GenerarCuatrimestresAnterioresResultado | null>(null);

  useEffect(() => {
    if (!open) return;
    setResultado(null);
    setLoading(true);
    Promise.all([
      getCuatrimestresAnterioresPreview(idGrupo),
      getAcademicPeriodsList().then((r) => (Array.isArray(r?.items) ? r.items : [])).catch(() => []),
    ])
      .then(([prev, pers]) => {
        setPreview(prev);
        setPeriodos(pers);
        const totalCohorte = prev.totalEstudiantes;
        setFilas(
          prev.cuatrimestresPrevios.map((c) => {
            const yaExiste = !!c.idGrupoExistente;
            const inscritos = c.alumnosCohorteInscritos ?? 0;
            const faltan = yaExiste ? Math.max(0, totalCohorte - inscritos) : totalCohorte;
            return {
              numeroCuatrimestre: c.numeroCuatrimestre,
              totalMaterias: c.totalMateriasEnPlan,
              yaExiste,
              grupoExistenteInfo: c.grupoExistenteInfo,
              alumnosInscritos: inscritos,
              faltanAlumnos: faltan,
              seleccionado: !yaExiste || faltan > 0,
              modo: c.idPeriodoSugerido ? "existente" : "nuevo",
              idPeriodo: c.idPeriodoSugerido ? String(c.idPeriodoSugerido) : "",
              nuevoNombre: "",
              nuevoFechaInicio: "",
              nuevoFechaFin: "",
            };
          }),
        );
      })
      .catch((e: unknown) => {
        const err = e as { response?: { data?: { error?: string } } };
        toast.error(err?.response?.data?.error ?? "No se pudo cargar la información del grupo");
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, idGrupo, onOpenChange]);

  const actualizar = (i: number, cambios: Partial<FilaEstado>) => {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...cambios } : f)));
  };

  const seleccionadas = useMemo(() => filas.filter((f) => f.seleccionado), [filas]);

  const validar = (): string | null => {
    if (seleccionadas.length === 0) return "Selecciona al menos un cuatrimestre para generar.";
    for (const f of seleccionadas) {
      if (f.modo === "existente" && !f.idPeriodo) return `Cuatrimestre ${f.numeroCuatrimestre}: elige un periodo.`;
      if (f.modo === "nuevo") {
        if (!f.nuevoNombre.trim()) return `Cuatrimestre ${f.numeroCuatrimestre}: nombre del periodo requerido.`;
        if (!f.nuevoFechaInicio || !f.nuevoFechaFin) return `Cuatrimestre ${f.numeroCuatrimestre}: fechas del periodo requeridas.`;
        if (f.nuevoFechaInicio > f.nuevoFechaFin) return `Cuatrimestre ${f.numeroCuatrimestre}: la fecha de inicio no puede ser mayor a la de fin.`;
      }
    }
    return null;
  };

  const handleGenerar = async () => {
    const error = validar();
    if (error) {
      toast.error(error);
      return;
    }
    const cuatrimestres: CuatrimestreAGenerar[] = seleccionadas.map((f) =>
      f.modo === "nuevo"
        ? {
            numeroCuatrimestre: f.numeroCuatrimestre,
            nuevoPeriodo: {
              nombre: f.nuevoNombre.trim(),
              fechaInicio: f.nuevoFechaInicio,
              fechaFin: f.nuevoFechaFin,
            },
          }
        : {
            numeroCuatrimestre: f.numeroCuatrimestre,
            idPeriodoAcademico: Number(f.idPeriodo),
          },
    );

    setGenerando(true);
    try {
      const res = await generarCuatrimestresAnteriores({
        idGrupoOrigen: idGrupo,
        copiarEstudiantes,
        cuatrimestres,
      });
      setResultado(res);
      toast.success(
        `${res.totalGruposCreados} grupo(s) creado(s), ${res.totalGruposReutilizados} reutilizado(s)`,
      );
      onSuccess?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Error al generar los cuatrimestres");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col gap-3">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" style={{ color: "#14356F" }} />
            Generar cuatrimestres anteriores
          </DialogTitle>
          <DialogDescription>
            Crea hacia atrás los grupos de cuatrimestres previos de <strong>{nombreGrupo}</strong>, con sus
            materias, e inscribe a los mismos alumnos en su periodo correspondiente. No captura calificaciones.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando…
          </div>
        ) : resultado ? (
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Se crearon <strong>{resultado.totalGruposCreados}</strong> grupo(s), se reutilizaron{" "}
                  <strong>{resultado.totalGruposReutilizados}</strong> y se crearon{" "}
                  <strong>{resultado.totalPeriodosCreados}</strong> periodo(s).
                </AlertDescription>
              </Alert>
              {resultado.cuatrimestres.map((c) => (
                <div key={c.numeroCuatrimestre} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {c.numeroCuatrimestre}° · {c.codigoGrupo || c.nombreGrupo}
                    </span>
                    <div className="flex gap-2">
                      {c.grupoYaExistia ? (
                        <Badge variant="secondary">Grupo reutilizado</Badge>
                      ) : (
                        <Badge>Grupo creado</Badge>
                      )}
                      {c.periodoCreado && <Badge variant="outline">Periodo nuevo</Badge>}
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {c.periodoAcademico} · {c.totalMaterias} materias · {c.estudiantesInscritos} inscritos
                    {c.estudiantesConAdvertencia > 0 ? ` · ${c.estudiantesConAdvertencia} con aviso` : ""}
                  </p>
                  {c.advertencias.length > 0 && (
                    <ul className="mt-1 text-xs text-amber-600 list-disc list-inside">
                      {c.advertencias.slice(0, 5).map((a, idx) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : preview && filas.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este grupo está en el {preview.numeroCuatrimestreActual}° cuatrimestre; no hay cuatrimestres anteriores que generar.
            </AlertDescription>
          </Alert>
        ) : preview ? (
          <>
            <div className="shrink-0 rounded-lg border bg-muted/40 p-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
              <span><strong>Plan:</strong> {preview.planEstudios}</span>
              <span><strong>Cuatri actual:</strong> {preview.numeroCuatrimestreActual}°</span>
              <span><strong>Turno:</strong> {preview.turno}</span>
              <span><strong>Alumnos:</strong> {preview.totalEstudiantes}</span>
            </div>

            <div className="shrink-0 flex items-center gap-2 py-1">
              <Checkbox
                id="copiar"
                checked={copiarEstudiantes}
                onCheckedChange={(v) => setCopiarEstudiantes(!!v)}
              />
              <Label htmlFor="copiar" className="cursor-pointer">
                Inscribir a los {preview.totalEstudiantes} alumnos del grupo en cada cuatrimestre generado
              </Label>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
              <div className="space-y-2">
                {filas.map((f, i) => (
                  <div
                    key={f.numeroCuatrimestre}
                    className={`border rounded-lg p-3 ${f.seleccionado ? "border-blue-300 bg-blue-50/40" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={f.seleccionado}
                        onCheckedChange={(v) => actualizar(i, { seleccionado: !!v })}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{f.numeroCuatrimestre}° Cuatrimestre</span>
                          <Badge variant="outline" className="text-xs">{f.totalMaterias} materias</Badge>
                          {!f.yaExiste ? (
                            <Badge className="text-xs bg-blue-600">Falta crear</Badge>
                          ) : f.faltanAlumnos > 0 ? (
                            <Badge className="text-xs bg-amber-500 hover:bg-amber-500">
                              Existe pero faltan {f.faltanAlumnos} de {preview.totalEstudiantes} alumnos
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Completo · {f.alumnosInscritos}/{preview.totalEstudiantes} alumnos
                            </Badge>
                          )}
                          {f.yaExiste && (
                            <span className="text-xs text-muted-foreground">({f.grupoExistenteInfo})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {f.seleccionado && (
                      <div className="mt-3 pl-7 space-y-2">
                        {f.yaExiste ? (
                          <div className="text-sm rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
                            {f.faltanAlumnos > 0
                              ? `Se inscribirán los ${f.faltanAlumnos} alumno(s) faltante(s) en el grupo ya existente (${f.grupoExistenteInfo}). No se crea otro grupo.`
                              : `Este grupo ya tiene a los ${preview.totalEstudiantes} alumnos; se re-verificará su inscripción.`}
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-4 text-sm">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={f.modo === "existente"}
                                  onChange={() => actualizar(i, { modo: "existente" })}
                                />
                                Usar periodo existente
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={f.modo === "nuevo"}
                                  onChange={() => actualizar(i, { modo: "nuevo" })}
                                />
                                Crear periodo nuevo
                              </label>
                            </div>

                            {f.modo === "existente" ? (
                              <Select value={f.idPeriodo} onValueChange={(v) => actualizar(i, { idPeriodo: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecciona el periodo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {periodos.map((p) => (
                                    <SelectItem key={p.idPeriodoAcademico} value={String(p.idPeriodoAcademico)}>
                                      {formatPeriodoLabel(p)}
                                      {p.esPeriodoActual ? " (actual)" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-3">
                                  <Input
                                    placeholder="Nombre del periodo (ej. CUATRIMESTRE ENERO-ABRIL 2024)"
                                    value={f.nuevoNombre}
                                    onChange={(e) => actualizar(i, { nuevoNombre: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Inicio</Label>
                                  <Input
                                    type="date"
                                    value={f.nuevoFechaInicio}
                                    onChange={(e) => actualizar(i, { nuevoFechaInicio: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Fin</Label>
                                  <Input
                                    type="date"
                                    value={f.nuevoFechaFin}
                                    onChange={(e) => actualizar(i, { nuevoFechaFin: e.target.value })}
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <DialogFooter className="shrink-0 mt-2">
          {resultado ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generando}>
                Cancelar
              </Button>
              {preview && filas.length > 0 && (
                <Button onClick={handleGenerar} disabled={generando || seleccionadas.length === 0}>
                  {generando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando…
                    </>
                  ) : (
                    <>
                      <CalendarClock className="h-4 w-4 mr-2" />
                      Generar {seleccionadas.length} cuatrimestre(s)
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
