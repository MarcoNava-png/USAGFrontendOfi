"use client";

import { useEffect, useMemo, useState } from "react";

import { FileSpreadsheet, FileText, Play, Loader2, Columns3, Filter as FilterIcon, Save, Trash2, FolderOpen, Layers } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAcademicPeriodsList, formatPeriodoLabel } from "@/services/academic-period-service";
import { getCampusList } from "@/services/campus-service";
import { getStudyPlans } from "@/services/catalogs-service";
import {
  getFuentesReporte,
  ejecutarReporte,
  exportarReporteExcel,
  exportarReportePdf,
  getDefinicionesReporte,
  guardarDefinicionReporte,
  eliminarDefinicionReporte,
  type ReporteFuente,
  type ReporteResultado,
  type ReporteDefinicion,
} from "@/services/report-builder-service";

type Opcion = { value: string; label: string };

const ESTATUS_RECIBO: Opcion[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PAGADO", label: "Pagado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "BONIFICADO", label: "Bonificado" },
];
const ESTATUS_ESTUDIANTE: Opcion[] = [
  { value: "Activo", label: "Activo" },
  { value: "Baja", label: "Baja" },
];
const ESTATUS_ASPIRANTE: Opcion[] = [
  { value: "En Proceso", label: "En Proceso" },
  { value: "Inscrito", label: "Inscrito" },
];
const ESTATUS_PAGO: Opcion[] = [
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "RECHAZADO", label: "Rechazado" },
  { value: "CANCELADO", label: "Cancelado" },
];

function valorCelda(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function formatNum(n: number): string {
  return n.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

type RenderRow =
  | { tipo: "data"; fila: Record<string, unknown> }
  | { tipo: "resumen"; etiqueta: string; valores: Record<string, number>; total?: boolean };

export default function ReportesBuilderPage() {
  const [fuentes, setFuentes] = useState<ReporteFuente[]>([]);
  const [fuente, setFuente] = useState<string>("");
  const [columnas, setColumnas] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [ordenCampo, setOrdenCampo] = useState<string>("");
  const [ordenDesc, setOrdenDesc] = useState(false);
  const [agruparPor, setAgruparPor] = useState<string>("");
  const [resultado, setResultado] = useState<ReporteResultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const [catalogos, setCatalogos] = useState<Record<string, Opcion[]>>({});
  const [definiciones, setDefiniciones] = useState<ReporteDefinicion[]>([]);
  const [nombreGuardar, setNombreGuardar] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getFuentesReporte()
      .then((data) => {
        setFuentes(data);
        if (data.length > 0) {
          setFuente(data[0].clave);
          setColumnas(data[0].campos.map((c) => c.clave));
        }
      })
      .catch(() => toast.error("No se pudieron cargar las fuentes de reportes"));

    cargarDefiniciones();

    Promise.allSettled([getStudyPlans(), getCampusList(), getAcademicPeriodsList()]).then(([planes, campus, periodos]) => {
      const cat: Record<string, Opcion[]> = {};
      if (planes.status === "fulfilled")
        cat["plan"] = planes.value.map((p) => ({ value: String(p.idPlanEstudios), label: p.nombrePlanEstudios }));
      if (campus.status === "fulfilled")
        cat["campus"] = (campus.value.items ?? []).map((c) => ({ value: String(c.idCampus), label: c.nombre }));
      if (periodos.status === "fulfilled")
        cat["periodo"] = (periodos.value.items ?? []).map((p) => ({ value: String(p.idPeriodoAcademico), label: formatPeriodoLabel(p) }));
      setCatalogos(cat);
    });
  }, []);

  const cargarDefiniciones = () => {
    getDefinicionesReporte().then(setDefiniciones).catch(() => {});
  };

  const fuenteActual = useMemo(() => fuentes.find((f) => f.clave === fuente), [fuentes, fuente]);

  const filasVista = useMemo<RenderRow[]>(() => {
    if (!resultado) return [];
    const filas = resultado.filas.slice(0, 500);
    if (!resultado.agrupadoPor) return filas.map((fila) => ({ tipo: "data", fila }));

    const gp = resultado.agrupadoPor;
    const subPorGrupo = Object.fromEntries(resultado.subtotales.map((s) => [s.grupo, s]));
    const rows: RenderRow[] = [];
    let actual: string | null = null;
    const empujarResumen = (g: string) => {
      const s = subPorGrupo[g];
      if (!s) return;
      rows.push({ tipo: "resumen", etiqueta: `Subtotal · ${g} (${s.conteo})`, valores: s.sumas });
      rows.push({ tipo: "resumen", etiqueta: `Promedio · ${g}`, valores: s.promedios });
    };
    for (const fila of filas) {
      const g = String(fila[gp] ?? "(Sin dato)");
      if (actual !== null && g !== actual) empujarResumen(actual);
      actual = g;
      rows.push({ tipo: "data", fila });
    }
    if (actual !== null) empujarResumen(actual);
    if (resultado.totalGeneral)
      rows.push({ tipo: "resumen", etiqueta: `TOTAL GENERAL (${resultado.totalGeneral.conteo})`, valores: resultado.totalGeneral.sumas, total: true });
    return rows;
  }, [resultado]);

  const opcionesDe = (catalogo?: string | null): Opcion[] | null => {
    if (!catalogo) return null;
    if (catalogo === "estatus-recibo") return ESTATUS_RECIBO;
    if (catalogo === "estatus-estudiante") return ESTATUS_ESTUDIANTE;
    if (catalogo === "estatus-aspirante") return ESTATUS_ASPIRANTE;
    if (catalogo === "estatus-pago") return ESTATUS_PAGO;
    return catalogos[catalogo] ?? [];
  };

  const cambiarFuente = (clave: string) => {
    setFuente(clave);
    const f = fuentes.find((x) => x.clave === clave);
    setColumnas(f ? f.campos.map((c) => c.clave) : []);
    setFiltros({});
    setOrdenCampo("");
    setAgruparPor("");
    setResultado(null);
  };

  const toggleColumna = (clave: string) =>
    setColumnas((prev) => (prev.includes(clave) ? prev.filter((c) => c !== clave) : [...prev, clave]));

  const construirRequest = () => ({
    fuente,
    columnas,
    filtros: Object.entries(filtros)
      .filter(([, v]) => v && v.trim())
      .map(([campo, valor]) => ({ campo, valor })),
    ordenCampo: ordenCampo || undefined,
    ordenDescendente: ordenDesc,
    agruparPor: agruparPor || undefined,
  });

  const ejecutar = async () => {
    if (columnas.length === 0) return toast.error("Selecciona al menos una columna");
    setLoading(true);
    try {
      setResultado(await ejecutarReporte(construirRequest()));
    } catch {
      toast.error("Error al ejecutar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const exportar = async () => {
    if (columnas.length === 0) return toast.error("Selecciona al menos una columna");
    setExportando(true);
    try {
      await exportarReporteExcel(construirRequest());
    } catch {
      toast.error("Error al exportar el reporte");
    } finally {
      setExportando(false);
    }
  };

  const exportarPdf = async () => {
    if (columnas.length === 0) return toast.error("Selecciona al menos una columna");
    setExportandoPdf(true);
    try {
      await exportarReportePdf(construirRequest());
    } catch {
      toast.error("Error al exportar el PDF");
    } finally {
      setExportandoPdf(false);
    }
  };

  const guardar = async () => {
    if (!nombreGuardar.trim()) return toast.error("Ponle un nombre al reporte");
    if (columnas.length === 0) return toast.error("Selecciona al menos una columna");
    setGuardando(true);
    try {
      const req = construirRequest();
      await guardarDefinicionReporte({
        nombre: nombreGuardar.trim(),
        fuente: req.fuente,
        columnas: req.columnas,
        filtros: req.filtros,
        ordenCampo: req.ordenCampo,
        ordenDescendente: req.ordenDescendente,
        agruparPor: req.agruparPor,
      });
      toast.success("Reporte guardado");
      setNombreGuardar("");
      cargarDefiniciones();
    } catch {
      toast.error("Error al guardar el reporte");
    } finally {
      setGuardando(false);
    }
  };

  const cargarDefinicion = (id: string) => {
    const def = definiciones.find((d) => d.idReporteDefinicion === Number(id));
    if (!def) return;
    cambiarFuente(def.fuente);
    setColumnas(def.columnas);
    setFiltros(Object.fromEntries(def.filtros.map((f) => [f.campo, f.valor ?? ""])));
    setOrdenCampo(def.ordenCampo ?? "");
    setOrdenDesc(def.ordenDescendente);
    setAgruparPor(def.agruparPor ?? "");
    setNombreGuardar(def.nombre);
    toast.success(`Reporte "${def.nombre}" cargado`);
  };

  const eliminarDef = async (id: number) => {
    if (!window.confirm("¿Eliminar este reporte guardado?")) return;
    try {
      await eliminarDefinicionReporte(id);
      cargarDefiniciones();
      toast.success("Reporte eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Columns3 className="h-7 w-7 text-primary" />
          </div>
          Constructor de Reportes
        </h1>
        <p className="text-muted-foreground mt-1">
          Arma tu reporte: elige la información, columnas y filtros. Guárdalo para reusarlo y expórtalo a Excel.
        </p>
      </div>

      {definiciones.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <Label className="flex items-center gap-1.5 text-sm mb-2">
              <FolderOpen className="h-3.5 w-3.5" /> Reportes guardados
            </Label>
            <div className="flex flex-wrap gap-2">
              {definiciones.map((d) => (
                <div key={d.idReporteDefinicion} className="flex items-center gap-1 rounded-full border pl-3 pr-1 py-1 text-sm">
                  <button className="hover:text-primary" onClick={() => cargarDefinicion(String(d.idReporteDefinicion))}>
                    {d.nombre}
                  </button>
                  <button className="text-muted-foreground hover:text-red-600 p-1" onClick={() => eliminarDef(d.idReporteDefinicion)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="text-lg">Configuración</CardTitle>
          <CardDescription>Define qué quieres ver en el reporte.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="w-full sm:max-w-xs space-y-1.5">
            <Label className="text-sm">Fuente de datos</Label>
            <Select value={fuente} onValueChange={cambiarFuente}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una fuente" />
              </SelectTrigger>
              <SelectContent>
                {fuentes.map((f) => (
                  <SelectItem key={f.clave} value={f.clave}>
                    {f.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fuenteActual && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Columns3 className="h-3.5 w-3.5" /> Columnas ({columnas.length})
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {fuenteActual.campos.map((c) => (
                    <label key={c.clave} className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer hover:bg-muted/50">
                      <Checkbox checked={columnas.includes(c.clave)} onCheckedChange={() => toggleColumna(c.clave)} />
                      {c.etiqueta}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <FilterIcon className="h-3.5 w-3.5" /> Filtros
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fuenteActual.campos
                    .filter((c) => c.filtrable)
                    .map((c) => {
                      const opciones = opcionesDe(c.catalogo);
                      return (
                        <div key={c.clave} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{c.etiqueta}</Label>
                          {opciones ? (
                            <Select
                              value={filtros[c.clave] || "todos"}
                              onValueChange={(v) => setFiltros((prev) => ({ ...prev, [c.clave]: v === "todos" ? "" : v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[240px]">
                                <SelectItem value="todos">Todos</SelectItem>
                                {opciones.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder={`Filtrar por ${c.etiqueta.toLowerCase()}`}
                              value={filtros[c.clave] ?? ""}
                              onChange={(e) => setFiltros((prev) => ({ ...prev, [c.clave]: e.target.value }))}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ordenar por</Label>
                  <Select value={ordenCampo || "ninguno"} onValueChange={(v) => setOrdenCampo(v === "ninguno" ? "" : v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sin orden" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Sin orden</SelectItem>
                      {fuenteActual.campos
                        .filter((c) => columnas.includes(c.clave))
                        .map((c) => (
                          <SelectItem key={c.clave} value={c.clave}>
                            {c.etiqueta}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm h-9">
                  <Checkbox checked={ordenDesc} onCheckedChange={(v) => setOrdenDesc(!!v)} />
                  Descendente
                </label>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" /> Agrupar por (subtotales)
                  </Label>
                  <Select value={agruparPor || "ninguno"} onValueChange={(v) => setAgruparPor(v === "ninguno" ? "" : v)}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Sin agrupar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Sin agrupar</SelectItem>
                      {fuenteActual.campos
                        .filter((c) => c.tipo !== "numero")
                        .map((c) => (
                          <SelectItem key={c.clave} value={c.clave}>
                            {c.etiqueta}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1" />
                <Button onClick={ejecutar} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Ejecutar
                </Button>
                <Button variant="outline" onClick={exportar} disabled={exportando || !resultado}>
                  {exportando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                  Exportar Excel
                </Button>
                <Button variant="outline" onClick={exportarPdf} disabled={exportandoPdf || !resultado}>
                  {exportandoPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Exportar PDF
                </Button>
              </div>

              <div className="flex flex-wrap items-end gap-2 border-t pt-4">
                <div className="space-y-1 flex-1 min-w-[200px] max-w-sm">
                  <Label className="text-xs text-muted-foreground">Guardar este reporte como…</Label>
                  <Input placeholder="Nombre del reporte" value={nombreGuardar} onChange={(e) => setNombreGuardar(e.target.value)} />
                </div>
                <Button variant="secondary" onClick={guardar} disabled={guardando}>
                  {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader className="border-b bg-muted/40">
            <CardTitle className="text-base">Resultado · {resultado.total} registros</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[60vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {resultado.columnas.map((c) => (
                      <TableHead key={c.clave} className="whitespace-nowrap">
                        {c.etiqueta}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasVista.map((rr, i) =>
                    rr.tipo === "data" ? (
                      <TableRow key={i}>
                        {resultado.columnas.map((c) => (
                          <TableCell key={c.clave} className="whitespace-nowrap">
                            {valorCelda(rr.fila[c.clave])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ) : (
                      <TableRow
                        key={i}
                        className={rr.total ? "bg-primary/10 font-semibold" : "bg-muted/60 font-medium"}
                      >
                        {resultado.columnas.map((c, ci) => (
                          <TableCell key={c.clave} className="whitespace-nowrap">
                            {ci === 0
                              ? rr.etiqueta
                              : rr.valores[c.clave] !== undefined
                                ? formatNum(rr.valores[c.clave])
                                : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
            {resultado.total > 500 && (
              <p className="text-xs text-muted-foreground p-3 border-t">
                Mostrando las primeras 500 filas. Exporta a Excel para ver todas ({resultado.total}).
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
