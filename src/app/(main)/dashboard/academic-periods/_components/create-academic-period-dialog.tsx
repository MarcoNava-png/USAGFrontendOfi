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
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createAcademicPeriod } from "@/services/academic-period-service";
import { getPeriodicity } from "@/services/catalogs-service";
import { Periodicity } from "@/types/catalog";

interface CreateAcademicPeriodDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAcademicPeriodDialog({ open, setOpen, onSuccess }: CreateAcademicPeriodDialogProps) {
  const form = useForm({
    defaultValues: {
      clave: "",
      nombre: "",
      idPeriodicidad: "",
      fechaInicio: "",
      fechaFin: "",
      fechaLimiteParcial1: "",
      fechaLimiteParcial2: "",
      fechaLimiteParcial3: "",
    },
  });

  const toDeadline = (v: string) => (v ? new Date(`${v}T23:59:59`).toISOString() : null);
  const [periodicity, setPeriodicity] = useState<Periodicity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPeriodicity().then((res) => setPeriodicity(res ?? []));
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await createAcademicPeriod({
        clave: data.clave,
        nombre: data.nombre,
        idPeriodicidad: Number(data.idPeriodicidad),
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        fechaLimiteParcial1: toDeadline(data.fechaLimiteParcial1),
        fechaLimiteParcial2: toDeadline(data.fechaLimiteParcial2),
        fechaLimiteParcial3: toDeadline(data.fechaLimiteParcial3),
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
      toast.success("Periodo académico creado exitosamente");
    } catch {
      toast.error("Error al crear el periodo académico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Crear</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear periodo académico</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-2">
              <FormField
                name="clave"
                render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Clave" required className="w-full" />}
              />
              <FormField
                name="nombre"
                render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Nombre" required className="w-full" />}
              />
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
              <FormField
                name="fechaInicio"
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ""} type="date" placeholder="Fecha de inicio" required className="w-full" />
                )}
              />
              <FormField
                name="fechaFin"
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ""} type="date" placeholder="Fecha de fin" required className="w-full" />
                )}
              />

              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-1">Fechas límite de captura de calificaciones (opcional)</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Define hasta cuándo los docentes pueden capturar cada parcial. Al vencer, se cierra solo.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Parcial 1</label>
                    <FormField name="fechaLimiteParcial1" render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} type="date" className="w-full" />
                    )} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Parcial 2</label>
                    <FormField name="fechaLimiteParcial2" render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} type="date" className="w-full" />
                    )} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Parcial 3</label>
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
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
