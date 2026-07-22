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
import { updateAcademicPeriod } from "@/services/academic-period-service";
import { getPeriodicity } from "@/services/catalogs-service";
import { getVentanas } from "@/services/ventana-captura-service";
import { AcademicPeriod } from "@/types/academic-period";
import { Periodicity } from "@/types/catalog";

interface EditAcademicPeriodDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  period: AcademicPeriod;
  onSuccess?: () => void;
}

function formatDateForInput(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const str = typeof dateStr === "string" ? dateStr : dateStr.toISOString();
  return str.split("T")[0];
}

export function EditAcademicPeriodDialog({ open, setOpen, period, onSuccess }: EditAcademicPeriodDialogProps) {
  const form = useForm({
    defaultValues: {
      clave: period.clave ?? "",
      nombre: period.nombre ?? "",
      idPeriodicidad: period.idPeriodicidad?.toString() ?? "",
      fechaInicio: formatDateForInput(period.fechaInicio),
      fechaFin: formatDateForInput(period.fechaFin),
      fechaLimiteParcial1: "",
      fechaLimiteParcial2: "",
      fechaLimiteParcial3: "",
    },
  });

  const [periodicity, setPeriodicity] = useState<Periodicity[]>([]);
  const [loading, setLoading] = useState(false);

  const toDeadline = (v: string) => (v ? new Date(`${v}T23:59:59`).toISOString() : null);

  useEffect(() => {
    getPeriodicity().then((res) => setPeriodicity(res ?? []));
  }, []);
  useEffect(() => {
    form.reset({
      clave: period.clave ?? "",
      nombre: period.nombre ?? "",
      idPeriodicidad: period.idPeriodicidad?.toString() ?? "",
      fechaInicio: formatDateForInput(period.fechaInicio),
      fechaFin: formatDateForInput(period.fechaFin),
      fechaLimiteParcial1: "",
      fechaLimiteParcial2: "",
      fechaLimiteParcial3: "",
    });
  }, [period, form]);

  useEffect(() => {
    if (!open || !period.idPeriodoAcademico) return;
    getVentanas(period.idPeriodoAcademico)
      .then((ventanas) => {
        for (const v of ventanas) {
          if (v.fechaLimite) {
            form.setValue(
              `fechaLimiteParcial${v.numeroParcial}` as "fechaLimiteParcial1",
              formatDateForInput(v.fechaLimite),
            );
          }
        }
      })
      .catch(() => {});
  }, [open, period.idPeriodoAcademico, form]);

  const onSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    try {
      const payload: AcademicPeriod = {
        idPeriodoAcademico: period.idPeriodoAcademico,
        clave: data.clave,
        nombre: data.nombre,
        idPeriodicidad: Number(data.idPeriodicidad),
        periodicidad: period.periodicidad,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        esPeriodoActual: period.esPeriodoActual,
        fechaLimiteParcial1: toDeadline(data.fechaLimiteParcial1),
        fechaLimiteParcial2: toDeadline(data.fechaLimiteParcial2),
        fechaLimiteParcial3: toDeadline(data.fechaLimiteParcial3),
      };
      await updateAcademicPeriod(payload);
      setOpen(false);
      onSuccess?.();
      toast.success("Periodo académico actualizado exitosamente");
    } catch {
      toast.error("Error al actualizar el periodo académico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar periodo académico</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="clave">Clave</Label>
                <FormField
                  name="clave"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="clave"
                      value={field.value ?? ""}
                      placeholder="Clave"
                      required
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <FormField
                  name="nombre"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="nombre"
                      value={field.value ?? ""}
                      placeholder="Nombre"
                      required
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodicidad">Periodicidad</Label>
                <FormField
                  name="idPeriodicidad"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
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

              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha de inicio</Label>
                <FormField
                  name="fechaInicio"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="fechaInicio"
                      value={field.value ?? ""}
                      type="date"
                      required
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha de fin</Label>
                <FormField
                  name="fechaFin"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="fechaFin"
                      value={field.value ?? ""}
                      type="date"
                      required
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-1">Fechas límite de captura de calificaciones (opcional)</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Hasta cuándo los docentes pueden capturar cada parcial. Al vencer, se cierra solo.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Parcial 1</Label>
                    <FormField name="fechaLimiteParcial1" render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} type="date" className="w-full" />
                    )} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Parcial 2</Label>
                    <FormField name="fechaLimiteParcial2" render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} type="date" className="w-full" />
                    )} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Parcial 3</Label>
                    <FormField name="fechaLimiteParcial3" render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} type="date" className="w-full" />
                    )} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
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
