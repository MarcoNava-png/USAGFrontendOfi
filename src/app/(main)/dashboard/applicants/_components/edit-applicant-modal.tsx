"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getApplicantForEdit, updateApplicant } from "@/services/applicants-service";
import { PayloadCreateApplicant, PayloadUpdateApplicant } from "@/types/applicant";
import { Campus } from "@/types/campus";
import { AcademicPeriod, ApplicantStatus, CivilStatus, ContactMethod, Genres, Modalidad, Schedule } from "@/types/catalog";
import { State } from "@/types/location";
import { StudyPlan } from "@/types/study-plan";

import { ApplicantCreateForm } from "./applicant-create-form";
import { createApplicantSchema } from "./schema-create-applicant";

interface EditApplicantModalProps {
  open: boolean;
  applicantId: number | null;
  genres: Genres[];
  civilStatus: CivilStatus[];
  campus: Campus[];
  studyPlans: StudyPlan[];
  contactMethods: ContactMethod[];
  schedules: Schedule[];
  applicantStatus: ApplicantStatus[];
  states: State[];
  modalidades: Modalidad[];
  academicPeriods: AcademicPeriod[];
  onOpenChange: (open: boolean) => void;
  onApplicantUpdated?: () => void;
}

export function EditApplicantModal({
  open,
  applicantId,
  onOpenChange,
  genres,
  civilStatus,
  campus,
  studyPlans,
  contactMethods,
  schedules,
  applicantStatus,
  states,
  modalidades,
  academicPeriods,
  onApplicantUpdated,
}: EditApplicantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedStatusId, setLoadedStatusId] = useState<number>(0);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<PayloadCreateApplicant>({
    resolver: zodResolver(createApplicantSchema),
    defaultValues: {
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      fechaNacimiento: "",
      generoId: 0,
      correo: "",
      telefono: "",
      curp: "",
      calle: "",
      numeroExterior: "",
      numeroInterior: "",
      codigoPostalId: 0,
      idEstadoCivil: 0,
      campusId: 0,
      planEstudiosId: 0,
      aspiranteStatusId: 0,
      medioContactoId: 0,
      notas: "",
      atendidoPorUsuarioId: "",
      horarioId: 0,
      stateId: "",
      municipalityId: "",
      celular: "",
      nombreContactoEmergencia: "",
      telefonoContactoEmergencia: "",
      parentescoContactoEmergencia: "",
    },
  });

  useEffect(() => {
    if (!open || !applicantId) return;

    setIsLoading(true);
    getApplicantForEdit(applicantId)
      .then((editData) => {
        const plan = studyPlans.find((p) => p.idPlanEstudios === editData.planEstudiosId);
        const campusId = editData.campusId ?? plan?.idCampus ?? 0;

        setLoadedStatusId(editData.idAspiranteEstatus);

        form.reset({
          nombre: editData.nombre ?? "",
          apellidoPaterno: editData.apellidoPaterno ?? "",
          apellidoMaterno: editData.apellidoMaterno ?? "",
          fechaNacimiento: editData.fechaNacimiento
            ? editData.fechaNacimiento.substring(0, 10)
            : "",
          generoId: editData.generoId ?? 0,
          correo: editData.correo ?? "",
          telefono: editData.telefono ?? "",
          curp: editData.curp ?? "",
          calle: editData.calle ?? "",
          numeroExterior: editData.numeroExterior ?? "",
          numeroInterior: editData.numeroInterior ?? "",
          codigoPostalId: editData.codigoPostalId ?? 0,
          idEstadoCivil: editData.idEstadoCivil ?? 0,
          campusId: campusId,
          planEstudiosId: editData.planEstudiosId,
          aspiranteStatusId: editData.idAspiranteEstatus,
          medioContactoId: editData.medioContactoId,
          notas: editData.notas ?? "",
          atendidoPorUsuarioId: editData.atendidoPorUsuarioId ?? "",
          horarioId: editData.horarioId ?? 0,
          cuatrimestreInteres: editData.cuatrimestreInteres ?? undefined,
          stateId: editData.estadoId ?? "",
          municipalityId: editData.municipioId ?? "",
          nacionalidad: editData.nacionalidad ?? "",
          institucionProcedencia: editData.institucionProcedencia ?? "",
          idModalidad: editData.idModalidad ?? undefined,
          idPeriodoAcademico: editData.idPeriodoAcademico ?? undefined,
          recorridoPlantel: editData.recorridoPlantel ?? undefined,
          trabaja: editData.trabaja ?? undefined,
          nombreEmpresa: editData.nombreEmpresa ?? "",
          domicilioEmpresa: editData.domicilioEmpresa ?? "",
          puestoEmpresa: editData.puestoEmpresa ?? "",
          quienCubreGastos: editData.quienCubreGastos ?? "",
          celular: editData.celular ?? "",
          nombreContactoEmergencia: editData.nombreContactoEmergencia ?? "",
          telefonoContactoEmergencia: editData.telefonoContactoEmergencia ?? "",
          parentescoContactoEmergencia: editData.parentescoContactoEmergencia ?? "",
        });
      })
      .catch((error: unknown) => {
        const err = error as { response?: { data?: string }; message?: string };
        toast.error("Error al cargar datos del aspirante", {
          description: err?.message ?? "Intenta nuevamente.",
        });
        onOpenChange(false);
      })
      .finally(() => setIsLoading(false));
  }, [open, applicantId]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const safeClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      form.reset();
      setLoadedStatusId(0);
      onOpenChange(false);
    }, 50);
  }, [form, onOpenChange]);

  const onSubmit = async (data: PayloadCreateApplicant) => {
    if (isSubmitting || !applicantId) return;

    setIsSubmitting(true);
    try {
      const payload: PayloadUpdateApplicant = {
        ...data,
        aspiranteId: applicantId,
        aspiranteStatusId: loadedStatusId,
      };
      await updateApplicant(payload);
      toast.success("Aspirante actualizado correctamente");
      safeClose();
      onApplicantUpdated?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } | string }; message?: string };
      const errorMessage =
        (typeof err?.response?.data === "object" ? err?.response?.data?.message : err?.response?.data) ||
        "Intenta nuevamente.";
      toast.error("Error al actualizar aspirante", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      safeClose();
    } else if (newOpen) {
      onOpenChange(true);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      safeClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[95vh] w-full !max-w-[80vw] overflow-y-auto p-6"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-blue-900">
            Editar Aspirante
          </DialogTitle>
          <DialogDescription>
            Modifique los datos del aspirante. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-500">Cargando datos del aspirante...</span>
          </div>
        ) : (
          <ApplicantCreateForm
            form={form}
            open={open}
            genres={genres}
            civilStatus={civilStatus}
            campus={campus}
            studyPlans={studyPlans}
            contactMethods={contactMethods}
            schedules={schedules}
            applicantStatus={applicantStatus}
            states={states}
            modalidades={modalidades}
            academicPeriods={academicPeriods}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isEditMode
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
