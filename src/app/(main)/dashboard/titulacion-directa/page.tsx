"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, Download, Eye, FileCode, FileText, Loader2, Medal, Plus, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/services/api-client";

import { DetalleCertificadoModal } from "./_components/detalle-certificado-modal";
import { NuevaTitulacionModal } from "./_components/nueva-titulacion-modal";

const BASE = "/titulacion/certificados";

const ESTATUS_MAP: Record<string, { label: string; className: string }> = {
  Registro: { label: "Registro", className: "bg-gray-100 text-gray-800" },
  EnRevision: { label: "En Revisión", className: "bg-yellow-100 text-yellow-800" },
  XMLGenerado: { label: "XML Generado", className: "bg-blue-100 text-blue-800" },
  Enviado: { label: "Enviado a SEP", className: "bg-purple-100 text-purple-800" },
  Procesando: { label: "Procesando", className: "bg-indigo-100 text-indigo-800" },
  Registrado: { label: "Registrado", className: "bg-green-100 text-green-800" },
  Rechazado: { label: "Rechazado", className: "bg-red-100 text-red-800" },
  Cancelado: { label: "Cancelado", className: "bg-gray-200 text-gray-600" },
};

interface CertificadoItem {
  id: number;
  folioControl: string | null;
  estatus: number;
  estatusTexto: string;
  numeroControl: string;
  curp: string | null;
  nombreCompleto: string;
  nombreCarrera: string | null;
  clavePlan: string | null;
  promedio: string | null;
  totalAsignaturas: number;
  asignaturasAsignadas: number;
  folioControlSEP: string | null;
  fechaExpedicion: string;
  createdAt: string;
}

interface Estadisticas {
  total: number;
  enRevision: number;
  xmlGenerados: number;
  registrados: number;
}

export default function TitulacionDirectaPage() {
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);
  const [stats, setStats] = useState<Estadisticas>({ total: 0, enRevision: 0, xmlGenerados: 0, registrados: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certRes, statsRes] = await Promise.all([
        apiClient.get<CertificadoItem[]>(`${BASE}/directa`),
        apiClient.get<Estadisticas>(`${BASE}/estadisticas/directa`),
      ]);
      setCertificados(certRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarXml = async (id: number) => {
    setGeneratingId(id);
    try {
      await apiClient.post(`${BASE}/${id}/generar-xml`);
      toast.success("XML generado correctamente");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error al generar XML");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDescargarXml = async (id: number, numeroControl: string) => {
    try {
      const { data } = await apiClient.get(`${BASE}/${id}/descargar-xml`, { responseType: "blob" });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DEC_${numeroControl}.xml`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar XML");
    }
  };

  const filtered = certificados.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.nombreCompleto.toLowerCase().includes(term) ||
      c.numeroControl.toLowerCase().includes(term) ||
      (c.curp && c.curp.toLowerCase().includes(term)) ||
      (c.folioControlSEP && c.folioControlSEP.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))" }}>
              <Medal className="h-8 w-8" style={{ color: "#14356F" }} />
            </div>
            Titulación Directa
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro y gestión de titulaciones por experiencia profesional
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Titulación
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2" style={{ borderColor: "rgba(20, 53, 111, 0.2)", background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.05), rgba(30, 74, 143, 0.1))" }}>
          <CardHeader className="pb-2">
            <CardDescription style={{ color: "#1e4a8f" }}>Total Registros</CardDescription>
            <CardTitle className="text-4xl" style={{ color: "#14356F" }}>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600">En Revisión</CardDescription>
            <CardTitle className="text-4xl text-yellow-700">{stats.enRevision}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600">XML Generados</CardDescription>
            <CardTitle className="text-4xl text-blue-700">{stats.xmlGenerados}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600">Registrados SEP</CardDescription>
            <CardTitle className="text-4xl text-green-700">{stats.registrados}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Registros de Titulación</CardTitle>
          <CardDescription>Lista de personas registradas para titulación por experiencia</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, CURP o folio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Medal className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">{certificados.length === 0 ? "No hay registros de titulación directa" : "No se encontraron resultados"}</p>
              {certificados.length === 0 && <p className="text-sm mt-1">Haz clic en &quot;Nueva Titulación&quot; para registrar una persona</p>}
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Control</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>CURP</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead className="text-center">Materias</TableHead>
                    <TableHead className="text-center">Promedio</TableHead>
                    <TableHead className="text-center">Estatus</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const est = ESTATUS_MAP[c.estatusTexto] || ESTATUS_MAP["Registro"];
                    return (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setDetalleId(c.id); setDetalleOpen(true); }}>
                        <TableCell className="font-mono text-sm">{c.numeroControl}</TableCell>
                        <TableCell className="font-medium">{c.nombreCompleto}</TableCell>
                        <TableCell className="font-mono text-xs">{c.curp || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{c.nombreCarrera || "—"}</TableCell>
                        <TableCell className="text-center">{c.asignaturasAsignadas}/{c.totalAsignaturas}</TableCell>
                        <TableCell className="text-center font-semibold">{c.promedio || "—"}</TableCell>
                        <TableCell className="text-center"><Badge className={est.className}>{est.label}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-600">{c.createdAt ? format(new Date(c.createdAt), "dd/MM/yyyy", { locale: es }) : "—"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {(c.estatusTexto === "Registro" || c.estatusTexto === "Rechazado") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                                disabled={generatingId === c.id}
                                onClick={() => handleGenerarXml(c.id)}
                              >
                                {generatingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileCode className="h-3 w-3" />}
                                Generar XML
                              </Button>
                            )}
                            {(c.estatusTexto === "XMLGenerado" || c.estatusTexto === "Enviado" || c.estatusTexto === "Registrado") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                                onClick={() => handleDescargarXml(c.id, c.numeroControl)}
                              >
                                <Download className="h-3 w-3" />
                                XML
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <NuevaTitulacionModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={loadData} />
      <DetalleCertificadoModal open={detalleOpen} onOpenChange={setDetalleOpen} certificadoId={detalleId} onStatusChanged={loadData} />
    </div>
  );
}
