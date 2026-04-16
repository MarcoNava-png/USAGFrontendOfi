"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, FileCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/services/api-client";

const BASE = "/titulacion/certificados";

const ESTATUS_MAP: Record<string, { label: string; className: string }> = {
  Registro: { label: "Registro", className: "bg-gray-100 text-gray-800" },
  EnRevision: { label: "En Revisión", className: "bg-yellow-100 text-yellow-800" },
  XMLGenerado: { label: "XML Generado", className: "bg-blue-100 text-blue-800" },
  Enviado: { label: "Enviado a SEP", className: "bg-purple-100 text-purple-800" },
  Procesando: { label: "Procesando", className: "bg-indigo-100 text-indigo-800" },
  Registrado: { label: "Registrado SEP", className: "bg-green-100 text-green-800" },
  Rechazado: { label: "Rechazado", className: "bg-red-100 text-red-800" },
  Cancelado: { label: "Cancelado", className: "bg-gray-200 text-gray-600" },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificadoId: number | null;
  onStatusChanged?: () => void;
}

export function DetalleCertificadoModal({ open, onOpenChange, certificadoId, onStatusChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [detalle, setDetalle] = useState<any>(null);
  const [tab, setTab] = useState("datos");

  useEffect(() => {
    if (open && certificadoId) loadDetalle();
    if (!open) { setDetalle(null); setTab("datos"); }
  }, [open, certificadoId]);

  const loadDetalle = async () => {
    if (!certificadoId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`${BASE}/${certificadoId}`);
      setDetalle(data);
    } catch { toast.error("Error al cargar detalle"); }
    finally { setLoading(false); }
  };

  const handleGenerarXml = async () => {
    if (!certificadoId) return;
    setGenerating(true);
    try {
      await apiClient.post(`${BASE}/${certificadoId}/generar-xml`);
      toast.success("XML generado correctamente");
      loadDetalle();
      onStatusChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error al generar XML");
    } finally { setGenerating(false); }
  };

  const handleDescargarXml = async () => {
    if (!certificadoId || !detalle) return;
    try {
      const { data } = await apiClient.get(`${BASE}/${certificadoId}/descargar-xml`, { responseType: "blob" });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DEC_${detalle.numeroControl}.xml`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Error al descargar XML"); }
  };

  if (!detalle && !loading) return null;

  const est = detalle ? ESTATUS_MAP[detalle.estatusTexto] || ESTATUS_MAP["Registro"] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[85vw] !max-w-[85vw] h-[85vh] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Certificado Electrónico
            {est && <Badge className={est.className}>{est.label}</Badge>}
            {detalle?.folioControl && <span className="text-sm font-mono text-muted-foreground">{detalle.folioControl}</span>}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : detalle && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="datos">Datos del Certificado</TabsTrigger>
              <TabsTrigger value="asignaturas">Asignaturas ({detalle.asignaturas?.length || 0})</TabsTrigger>
              <TabsTrigger value="xml">XML {detalle.xmlGenerado ? "✓" : ""}</TabsTrigger>
            </TabsList>

            <TabsContent value="datos" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Datos del Alumno</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Nombre:</span> <strong>{detalle.nombre} {detalle.primerApellido} {detalle.segundoApellido || ""}</strong></div>
                      <div><span className="text-muted-foreground">No. Control:</span> <strong className="font-mono">{detalle.numeroControl}</strong></div>
                      <div><span className="text-muted-foreground">CURP:</span> <strong className="font-mono">{detalle.curp || "—"}</strong></div>
                      <div><span className="text-muted-foreground">Género:</span> <strong>{detalle.idGenero === 250 ? "Mujer" : "Hombre"}</strong></div>
                      <div><span className="text-muted-foreground">Fecha Nac:</span> <strong>{detalle.fechaNacimiento ? format(new Date(detalle.fechaNacimiento), "dd/MM/yyyy", { locale: es }) : "—"}</strong></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Datos Académicos</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Carrera:</span> <strong>{detalle.nombreCarrera}</strong></div>
                      <div><span className="text-muted-foreground">Clave Plan:</span> <strong>{detalle.clavePlan}</strong></div>
                      <div><span className="text-muted-foreground">RVOE:</span> <strong>{detalle.numeroRvoe}</strong></div>
                      <div><span className="text-muted-foreground">Tipo Periodo:</span> <strong>{detalle.tipoPeriodo}</strong></div>
                      <div><span className="text-muted-foreground">Tipo Cert.:</span> <strong>{detalle.tipoCertificacion}</strong></div>
                      <div><span className="text-muted-foreground">Fecha Exp.:</span> <strong>{detalle.fechaExpedicion ? format(new Date(detalle.fechaExpedicion), "dd/MM/yyyy", { locale: es }) : "—"}</strong></div>
                      <div><span className="text-muted-foreground">Materias:</span> <strong>{detalle.asignaturasAsignadas}/{detalle.totalAsignaturas}</strong></div>
                      <div><span className="text-muted-foreground">Promedio:</span> <strong>{detalle.promedio || "—"}</strong></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Estado SEP</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-4 gap-4">
                      <div><span className="text-muted-foreground">Estatus:</span> {est && <Badge className={est.className}>{est.label}</Badge>}</div>
                      <div><span className="text-muted-foreground">Folio SEP:</span> <strong>{detalle.folioControlSEP || "Pendiente"}</strong></div>
                      <div><span className="text-muted-foreground">Enviado:</span> <strong>{detalle.fechaEnvioSEP ? format(new Date(detalle.fechaEnvioSEP), "dd/MM/yyyy HH:mm", { locale: es }) : "No enviado"}</strong></div>
                      <div><span className="text-muted-foreground">Respuesta:</span> <strong>{detalle.mensajeSEP || "—"}</strong></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="asignaturas" className="mt-4">
              <div className="border rounded-lg max-h-[55vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead className="w-28">Clave</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-20 text-center">Ciclo</TableHead>
                      <TableHead className="w-20 text-center">Calif.</TableHead>
                      <TableHead className="w-24">Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detalle.asignaturas || []).map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs text-gray-400">{a.idAsignatura}</TableCell>
                        <TableCell className="font-mono text-xs">{a.claveAsignatura}</TableCell>
                        <TableCell className="text-sm">{a.nombre}</TableCell>
                        <TableCell className="text-center text-sm">{a.ciclo}</TableCell>
                        <TableCell className="text-center font-semibold">{a.calificacion}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.observaciones || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="xml" className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                {(detalle.estatusTexto === "Registro" || detalle.estatusTexto === "Rechazado") && (
                  <Button onClick={handleGenerarXml} disabled={generating} className="gap-2">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCode className="h-4 w-4" />}
                    {detalle.xmlGenerado ? "Regenerar XML" : "Generar XML"}
                  </Button>
                )}
                {detalle.xmlGenerado && (
                  <Button variant="outline" onClick={handleDescargarXml} className="gap-2">
                    <Download className="h-4 w-4" />
                    Descargar XML
                  </Button>
                )}
              </div>

              {detalle.xmlGenerado ? (
                <div className="border rounded-lg bg-gray-50 p-4 max-h-[50vh] overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">{detalle.xmlGenerado}</pre>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <FileCode className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">XML no generado aún</p>
                  <p className="text-sm mt-1">Haz clic en &quot;Generar XML&quot; para crear el certificado electrónico</p>
                </div>
              )}

              {detalle.cadenaOriginal && (
                <div className="border rounded-lg bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Cadena Original:</p>
                  <pre className="text-xs font-mono break-all text-blue-900">{detalle.cadenaOriginal}</pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
