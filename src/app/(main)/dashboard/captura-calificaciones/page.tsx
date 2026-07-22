"use client";

import { useCallback, useEffect, useState } from "react";

import { CalendarClock, CheckCircle2, Clock, Lock, LockOpen, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/use-permissions";
import { formatPeriodoLabel } from "@/services/academic-period-service";
import { getAcademicPeriods } from "@/services/catalogs-service";
import {
  abrirVentana,
  cerrarVentana,
  getAvance,
  getProrrogas,
  getVentanas,
  resolverProrroga,
  type AvanceCaptura,
  type SolicitudProrroga,
  type VentanaCaptura,
} from "@/services/ventana-captura-service";
import type { AcademicPeriod } from "@/types/catalog";

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—");

const ROLES_GESTION = ["admin", "superadmin", "controlescolar", "academico"];

export default function CapturaCalificacionesPage() {
  const { permissions, primaryRole } = usePermissions();
  const rolesUsuario = permissions?.roles ?? (primaryRole ? [primaryRole] : []);
  const puedeGestionar = rolesUsuario.some((r) => ROLES_GESTION.includes(r.toLowerCase()));

  const [periodos, setPeriodos] = useState<AcademicPeriod[]>([]);
  const [idPeriodo, setIdPeriodo] = useState<string>("");
  const [ventanas, setVentanas] = useState<VentanaCaptura[]>([]);
  const [fechasLimite, setFechasLimite] = useState<Record<number, string>>({});
  const [parcialAvance, setParcialAvance] = useState<string>("1");
  const [avance, setAvance] = useState<AvanceCaptura | null>(null);
  const [prorrogas, setProrrogas] = useState<SolicitudProrroga[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAcademicPeriods().then((res) => {
      setPeriodos(res);
      const actual = res.find((p) => p.esPeriodoActual) ?? res[0];
      if (actual) setIdPeriodo(String(actual.idPeriodoAcademico));
    });
  }, []);

  const loadVentanas = useCallback(async () => {
    if (!idPeriodo) return;
    const data = await getVentanas(Number(idPeriodo));
    setVentanas(data);
  }, [idPeriodo]);

  const loadProrrogas = useCallback(async () => {
    if (!puedeGestionar) return;
    const data = await getProrrogas();
    setProrrogas(data);
  }, [puedeGestionar]);

  useEffect(() => {
    loadVentanas();
  }, [loadVentanas]);

  useEffect(() => {
    loadProrrogas();
  }, [loadProrrogas]);

  const handleAbrir = async (numeroParcial: number) => {
    if (!idPeriodo) return;
    setLoading(true);
    try {
      const fl = fechasLimite[numeroParcial];
      await abrirVentana(Number(idPeriodo), numeroParcial, fl ? new Date(fl).toISOString() : null);
      toast.success(`Captura del Parcial ${numeroParcial} abierta`);
      loadVentanas();
    } catch {
      toast.error("No se pudo abrir la captura");
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = async (numeroParcial: number) => {
    if (!idPeriodo) return;
    setLoading(true);
    try {
      await cerrarVentana(Number(idPeriodo), numeroParcial);
      toast.success(`Captura del Parcial ${numeroParcial} cerrada`);
      loadVentanas();
    } catch {
      toast.error("No se pudo cerrar la captura");
    } finally {
      setLoading(false);
    }
  };

  const loadAvance = async () => {
    if (!idPeriodo) return;
    setLoading(true);
    try {
      const data = await getAvance(Number(idPeriodo), Number(parcialAvance));
      setAvance(data);
    } catch {
      toast.error("No se pudo cargar el avance");
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = async (s: SolicitudProrroga, aprobar: boolean) => {
    let fecha: string | null = null;
    if (aprobar) {
      const input = window.prompt(
        `Nueva fecha límite para ${s.profesor} — ${s.materia} (Parcial ${s.numeroParcial}).\nFormato: AAAA-MM-DD HH:MM`,
      );
      if (!input) return;
      const d = new Date(input.replace(" ", "T"));
      if (isNaN(d.getTime())) {
        toast.error("Fecha inválida");
        return;
      }
      fecha = d.toISOString();
    }
    try {
      await resolverProrroga(s.idSolicitudProrroga, aprobar, fecha);
      toast.success(aprobar ? "Prórroga aprobada" : "Prórroga rechazada");
      loadProrrogas();
    } catch {
      toast.error("No se pudo resolver la solicitud");
    }
  };

  const pendientes = prorrogas.filter((p) => p.estado === "Pendiente");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3" style={{ color: "#14356F" }}>
          <CalendarClock className="h-8 w-8" />
          Captura de Calificaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Abre/cierra la captura por parcial, supervisa el avance de los docentes y autoriza prórrogas.
        </p>
      </div>

      <div className="max-w-sm">
        <Label>Periodo académico</Label>
        <Select value={idPeriodo} onValueChange={setIdPeriodo}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un periodo" />
          </SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p.idPeriodoAcademico} value={String(p.idPeriodoAcademico)}>
                {formatPeriodoLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="ventanas">
        <TabsList>
          <TabsTrigger value="ventanas">Ventanas de captura</TabsTrigger>
          <TabsTrigger value="avance">Avance</TabsTrigger>
          {puedeGestionar && (
            <TabsTrigger value="prorrogas">
              Prórrogas{pendientes.length > 0 ? ` (${pendientes.length})` : ""}
            </TabsTrigger>
          )}
        </TabsList>

        {/* VENTANAS */}
        <TabsContent value="ventanas" className="space-y-4 mt-4">
          {[1, 2, 3].map((np) => {
            const v = ventanas.find((x) => x.numeroParcial === np);
            const vigente = v?.vigente;
            return (
              <Card key={np}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>Parcial {np}</span>
                    {vigente ? (
                      <Badge className="bg-green-600">
                        <LockOpen className="h-3.5 w-3.5 mr-1" /> Abierta
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <Lock className="h-3.5 w-3.5 mr-1" /> Cerrada
                      </Badge>
                    )}
                  </CardTitle>
                  {v?.fechaLimite && (
                    <CardDescription>Fecha límite: {fmt(v.fechaLimite)}</CardDescription>
                  )}
                </CardHeader>
                {puedeGestionar ? (
                  <CardContent className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Fecha límite (opcional)</Label>
                      <Input
                        type="datetime-local"
                        className="w-[230px]"
                        value={fechasLimite[np] ?? ""}
                        onChange={(e) => setFechasLimite((prev) => ({ ...prev, [np]: e.target.value }))}
                      />
                    </div>
                    <Button onClick={() => handleAbrir(np)} disabled={loading} className="bg-green-600 hover:bg-green-700">
                      <LockOpen className="h-4 w-4 mr-1" /> Abrir
                    </Button>
                    <Button onClick={() => handleCerrar(np)} disabled={loading} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                      <Lock className="h-4 w-4 mr-1" /> Cerrar
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Consulta el estado de la captura. La apertura/cierre la gestiona Control Escolar / Académico.
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* AVANCE */}
        <TabsContent value="avance" className="space-y-4 mt-4">
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">Parcial</Label>
              <Select value={parcialAvance} onValueChange={setParcialAvance}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Parcial 1</SelectItem>
                  <SelectItem value="2">Parcial 2</SelectItem>
                  <SelectItem value="3">Parcial 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadAvance} disabled={loading} style={{ background: "#14356F" }} className="text-white">
              Ver avance
            </Button>
          </div>

          {avance && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card><CardHeader className="pb-2"><CardDescription>Total grupos-materia</CardDescription><CardTitle className="text-3xl">{avance.total}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription className="text-green-600">Capturados</CardDescription><CardTitle className="text-3xl text-green-700">{avance.capturados}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription className="text-red-600">Pendientes</CardDescription><CardTitle className="text-3xl text-red-700">{avance.pendientes}</CardTitle></CardHeader></Card>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="text-left px-4 py-2">Grupo</th>
                      <th className="text-left px-4 py-2">Materia</th>
                      <th className="text-left px-4 py-2">Profesor</th>
                      <th className="text-left px-4 py-2">Campus</th>
                      <th className="text-center px-4 py-2">Estado</th>
                      <th className="text-left px-4 py-2">Última captura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avance.items.map((it) => (
                      <tr key={it.idGrupoMateria} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{it.grupo}</td>
                        <td className="px-4 py-2">{it.materia}</td>
                        <td className="px-4 py-2">{it.profesor}</td>
                        <td className="px-4 py-2 text-muted-foreground">{it.campus ?? "—"}</td>
                        <td className="px-4 py-2 text-center">
                          {it.estado === "Capturado" ? (
                            <Badge className="bg-green-600"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Capturado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-200"><Clock className="h-3.5 w-3.5 mr-1" />Pendiente</Badge>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{fmt(it.ultimaActualizacion)}</td>
                      </tr>
                    ))}
                    {avance.items.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No hay grupos-materia en este periodo.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* PRORROGAS */}
        <TabsContent value="prorrogas" className="space-y-3 mt-4" hidden={!puedeGestionar}>
          {prorrogas.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">No hay solicitudes de prórroga.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-4 py-2">Profesor</th>
                    <th className="text-left px-4 py-2">Grupo / Materia</th>
                    <th className="text-center px-4 py-2">Parcial</th>
                    <th className="text-left px-4 py-2">Motivo</th>
                    <th className="text-left px-4 py-2">Solicitada</th>
                    <th className="text-center px-4 py-2">Estado</th>
                    <th className="text-center px-4 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prorrogas.map((s) => (
                    <tr key={s.idSolicitudProrroga} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{s.profesor}</td>
                      <td className="px-4 py-2">{s.grupo} · {s.materia}</td>
                      <td className="px-4 py-2 text-center">{s.numeroParcial}</td>
                      <td className="px-4 py-2 max-w-[220px]">{s.motivo ?? "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{fmt(s.fechaSolicitud)}</td>
                      <td className="px-4 py-2 text-center">
                        {s.estado === "Pendiente" && <Badge variant="outline" className="text-amber-600 border-amber-200">Pendiente</Badge>}
                        {s.estado === "Aprobada" && <Badge className="bg-green-600">Aprobada · {fmt(s.fechaLimiteProrroga)}</Badge>}
                        {s.estado === "Rechazada" && <Badge variant="outline" className="text-red-600 border-red-200">Rechazada</Badge>}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {s.estado === "Pendiente" && (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleResolver(s, true)}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleResolver(s, false)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />Rechazar
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
