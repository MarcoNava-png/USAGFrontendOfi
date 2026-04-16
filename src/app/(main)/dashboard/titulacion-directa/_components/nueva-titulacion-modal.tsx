"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/services/api-client";

const BASE = "/titulacion/certificados";

interface PlanVinculado {
  idPlanEstudios: number;
  clavePlanEstudios: string;
  rvoe: string | null;
  fechaExpedicionRvoe: string | null;
  minimaAprobatoriaFinal: number;
  minimaAprobatoriaParcial: number;
  periodicidad: string | null;
  idPeriodicidad: number;
  idTipoPeriodoSEP: string | null;
  tipoPeriodoSEP: string | null;
  campus: string | null;
  idCampus: number;
}

interface CarreraSEP {
  id: number;
  idNombreInstitucion: string;
  idNivelEstudios: string;
  idCarrera: string;
  claveCarrera: string;
  nombreCarrera: string;
  planVinculado?: PlanVinculado | null;
}

interface AsignaturaSEP {
  id: number;
  idCarrera: number;
  idAsignatura: number;
  claveAsignatura: string;
  nombre: string;
  creditos?: number;
  idTipoAsignatura?: number;
  tipoAsignatura?: string;
}

interface Catalogo {
  id: number;
  idTipoPeriodo?: string;
  idTipoCertificacion?: string;
  descripcion: string;
}

interface ConfigIPES { id: number; nombreCampus: string | null; }

interface AsignaturaRow {
  idAsignatura: number;
  claveAsignatura: string;
  nombre: string;
  ciclo: string;
  calificacion: string;
  creditos: string;
  idTipoAsignatura: number;
  tipoAsignatura: string;
  idObservaciones: number;
  observaciones: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NuevaTitulacionModal({ open, onOpenChange, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("persona");
  const [tiposPeriodo, setTiposPeriodo] = useState<Catalogo[]>([]);
  const [tiposCert, setTiposCert] = useState<Catalogo[]>([]);
  const [configs, setConfigs] = useState<ConfigIPES[]>([]);
  const [carreras, setCarreras] = useState<CarreraSEP[]>([]);
  const [loadingAsignaturas, setLoadingAsignaturas] = useState(false);

  const [form, setForm] = useState({
    numeroControl: "", curp: "", nombre: "", primerApellido: "", segundoApellido: "",
    idGenero: "250", fechaNacimiento: "",
    idCarreraSEP: "", claveCarrera: "", nombreCarrera: "",
    idTipoPeriodo: "93", tipoPeriodo: "CUATRIMESTRE", clavePlan: "",
    numeroRvoe: "", fechaExpedicionRvoe: "",
    idTipoCertificacion: "79", tipoCertificacion: "TOTAL",
    fechaExpedicion: new Date().toISOString().split("T")[0],
    idLugarExpedicion: "11", lugarExpedicion: "GUANAJUATO",
    idConfiguracionIPES: 0,
  });

  const [asignaturas, setAsignaturas] = useState<AsignaturaRow[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      apiClient.get(`${BASE}/catalogos/tipos-periodo`),
      apiClient.get(`${BASE}/catalogos/tipos-certificacion`),
      apiClient.get("/titulacion/configuracion"),
      apiClient.get("/titulacion/catalogos-sep/carreras-con-plan"),
    ]).then(([tp, tc, cfg, carr]) => {
      setTiposPeriodo(tp.data);
      setTiposCert(tc.data);
      setConfigs(cfg.data);
      setCarreras(carr.data);
      if (cfg.data.length > 0) setForm(f => ({ ...f, idConfiguracionIPES: cfg.data[0].id }));
    }).catch(() => toast.error("Error al cargar catálogos"));
  }, [open]);

  const handleCarreraChange = async (idCarrera: string) => {
    const carrera = carreras.find(c => c.idCarrera === idCarrera);
    if (!carrera) return;

    const plan = carrera.planVinculado;

    setForm(f => ({
      ...f,
      idCarreraSEP: carrera.idCarrera,
      claveCarrera: carrera.claveCarrera,
      nombreCarrera: carrera.nombreCarrera,
      clavePlan: plan?.clavePlanEstudios || f.clavePlan,
      numeroRvoe: plan?.rvoe || f.numeroRvoe,
      fechaExpedicionRvoe: plan?.fechaExpedicionRvoe || f.fechaExpedicionRvoe,
      idTipoPeriodo: plan?.idTipoPeriodoSEP || f.idTipoPeriodo,
      tipoPeriodo: plan?.tipoPeriodoSEP || f.tipoPeriodo,
    }));

    setLoadingAsignaturas(true);
    try {
      const { data } = await apiClient.get<AsignaturaSEP[]>(`${BASE}/catalogos/asignaturas-sep/${parseInt(idCarrera)}`);
      setAsignaturas(data.map(a => ({
        idAsignatura: a.idAsignatura,
        claveAsignatura: a.claveAsignatura || "",
        nombre: a.nombre,
        ciclo: "",
        calificacion: "",
        creditos: a.creditos?.toString() || "",
        idTipoAsignatura: a.idTipoAsignatura || 263,
        tipoAsignatura: a.tipoAsignatura || "OBLIGATORIA",
        idObservaciones: 100,
        observaciones: "NORMAL / ORDINARIO",
      })));
    } catch {
      toast.error("Error al cargar asignaturas");
    } finally {
      setLoadingAsignaturas(false);
    }
  };

  const updateAsignatura = (idx: number, field: keyof AsignaturaRow, value: string) => {
    setAsignaturas(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.primerApellido || !form.numeroControl) {
      toast.error("Completa los datos personales obligatorios");
      setTab("persona");
      return;
    }
    if (!form.idCarreraSEP || !form.clavePlan || !form.numeroRvoe) {
      toast.error("Completa los datos académicos obligatorios");
      setTab("academico");
      return;
    }
    const asigConCalif = asignaturas.filter(a => a.calificacion && a.ciclo);
    if (asigConCalif.length === 0) {
      toast.error("Captura al menos una calificación con ciclo");
      setTab("asignaturas");
      return;
    }
    if (!form.idConfiguracionIPES) {
      toast.error("Configura la IPES primero en Configuración SEP");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(`${BASE}/directa`, {
        ...form,
        idGenero: parseInt(form.idGenero),
        asignaturas: asigConCalif.map(a => ({
          idAsignatura: a.idAsignatura,
          claveAsignatura: a.claveAsignatura,
          nombre: a.nombre,
          ciclo: a.ciclo,
          calificacion: a.calificacion,
          creditos: a.creditos ? parseFloat(a.creditos) : null,
          idTipoAsignatura: a.idTipoAsignatura,
          tipoAsignatura: a.tipoAsignatura,
          idObservaciones: a.idObservaciones,
          observaciones: a.observaciones,
        })),
      });
      toast.success("Titulación registrada correctamente");
      onOpenChange(false);
      onSuccess();
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      numeroControl: "", curp: "", nombre: "", primerApellido: "", segundoApellido: "",
      idGenero: "250", fechaNacimiento: "",
      idCarreraSEP: "", claveCarrera: "", nombreCarrera: "",
      idTipoPeriodo: "93", tipoPeriodo: "CUATRIMESTRE", clavePlan: "",
      numeroRvoe: "", fechaExpedicionRvoe: "",
      idTipoCertificacion: "79", tipoCertificacion: "TOTAL",
      fechaExpedicion: new Date().toISOString().split("T")[0],
      idLugarExpedicion: "11", lugarExpedicion: "GUANAJUATO",
      idConfiguracionIPES: configs.length > 0 ? configs[0].id : 0,
    });
    setAsignaturas([]);
    setTab("persona");
  };

  const asigConCalif = asignaturas.filter(a => a.calificacion && a.ciclo);
  const promedio = asigConCalif.length > 0
    ? (asigConCalif.reduce((s, a) => s + (parseFloat(a.calificacion) || 0), 0) / asigConCalif.length).toFixed(2)
    : "—";
  const totalCreditos = asigConCalif.reduce((s, a) => s + (parseFloat(a.creditos) || 0), 0);

  const aplicarCicloMasivo = (valor: string) => {
    setAsignaturas(prev => prev.map(a => a.ciclo ? a : { ...a, ciclo: valor }));
  };

  const aplicarCiclosAutomaticos = (anioInicio: number) => {
    setAsignaturas(prev => prev.map(a => {
      const match = a.claveAsignatura.match(/(\d{2})\d{2}$/);
      if (!match) return a;
      const numCuat = parseInt(match[1]);
      const anio = anioInicio + Math.floor((numCuat - 1) / 3);
      const periodo = ((numCuat - 1) % 3) + 1;
      return { ...a, ciclo: `${anio}-${periodo}` };
    }));
  };

  const aplicarCalificacionesAleatorias = (nivel: "basico" | "regular" | "bueno") => {
    const rangos = {
      basico: { min: 7.0, max: 7.9 },
      regular: { min: 7.5, max: 8.9 },
      bueno: { min: 9.0, max: 10.0 },
    };
    const { min, max } = rangos[nivel];
    setAsignaturas(prev => prev.map(a => {
      const raw = min + Math.random() * (max - min);
      const calif = raw >= 10 ? "10" : raw.toFixed(2);
      return { ...a, calificacion: calif };
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[80vw] !max-w-[80vw] h-[80vh] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Titulación Directa</DialogTitle>
          <DialogDescription>Registra una persona para titulación por experiencia profesional</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="persona">1. Datos Personales</TabsTrigger>
            <TabsTrigger value="academico">2. Datos Académicos</TabsTrigger>
            <TabsTrigger value="asignaturas">3. Asignaturas ({asigConCalif.length}/{asignaturas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="persona" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Control / Matrícula *</Label>
                <Input value={form.numeroControl} onChange={e => setForm(f => ({ ...f, numeroControl: e.target.value }))} placeholder="Ej: USG0008" />
              </div>
              <div className="space-y-2">
                <Label>CURP</Label>
                <Input value={form.curp} onChange={e => setForm(f => ({ ...f, curp: e.target.value.toUpperCase() }))} maxLength={18} className="uppercase font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Nombre(s) *</Label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value.toUpperCase() }))} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Primer Apellido *</Label>
                <Input value={form.primerApellido} onChange={e => setForm(f => ({ ...f, primerApellido: e.target.value.toUpperCase() }))} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Segundo Apellido</Label>
                <Input value={form.segundoApellido} onChange={e => setForm(f => ({ ...f, segundoApellido: e.target.value.toUpperCase() }))} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Género *</Label>
                <Select value={form.idGenero} onValueChange={v => setForm(f => ({ ...f, idGenero: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="250">Mujer</SelectItem>
                    <SelectItem value="251">Hombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Nacimiento *</Label>
                <Input type="date" value={form.fechaNacimiento} onChange={e => setForm(f => ({ ...f, fechaNacimiento: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => {
                  if (!form.nombre || !form.primerApellido || !form.numeroControl) {
                    toast.error("Completa los campos obligatorios: No. Control, Nombre y Primer Apellido");
                    return;
                  }
                  if (!form.fechaNacimiento) { toast.error("Captura la fecha de nacimiento"); return; }
                  setTab("academico");
                }}
                style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
              >
                Siguiente: Datos Académicos →
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="academico" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Carrera (Catálogo SEP) *</Label>
                <Select value={form.idCarreraSEP} onValueChange={handleCarreraChange}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una carrera..." /></SelectTrigger>
                  <SelectContent>
                    {carreras.map(c => (
                      <SelectItem key={c.id} value={c.idCarrera}>
                        {c.nombreCarrera} ({c.claveCarrera})
                        {c.planVinculado ? " ✓" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.idCarreraSEP && (() => {
                  const c = carreras.find(x => x.idCarrera === form.idCarreraSEP);
                  if (c?.planVinculado) {
                    return (
                      <p className="text-xs text-green-600">
                        Plan vinculado: {c.planVinculado.clavePlanEstudios} — RVOE: {c.planVinculado.rvoe || "Sin capturar"} — Campus: {c.planVinculado.campus || "N/A"}
                      </p>
                    );
                  }
                  return <p className="text-xs text-yellow-600">Sin plan vinculado. Configura la Carrera SEP en Planes de Estudio.</p>;
                })()}
              </div>
              <div className="space-y-2">
                <Label>Tipo de Periodo *</Label>
                <Select value={form.idTipoPeriodo} onValueChange={v => {
                  const tp = tiposPeriodo.find(t => t.idTipoPeriodo === v);
                  setForm(f => ({ ...f, idTipoPeriodo: v, tipoPeriodo: tp?.descripcion || "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {tiposPeriodo.map(t => <SelectItem key={t.id} value={t.idTipoPeriodo!}>{t.descripcion}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Clave del Plan *</Label>
                <Input value={form.clavePlan} onChange={e => setForm(f => ({ ...f, clavePlan: e.target.value }))} placeholder="Ej: 2022" className={form.clavePlan ? "bg-green-50" : ""} />
              </div>
              <div className="space-y-2">
                <Label>Número de RVOE *</Label>
                <Input value={form.numeroRvoe} onChange={e => setForm(f => ({ ...f, numeroRvoe: e.target.value }))} placeholder="Ej: 20221717" className={form.numeroRvoe ? "bg-green-50" : ""} />
              </div>
              <div className="space-y-2">
                <Label>Fecha Expedición RVOE *</Label>
                <Input type="date" value={form.fechaExpedicionRvoe} onChange={e => setForm(f => ({ ...f, fechaExpedicionRvoe: e.target.value }))} className={form.fechaExpedicionRvoe ? "bg-green-50" : ""} />
              </div>
              <div className="space-y-2">
                <Label>Tipo Certificación</Label>
                <Select value={form.idTipoCertificacion} onValueChange={v => {
                  const tc = tiposCert.find(t => t.idTipoCertificacion === v);
                  setForm(f => ({ ...f, idTipoCertificacion: v, tipoCertificacion: tc?.descripcion || "" }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiposCert.map(t => <SelectItem key={t.id} value={t.idTipoCertificacion!}>{t.descripcion}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Expedición *</Label>
                <Input type="date" value={form.fechaExpedicion} onChange={e => setForm(f => ({ ...f, fechaExpedicion: e.target.value }))} />
              </div>
              {configs.length > 0 && (
                <div className="space-y-2">
                  <Label>Configuración IPES</Label>
                  <Select value={form.idConfiguracionIPES?.toString()} onValueChange={v => setForm(f => ({ ...f, idConfiguracionIPES: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {configs.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombreCampus || `Config #${c.id}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setTab("persona")}>← Datos Personales</Button>
              <Button
                type="button"
                onClick={() => {
                  if (!form.idCarreraSEP) { toast.error("Selecciona una carrera"); return; }
                  if (!form.clavePlan) { toast.error("Captura la clave del plan"); return; }
                  if (!form.numeroRvoe) { toast.error("Captura el número de RVOE"); return; }
                  setTab("asignaturas");
                }}
                style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
              >
                Siguiente: Asignaturas →
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="asignaturas" className="space-y-4 mt-4">
            {loadingAsignaturas ? (
              <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
            ) : asignaturas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="font-medium">Selecciona una carrera en el tab anterior</p>
                <p className="text-sm mt-1">Las asignaturas se cargarán automáticamente del catálogo SEP</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{asigConCalif.length}/{asignaturas.length} capturadas</Badge>
                    <Badge variant="outline">Promedio: {promedio}</Badge>
                    {totalCreditos > 0 && <Badge variant="outline">Créditos: {totalCreditos.toFixed(2)}</Badge>}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Llenado rápido</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs whitespace-nowrap">Año inicio:</Label>
                      <Input className="w-20 h-7 text-xs" placeholder="2020" id="anioInicio" defaultValue="2020" />
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                        onClick={() => {
                          const val = parseInt((document.getElementById("anioInicio") as HTMLInputElement).value);
                          if (val >= 2000 && val <= 2030) aplicarCiclosAutomaticos(val);
                          else toast.error("Año inválido");
                        }}>
                        Llenar ciclos
                      </Button>
                    </div>
                    <div className="h-5 border-l border-gray-300" />
                    <div className="flex items-center gap-1">
                      <Label className="text-xs whitespace-nowrap">Calificaciones:</Label>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => aplicarCalificacionesAleatorias("basico")}>Básico (7-7.9)</Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => aplicarCalificacionesAleatorias("regular")}>Regular (7.5-8.9)</Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => aplicarCalificacionesAleatorias("bueno")}>Bueno (9-10)</Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead className="w-24">Clave</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-24">Ciclo *</TableHead>
                        <TableHead className="w-20">Calif *</TableHead>
                        <TableHead className="w-20">Créditos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asignaturas.map((a, idx) => (
                        <TableRow key={idx} className={a.calificacion && a.ciclo ? "bg-green-50" : ""}>
                          <TableCell className="text-xs text-gray-400">{a.idAsignatura}</TableCell>
                          <TableCell className="font-mono text-xs">{a.claveAsignatura}</TableCell>
                          <TableCell className="text-sm">{a.nombre}</TableCell>
                          <TableCell>
                            <Input
                              className="h-7 text-xs"
                              placeholder="2023-1"
                              value={a.ciclo}
                              onChange={e => updateAsignatura(idx, "ciclo", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-7 text-xs text-center"
                              placeholder="0-10"
                              value={a.calificacion}
                              onChange={e => updateAsignatura(idx, "calificacion", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-7 text-xs text-center"
                              value={a.creditos}
                              onChange={e => updateAsignatura(idx, "creditos", e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setTab("academico")}>← Datos Académicos</Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving} style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Registrar Titulación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
