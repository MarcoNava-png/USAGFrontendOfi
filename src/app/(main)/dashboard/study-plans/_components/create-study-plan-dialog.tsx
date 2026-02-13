"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getCampusList } from "@/services/campus-service";
import { getEducationLevels, getPeriodicity } from "@/services/catalogs-service";
import { createStudyPlan } from "@/services/study-plans-service";
import { Campus } from "@/types/campus";
import { EducationLevel, Periodicity } from "@/types/catalog";

interface CreateStudyPlanDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const defaultValues = {
  clavePlanEstudios: "",
  nombrePlanEstudios: "",
  rvoe: "",
  version: "",
  duracionMeses: "",
  minimaAprobatoriaParcial: "",
  minimaAprobatoriaFinal: "",
  permiteAdelantar: "false",
  idPeriodicidad: "",
  idNivelEducativo: "",
  idCampus: "",
};

export function CreateStudyPlanDialog({ open, setOpen, onSuccess }: CreateStudyPlanDialogProps) {
  const form = useForm({ defaultValues });
  const [campus, setCampus] = useState<Campus[]>([]);
  const [periodicity, setPeriodicity] = useState<Periodicity[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCampusList().then((res) => setCampus(res.items));
    getPeriodicity().then((res) => setPeriodicity(res));
    getEducationLevels().then((res) => setEducationLevels(res));
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await createStudyPlan({
        ...data,
        permiteAdelantar: data.permiteAdelantar === "true",
        duracionMeses: Number(data.duracionMeses),
        minimaAprobatoriaParcial: Number(data.minimaAprobatoriaParcial),
        minimaAprobatoriaFinal: Number(data.minimaAprobatoriaFinal),
        idPeriodicidad: Number(data.idPeriodicidad),
        idNivelEducativo: Number(data.idNivelEducativo),
        idCampus: Number(data.idCampus),
      });
      toast.success("Plan de estudios creado exitosamente");
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Error al crear el plan de estudios";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Crear plan de estudios</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Crear plan de estudios</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información general */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Informaci&oacute;n general</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  name="clavePlanEstudios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clave del plan</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Ej: 04LICENF" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="nombrePlanEstudios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del plan</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Ej: Licenciatura en Enfermer&iacute;a" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="rvoe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RVOE</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="N&uacute;mero de RVOE" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versi&oacute;n</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Ej: 2024" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configuración académica */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Configuraci&oacute;n acad&eacute;mica</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  name="duracionMeses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duraci&oacute;n (meses)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} type="number" min="1" placeholder="Ej: 48" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="minimaAprobatoriaParcial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>M&iacute;nima parcial</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} type="number" min="0" max="100" placeholder="Ej: 70" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="minimaAprobatoriaFinal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>M&iacute;nima final</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} type="number" min="0" max="100" placeholder="Ej: 70" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Catálogos */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Cat&aacute;logos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  name="idCampus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campus.map((c: Campus) => (
                            <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="idNivelEducativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel educativo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nivel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((n: EducationLevel) => (
                            <SelectItem key={n.idNivelEducativo} value={String(n.idNivelEducativo)}>
                              {n.descNivelEducativo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="idPeriodicidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodicidad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar periodicidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periodicity.map((p: Periodicity) => (
                            <SelectItem key={p.idPeriodicidad} value={String(p.idPeriodicidad)}>
                              {p.descPeriodicidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="permiteAdelantar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permite adelantar materias</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "false"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">S&iacute;</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Crear plan de estudios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
