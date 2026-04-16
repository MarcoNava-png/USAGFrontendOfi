"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getCampusList } from "@/services/campus-service";
import { getEducationLevels, getPeriodicity } from "@/services/catalogs-service";
import { updateStudyPlan } from "@/services/study-plans-service";
import { Campus } from "@/types/campus";
import { EducationLevel, Periodicity } from "@/types/catalog";
import { StudyPlan, PayloadUpdateStudyPlan } from "@/types/study-plan";
import apiClient from "@/services/api-client";

interface CarreraSEP { id: number; idCarrera: string; claveCarrera: string; nombreCarrera: string; }

interface EditStudyPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: StudyPlan | null;
  onSuccess: () => void;
}

const defaultValues = {
  clavePlanEstudios: "",
  nombrePlanEstudios: "",
  rvoe: "",
  fechaExpedicionRvoe: "",
  idCarreraSEP: "",
  version: "",
  duracionMeses: "",
  minimaAprobatoriaParcial: "",
  minimaAprobatoriaFinal: "",
  permiteAdelantar: "false",
  esOficial: "true",
  idPeriodicidad: "",
  idNivelEducativo: "",
  idCampus: "",
};

export function EditStudyPlanDialog({ open, onOpenChange, plan, onSuccess }: EditStudyPlanDialogProps) {
  const form = useForm({ defaultValues });
  const [campus, setCampus] = useState<Campus[]>([]);
  const [periodicity, setPeriodicity] = useState<Periodicity[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [carrerasSEP, setCarrerasSEP] = useState<CarreraSEP[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCampusList().then((res) => setCampus(res.items));
    getPeriodicity().then((res) => setPeriodicity(res));
    getEducationLevels().then((res) => setEducationLevels(res));
    apiClient.get("/titulacion/certificados/catalogos/carreras-sep").then((res) => setCarrerasSEP(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (plan && open) {
      form.reset({
        clavePlanEstudios: plan.clavePlanEstudios || "",
        nombrePlanEstudios: plan.nombrePlanEstudios || "",
        rvoe: plan.rvoe || "",
        fechaExpedicionRvoe: plan.fechaExpedicionRvoe ? plan.fechaExpedicionRvoe.split("T")[0] : "",
        idCarreraSEP: plan.idCarreraSEP?.toString() || "",
        version: plan.version || "",
        duracionMeses: plan.duracionMeses?.toString() || "",
        minimaAprobatoriaParcial: plan.minimaAprobatoriaParcial?.toString() || "",
        minimaAprobatoriaFinal: plan.minimaAprobatoriaFinal?.toString() || "",
        permiteAdelantar: plan.permiteAdelantar ? "true" : "false",
        idPeriodicidad: plan.idPeriodicidad?.toString() || "",
        idNivelEducativo: plan.idNivelEducativo?.toString() || "",
        idCampus: plan.idCampus?.toString() || "",
        esOficial: plan.esOficial ? "true" : "false",
      });
    } else if (!open) {
      form.reset(defaultValues);
    }
  }, [plan, open, form]);

  const onSubmit = async (data: any) => {
    if (!plan) return;
    setLoading(true);
    try {
      const payload: PayloadUpdateStudyPlan = {
        idPlanEstudios: plan.idPlanEstudios,
        clavePlanEstudios: data.clavePlanEstudios,
        nombrePlanEstudios: data.nombrePlanEstudios,
        rvoe: data.rvoe,
        fechaExpedicionRvoe: data.fechaExpedicionRvoe || null,
        idCarreraSEP: data.idCarreraSEP ? Number(data.idCarreraSEP) : null,
        version: data.version,
        permiteAdelantar: data.permiteAdelantar === "true",
        duracionMeses: Number(data.duracionMeses),
        minimaAprobatoriaParcial: Number(data.minimaAprobatoriaParcial),
        minimaAprobatoriaFinal: Number(data.minimaAprobatoriaFinal),
        idPeriodicidad: Number(data.idPeriodicidad),
        idNivelEducativo: Number(data.idNivelEducativo),
        idCampus: Number(data.idCampus),
        status: plan.activo ? 1 : 0,
        esOficial: data.esOficial === "true",
      };
      await updateStudyPlan(payload);
      toast.success("Plan de estudios actualizado exitosamente");
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar el plan de estudios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar plan de estudio</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clave</Label>
                  <FormField
                    name="clavePlanEstudios"
                    render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Clave" required className="w-full" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Version</Label>
                  <FormField
                    name="version"
                    render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Version" required className="w-full" />}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <FormField
                  name="nombrePlanEstudios"
                  render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Nombre" required className="w-full" />}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RVOE</Label>
                  <FormField
                    name="rvoe"
                    render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="RVOE" required className="w-full" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Expedición RVOE</Label>
                  <FormField
                    name="fechaExpedicionRvoe"
                    render={({ field }) => <Input {...field} value={field.value ?? ""} type="date" className="w-full" />}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Carrera SEP (Titulación)</Label>
                <FormField
                  name="idCarreraSEP"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="0">Sin asignar</SelectItem>
                        {carrerasSEP.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.nombreCarrera} ({c.claveCarrera})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duracion (meses)</Label>
                  <FormField
                    name="duracionMeses"
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} type="number" placeholder="Duracion (meses)" required className="w-full" />
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minima aprobatoria parcial</Label>
                  <FormField
                    name="minimaAprobatoriaParcial"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        placeholder="Minima aprobatoria parcial"
                        required
                        className="w-full"
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minima aprobatoria final</Label>
                  <FormField
                    name="minimaAprobatoriaFinal"
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} type="number" placeholder="Minima aprobatoria final" required className="w-full" />
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Permite adelantar</Label>
                  <FormField
                    name="permiteAdelantar"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || "false"}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Permite adelantar" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          <SelectItem value="true">Si</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Es Oficial</Label>
                  <FormField
                    control={form.control}
                    name="esOficial"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || "true"}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Es Oficial" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Oficial</SelectItem>
                          <SelectItem value="false">No Oficial</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Periodicidad</Label>
                  <FormField
                    name="idPeriodicidad"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Periodicidad" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {periodicity.map((p: Periodicity) => (
                            <SelectItem key={p.idPeriodicidad} value={String(p.idPeriodicidad)}>
                              {p.descPeriodicidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nivel educativo</Label>
                  <FormField
                    name="idNivelEducativo"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Nivel educativo" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {educationLevels.map((n: EducationLevel) => (
                            <SelectItem key={n.idNivelEducativo} value={String(n.idNivelEducativo)}>
                              {n.descNivelEducativo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campus</Label>
                  <FormField
                    name="idCampus"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Campus" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {campus.map((c: Campus) => (
                            <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
