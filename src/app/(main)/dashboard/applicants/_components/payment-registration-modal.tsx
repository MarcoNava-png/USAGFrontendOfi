"use client";

import { useEffect, useState } from "react";

import { DollarSign, CreditCard, Receipt, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApplicantReceipts } from "@/services/applicants-service";
import { getPaymentMethods } from "@/services/catalogs-service";
import { registrarYAplicarPago } from "@/services/payments-service";
import { Applicant, ReciboDto } from "@/types/applicant";
import { PaymentMethod } from "@/types/catalog";

interface PaymentRegistrationModalProps {
  open: boolean;
  applicant: Applicant | null;
  onClose: () => void;
  onPaymentRegistered: () => void;
}

export function PaymentRegistrationModal({
  open,
  applicant,
  onClose,
  onPaymentRegistered,
}: PaymentRegistrationModalProps) {
  const [receipts, setReceipts] = useState<ReciboDto[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [notas, setNotas] = useState<string>("");
  const [selectedReceipts, setSelectedReceipts] = useState<Map<number, { monto: number; idMedioPago: string; referencia: string }>>(new Map());

  useEffect(() => {
    if (open && applicant) {
      loadData();
    } else {
      resetForm();
    }
  }, [open, applicant]);

  const loadData = async () => {
    if (!applicant) return;

    setLoading(true);
    try {
      console.log("=== PASO 1: REPARACIÓN PREVENTIVA ===");
      try {
        const { repairReceiptsWithoutDetails } = await import("@/services/applicants-service");
        const resultadoReparacion = await repairReceiptsWithoutDetails();
        console.log("Reparación completada:", resultadoReparacion);
        if (resultadoReparacion.reparados > 0) {
          toast.success(`${resultadoReparacion.mensaje}`);
        }
      } catch (repairError: any) {
        console.warn("Error en reparación:", repairError);
      }

      console.log("=== PASO 2: CARGANDO RECIBOS ===");
      const [receiptsData, paymentMethodsData] = await Promise.all([
        getApplicantReceipts(applicant.idAspirante),
        getPaymentMethods(),
      ]);

      const pendingReceipts = receiptsData.filter((r) => r.saldo > 0);
      console.log(`Total: ${receiptsData.length}, Pendientes: ${pendingReceipts.length}`);

      console.log("=== PASO 3: VERIFICANDO DETALLES ===");
      pendingReceipts.forEach((r) => {
        console.log(`Recibo ${r.idRecibo}: ${r.detalles?.length ?? 0} detalles`);
        if (r.detalles) {
          r.detalles.forEach((d) => {
            console.log(`  - Detalle ${d.idReciboDetalle}: ${d.descripcion} = ${d.importe}`);
          });
        }
      });

      setReceipts(pendingReceipts);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNotas("");
    setSelectedReceipts(new Map());
  };

  const handleReceiptSelection = (reciboId: number, checked: boolean, maxAmount: number) => {
    const newSelection = new Map(selectedReceipts);
    if (checked) {
      newSelection.set(reciboId, { monto: maxAmount, idMedioPago: "", referencia: "" });
    } else {
      newSelection.delete(reciboId);
    }
    setSelectedReceipts(newSelection);
  };

  const updateReceiptPayment = (reciboId: number, field: "monto" | "idMedioPago" | "referencia", value: string) => {
    const newSelection = new Map(selectedReceipts);
    const current = newSelection.get(reciboId);
    if (!current) return;

    if (field === "monto") {
      const receipt = receipts.find((r) => r.idRecibo === reciboId);
      const maxAmount = receipt?.saldo ?? 0;
      current.monto = Math.min(parseFloat(value) || 0, maxAmount);
    } else {
      current[field] = value;
    }
    newSelection.set(reciboId, current);
    setSelectedReceipts(newSelection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicant) return;

    if (selectedReceipts.size === 0) {
      toast.error("Debe seleccionar al menos un recibo");
      return;
    }

    const sinMetodo = Array.from(selectedReceipts.entries()).filter(([, v]) => !v.idMedioPago);
    if (sinMetodo.length > 0) {
      toast.error("Seleccione un metodo de pago para cada recibo");
      return;
    }

    setSubmitting(true);
    try {
      const resultados = [];
      for (const [reciboId, data] of selectedReceipts.entries()) {
        const resultado = await registrarYAplicarPago({
          idRecibo: reciboId,
          idMedioPago: parseInt(data.idMedioPago),
          monto: data.monto,
          referencia: data.referencia || undefined,
          notas: notas || undefined,
        });
        resultados.push(resultado);
      }

      const todosCompletados = resultados.every(r => r.reciboPagadoCompletamente);
      const totalAplicado = resultados.reduce((sum, r) => sum + r.montoAplicado, 0);

      if (todosCompletados) {
        toast.success(`Todos los recibos fueron pagados. Total: ${formatCurrency(totalAplicado)}`);
      } else {
        toast.success(`Pago aplicado. Total: ${formatCurrency(totalAplicado)}`);
      }

      onPaymentRegistered();
      onClose();
      resetForm();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err?.response?.data?.error || err?.message || "Error al registrar el pago");
    } finally {
      setSubmitting(false);
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
      month: "short",
      day: "numeric",
    });
  };

  const totalSelected = Array.from(selectedReceipts.values()).reduce((sum, v) => sum + v.monto, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Registrar Pago - {applicant?.nombreCompleto}
          </DialogTitle>
          <DialogDescription>
            Complete la información del pago y seleccione los recibos a los que desea aplicarlo
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Cargando datos...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Recibos Pendientes ({receipts.length})
              </h3>

              {receipts.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No hay recibos pendientes de pago</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => {
                    const isSelected = selectedReceipts.has(receipt.idRecibo);
                    const receiptData = selectedReceipts.get(receipt.idRecibo);
                    const medioSel = paymentMethods.find((m) => m.idMedioPago.toString() === receiptData?.idMedioPago);

                    return (
                      <div
                        key={receipt.idRecibo}
                        className={`border rounded-lg p-3 space-y-2 transition-colors ${
                          isSelected ? "bg-blue-50 border-blue-300" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleReceiptSelection(receipt.idRecibo, checked as boolean, receipt.saldo)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold">
                                  {receipt.detalles?.[0]?.descripcion || receipt.folio || `Recibo #${receipt.idRecibo}`}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {receipt.folio} | Vence: {formatDate(receipt.fechaVencimiento)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-gray-900">{formatCurrency(receipt.saldo)}</p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-2 pt-2 border-t grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-[10px]">Metodo de pago</Label>
                                  <Select
                                    value={receiptData?.idMedioPago || ""}
                                    onValueChange={(v) => updateReceiptPayment(receipt.idRecibo, "idMedioPago", v)}
                                  >
                                    <SelectTrigger className="text-xs h-8">
                                      <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {paymentMethods.map((method) => (
                                        <SelectItem key={method.idMedioPago} value={method.idMedioPago.toString()} className="text-xs">
                                          {method.descripcion ?? method.clave}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-[10px]">Monto</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={receipt.saldo}
                                    value={receiptData?.monto ?? 0}
                                    onChange={(e) => updateReceiptPayment(receipt.idRecibo, "monto", e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>
                                {medioSel?.requiereReferencia && (
                                  <div>
                                    <Label className="text-[10px]">Referencia</Label>
                                    <Input
                                      placeholder="No. transaccion"
                                      value={receiptData?.referencia || ""}
                                      onChange={(e) => updateReceiptPayment(receipt.idRecibo, "referencia", e.target.value)}
                                      className="text-xs h-8"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedReceipts.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm text-blue-900">Resumen del Pago</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Recibos seleccionados:</span>
                    <span className="font-semibold">{selectedReceipts.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monto total a aplicar:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(totalSelected)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notas" className="text-xs">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="text-xs">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || selectedReceipts.size === 0}
                className="text-xs"
              >
                {submitting ? "Procesando..." : "Registrar Pago"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
