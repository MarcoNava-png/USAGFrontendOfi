"use client";

import { useEffect, useState } from "react";

import { BookOpen, Plus, Trash2, User, MapPin, Clock, Edit, Zap } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateScheduleSummary, calculateWeeklyHours } from "@/lib/schedule-validation";
import { getGroupSubjects, removeSubjectFromGroup, addSubjectToGroup } from "@/services/groups-service";
import { getMattersByStudyPlan } from "@/services/matter-plan-service";
import { GrupoMateria } from "@/types/group";

import { AddSubjectModal } from "./add-subject-modal";
import { AssignTeacherModal } from "./assign-teacher-modal";
import { EditSubjectScheduleModal } from "./edit-subject-schedule-modal";
import { ScheduleGridView } from "./schedule-grid-view";

interface GroupSubjectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idGrupo: number;
  nombreGrupo: string;
  idPlanEstudios?: number;
  codigoGrupo?: string;
  numeroCuatrimestre?: number;
  periodicidadLabel?: string;
}

export function GroupSubjectsModal({
  open,
  onOpenChange,
  idGrupo,
  nombreGrupo,
  idPlanEstudios,
  codigoGrupo,
  numeroCuatrimestre,
  periodicidadLabel = "Cuatrimestre",
}: GroupSubjectsModalProps) {
  const [subjects, setSubjects] = useState<GrupoMateria[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<GrupoMateria | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [showAutoLoadDialog, setShowAutoLoadDialog] = useState(false);

  useEffect(() => {
    if (open) {
      loadSubjects();
    }
  }, [open, idGrupo]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await getGroupSubjects(idGrupo);
      const transformedData = data.map((subject: any) => ({
        ...subject,
        inscritos: subject.estudiantesInscritos ?? subject.inscritos ?? 0,
        disponibles: subject.cupoDisponible ?? subject.disponibles ?? 0,
      }));
      setSubjects(transformedData);
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error("Error al cargar las materias");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubject = async (idGrupoMateria: number, nombreMateria: string) => {
    if (!confirm(`¿Eliminar la materia "${nombreMateria}" del grupo?`)) {
      return;
    }

    setDeletingId(idGrupoMateria);
    try {
      await removeSubjectFromGroup(idGrupoMateria);
      toast.success("Materia eliminada del grupo");
      loadSubjects();
    } catch (error: unknown) {
      console.error("Error removing subject:", error);
      const err = error as { response?: { data?: { mensaje?: string } }; message?: string };
      const errorMessage = err?.response?.data?.mensaje ?? err?.message ?? "Error al eliminar la materia";
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSchedule = (subject: GrupoMateria) => {
    setSelectedSubject(subject);
    setShowEditScheduleModal(true);
  };

  const handleAssignTeacher = (subject: GrupoMateria) => {
    setSelectedSubject(subject);
    setShowAssignTeacherModal(true);
  };

  const handleAutoLoadSubjects = async () => {
    if (!idPlanEstudios) {
      toast.error("No se puede determinar el plan de estudios del grupo");
      return;
    }

    let numeroCuatrimestreGrupo = numeroCuatrimestre;
    if (!numeroCuatrimestreGrupo && codigoGrupo) {
      numeroCuatrimestreGrupo = parseInt(codigoGrupo[0]);
    }

    if (!numeroCuatrimestreGrupo) {
      toast.error(`No se puede determinar el ${periodicidadLabel.toLowerCase()} del grupo`);
      return;
    }

    setAutoLoading(true);
    setShowAutoLoadDialog(false);

    try {
      const allMatters = await getMattersByStudyPlan(idPlanEstudios);

      const mattersForQuarter = allMatters.filter(m => m.cuatrimestre === numeroCuatrimestreGrupo);

      if (mattersForQuarter.length === 0) {
        toast.info(`No hay materias definidas para el ${periodicidadLabel.toLowerCase()} ${numeroCuatrimestreGrupo}`);
        return;
      }

      const currentSubjects = await getGroupSubjects(idGrupo);
      const existingMatterIds = new Set(currentSubjects.map(s => s.idMateriaPlan));

      const mattersToAdd = mattersForQuarter.filter(m => !existingMatterIds.has(m.idMateriaPlan));

      if (mattersToAdd.length === 0) {
        toast.info(`El grupo ya tiene todas las materias del ${periodicidadLabel.toLowerCase()}`);
        return;
      }

      let added = 0;
      let failed = 0;

      for (const matter of mattersToAdd) {
        try {
          await addSubjectToGroup(idGrupo, {
            idMateriaPlan: matter.idMateriaPlan,
            cupo: 30,
          });
          added++;
        } catch (err: any) {
          console.error(`Error adding matter ${matter.idMateriaPlan}:`, err);
          if (err?.response?.status === 500 && err?.response?.data?.includes?.('cycle')) {
            console.warn(`Warning: Backend serialization error for matter ${matter.idMateriaPlan}, but likely added successfully`);
            added++;
          } else {
            failed++;
          }
        }
      }

      if (added > 0) {
        toast.success(`${added} materia${added !== 1 ? 's' : ''} agregada${added !== 1 ? 's' : ''} al grupo`);
        loadSubjects();
      }

      if (failed > 0) {
        toast.warning(`${failed} materia${failed !== 1 ? 's' : ''} no se pudo${failed !== 1 ? 'ieron' : ''} agregar`);
      }

    } catch (error: unknown) {
      console.error("Error auto-loading subjects:", error);
      const err = error as { response?: { data?: { mensaje?: string } }; message?: string };
      const errorMessage = err?.response?.data?.mensaje ?? err?.message ?? "Error al cargar materias automáticamente";
      toast.error(errorMessage);
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] w-full h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Materias del Grupo {nombreGrupo}
            </DialogTitle>
            <DialogDescription>
              Gestiona las materias asignadas a este grupo
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="list" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <TabsList className="flex-shrink-0">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horario
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowAutoLoadDialog(true)}
                  size="sm"
                  variant="outline"
                  disabled={autoLoading || !idPlanEstudios}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  {autoLoading ? "Cargando..." : "Auto Cargar"}
                </Button>
                <Button onClick={() => setShowAddModal(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            <TabsContent value="list" className="space-y-4 mt-0 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {subjects.length} materia{subjects.length !== 1 ? "s" : ""} en el grupo
                </p>
              </div>

            {loading && (
              <div className="text-center py-8 text-sm text-gray-500">
                Cargando materias...
              </div>
            )}

            {!loading && subjects.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay materias en este grupo</p>
                <p className="text-gray-500 text-sm mt-1">
                  Agrega materias al grupo para comenzar
                </p>
              </div>
            )}

            {!loading && subjects.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Materia</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Clave</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Profesor</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Horario</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Aula</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Cupo</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Créditos</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject, index) => (
                      <tr
                        key={subject.idGrupoMateria}
                        className={`border-b last:border-b-0 hover:bg-blue-50/50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                          <span className="truncate block">{subject.nombreMateria}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                            {subject.claveMateria}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          {subject.nombreProfesor ? (
                            <span className="text-gray-800 truncate block">{subject.nombreProfesor}</span>
                          ) : (
                            <span className="text-gray-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          {subject.horarioJson && subject.horarioJson.length > 0 ? (
                            <span className="text-gray-700 text-xs block">
                              {generateScheduleSummary(subject.horarioJson)}
                            </span>
                          ) : (
                            <span className="text-yellow-600 italic text-xs">Sin horario</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700">{subject.aula || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${
                            subject.disponibles === 0
                              ? "text-red-600"
                              : subject.disponibles < 5
                                ? "text-yellow-600"
                                : "text-gray-800"
                          }`}>
                            {subject.inscritos}/{subject.cupo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {subject.creditos}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAssignTeacher(subject)}
                              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              title="Asignar profesor"
                            >
                              <User className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSchedule(subject)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Editar horarios"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSubject(subject.idGrupoMateria, subject.nombreMateria)}
                              disabled={deletingId === subject.idGrupoMateria}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar materia"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 flex-1 overflow-y-auto">
              <ScheduleGridView materias={subjects} nombreGrupo={nombreGrupo} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AddSubjectModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        idGrupo={idGrupo}
        idPlanEstudios={idPlanEstudios}
        onSuccess={loadSubjects}
        periodicidadLabel={periodicidadLabel}
      />

      <EditSubjectScheduleModal
        open={showEditScheduleModal}
        onOpenChange={setShowEditScheduleModal}
        subject={selectedSubject}
        onSuccess={loadSubjects}
      />

      <AssignTeacherModal
        open={showAssignTeacherModal}
        onClose={() => {
          setShowAssignTeacherModal(false);
          setSelectedSubject(null);
        }}
        grupoMateria={selectedSubject}
        onSuccess={loadSubjects}
      />

      <AlertDialog open={showAutoLoadDialog} onOpenChange={setShowAutoLoadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cargar materias automáticamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se agregarán todas las materias del {periodicidadLabel.toLowerCase()} {numeroCuatrimestre || (codigoGrupo ? codigoGrupo[0] : '?')} al grupo {nombreGrupo}.
              <br /><br />
              Las materias que ya existan en el grupo no se duplicarán.
              <br />
              Puedes configurar horarios y profesores después de agregarlas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutoLoadSubjects} className="bg-blue-600 hover:bg-blue-700">
              Cargar Materias
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
