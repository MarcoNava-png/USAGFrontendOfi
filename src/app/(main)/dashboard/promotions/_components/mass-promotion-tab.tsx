"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  DollarSign,
  GraduationCap,
  Loader2,
  RotateCcw,
  Search,
  UserX,
  Users,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  executePromocionMasiva,
  getPeriodosConEstudiantes,
  PeriodoConEstudiantes,
  previewPromocionMasiva,
  PromocionMasivaItem,
  PromocionMasivaPreview,
  PromocionMasivaResultado,
} from "@/services/groups-service";
import { formatPeriodoLabel } from "@/services/academic-period-service";
import { AcademicPeriod } from "@/types/catalog";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

export default function MassPromotionTab({ academicPeriods }: { academicPeriods: AcademicPeriod[] }) {
  const [periodos, setPeriodos] = useState<PeriodoConEstudiantes[]>([]);
  const [loadingPeriodos, setLoadingPeriodos] = useState(true);

  const [origenId, setOrigenId] = useState<string>("");
  const [destinoId, setDestinoId] = useState<string>("");

  const [preview, setPreview] = useState<PromocionMasivaPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [resultado, setResultado] = useState<PromocionMasivaResultado | null>(null);
  const [executing, setExecuting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    loadPeriodos();
  }, []);

  const periodosOrdenados = useMemo(
    () =>
      [...academicPeriods].sort(
        (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
      ),
    [academicPeriods]
  );

  const periodLabel = (idPeriodo: number): string => {
    const p = academicPeriods.find((x) => x.idPeriodoAcademico === idPeriodo);
    if (!p) return `Periodo ${idPeriodo}`;
    const anio = p.fechaInicio ? new Date(p.fechaInicio).getFullYear() : "";
    return `${p.nombre}${anio ? ` ${anio}` : ""}`;
  };

  const sugerirDestino = (origen: string) => {
    const idx = periodosOrdenados.findIndex((p) => p.idPeriodoAcademico.toString() === origen);
    if (idx >= 0 && idx + 1 < periodosOrdenados.length) {
      setDestinoId(periodosOrdenados[idx + 1].idPeriodoAcademico.toString());
    } else {
      setDestinoId("");
    }
  };

  const loadPeriodos = async () => {
    setLoadingPeriodos(true);
    try {
      const data = await getPeriodosConEstudiantes();
      setPeriodos(data);
      const actual = data.find((p) => p.esPeriodoActual) ?? data[0];
      if (actual) {
        const origen = actual.idPeriodoAcademico.toString();
        setOrigenId(origen);
        sugerirDestino(origen);
      }
    } catch (error) {
      console.error("Error cargando periodos:", error);
      toast.error("Error al cargar los periodos con estudiantes");
    } finally {
      setLoadingPeriodos(false);
    }
  };

  const handleOrigenChange = (value: string) => {
    setOrigenId(value);
    setPreview(null);
    setResultado(null);
    sugerirDestino(value);
  };

  const handlePreview = async () => {
    if (!origenId || !destinoId) {
      toast.error("Selecciona el periodo origen y destino");
      return;
    }
    if (origenId === destinoId) {
      toast.error("El periodo origen y destino no pueden ser el mismo");
      return;
    }
    setLoadingPreview(true);
    setResultado(null);
    try {
      const data = await previewPromocionMasiva({
        idPeriodoOrigen: parseInt(origenId),
        idPeriodoDestino: parseInt(destinoId),
      });
      setPreview(data);
    } catch (error: any) {
      console.error("Error en preview masivo:", error);
      toast.error(error.response?.data?.error || "Error al generar la vista previa");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    setConfirmOpen(false);
    setExecuting(true);
    try {
      const data = await executePromocionMasiva({
        idPeriodoOrigen: parseInt(origenId),
        idPeriodoDestino: parseInt(destinoId),
      });
      setResultado(data);
      setPreview(null);
      toast.success(data.mensaje);
    } catch (error: any) {
      console.error("Error en promoción masiva:", error);
      toast.error(error.response?.data?.error || "Error al ejecutar la promoción masiva");
    } finally {
      setExecuting(false);
    }
  };

  const reiniciar = () => {
    setPreview(null);
    setResultado(null);
  };

  if (loadingPeriodos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: "#14356F" }} />
        <p className="text-gray-600">Cargando periodos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#14356F" }} />
            Promoción masiva por periodo
          </CardTitle>
          <CardDescription>
            Promueve todos los grupos de un periodo a la vez. Los alumnos del último cuatrimestre que
            terminan se marcan como <strong>egresados</strong>. Se excluyen automáticamente los de nuevo
            ingreso (los que ya tienen grupo en el periodo destino).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Periodo origen (con estudiantes)</Label>
              <Select value={origenId} onValueChange={handleOrigenChange}>
                <SelectTrigger className="w-full border-2 border-gray-300">
                  <SelectValue placeholder="Selecciona el periodo origen" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.idPeriodoAcademico} value={p.idPeriodoAcademico.toString()}>
                      {formatPeriodoLabel(p)} ({p.totalEstudiantes} alumno
                      {p.totalEstudiantes !== 1 ? "s" : ""}){p.esPeriodoActual ? " — Actual" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Periodo destino (sugerido, editable)</Label>
              <Select value={destinoId} onValueChange={setDestinoId}>
                <SelectTrigger className="w-full border-2 border-gray-300">
                  <SelectValue placeholder="Selecciona el periodo destino" />
                </SelectTrigger>
                <SelectContent>
                  {periodosOrdenados.map((p) => (
                    <SelectItem key={p.idPeriodoAcademico} value={p.idPeriodoAcademico.toString()}>
                      {formatPeriodoLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {(preview || resultado) && (
              <Button variant="outline" onClick={reiniciar}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            )}
            <Button
              onClick={handlePreview}
              disabled={!origenId || !destinoId || loadingPreview}
              className="text-white"
              style={{ background: "linear-gradient(to right, var(--brand-surface), var(--brand-surface-2))" }}
            >
              {loadingPreview ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Vista previa masiva
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard icon={<Users className="w-4 h-4" />} label="Total alumnos" value={preview.totalEstudiantes} color="#14356F" />
            <StatCard icon={<GraduationCap className="w-4 h-4" />} label="A promover" value={preview.totalAPromover} color="#059669" />
            <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="A egresar" value={preview.totalAEgresar} color="#7c3aed" />
            <StatCard icon={<UserX className="w-4 h-4" />} label="Excluidos (nuevo ingreso)" value={preview.totalExcluidosNuevoIngreso} color="#6b7280" />
            <StatCard icon={<DollarSign className="w-4 h-4" />} label="Con adeudo" value={preview.totalConAdeudo} color="#d97706" sub={formatCurrency(preview.totalSaldoPendiente)} />
          </div>

          {preview.totalConAdeudo > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Hay {preview.totalConAdeudo} alumno(s) con adeudo por {formatCurrency(preview.totalSaldoPendiente)}.
                Por política actual <strong>se promueven de todos modos</strong>; el adeudo queda registrado para gestión con finanzas.
              </span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalle por grupo ({preview.totalGrupos})</CardTitle>
              <CardDescription>
                {periodLabel(preview.idPeriodoOrigen)} → {periodLabel(preview.idPeriodoDestino)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Campus</TableHead>
                      <TableHead>Plan de estudios</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-center">Movimiento</TableHead>
                      <TableHead className="text-center">Alumnos</TableHead>
                      <TableHead className="text-center">Promover</TableHead>
                      <TableHead className="text-center">Egresar</TableHead>
                      <TableHead className="text-center">Excluidos</TableHead>
                      <TableHead className="text-center">Con adeudo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.grupos.map((g) => (
                      <TableRow key={g.idGrupo}>
                        <TableCell className="text-xs">{g.campus}</TableCell>
                        <TableCell className="text-xs">{g.planEstudios}</TableCell>
                        <TableCell className="font-medium text-xs">
                          {g.codigoGrupo} {g.turno && <span className="text-gray-400">· {g.turno}</span>}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {g.esUltimoCuatrimestre ? (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                              Cuatri {g.cuatrimestreOrigen} → Egreso
                            </Badge>
                          ) : (
                            <Badge variant="outline" style={{ borderColor: "#14356F", color: "#14356F" }}>
                              {g.cuatrimestreOrigen} → {g.cuatrimestreDestino}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{g.totalEstudiantes}</TableCell>
                        <TableCell className="text-center text-green-700 font-medium">{g.aPromover || "—"}</TableCell>
                        <TableCell className="text-center text-purple-700 font-medium">{g.aEgresar || "—"}</TableCell>
                        <TableCell className="text-center text-gray-500">{g.excluidosNuevoIngreso || "—"}</TableCell>
                        <TableCell className="text-center text-amber-700">{g.conAdeudo || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={executing || (preview.totalAPromover + preview.totalAEgresar === 0)}
                  className="text-white min-w-[220px]"
                  style={{ background: "linear-gradient(to right, #059669, #10b981)" }}
                >
                  {executing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <GraduationCap className="w-4 h-4 mr-2" />
                  )}
                  Ejecutar promoción masiva
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {resultado && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard icon={<GraduationCap className="w-4 h-4" />} label="Promovidos" value={resultado.totalPromovidos} color="#059669" />
            <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Egresados" value={resultado.totalEgresados} color="#7c3aed" />
            <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Con error" value={resultado.totalErrores} color="#dc2626" />
            <StatCard icon={<Building2 className="w-4 h-4" />} label="Grupos creados" value={resultado.gruposCreados} color="#14356F" />
          </div>

          <ReporteTabla
            titulo="Promovidos y egresados exitosamente"
            descripcion="Alumnos que avanzaron de cuatrimestre o egresaron."
            items={[...resultado.promovidos, ...resultado.egresados]}
            vacio="No hubo movimientos exitosos."
            exito
          />

          <ReporteTabla
            titulo="Errores / no procesados"
            descripcion="Alumnos que no se pudieron promover ni egresar. Revisa el detalle del error."
            items={resultado.errores}
            vacio="Sin errores. Todos los alumnos se procesaron correctamente."
          />

          <div className="flex justify-end">
            <Button variant="outline" onClick={reiniciar}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Nueva promoción
            </Button>
          </div>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar promoción masiva</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Estás por procesar <strong>{preview?.totalGrupos}</strong> grupos de{" "}
                  <strong>{preview && periodLabel(preview.idPeriodoOrigen)}</strong> hacia{" "}
                  <strong>{preview && periodLabel(preview.idPeriodoDestino)}</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>{preview?.totalAPromover}</strong> alumnos serán promovidos al siguiente cuatrimestre.</li>
                  <li><strong>{preview?.totalAEgresar}</strong> alumnos serán marcados como <strong>egresados</strong>.</li>
                  <li><strong>{preview?.totalExcluidosNuevoIngreso}</strong> excluidos por nuevo ingreso.</li>
                </ul>
                <p className="text-amber-700">
                  Esta operación es difícil de revertir. ¿Deseas continuar?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecute}
              className="text-white"
              style={{ background: "linear-gradient(to right, #059669, #10b981)" }}
            >
              Sí, promover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  return (
    <Card className="border-2" style={{ borderColor: `${color}33` }}>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2" style={{ color }}>
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-3xl" style={{ color }}>
          {value}
        </CardTitle>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </CardHeader>
    </Card>
  );
}

function ReporteTabla({
  titulo,
  descripcion,
  items,
  vacio,
  exito,
}: {
  titulo: string;
  descripcion: string;
  items: PromocionMasivaItem[];
  vacio: string;
  exito?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {exito ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {titulo}
            </CardTitle>
            <CardDescription>{descripcion}</CardDescription>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">{vacio}</p>
        ) : (
          <div className="rounded-md border overflow-hidden max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Adeudo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={`${it.idEstudiante}-${it.accion}`}>
                    <TableCell className="font-mono text-xs">{it.matricula}</TableCell>
                    <TableCell className="text-xs">{it.nombreCompleto}</TableCell>
                    <TableCell className="text-xs">{it.campus}</TableCell>
                    <TableCell className="text-xs">{it.planEstudios}</TableCell>
                    <TableCell className="text-xs">{it.grupo}</TableCell>
                    <TableCell className="text-center">
                      {it.accion === "Promovido" && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Promovido</Badge>
                      )}
                      {it.accion === "Egresado" && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">Egresado</Badge>
                      )}
                      {it.accion === "Error" && (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">Error</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[260px]">{it.detalle}</TableCell>
                    <TableCell className="text-right text-xs">
                      {it.tieneAdeudo ? (
                        <span className="text-amber-700 font-medium">{formatCurrency(it.saldoPendiente)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
