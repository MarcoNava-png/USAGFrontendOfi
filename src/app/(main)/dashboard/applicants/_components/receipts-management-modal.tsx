"use client";

import React, { useEffect, useState } from "react";

import { Receipt, DollarSign, Calendar, FileText, Plus, FileSpreadsheet, Trash2, AlertTriangle, HandCoins, Building } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getApplicantReceipts,
  generateApplicantReceipt,
  generateApplicantReceiptByConcepto,
  deleteApplicantReceipt,
  repairReceiptsWithoutDetails,
  buscarPlantillaParaAspirante,
  generarRecibosDesdeePlantilla,
} from "@/services/applicants-service";
import { listarConceptosPago } from "@/services/conceptos-pago-service";
import { obtenerPromocionesActivas, formatearBeneficio } from "@/services/convenios-service";
import { listarEmpresas } from "@/services/empresas-service";
import {
  listarTarifasAdmision,
  generarRecibosAdmision,
  generarRecibosAdmisionV2,
  descargarCotizacionAdmisionPdf,
  descargarCotizacionAdmisionPdfV2,
} from "@/services/tarifas-admision-service";
import { Applicant, ReciboDto, EstatusRecibo, PlantillaCobroAspirante } from "@/types/applicant";
import { ConvenioDisponibleDto } from "@/types/convenio";
import { EmpresaDto } from "@/types/empresa";
import { ConceptoPago } from "@/types/receipt";
import { TarifaAdmisionDto } from "@/types/tarifa-admision";

import { PaymentRegistrationModal } from "./payment-registration-modal";

interface ReceiptsManagementModalProps {
  open: boolean;
  applicant: Applicant | null;
  onClose: () => void;
  onPaymentRegistered?: () => void;
}

export function ReceiptsManagementModal({ open, applicant, onClose, onPaymentRegistered }: ReceiptsManagementModalProps) {
  const [receipts, setReceipts] = useState<ReciboDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState<string>("600");
  const [receiptConcept, setReceiptConcept] = useState<string>("Cuota de Inscripcion");
  const [deletingReceipt, setDeletingReceipt] = useState<number | null>(null);
  const [repairing, setRepairing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);
  const [confirmRepairOpen, setConfirmRepairOpen] = useState(false);

  // Nuevos estados para ConceptoPago
  const [conceptos, setConceptos] = useState<ConceptoPago[]>([]);
  const [selectedConcepto, setSelectedConcepto] = useState<string>("");

  // Nuevos estados para Plantilla
  const [plantilla, setPlantilla] = useState<PlantillaCobroAspirante | null>(null);
  const [loadingPlantilla, setLoadingPlantilla] = useState(false);
  const [generatingFromPlantilla, setGeneratingFromPlantilla] = useState(false);

  // Estados para Tarifa de Admisión
  const [tarifas, setTarifas] = useState<TarifaAdmisionDto[]>([]);
  const [selectedTarifa, setSelectedTarifa] = useState<string>("");
  const [pagoCompleto, setPagoCompleto] = useState(false);
  const [generatingFromTarifa, setGeneratingFromTarifa] = useState(false);
  const [downloadingCotizacion, setDownloadingCotizacion] = useState(false);
  const [conceptosSeleccionados, setConceptosSeleccionados] = useState<number[]>([]);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<string>("0");

  // Nuevos estados Phase 3E + 5
  const [tipoTarifa, setTipoTarifa] = useState<"normal" | "convenio">("normal");
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>("");
  const [promociones, setPromociones] = useState<ConvenioDisponibleDto[]>([]);
  const [promocionPorConcepto, setPromocionPorConcepto] = useState<Record<number, number | null>>({});

  useEffect(() => {
    if (open && applicant) {
      loadAll();
    }
  }, [open, applicant]);

  const loadAll = async () => {
    if (!applicant) return;

    setLoading(true);
    try {
      const [recibosData, conceptosData, tarifasData, empresasData, promocionesData] = await Promise.all([
        getApplicantReceipts(applicant.idAspirante),
        listarConceptosPago({ soloActivos: true }),
        listarTarifasAdmision(true),
        listarEmpresas(true),
        obtenerPromocionesActivas(),
      ]);
      setReceipts(recibosData);
      setConceptos(conceptosData);
      setTarifas(tarifasData);
      setEmpresas(empresasData);
      setPromociones(promocionesData);

      // Phase 5: Auto-selección si el aspirante tiene empresa
      if (applicant.idEmpresa) {
        setTipoTarifa("convenio");
        setEmpresaSeleccionada(String(applicant.idEmpresa));
      } else {
        setTipoTarifa("normal");
        setEmpresaSeleccionada("");
      }
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error(error);
    } finally {
      setLoading(false);
    }

    // Cargar plantilla en paralelo (no bloquea)
    setLoadingPlantilla(true);
    try {
      const plantillaData = await buscarPlantillaParaAspirante(applicant.idAspirante);
      setPlantilla(plantillaData);
    } catch {
      setPlantilla(null);
    } finally {
      setLoadingPlantilla(false);
    }
  };

  const loadReceipts = async () => {
    if (!applicant) return;

    setLoading(true);
    try {
      const data = await getApplicantReceipts(applicant.idAspirante);
      setReceipts(data);
    } catch (error) {
      toast.error("Error al cargar recibos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Generar recibo desde ConceptoPago
  const handleGenerateByConcepto = async () => {
    if (!applicant || !selectedConcepto) return;

    setGeneratingReceipt(true);
    try {
      await generateApplicantReceiptByConcepto(applicant.idAspirante, parseInt(selectedConcepto), 7);
      toast.success("Recibo generado exitosamente");
      setSelectedConcepto("");
      loadReceipts();
      onPaymentRegistered?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string } }; message?: string };
      toast.error(err?.response?.data?.Error ?? "Error al generar recibo");
      console.error(error);
    } finally {
      setGeneratingReceipt(false);
    }
  };

  // Generar recibos desde Plantilla
  const handleGenerateFromPlantilla = async () => {
    if (!applicant || !plantilla) return;

    setGeneratingFromPlantilla(true);
    try {
      const recibos = await generarRecibosDesdeePlantilla(
        applicant.idAspirante,
        plantilla.idPlantillaCobro,
        false
      );
      toast.success(`Se generaron ${recibos.length} recibo(s) desde la plantilla`);
      loadReceipts();
      onPaymentRegistered?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string } }; message?: string };
      toast.error(err?.response?.data?.Error ?? "Error al generar recibos desde plantilla");
      console.error(error);
    } finally {
      setGeneratingFromPlantilla(false);
    }
  };

  // Generar recibos desde Tarifa de Admisión (V2 con promociones por concepto)
  const handleGenerateFromTarifa = async () => {
    if (!applicant || !selectedTarifa) return;
    if (conceptosSeleccionados.length === 0) {
      toast.error("Selecciona al menos un concepto");
      return;
    }

    setGeneratingFromTarifa(true);
    try {
      const conceptos = conceptosSeleccionados.map((idConceptoPago) => ({
        idConceptoPago,
        idPromocion: promocionPorConcepto[idConceptoPago] ?? null,
      }));
      const idEmpresa = tipoTarifa === "convenio" && empresaSeleccionada
        ? parseInt(empresaSeleccionada)
        : null;

      const result = await generarRecibosAdmisionV2(
        parseInt(selectedTarifa),
        applicant.idAspirante,
        {
          pagoCompleto,
          idEmpresa,
          conceptos,
        }
      );
      const total = result.totalRecibos;
      toast.success(`Se generaron ${total} recibo(s) de admisión`);
      loadReceipts();
      onPaymentRegistered?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message ?? "Error al generar recibos desde tarifa");
    } finally {
      setGeneratingFromTarifa(false);
    }
  };

  // Descargar cotización de admisión PDF (V2 con promociones)
  const handleDescargarCotizacion = async () => {
    if (!applicant || !selectedTarifa) return;
    setDownloadingCotizacion(true);
    try {
      const conceptos = conceptosSeleccionados.map((idConceptoPago) => ({
        idConceptoPago,
        idPromocion: promocionPorConcepto[idConceptoPago] ?? null,
      }));
      const idEmpresa = tipoTarifa === "convenio" && empresaSeleccionada
        ? parseInt(empresaSeleccionada)
        : null;

      const blob = await descargarCotizacionAdmisionPdfV2(
        parseInt(selectedTarifa),
        applicant.idAspirante,
        { conceptos, idEmpresa }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CotizacionAdmision_${applicant.idAspirante}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar la cotización");
    } finally {
      setDownloadingCotizacion(false);
    }
  };

  // Generar recibo manual
  const handleGenerateReceipt = async () => {
    if (!applicant) return;

    const amount = parseFloat(receiptAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (!receiptConcept.trim()) {
      toast.error("El concepto es requerido");
      return;
    }

    setGeneratingReceipt(true);
    try {
      await generateApplicantReceipt(applicant.idAspirante, amount, receiptConcept, 7);
      toast.success("Recibo generado exitosamente");
      loadReceipts();
      onPaymentRegistered?.();
    } catch (error) {
      toast.error("Error al generar el recibo");
      console.error(error);
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const openDeleteConfirmation = (idRecibo: number) => {
    setReceiptToDelete(idRecibo);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;

    setConfirmDeleteOpen(false);
    setDeletingReceipt(receiptToDelete);
    try {
      await deleteApplicantReceipt(receiptToDelete);
      toast.success("Recibo eliminado exitosamente");
      loadReceipts();
      onPaymentRegistered?.();
    } catch (error: unknown) {
      const err = error as {response?: {data?: {Error?: string}}, message?: string};
      const errorMessage = err?.response?.data?.Error ?? err?.message ?? "Error al eliminar el recibo";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setDeletingReceipt(null);
      setReceiptToDelete(null);
    }
  };

  const handleRepairReceipts = async () => {
    setConfirmRepairOpen(false);
    setRepairing(true);
    try {
      const result = await repairReceiptsWithoutDetails();
      toast.success(result.mensaje);
      loadReceipts();
      onPaymentRegistered?.();
    } catch (error: unknown) {
      const err = error as {response?: {data?: {Error?: string}}, message?: string};
      const errorMessage = err?.response?.data?.Error ?? err?.message ?? "Error al reparar recibos";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setRepairing(false);
    }
  };

  const getStatusBadgeClass = (estatus: EstatusRecibo) => {
    switch (estatus) {
      case EstatusRecibo.PAGADO:
        return "bg-green-100 text-green-700";
      case EstatusRecibo.PARCIAL:
        return "bg-yellow-100 text-yellow-700";
      case EstatusRecibo.PENDIENTE:
        return "bg-orange-100 text-orange-700";
      case EstatusRecibo.VENCIDO:
        return "bg-red-100 text-red-700";
      case EstatusRecibo.CANCELADO:
        return "bg-gray-100 text-gray-700";
      case EstatusRecibo.BONIFICADO:
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (estatus: EstatusRecibo) => {
    switch (estatus) {
      case EstatusRecibo.PAGADO:
        return "Pagado";
      case EstatusRecibo.PARCIAL:
        return "Pago Parcial";
      case EstatusRecibo.PENDIENTE:
        return "Pendiente";
      case EstatusRecibo.VENCIDO:
        return "Vencido";
      case EstatusRecibo.CANCELADO:
        return "Cancelado";
      case EstatusRecibo.BONIFICADO:
        return "Bonificado";
      default:
        return "Desconocido";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTotalStats = () => {
    const total = receipts.reduce((sum, r) => sum + r.total, 0);
    const pagado = receipts.reduce((sum, r) => sum + (r.total - r.saldo), 0);
    const pendiente = receipts.reduce((sum, r) => sum + r.saldo, 0);
    const descuentoTotal = receipts.reduce((sum, r) => sum + r.descuento, 0);

    return { total, pagado, pendiente, descuentoTotal };
  };

  if (!applicant) return null;

  const stats = getTotalStats();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] !max-w-[80vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Recibos y Pagos - {applicant.nombreCompleto}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Cargando recibos...</div>
        ) : (
          <div className="space-y-6">
            {/* Estadisticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-blue-50 p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total a Pagar</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-blue-900">{formatCurrency(stats.total)}</p>
              </div>

              <div className="rounded-lg border bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Total Pagado</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-green-900">{formatCurrency(stats.pagado)}</p>
              </div>

              <div className="rounded-lg border bg-orange-50 p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Saldo Pendiente</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-orange-900">{formatCurrency(stats.pendiente)}</p>
              </div>
            </div>

            {/* Panel de descuentos de convenio */}
            {stats.descuentoTotal > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <HandCoins className="h-4 w-4" />
                  Descuento por convenio aplicado: {formatCurrency(stats.descuentoTotal)}
                </div>
              </div>
            )}

            {/* Seccion de generacion con Tabs */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <FileSpreadsheet className="h-5 w-5" />
                Generar Nuevo Recibo
              </h3>

              <Tabs defaultValue="tarifa" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="tarifa">Tarifa del Plan</TabsTrigger>
                </TabsList>

                {/* Tab: Tarifa del Plan */}
                <TabsContent value="tarifa" className="space-y-4 mt-4">
                  {tarifas.length === 0 ? (
                    <Alert className="border-yellow-300 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700">
                        No hay tarifas de admisión activas configuradas. Crea una en la sección de Tarifas de Admisión.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {/* Tipo de tarifa */}
                      <div className="space-y-2">
                        <Label>Tipo de Tarifa</Label>
                        <RadioGroup
                          value={tipoTarifa}
                          onValueChange={(val) => {
                            setTipoTarifa(val as "normal" | "convenio");
                            setSelectedTarifa("");
                            setConceptosSeleccionados([]);
                            setPromocionPorConcepto({});
                            if (val === "normal") setEmpresaSeleccionada("");
                          }}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="normal" id="tipo-normal" />
                            <Label htmlFor="tipo-normal" className="cursor-pointer font-normal">Normal</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="convenio" id="tipo-convenio" />
                            <Label htmlFor="tipo-convenio" className="cursor-pointer font-normal flex items-center gap-1">
                              <Building className="h-3.5 w-3.5" />
                              Costos convenio
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Empresa dropdown (solo si convenio) */}
                      {tipoTarifa === "convenio" && (
                        <div className="space-y-2">
                          <Label>Empresa</Label>
                          <Select value={empresaSeleccionada} onValueChange={setEmpresaSeleccionada}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una empresa" />
                            </SelectTrigger>
                            <SelectContent>
                              {empresas.map((e) => (
                                <SelectItem key={e.idEmpresa} value={String(e.idEmpresa)}>
                                  {e.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Tarifa dropdown filtrada */}
                      <div className="space-y-2">
                        <Label>Tarifa de Admisión</Label>
                        <Select value={selectedTarifa} onValueChange={(val) => {
                          setSelectedTarifa(val);
                          const tarifa = tarifas.find((t) => String(t.idTarifaAdmision) === val);
                          if (tarifa) {
                            const yaGenerados = new Set(
                              receipts.flatMap((r) => r.detalles.map((d) => d.idConceptoPago))
                            );
                            const aplicables = tarifa.detalles.filter((d) => d.esAplicable);
                            const mensualidades = aplicables.filter((d) =>
                              d.nombreConcepto?.toUpperCase().includes("MENSUALIDAD") || d.nombreConcepto?.toUpperCase().includes("COLEGIATURA")
                            );
                            let seleccionados = aplicables
                              .filter((d) => !yaGenerados.has(d.idConceptoPago))
                              .map((d) => d.idConceptoPago);
                            if (mensualidades.length > 1) {
                              const excluir = mensualidades.slice(1).map((d) => d.idConceptoPago);
                              seleccionados = seleccionados.filter((id) => !excluir.includes(id));
                            }
                            setConceptosSeleccionados(seleccionados);
                          } else {
                            setConceptosSeleccionados([]);
                          }
                          setPromocionPorConcepto({});
                          setDescuentoPorcentaje("0");
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una tarifa de admisión" />
                          </SelectTrigger>
                          <SelectContent>
                            {tarifas
                              .filter((t) => t.esConvenioEmpresarial === (tipoTarifa === "convenio"))
                              .filter((t) => !applicant?.planEstudiosId || t.idPlanEstudios === applicant.planEstudiosId)
                              .map((t) => (
                                <SelectItem key={t.idTarifaAdmision} value={String(t.idTarifaAdmision)}>
                                  {t.nombre} — {t.clavePlanEstudios}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Detalle de tarifa con promociones por concepto */}
                      {selectedTarifa && (() => {
                        const tarifa = tarifas.find((t) => String(t.idTarifaAdmision) === selectedTarifa);
                        if (!tarifa) return null;
                        const detallesAplicables = tarifa.detalles.filter((d) => d.esAplicable);
                        const conceptosConRecibo = new Set(
                          receipts.flatMap((r) => r.detalles.map((d) => d.idConceptoPago))
                        );

                        // Calcular descuento por concepto según la promoción seleccionada
                        const calcularDescuentoConcepto = (idConceptoPago: number, monto: number): number => {
                          const idPromo = promocionPorConcepto[idConceptoPago];
                          if (!idPromo) return 0;
                          const promo = promociones.find((p) => p.idConvenio === idPromo);
                          if (!promo) return 0;
                          switch (promo.tipoBeneficio) {
                            case "PORCENTAJE":
                              return Math.round(monto * ((promo.descuentoPct ?? 0) / 100) * 100) / 100;
                            case "MONTO":
                              return Math.min(promo.monto ?? 0, monto);
                            case "EXENCION":
                              return monto;
                            default:
                              return 0;
                          }
                        };

                        const conceptosConCalculo = detallesAplicables
                          .filter((d) => conceptosSeleccionados.includes(d.idConceptoPago))
                          .map((d) => {
                            const descuento = calcularDescuentoConcepto(d.idConceptoPago, d.monto);
                            return { ...d, descuento, montoFinal: d.monto - descuento };
                          });

                        const totalFinal = conceptosConCalculo.reduce((s, c) => s + c.montoFinal, 0);
                        const totalDescuento = conceptosConCalculo.reduce((s, c) => s + c.descuento, 0);

                        return (
                          <div className="rounded-lg border p-4 bg-white space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">{tarifa.nombre}</p>
                                <p className="text-xs text-muted-foreground">{tarifa.nombrePlanEstudios}</p>
                              </div>
                              <div className="flex gap-1.5">
                                {tarifa.aplicaConvenioMensualidad && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Aplica convenio</span>
                                )}
                                {tarifa.esConvenioEmpresarial && (
                                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Costos Convenio</span>
                                )}
                              </div>
                            </div>

                            {/* Tabla de conceptos con promoción */}
                            <div className="border-t pt-2 space-y-1">
                              <div className="grid grid-cols-[auto_1fr_auto_minmax(160px,1fr)_auto] gap-x-3 gap-y-1.5 text-xs items-center">
                                <span className="font-medium text-muted-foreground"></span>
                                <span className="font-medium text-muted-foreground">Concepto</span>
                                <span className="font-medium text-muted-foreground text-right">Monto</span>
                                <span className="font-medium text-muted-foreground">Convenio</span>
                                <span className="font-medium text-muted-foreground text-right">Final</span>

                                {detallesAplicables.map((d) => {
                                  const yaGenerado = conceptosConRecibo.has(d.idConceptoPago);
                                  const checked = yaGenerado || conceptosSeleccionados.includes(d.idConceptoPago);
                                  const descConcepto = checked && !yaGenerado ? calcularDescuentoConcepto(d.idConceptoPago, d.monto) : 0;
                                  const final = d.monto - descConcepto;
                                  return (
                                    <React.Fragment key={d.idTarifaAdmisionDetalle}>
                                      <div>
                                        <Checkbox
                                          id={`concepto-${d.idTarifaAdmisionDetalle}`}
                                          checked={checked}
                                          disabled={yaGenerado}
                                          onCheckedChange={(val) => {
                                            if (yaGenerado) return;
                                            if (val) {
                                              setConceptosSeleccionados((prev) => [...prev, d.idConceptoPago]);
                                            } else {
                                              setConceptosSeleccionados((prev) => prev.filter((id) => id !== d.idConceptoPago));
                                              setPromocionPorConcepto((prev) => {
                                                const next = { ...prev };
                                                delete next[d.idConceptoPago];
                                                return next;
                                              });
                                            }
                                          }}
                                        />
                                      </div>
                                      <label
                                        htmlFor={`concepto-${d.idTarifaAdmisionDetalle}`}
                                        className={`${yaGenerado ? "text-green-600" : !checked ? "cursor-pointer line-through text-muted-foreground" : "cursor-pointer"}`}
                                      >
                                        {d.nombreConcepto} {yaGenerado && "✓"}
                                      </label>
                                      <span className={`text-right font-medium ${yaGenerado ? "text-green-600" : !checked ? "line-through text-muted-foreground" : ""}`}>
                                        {formatCurrency(d.monto)}
                                      </span>
                                      <div>
                                        {checked ? (
                                          <Select
                                            value={promocionPorConcepto[d.idConceptoPago] ? String(promocionPorConcepto[d.idConceptoPago]) : "none"}
                                            onValueChange={(val) => {
                                              setPromocionPorConcepto((prev) => ({
                                                ...prev,
                                                [d.idConceptoPago]: val === "none" ? null : parseInt(val),
                                              }));
                                            }}
                                          >
                                            <SelectTrigger className="h-7 text-xs">
                                              <SelectValue placeholder="Sin convenio" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">Sin convenio</SelectItem>
                                              {promociones.map((p) => (
                                                <SelectItem key={p.idConvenio} value={String(p.idConvenio)}>
                                                  {p.nombre} — {formatearBeneficio(p)}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                      </div>
                                      <span className={`text-right font-semibold ${!checked ? "text-muted-foreground" : descConcepto > 0 ? "text-green-600" : ""}`}>
                                        {checked ? formatCurrency(final) : "—"}
                                      </span>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Totales */}
                            <div className="border-t pt-2 space-y-1">
                              {totalDescuento > 0 && (
                                <div className="flex justify-between text-xs text-green-600">
                                  <span>Descuento total por promociones</span>
                                  <span>-{formatCurrency(totalDescuento)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-semibold">
                                <span>Total admisión</span>
                                <span>{formatCurrency(totalFinal)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Pago Completo (incluir mensualidades)</Label>
                          <p className="text-xs text-muted-foreground">
                            Genera también los recibos de mensualidad del primer cuatrimestre
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${pagoCompleto ? "text-muted-foreground" : "font-medium"}`}>No</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={pagoCompleto}
                            onClick={() => setPagoCompleto(!pagoCompleto)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${pagoCompleto ? "bg-primary" : "bg-gray-200"}`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${pagoCompleto ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                          <span className={`text-xs ${pagoCompleto ? "font-medium" : "text-muted-foreground"}`}>Sí</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={handleDescargarCotizacion}
                          disabled={!selectedTarifa || downloadingCotizacion}
                        >
                          {downloadingCotizacion ? "Descargando..." : "Descargar Cotización PDF"}
                        </Button>
                        <Button
                          onClick={handleGenerateFromTarifa}
                          disabled={!selectedTarifa || generatingFromTarifa}
                        >
                          {generatingFromTarifa ? "Generando..." : "Generar Recibos de Admisión"}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Por Concepto */}
              </Tabs>
            </div>

            {/* Lista de recibos */}
            <div className="space-y-3">
              <h3 className="font-semibold">Recibos ({receipts.length})</h3>

              {receipts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No hay recibos generados para este aspirante</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Usa las opciones de arriba para generar un recibo
                  </p>
                </div>
              ) : (
                receipts.map((recibo) => (
                  <div key={recibo.idRecibo} className="rounded-lg border p-4 transition-colors hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-semibold">
                              Folio: {recibo.folio ?? `#${recibo.idRecibo}`}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Emitido: {formatDate(recibo.fechaEmision)} | Vencimiento:{" "}
                              {formatDate(recibo.fechaVencimiento)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1">
                          {recibo.detalles.map((detalle) => (
                            <div
                              key={detalle.idReciboDetalle}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {detalle.descripcion} (x{detalle.cantidad})
                              </span>
                              <span className="font-medium">{formatCurrency(detalle.importe)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-1 border-t pt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>{formatCurrency(recibo.subtotal)}</span>
                          </div>
                          {recibo.descuento > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Descuento (Promoción):</span>
                              <span>-{formatCurrency(recibo.descuento)}</span>
                            </div>
                          )}
                          {recibo.recargos > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                              <span>Recargos:</span>
                              <span>+{formatCurrency(recibo.recargos)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrency(recibo.total)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Saldo Pendiente:</span>
                            <span className={recibo.saldo > 0 ? "text-orange-600" : "text-green-600"}>
                              {formatCurrency(recibo.saldo)}
                            </span>
                          </div>
                        </div>

                        {recibo.notas && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notas:</span> {recibo.notas}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2 items-end">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(recibo.estatus)}`}
                        >
                          {getStatusText(recibo.estatus)}
                        </span>
                        {recibo.saldo === recibo.total && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteConfirmation(recibo.idRecibo)}
                            disabled={deletingReceipt === recibo.idRecibo}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => setPaymentModalOpen(true)}
              disabled={stats.pendiente === 0}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar Pago
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmRepairOpen(true)}
              disabled={repairing}
              className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              {repairing ? "Reparando..." : "Reparar Recibos"}
            </Button>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
      <PaymentRegistrationModal
        open={paymentModalOpen}
        applicant={applicant}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentRegistered={() => {
          loadReceipts();
          onPaymentRegistered?.();
        }}
      />

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Recibo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar este recibo? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReceiptToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReceipt}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRepairOpen} onOpenChange={setConfirmRepairOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reparar Recibos</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas reparar todos los recibos sin detalles? Esto agregara lineas de detalle a los recibos que no las tienen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRepairReceipts}>
              Reparar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
