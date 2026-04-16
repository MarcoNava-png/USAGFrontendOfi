"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Check, Loader2, UserX, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/services/api-client";

const BASE = "/solicitudes-baja";

interface Solicitud {
  idSolicitudBaja: number;
  idEstudiante: number;
  matricula: string;
  nombreEstudiante: string;
  carrera: string;
  tipoBajaTexto: string;
  estadoBajaTexto: string;
  motivoBaja: string | null;
  montoAdeudo: number;
  recibosVencidos: number;
  recibosPendientes: number;
  estatusSolicitud: string;
  solicitadoPor: string;
  autorizadoPor: string | null;
  comentarioFinanzas: string | null;
  fechaSolicitud: string;
  fechaAutorizacion: string | null;
}

export default function SolicitudesBajaPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Pendiente");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Solicitud | null>(null);
  const [accion, setAccion] = useState<"autorizar" | "rechazar">("autorizar");
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Solicitud[]>(`${BASE}?estatus=${tab}`);
      setSolicitudes(data);
    } catch { toast.error("Error al cargar solicitudes"); }
    finally { setLoading(false); }
  };

  const openModal = (sol: Solicitud, acc: "autorizar" | "rechazar") => {
    setSelected(sol);
    setAccion(acc);
    setComentario("");
    setModalOpen(true);
  };

  const handleProcesar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put(`${BASE}/${selected.idSolicitudBaja}/${accion}`, { comentario });
      toast.success(accion === "autorizar" ? "Baja autorizada y procesada" : "Solicitud rechazada");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error al procesar");
    } finally { setSaving(false); }
  };

  const pendientes = solicitudes.filter(s => s.estatusSolicitud === "Pendiente").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50">
            <UserX className="h-8 w-8 text-red-600" />
          </div>
          Solicitudes de Baja
        </h1>
        <p className="text-muted-foreground mt-1">
          Autoriza o rechaza solicitudes de baja de estudiantes con adeudos
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="Pendiente" className="gap-2">
            Pendientes {pendientes > 0 && <Badge variant="destructive" className="text-xs">{pendientes}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="Autorizada">Autorizadas</TabsTrigger>
          <TabsTrigger value="Rechazada">Rechazadas</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardHeader>
              <CardTitle>{tab === "Pendiente" ? "Solicitudes Pendientes de Autorización" : `Solicitudes ${tab}s`}</CardTitle>
              <CardDescription>{solicitudes.length} solicitud(es)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
              ) : solicitudes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No hay solicitudes {tab.toLowerCase()}s</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {solicitudes.map((sol) => (
                    <div key={sol.idSolicitudBaja} className={`border rounded-lg p-4 ${sol.estatusSolicitud === "Pendiente" ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-sm font-bold">{sol.matricula}</span>
                            <span className="font-semibold text-lg">{sol.nombreEstudiante}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{sol.carrera}</Badge>
                            <Badge variant="outline" className="text-xs">{sol.tipoBajaTexto}</Badge>
                            <Badge variant="outline" className="text-xs">{sol.estadoBajaTexto}</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-red-600 font-bold text-lg">${sol.montoAdeudo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                            {sol.recibosVencidos > 0 && <Badge variant="destructive" className="text-xs">{sol.recibosVencidos} vencido(s)</Badge>}
                            {sol.recibosPendientes > 0 && <Badge variant="secondary" className="text-xs">{sol.recibosPendientes} pendiente(s)</Badge>}
                          </div>
                          {sol.motivoBaja && (
                            <div className="bg-white border rounded-md p-3">
                              <p className="text-sm font-medium text-gray-500 mb-1">Motivo:</p>
                              <p className="text-sm">{sol.motivoBaja}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Solicitado por: <strong>{sol.solicitadoPor}</strong></span>
                            <span>{format(new Date(sol.fechaSolicitud), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                          </div>
                          {sol.estatusSolicitud !== "Pendiente" && sol.autorizadoPor && (
                            <div className="bg-gray-50 border rounded-md p-3">
                              <p className="text-sm"><strong>Resolución por:</strong> {sol.autorizadoPor}</p>
                              {sol.comentarioFinanzas && <p className="text-sm mt-1">{sol.comentarioFinanzas}</p>}
                            </div>
                          )}
                        </div>
                        {tab === "Pendiente" && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => openModal(sol, "autorizar")}>
                              <Check className="h-3 w-3" /> Autorizar
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => openModal(sol, "rechazar")}>
                              <X className="h-3 w-3" /> Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{accion === "autorizar" ? "Autorizar Baja" : "Rechazar Solicitud"}</DialogTitle>
            <DialogDescription>
              {selected?.matricula} — {selected?.nombreEstudiante}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">Adeudo: ${selected.montoAdeudo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-sm text-red-600">
                  {selected.recibosVencidos} recibo(s) vencido(s), {selected.recibosPendientes} pendiente(s)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Comentario {accion === "rechazar" ? "(motivo del rechazo)" : "(opcional)"}</Label>
                <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} placeholder={accion === "autorizar" ? "Autorizado por acuerdo con el estudiante..." : "No se puede dar de baja hasta liquidar adeudo..."} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleProcesar} disabled={saving} variant={accion === "autorizar" ? "default" : "destructive"}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {accion === "autorizar" ? "Autorizar Baja" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
