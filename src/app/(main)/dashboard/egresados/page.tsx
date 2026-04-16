"use client";

import { useEffect, useState } from "react";

import { GraduationCap, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/services/api-client";

const BASE = "/seguimiento-egresados";

const ESTATUS_COLOR: Record<string, string> = {
  "Completo": "bg-green-100 text-green-800",
  "Incompleto": "bg-red-100 text-red-800",
  "Pagado": "bg-green-100 text-green-800",
  "Pendiente": "bg-yellow-100 text-yellow-800",
  "Liberado": "bg-green-100 text-green-800",
  "En Proceso": "bg-blue-100 text-blue-800",
  "No Aplica": "bg-gray-100 text-gray-600",
  "Sin Servicio": "bg-gray-100 text-gray-600",
  "Títulado": "bg-green-100 text-green-800",
  "Entregado": "bg-green-100 text-green-800",
  "Entregada": "bg-green-100 text-green-800",
  "Si": "bg-green-100 text-green-800",
  "No": "bg-red-100 text-red-800",
};

const OPCIONES: Record<string, string[]> = {
  expediente: ["Completo", "Incompleto"],
  pagoTitulacion: ["Pagado", "Pendiente"],
  liberacionServicioSocial: ["Liberado", "En Proceso", "No Aplica", "Sin Servicio"],
  estatusTitulacion: ["Títulado", "En Proceso"],
  estatusCertificado: ["Entregado", "En Proceso", "Pendiente"],
  estatusTituloElectronico: ["Entregado", "En Proceso", "Pendiente"],
  estatusTituloFisico: ["Entregado", "En Proceso", "Pendiente"],
  pagoCedula: ["Si", "No"],
  tramiteCedula: ["Entregada", "En Proceso", "Pendiente"],
};

interface SeguimientoItem {
  idSeguimientoEgresado: number;
  matricula: string | null;
  nombreCompleto: string;
  programaAcademico: string;
  expediente: string | null;
  pagoTitulacion: string | null;
  liberacionServicioSocial: string | null;
  estatusTitulacion: string | null;
  estatusCertificado: string | null;
  estatusTituloElectronico: string | null;
  estatusTituloFisico: string | null;
  pagoCedula: string | null;
  tramiteCedula: string | null;
  observaciones: string | null;
}

interface Stats {
  total: number; titulados: number; enProceso: number;
  expedienteCompleto: number; servicioSocialLiberado: number;
  certificadoEntregado: number; tituloElectronicoEntregado: number;
  cedulaEntregada: number;
}

export default function EgresadosPage() {
  const [registros, setRegistros] = useState<SeguimientoItem[]>([]);
  const [programas, setProgramas] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [programaFiltro, setProgramaFiltro] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      apiClient.get(`${BASE}/programas`),
      apiClient.get(`${BASE}/estadisticas`),
    ]).then(([progRes, statsRes]) => {
      setProgramas(progRes.data);
      setStats(statsRes.data);
    });
  }, []);

  useEffect(() => { loadData(); }, [page, programaFiltro]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "50");
      if (programaFiltro) params.append("programa", programaFiltro);
      if (busqueda) params.append("busqueda", busqueda);
      const { data } = await apiClient.get(`${BASE}?${params}`);
      setRegistros(data.items);
      setTotal(data.total);
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  const handleBuscar = () => { setPage(1); loadData(); };

  const handleCambioCampo = async (id: number, campo: string, valor: string) => {
    try {
      await apiClient.put(`${BASE}/${id}`, { [campo]: valor });
      setRegistros(prev => prev.map(r =>
        r.idSeguimientoEgresado === id ? { ...r, [campo]: valor } : r
      ));
      toast.success("Actualizado");
      apiClient.get(`${BASE}/estadisticas`).then(res => setStats(res.data));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Sin permisos para editar este campo");
    }
  };

  const renderCeldaEditable = (registro: SeguimientoItem, campo: string, valor: string | null) => {
    const opciones = OPCIONES[campo];
    if (!opciones) return <span className="text-gray-300 text-xs">—</span>;

    const color = valor ? (ESTATUS_COLOR[valor.trim()] || "bg-gray-100 text-gray-700") : "";

    return (
      <Select
        value={valor?.trim() || ""}
        onValueChange={(v) => handleCambioCampo(registro.idSeguimientoEgresado, campo, v)}
      >
        <SelectTrigger className="h-7 border-0 bg-transparent p-0 shadow-none justify-center min-w-[90px]">
          {valor ? (
            <Badge className={`${color} text-[10px] whitespace-nowrap cursor-pointer`}>{valor.trim()}</Badge>
          ) : (
            <span className="text-gray-300 text-xs cursor-pointer hover:text-gray-500">—</span>
          )}
        </SelectTrigger>
        <SelectContent>
          {opciones.map((op) => (
            <SelectItem key={op} value={op}>
              <Badge className={`${ESTATUS_COLOR[op] || "bg-gray-100"} text-[10px]`}>{op}</Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))" }}>
            <GraduationCap className="h-8 w-8" style={{ color: "#14356F" }} />
          </div>
          Egresados y Titulados
        </h1>
        <p className="text-muted-foreground mt-1">Seguimiento del proceso de egreso y titulación — haz clic en cualquier campo para editarlo</p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-2" style={{ borderColor: "rgba(20, 53, 111, 0.2)" }}>
            <CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle className="text-3xl" style={{ color: "#14356F" }}>{stats.total}</CardTitle></CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2"><CardDescription className="text-green-600">Titulados</CardDescription><CardTitle className="text-3xl text-green-700">{stats.titulados}</CardTitle></CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2"><CardDescription className="text-blue-600">En Proceso</CardDescription><CardTitle className="text-3xl text-blue-700">{stats.enProceso}</CardTitle></CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2"><CardDescription className="text-purple-600">Certificados</CardDescription><CardTitle className="text-3xl text-purple-700">{stats.certificadoEntregado}</CardTitle></CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2"><CardDescription className="text-orange-600">Cédulas</CardDescription><CardTitle className="text-3xl text-orange-700">{stats.cedulaEntregada}</CardTitle></CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Listado de Egresados</CardTitle>
              <CardDescription>{total} registro(s)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={programaFiltro} onValueChange={(v) => { setProgramaFiltro(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Todos los programas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los programas</SelectItem>
                  {programas.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleBuscar()} className="pl-10 w-56" />
              </div>
              <Button onClick={handleBuscar} variant="outline">Buscar</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">Nombre</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead className="text-center">Expediente</TableHead>
                    <TableHead className="text-center">Pago Titulación</TableHead>
                    <TableHead className="text-center">Serv. Social</TableHead>
                    <TableHead className="text-center">Titulación</TableHead>
                    <TableHead className="text-center">Certificado</TableHead>
                    <TableHead className="text-center">Título Elec.</TableHead>
                    <TableHead className="text-center">Título Físico</TableHead>
                    <TableHead className="text-center">Pago Cédula</TableHead>
                    <TableHead className="text-center">Cédula</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((r) => (
                    <TableRow key={r.idSeguimientoEgresado} className="hover:bg-blue-50/30">
                      <TableCell className="sticky left-0 bg-white z-10 font-medium text-sm">
                        {r.nombreCompleto}
                        {r.matricula && <span className="block text-xs text-gray-400 font-mono">{r.matricula}</span>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs whitespace-nowrap">{r.programaAcademico}</Badge></TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "expediente", r.expediente)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "pagoTitulacion", r.pagoTitulacion)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "liberacionServicioSocial", r.liberacionServicioSocial)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "estatusTitulacion", r.estatusTitulacion)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "estatusCertificado", r.estatusCertificado)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "estatusTituloElectronico", r.estatusTituloElectronico)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "estatusTituloFisico", r.estatusTituloFisico)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "pagoCedula", r.pagoCedula)}</TableCell>
                      <TableCell className="text-center">{renderCeldaEditable(r, "tramiteCedula", r.tramiteCedula)}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[150px] truncate">{r.observaciones || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {total > 50 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-sm text-gray-500 py-2">Página {page} de {Math.ceil(total / 50)}</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
