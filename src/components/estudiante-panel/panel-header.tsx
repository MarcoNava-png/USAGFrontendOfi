"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Building, Clock, Pencil, Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CambioGrupoModal } from "@/app/(main)/dashboard/academic-management/_components/cambio-grupo-modal";
import { cambiarMatricula } from "@/services/estudiante-panel-service";
import type { EstudiantePanelDto } from "@/types/estudiante-panel";
// eslint-disable-next-line no-duplicate-imports
import { formatDate } from "@/types/estudiante-panel";

interface PanelHeaderProps {
  panel: EstudiantePanelDto;
  onUpdate?: () => void;
}

export function PanelHeader({ panel, onUpdate }: PanelHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevaMatricula, setNuevaMatricula] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cambioGrupoOpen, setCambioGrupoOpen] = useState(false);

  const handleCambiarMatricula = async () => {
    const matriculaUpper = nuevaMatricula.trim().toUpperCase();
    if (!/^[A-Z]{1,3}\d{6}$/.test(matriculaUpper)) {
      toast.error("Formato inválido. Debe ser 1-3 letras + 6 dígitos. Ej: L000001, LE000001, LC000001");
      return;
    }
    setGuardando(true);
    try {
      const res = await cambiarMatricula(panel.idEstudiante, matriculaUpper);
      if (res.exitoso) {
        toast.success(res.mensaje);
        setModalOpen(false);
        setNuevaMatricula("");
        onUpdate?.();
      } else {
        toast.error(res.mensaje);
      }
    } catch {
      toast.error("Error al cambiar la matrícula");
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = panel.nombreCompleto
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
    <Card className="overflow-hidden">
      <div
        className="h-2"
        style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
      />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
              <AvatarImage src={panel.fotografia || undefined} alt={panel.nombreCompleto} />
              <AvatarFallback
                className="text-2xl font-bold text-white"
                style={{ backgroundColor: "#14356F" }}
              >
                {iniciales}
              </AvatarFallback>
            </Avatar>
            <Badge
              variant={panel.activo ? "default" : "secondary"}
              className={`${
                panel.activo
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-red-100 text-red-800 hover:bg-red-100"
              }`}
            >
              {panel.activo ? "● Activo" : "○ Inactivo"}
            </Badge>
            <Badge
              variant="outline"
              className={
                panel.estatusAcademico === 3 ? "bg-blue-100 text-blue-800 border-blue-300" :
                panel.estatusAcademico === 4 ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                panel.estatusAcademico === 5 ? "bg-purple-100 text-purple-800 border-purple-300" :
                "bg-gray-100 text-gray-700 border-gray-300"
              }
            >
              {({
                "Inscrito": "Inscrito",
                "Cursando": "Cursando",
                "Egresado": "Egresado",
                "EnProcesoTitulacion": "En Proceso de Titulación",
                "Titulado": "Titulado",
                "BajaTemporal": "Baja Temporal",
                "BajaDefinitiva": "Baja Definitiva",
              } as Record<string, string>)[panel.estatusAcademicoTexto ?? ""] ?? panel.estatusAcademicoTexto}
            </Badge>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{panel.nombreCompleto}</h2>
              <div className="flex items-center gap-2">
                <p className="text-lg font-medium" style={{ color: "#14356F" }}>
                  Matrícula: {panel.matricula}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setNuevaMatricula(/^[A-Z]{1,3}\d{6}$/.test(panel.matricula) ? panel.matricula : "");
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {panel.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{panel.email}</span>
                </div>
              )}
              {panel.telefono && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{panel.telefono}</span>
                </div>
              )}
              {panel.curp && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono">{panel.curp}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-5 h-5 mt-0.5" style={{ color: "#14356F" }} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Carrera</p>
                    <p className="text-sm font-medium text-gray-900">
                      {panel.informacionAcademica.planEstudios || "No asignado"}
                    </p>
                    {panel.informacionAcademica.rvoe && (
                      <p className="text-xs text-gray-500">RVOE: {panel.informacionAcademica.rvoe}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Building className="w-5 h-5 mt-0.5" style={{ color: "#14356F" }} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Campus</p>
                    <p className="text-sm font-medium text-gray-900">
                      {panel.informacionAcademica.campus || "No asignado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 mt-0.5" style={{ color: "#14356F" }} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Grupo / Turno</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-gray-900">
                        {panel.informacionAcademica.grupoActual?.codigoGrupo || "Sin grupo"}
                        {panel.informacionAcademica.turno && ` • ${panel.informacionAcademica.turno}`}
                      </p>
                      {panel.activo && panel.informacionAcademica.grupoActual?.idEstudianteGrupo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Cambiar de grupo"
                          onClick={() => setCambioGrupoOpen(true)}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 mt-0.5" style={{ color: "#14356F" }} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha de Ingreso</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(panel.informacionAcademica.fechaIngreso)}
                    </p>
                  </div>
                </div>
              </div>

              {panel.informacionAcademica.periodoActual && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: "rgba(20, 53, 111, 0.05)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Período Actual</p>
                      <p className="text-sm font-semibold" style={{ color: "#14356F" }}>
                        {panel.informacionAcademica.periodoActual.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(panel.informacionAcademica.periodoActual.fechaInicio)} -{" "}
                        {formatDate(panel.informacionAcademica.periodoActual.fechaFin)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Matrícula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Matrícula actual</Label>
              <Input value={panel.matricula} disabled />
            </div>
            <div className="space-y-2">
              <Label>Nueva matrícula</Label>
              <Input
                value={nuevaMatricula}
                onChange={(e) => setNuevaMatricula(e.target.value.toUpperCase())}
                placeholder="Ej: LC000001"
                maxLength={9}
              />
              <p className="text-xs text-muted-foreground">
                Formato: 1-3 letras + 6 dígitos (ej: L000001, LE000001, LC000001).
                El correo institucional se actualizará automáticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleCambiarMatricula} disabled={guardando || !nuevaMatricula.trim()}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>

    {panel.informacionAcademica.grupoActual?.idEstudianteGrupo &&
      panel.informacionAcademica.grupoActual?.numeroCuatrimestre &&
      panel.informacionAcademica.grupoActual?.idPlanEstudios && (
      <CambioGrupoModal
        open={cambioGrupoOpen}
        onOpenChange={setCambioGrupoOpen}
        idEstudianteGrupo={panel.informacionAcademica.grupoActual.idEstudianteGrupo}
        nombreEstudiante={panel.nombreCompleto}
        matricula={panel.matricula}
        idGrupoActual={panel.informacionAcademica.grupoActual.idGrupo}
        numeroCuatrimestre={panel.informacionAcademica.grupoActual.numeroCuatrimestre}
        idPlanEstudios={panel.informacionAcademica.grupoActual.idPlanEstudios}
        idPeriodoAcademico={panel.informacionAcademica.grupoActual.idPeriodoAcademico ?? undefined}
        onSuccess={() => {
          setCambioGrupoOpen(false);
          onUpdate?.();
        }}
      />
    )}
    </>
  );
}
