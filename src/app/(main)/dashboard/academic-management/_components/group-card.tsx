"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  History,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/use-permissions";
import { deleteGroup, sincronizarMateriasPlan } from "@/services/groups-service";
import { GrupoResumen } from "@/types/group";

import { GenerarCuatrimestresAnterioresModal } from "./generar-cuatrimestres-anteriores-modal";
import { GroupSubjectsModal } from "./group-subjects-modal";
import { PromoteStudentsModal } from "./promote-students-modal";
import { StudentsInGroupModal } from "./students-in-group-modal";

interface GroupCardProps {
  grupo: GrupoResumen;
  numeroCuatrimestre?: number;
  onUpdate: () => void;
  periodicidadLabel?: string;
}

export function GroupCard({ grupo, numeroCuatrimestre, onUpdate, periodicidadLabel = "Cuatrimestre" }: GroupCardProps) {
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showGenerarAnteriores, setShowGenerarAnteriores] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const router = useRouter();
  const { permissions } = usePermissions();
  const puedeCapturarHistorial =
    permissions?.roles?.some((r) => ["superadmin", "admin", "controlescolar", "director", "coordinador"].includes(r)) ?? false;
  const puedeGenerarAnteriores =
    (numeroCuatrimestre ?? 0) > 1 &&
    (permissions?.roles?.some((r) => ["superadmin", "admin", "controlescolar"].includes(r)) ?? false);

  const ocupacion = grupo.capacidadMaxima > 0
    ? Math.round((grupo.totalEstudiantes / grupo.capacidadMaxima) * 100)
    : 0;

  const handleSincronizarMaterias = async () => {
    setSyncing(true);
    try {
      const r = await sincronizarMateriasPlan(grupo.idGrupo);
      if (r.yaEstabaCompleto || r.materiasAgregadas === 0) {
        toast.success(`El grupo ya tiene todas las materias del plan (${r.totalMateriasActivas}).`);
      } else {
        toast.success(
          `Se ligaron ${r.materiasAgregadas} materia(s) del plan (${r.inscripcionesCreadas} inscripción(es) creadas).`,
        );
      }
      onUpdate();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string } }; message?: string };
      toast.error(err?.response?.data?.Error ?? err?.message ?? "No se pudieron sincronizar las materias");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGroup(grupo.idGrupo);
      toast.success("Grupo eliminado exitosamente");
      setShowDeleteDialog(false);
      onUpdate();
    } catch (error: unknown) {
      console.error("Error deleting group:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message ?? err?.message ?? "Error al eliminar el grupo";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-lg text-gray-900">{grupo.nombreGrupo}</h4>
            <p className="text-sm text-gray-600">Código: {grupo.codigoGrupo}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSubjectsModal(true)}>
                <BookOpen className="w-4 h-4 mr-2" />
                Ver Materias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowStudentsModal(true)}>
                <Users className="w-4 h-4 mr-2" />
                Ver Estudiantes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPromoteModal(true)}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Promover Estudiantes
              </DropdownMenuItem>
              {puedeCapturarHistorial && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/academic-management/historial-grupo/${grupo.idGrupo}`)}>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Capturar calificaciones
                </DropdownMenuItem>
              )}
              {puedeCapturarHistorial && (
                <DropdownMenuItem onClick={handleSincronizarMaterias} disabled={syncing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  Sincronizar materias del plan
                </DropdownMenuItem>
              )}
              {puedeGenerarAnteriores && (
                <DropdownMenuItem onClick={() => setShowGenerarAnteriores(true)}>
                  <History className="w-4 h-4 mr-2" />
                  Generar cuatrimestres anteriores
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Grupo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{grupo.turno}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{grupo.periodoAcademico}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(20, 53, 111, 0.1)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" style={{ color: '#14356F' }} />
              <span className="text-xs font-medium" style={{ color: '#1e4a8f' }}>Estudiantes</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#14356F' }}>
              {grupo.totalEstudiantes}/{grupo.capacidadMaxima}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Materias</span>
            </div>
            <p className="text-xl font-bold text-green-900">{grupo.totalMaterias}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Ocupación</span>
            <span>{ocupacion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                ocupacion >= 90
                  ? "bg-red-500"
                  : ocupacion >= 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${ocupacion}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Horarios cargados
            </span>
            <span className="font-medium">
              {grupo.porcentajeHorarios ?? 0}% ({grupo.materiasConHorario ?? 0}/{grupo.totalMaterias})
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                (grupo.porcentajeHorarios ?? 0) >= 100
                  ? "bg-green-500"
                  : (grupo.porcentajeHorarios ?? 0) >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${grupo.porcentajeHorarios ?? 0}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubjectsModal(true)}
            className="w-full"
            style={{ borderColor: '#14356F', color: '#14356F' }}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Materias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStudentsModal(true)}
            className="w-full"
            style={{ borderColor: '#14356F', color: '#14356F' }}
          >
            <Users className="w-4 h-4 mr-2" />
            Estudiantes
          </Button>
        </div>
      </div>
      <GroupSubjectsModal
        open={showSubjectsModal}
        onOpenChange={setShowSubjectsModal}
        idGrupo={grupo.idGrupo}
        nombreGrupo={grupo.nombreGrupo}
        idPlanEstudios={grupo.idPlanEstudios}
        codigoGrupo={grupo.codigoGrupo}
        numeroCuatrimestre={numeroCuatrimestre}
        periodicidadLabel={periodicidadLabel}
      />

      <StudentsInGroupModal
        open={showStudentsModal}
        onOpenChange={setShowStudentsModal}
        idGrupo={grupo.idGrupo}
        nombreGrupo={grupo.nombreGrupo}
        numeroCuatrimestre={numeroCuatrimestre}
        idPlanEstudios={grupo.idPlanEstudios}
        idPeriodoAcademico={grupo.idPeriodoAcademico}
        onUpdate={onUpdate}
      />

      <PromoteStudentsModal
        open={showPromoteModal}
        onOpenChange={setShowPromoteModal}
        idGrupo={grupo.idGrupo}
        nombreGrupo={grupo.nombreGrupo}
        onSuccess={onUpdate}
        periodicidadLabel={periodicidadLabel}
      />

      {puedeGenerarAnteriores && (
        <GenerarCuatrimestresAnterioresModal
          open={showGenerarAnteriores}
          onOpenChange={setShowGenerarAnteriores}
          idGrupo={grupo.idGrupo}
          nombreGrupo={grupo.nombreGrupo}
          onSuccess={onUpdate}
        />
      )}

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Eliminar Grupo"
        description="Esta acción no se puede deshacer. Se eliminará permanentemente el grupo:"
        itemName={grupo.nombreGrupo}
        onConfirm={handleDelete}
        isDeleting={deleting}
      />
    </>
  );
}
