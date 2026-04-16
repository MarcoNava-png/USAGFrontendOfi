"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AlertTriangle, ArrowLeft, Download, Mail, MoreVertical, RefreshCw, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { PanelHeader } from "@/components/estudiante-panel/panel-header";
import { PanelStatsCards } from "@/components/estudiante-panel/panel-stats-cards";
import { BecasTab } from "@/components/estudiante-panel/tabs/becas-tab";
import { DatosPersonalesTab } from "@/components/estudiante-panel/tabs/datos-personales-tab";
import { DocumentosPersonalesTab } from "@/components/estudiante-panel/tabs/documentos-personales-tab";
import { DocumentosTab } from "@/components/estudiante-panel/tabs/documentos-tab";
import { RecibosTab } from "@/components/estudiante-panel/tabs/recibos-tab";
import { SeguimientoAcademicoTab } from "@/components/estudiante-panel/tabs/seguimiento-academico-tab";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  actualizarEstatusEstudiante,
  descargarYGuardarExpediente,
  enviarRecordatorioPago,
  obtenerPanelEstudiante,
} from "@/services/estudiante-panel-service";
import type { EstudiantePanelDto } from "@/types/estudiante-panel";

export default function PanelEstudiantePage() {
  const params = useParams();
  const router = useRouter();
  const idEstudiante = Number(params.id);

  const [panel, setPanel] = useState<EstudiantePanelDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("datos");
  const [bajaModalOpen, setBajaModalOpen] = useState(false);
  const [bajaTipo, setBajaTipo] = useState<string>("");
  const [bajaEstado, setBajaEstado] = useState<string>("");
  const [bajaMotivo, setBajaMotivo] = useState("");
  const [procesandoBaja, setProcesandoBaja] = useState(false);

  const cargarPanel = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const data = await obtenerPanelEstudiante(idEstudiante);
      setPanel(data);

      if (showToast) {
        toast.success("Información actualizada");
      }
    } catch (error) {
      console.error("Error al cargar panel:", error);
      toast.error("Error al cargar la información del estudiante");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [idEstudiante]);

  useEffect(() => {
    if (idEstudiante) {
      cargarPanel();
    }
  }, [idEstudiante, cargarPanel]);

  const handleDescargarExpediente = async () => {
    if (!panel) return;
    try {
      toast.loading("Generando Expediente...");
      await descargarYGuardarExpediente(panel.idEstudiante, panel.matricula);
      toast.dismiss();
      toast.success("Expediente descargado exitosamente");
    } catch (error) {
      toast.dismiss();
      toast.error("Error al descargar el Expediente");
      console.error(error);
    }
  };

  const handleEnviarRecordatorio = async () => {
    if (!panel) return;
    try {
      const result = await enviarRecordatorioPago(panel.idEstudiante);
      if (result.exitoso) {
        toast.success(result.mensaje);
      } else {
        toast.error(result.mensaje);
      }
    } catch (error) {
      toast.error("Error al enviar el recordatorio");
      console.error(error);
    }
  };

  const handleAbrirBaja = () => {
    setBajaTipo("");
    setBajaEstado("");
    setBajaMotivo("");
    setBajaModalOpen(true);
  };

  const handleConfirmarBaja = async () => {
    if (!panel || !bajaTipo || !bajaEstado || !bajaMotivo.trim()) return;
    setProcesandoBaja(true);
    try {
      const { data } = await (await import("@/services/api-client")).default.post(
        `/solicitudes-baja/${panel.idEstudiante}`,
        {
          tipoBaja: Number(bajaTipo),
          estadoBaja: Number(bajaEstado),
          motivoBaja: bajaMotivo.trim(),
        }
      );
      if (data.procesada) {
        toast.success(data.mensaje);
        setBajaModalOpen(false);
        cargarPanel(true);
      } else {
        toast.warning(data.mensaje, { duration: 8000 });
        setBajaModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al procesar la baja");
      console.error(error);
    } finally {
      setProcesandoBaja(false);
    }
  };

  const handleReactivar = async () => {
    if (!panel) return;
    try {
      const result = await actualizarEstatusEstudiante(
        panel.idEstudiante,
        true,
        "Reactivación desde panel administrativo"
      );
      if (result.exitoso) {
        toast.success(result.mensaje);
        cargarPanel(true);
      } else {
        toast.error(result.mensaje);
      }
    } catch (error) {
      toast.error("Error al reactivar al estudiante");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-700">Estudiante no encontrado</h2>
          <p className="text-gray-500 mt-2">No se pudo cargar la información del estudiante.</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Regresar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#14356F" }}>
              Panel del Estudiante
            </h1>
            <p className="text-sm text-gray-500">
              Gestión completa de información académica y administrativa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarPanel(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            size="sm"
            onClick={handleDescargarExpediente}
            style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
          >
            <Download className="w-4 h-4 mr-2" />
            Expediente Académico
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleEnviarRecordatorio}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Recordatorio de Pago
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {panel.activo ? (
                <DropdownMenuItem onClick={handleAbrirBaja} className="text-red-600">
                  <UserX className="w-4 h-4 mr-2" />
                  Dar de Baja
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleReactivar} className="text-green-600">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Reactivar Estudiante
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!panel.activo && (panel.tipoBaja != null || panel.estatusAcademico >= 6) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-red-700">Estudiante dado de baja</span>
            {panel.tipoBaja != null && (
              <Badge variant="outline" className="border-red-300 text-red-700">
                {panel.tipoBaja === 1 ? "Administrativa" : "Académica"}
              </Badge>
            )}
            {panel.estadoBaja != null && (
              <Badge variant="outline" className={panel.estadoBaja === 2 ? "border-red-500 text-red-800" : "border-yellow-500 text-yellow-800"}>
                {panel.estadoBaja === 1 ? "Temporal" : "Definitiva"}
              </Badge>
            )}
            {panel.tipoBaja == null && panel.estadoBaja == null && (
              <Badge variant="outline" className={panel.estatusAcademico === 7 ? "border-red-500 text-red-800" : "border-yellow-500 text-yellow-800"}>
                {panel.estatusAcademico === 7 ? "Definitiva" : "Temporal"}
              </Badge>
            )}
            {panel.motivoBaja && (
              <span className="text-sm text-red-600">— {panel.motivoBaja}</span>
            )}
            {panel.fechaBaja && (
              <span className="text-xs text-red-400">
                ({new Date(panel.fechaBaja.endsWith("Z") ? panel.fechaBaja : panel.fechaBaja + "Z").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Mexico_City" })})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={bajaModalOpen} onOpenChange={setBajaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Dar de Baja a Estudiante
            </DialogTitle>
            <DialogDescription>
              {panel.nombreCompleto} — {panel.matricula}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de Baja</Label>
              <Select value={bajaTipo} onValueChange={setBajaTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Administrativa</SelectItem>
                  <SelectItem value="2">Académica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado de Baja</Label>
              <Select value={bajaEstado} onValueChange={setBajaEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Temporal</SelectItem>
                  <SelectItem value="2">Definitiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Describe el motivo de la baja..."
                value={bajaMotivo}
                onChange={(e) => setBajaMotivo(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
            {bajaEstado === "2" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-700">
                  La baja definitiva implica que el estudiante no podrá ser reactivado fácilmente.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBajaModalOpen(false)} disabled={procesandoBaja}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarBaja}
              disabled={!bajaTipo || !bajaEstado || !bajaMotivo.trim() || procesandoBaja}
            >
              {procesandoBaja ? "Procesando..." : "Confirmar Baja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PanelHeader panel={panel} onUpdate={() => cargarPanel(true)} />

      <PanelStatsCards panel={panel} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="datos">Datos Personales</TabsTrigger>
          <TabsTrigger value="academico">Seguimiento Académico</TabsTrigger>
          <TabsTrigger value="recibos">Pagos y Recibos</TabsTrigger>
          <TabsTrigger value="becas">Becas</TabsTrigger>
          <TabsTrigger value="expediente">Expediente</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="datos" className="m-0">
            <DatosPersonalesTab
              panel={panel}
              onUpdate={() => cargarPanel(true)}
            />
          </TabsContent>

          <TabsContent value="academico" className="m-0">
            <SeguimientoAcademicoTab
              idEstudiante={panel.idEstudiante}
              resumenKardex={panel.resumenKardex}
            />
          </TabsContent>

          <TabsContent value="recibos" className="m-0">
            <RecibosTab
              idEstudiante={panel.idEstudiante}
              resumenRecibos={panel.resumenRecibos}
            />
          </TabsContent>

          <TabsContent value="becas" className="m-0">
            <BecasTab
              idEstudiante={panel.idEstudiante}
              becas={panel.becas}
              onUpdate={() => cargarPanel(true)}
            />
          </TabsContent>

          <TabsContent value="expediente" className="m-0">
            <DocumentosPersonalesTab idEstudiante={panel.idEstudiante} />
          </TabsContent>

          <TabsContent value="documentos" className="m-0">
            <DocumentosTab
              idEstudiante={panel.idEstudiante}
              documentos={panel.documentos}
              matricula={panel.matricula}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
