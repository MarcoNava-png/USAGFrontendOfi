"use client";

import { useEffect, useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { listarConceptosPago } from "@/services/conceptos-pago-service";
import { crearTarifaAdmision, actualizarTarifaAdmision } from "@/services/tarifas-admision-service";
import { Campus } from "@/types/campus";
import { StudyPlan } from "@/types/catalog";
import { ConceptoPago } from "@/types/receipt";
import { TarifaAdmisionDto, CrearTarifaAdmisionDetalleDto } from "@/types/tarifa-admision";

interface Props {
  open: boolean;
  onClose: (reload?: boolean) => void;
  tarifaToEdit?: TarifaAdmisionDto | null;
  planes: StudyPlan[];
  campuses: Campus[];
}

interface DetalleForm extends CrearTarifaAdmisionDetalleDto {
  nombreConcepto?: string;
  claveConcepto?: string;
}

export function TarifaAdmisionModal({ open, onClose, tarifaToEdit, planes, campuses }: Props) {
  const [loading, setLoading] = useState(false);
  const [conceptos, setConceptos] = useState<ConceptoPago[]>([]);

  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [idPlanEstudios, setIdPlanEstudios] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [aplicaConvenioMensualidad, setAplicaConvenioMensualidad] = useState(false);
  const [esConvenioEmpresarial, setEsConvenioEmpresarial] = useState(false);
  const [activo, setActivo] = useState(true);
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);

  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<string>("");

  const isEditing = !!tarifaToEdit;

  useEffect(() => {
    listarConceptosPago({ soloActivos: true }).then(setConceptos).catch(() => {});
  }, []);

  useEffect(() => {
    if (tarifaToEdit) {
      const plan = planes.find((p) => p.idPlanEstudios === tarifaToEdit.idPlanEstudios);
      setSelectedCampus(plan?.idCampus ? String(plan.idCampus) : "");
      setIdPlanEstudios(String(tarifaToEdit.idPlanEstudios));
      setNombre(tarifaToEdit.nombre);
      setAplicaConvenioMensualidad(tarifaToEdit.aplicaConvenioMensualidad);
      setEsConvenioEmpresarial(tarifaToEdit.esConvenioEmpresarial);
      setActivo(tarifaToEdit.activo);
      setDetalles(
        tarifaToEdit.detalles.map((d) => ({
          idConceptoPago: d.idConceptoPago,
          monto: d.monto,
          esAplicable: d.esAplicable,
          notas: d.notas ?? "",
          orden: d.orden,
          nombreConcepto: d.nombreConcepto,
          claveConcepto: d.claveConcepto,
        }))
      );
    } else {
      resetForm();
    }
  }, [tarifaToEdit, open, planes]);

  function resetForm() {
    setSelectedCampus("");
    setIdPlanEstudios("");
    setNombre("");
    setAplicaConvenioMensualidad(false);
    setEsConvenioEmpresarial(false);
    setActivo(true);
    setDetalles([]);
    setConceptoSeleccionado("");
  }

  function agregarConcepto() {
    if (!conceptoSeleccionado) {
      toast.error("Selecciona un concepto de pago");
      return;
    }
    const id = Number(conceptoSeleccionado);
    if (detalles.some((d) => d.idConceptoPago === id)) {
      toast.error("Este concepto ya está en la tarifa");
      return;
    }
    const concepto = conceptos.find((c) => c.idConceptoPago === id);
    if (!concepto) return;
    const nuevoOrden = detalles.length + 1;
    setDetalles((prev) => [
      ...prev,
      {
        idConceptoPago: id,
        monto: 0,
        esAplicable: true,
        notas: "",
        orden: nuevoOrden,
        nombreConcepto: concepto.nombre,
        claveConcepto: concepto.clave,
      },
    ]);
    setConceptoSeleccionado("");
  }

  function eliminarDetalle(idConceptoPago: number) {
    setDetalles((prev) =>
      prev
        .filter((d) => d.idConceptoPago !== idConceptoPago)
        .map((d, i) => ({ ...d, orden: i + 1 }))
    );
  }

  function actualizarDetalle(idConceptoPago: number, field: keyof DetalleForm, value: unknown) {
    setDetalles((prev) =>
      prev.map((d) => (d.idConceptoPago === idConceptoPago ? { ...d, [field]: value } : d))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!idPlanEstudios) {
      toast.error("Selecciona un plan de estudios");
      return;
    }
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (detalles.length === 0) {
      toast.error("Agrega al menos un concepto de pago");
      return;
    }

    setLoading(true);
    try {
      const detallesPayload: CrearTarifaAdmisionDetalleDto[] = detalles.map((d) => ({
        idConceptoPago: d.idConceptoPago,
        monto: Number(d.monto),
        esAplicable: d.esAplicable,
        notas: d.notas || null,
        orden: d.orden,
      }));

      if (isEditing) {
        await actualizarTarifaAdmision(tarifaToEdit!.idTarifaAdmision, {
          nombre,
          aplicaConvenioMensualidad,
          esConvenioEmpresarial,
          activo,
          detalles: detallesPayload,
        });
        toast.success("Tarifa actualizada correctamente");
      } else {
        await crearTarifaAdmision({
          idPlanEstudios: Number(idPlanEstudios),
          nombre,
          aplicaConvenioMensualidad,
          esConvenioEmpresarial,
          activo,
          detalles: detallesPayload,
        });
        toast.success("Tarifa creada correctamente");
      }
      onClose(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? `Error al ${isEditing ? "actualizar" : "crear"} tarifa`);
    } finally {
      setLoading(false);
    }
  }

  const planesFiltradosPorCampus = isEditing
    ? planes
    : selectedCampus
    ? planes.filter((p) => String(p.idCampus) === selectedCampus)
    : planes;

  const conceptosDisponibles = conceptos.filter(
    (c) => !detalles.some((d) => d.idConceptoPago === c.idConceptoPago)
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tarifa de Admisión" : "Nueva Tarifa de Admisión"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la tarifa de admisión"
              : "Define los costos de admisión para un plan de estudios"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Campus</Label>
                  <Input
                    value={tarifaToEdit?.nombreCampus || "Sin campus asignado"}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan de Estudios</Label>
                  <Input
                    value={`${tarifaToEdit?.clavePlanEstudios} - ${tarifaToEdit?.nombrePlanEstudios}`}
                    disabled
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="campus">
                    Campus <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedCampus}
                    onValueChange={(v) => { setSelectedCampus(v); setIdPlanEstudios(""); }}
                  >
                    <SelectTrigger id="campus">
                      <SelectValue placeholder="Selecciona un campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map((c) => (
                        <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                          {c.claveCampus} - {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">
                    Plan de Estudios <span className="text-red-500">*</span>
                  </Label>
                  <Select value={idPlanEstudios} onValueChange={setIdPlanEstudios} disabled={!selectedCampus}>
                    <SelectTrigger id="plan">
                      <SelectValue placeholder={selectedCampus ? "Selecciona un plan" : "Primero selecciona un campus"} />
                    </SelectTrigger>
                    <SelectContent>
                      {planesFiltradosPorCampus.map((p) => (
                        <SelectItem key={p.idPlanEstudios} value={String(p.idPlanEstudios)}>
                          {p.clavePlanEstudios} - {p.nombrePlanEstudios}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre de la Tarifa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Tarifa Admisión 2025"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Aplica Promoción a Mensualidad</Label>
                <p className="text-sm text-muted-foreground">
                  Descuentos de promoción en mensualidades
                </p>
              </div>
              <Switch
                checked={aplicaConvenioMensualidad}
                onCheckedChange={setAplicaConvenioMensualidad}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Costos Convenio</Label>
                <p className="text-sm text-muted-foreground">
                  Tarifa especial para aspirantes con convenio
                </p>
              </div>
              <Switch
                checked={esConvenioEmpresarial}
                onCheckedChange={setEsConvenioEmpresarial}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Activa</Label>
                <p className="text-sm text-muted-foreground">
                  Solo las tarifas activas pueden usarse
                </p>
              </div>
              <Switch checked={activo} onCheckedChange={setActivo} />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Conceptos de Pago</Label>
            <div className="flex gap-2">
              <Select value={conceptoSeleccionado} onValueChange={setConceptoSeleccionado}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un concepto para agregar..." />
                </SelectTrigger>
                <SelectContent>
                  {conceptosDisponibles.map((c) => (
                    <SelectItem key={c.idConceptoPago} value={String(c.idConceptoPago)}>
                      {c.clave} - {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={agregarConcepto}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            {detalles.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="w-56">Monto</TableHead>
                      <TableHead className="w-28">Aplicable</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalles.map((d) => (
                      <TableRow key={d.idConceptoPago}>
                        <TableCell className="text-muted-foreground text-sm">{d.orden}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{d.nombreConcepto}</p>
                            <p className="text-xs text-muted-foreground">{d.claveConcepto}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base font-semibold">$</span>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={d.monto || ""}
                              onChange={(e) => actualizarDetalle(d.idConceptoPago, "monto", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                              onFocus={(e) => e.target.select()}
                              placeholder="0.00"
                              className="w-full pl-8 text-lg font-semibold h-12"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={d.esAplicable}
                            onCheckedChange={(v) => actualizarDetalle(d.idConceptoPago, "esAplicable", v)}
                          />
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={d.notas ?? ""}
                            onChange={(e) => actualizarDetalle(d.idConceptoPago, "notas", e.target.value)}
                            placeholder="Notas opcionales..."
                            rows={1}
                            className="text-sm resize-none"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => eliminarDetalle(d.idConceptoPago)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {detalles.length === 0 && (
              <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                Agrega conceptos de pago a la tarifa
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditing ? "Actualizando..." : "Creando..."
                : isEditing ? "Actualizar Tarifa" : "Crear Tarifa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
