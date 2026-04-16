"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, Check, Loader2, X } from "lucide-react";
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

const BASE = "/PlanEstudios/solicitudes";

interface Solicitud {
  idSolicitudPlanEstudios: number;
  idPlanEstudios: number;
  clavePlanEstudios: string;
  nombrePlanEstudios: string;
  campus: string | null;
  rvoe: string | null;
  estatusSolicitud: string;
  solicitadoPor: string;
  aprobadoPor: string | null;
  comentarioRevision: string | null;
  fechaSolicitud: string;
  fechaResolucion: string | null;
}

export default function SolicitudesPlanPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Pendiente");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Solicitud | null>(null);
  const [accion, setAccion] = useState<"aprobar" | "rechazar">("aprobar");
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

  const openModal = (sol: Solicitud, acc: "aprobar" | "rechazar") => {
    setSelected(sol);
    setAccion(acc);
    setComentario("");
    setModalOpen(true);
  };

  const handleProcesar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put(`${BASE}/${selected.idSolicitudPlanEstudios}/${accion}`, { comentario });
      toast.success(accion === "aprobar" ? "Plan aprobado y activado" : "Solicitud rechazada");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error al procesar");
    } finally { setSaving(false); }
  };

  const estatusColor = (estatus: string) => {
    if (estatus === "Pendiente") return "bg-yellow-100 text-yellow-800";
    if (estatus === "Aprobada") return "bg-green-100 text-green-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          Solicitudes de Planes de Estudio
        </h1>
        <p className="text-muted-foreground mt-1">
          Revisa y aprueba solicitudes de nuevos planes de estudio
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="Pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="Aprobada">Aprobadas</TabsTrigger>
          <TabsTrigger value="Rechazada">Rechazadas</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardHeader>
              <CardTitle>{tab === "Pendiente" ? "Pendientes de Aprobación" : `Solicitudes ${tab}s`}</CardTitle>
              <CardDescription>{solicitudes.length} solicitud(es)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
              ) : solicitudes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No hay solicitudes {tab.toLowerCase()}s</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clave</TableHead>
                        <TableHead>Plan de Estudios</TableHead>
                        <TableHead>Campus</TableHead>
                        <TableHead>RVOE</TableHead>
                        <TableHead className="text-center">Estatus</TableHead>
                        <TableHead>Solicitado Por</TableHead>
                        <TableHead>Fecha</TableHead>
                        {tab === "Pendiente" && <TableHead className="text-center">Acciones</TableHead>}
                        {tab !== "Pendiente" && <TableHead>Resolución</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitudes.map((sol) => (
                        <TableRow key={sol.idSolicitudPlanEstudios} className={sol.estatusSolicitud === "Pendiente" ? "bg-yellow-50" : ""}>
                          <TableCell className="font-mono text-sm">{sol.clavePlanEstudios}</TableCell>
                          <TableCell className="font-medium">{sol.nombrePlanEstudios}</TableCell>
                          <TableCell className="text-sm">{sol.campus || "—"}</TableCell>
                          <TableCell className="text-sm">{sol.rvoe || "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={estatusColor(sol.estatusSolicitud)}>{sol.estatusSolicitud}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{sol.solicitadoPor}</TableCell>
                          <TableCell className="text-sm">{format(new Date(sol.fechaSolicitud), "dd/MM/yy HH:mm", { locale: es })}</TableCell>
                          {tab === "Pendiente" && (
                            <TableCell className="text-center">
                              <div className="flex gap-1 justify-center">
                                <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => openModal(sol, "aprobar")}>
                                  <Check className="h-3 w-3" /> Aprobar
                                </Button>
                                <Button size="sm" variant="destructive" className="gap-1" onClick={() => openModal(sol, "rechazar")}>
                                  <X className="h-3 w-3" /> Rechazar
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          {tab !== "Pendiente" && (
                            <TableCell className="text-sm">
                              <p className="font-medium">{sol.aprobadoPor}</p>
                              {sol.comentarioRevision && <p className="text-gray-500 text-xs">{sol.comentarioRevision}</p>}
                              {sol.fechaResolucion && <p className="text-gray-400 text-xs">{format(new Date(sol.fechaResolucion), "dd/MM/yy HH:mm", { locale: es })}</p>}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{accion === "aprobar" ? "Aprobar Plan de Estudios" : "Rechazar Solicitud"}</DialogTitle>
            <DialogDescription>
              {selected?.clavePlanEstudios} — {selected?.nombrePlanEstudios}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p><strong>Campus:</strong> {selected.campus || "No especificado"}</p>
                <p><strong>RVOE:</strong> {selected.rvoe || "No especificado"}</p>
                <p><strong>Solicitado por:</strong> {selected.solicitadoPor}</p>
              </div>
              <div className="space-y-2">
                <Label>Comentarios {accion === "rechazar" ? "(motivo del rechazo) *" : "(opcional)"}</Label>
                <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3}
                  placeholder={accion === "aprobar" ? "Plan revisado y aprobado..." : "Motivo del rechazo..."} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleProcesar} disabled={saving} variant={accion === "aprobar" ? "default" : "destructive"}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {accion === "aprobar" ? "Aprobar y Activar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
