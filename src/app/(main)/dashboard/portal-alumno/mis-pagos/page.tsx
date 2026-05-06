"use client";

import { useEffect, useState } from "react";

import { DollarSign, Receipt, AlertTriangle, CheckCircle, CreditCard, Eye } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { obtenerMisPagos, obtenerMiReciboDetalle } from "@/services/portal-alumno-service";
import type { MisPagos, MiRecibo } from "@/types/portal-alumno";

const formatoMoneda = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export default function MisPagosPage() {
  const [datos, setDatos] = useState<MisPagos | null>(null);
  const [loading, setLoading] = useState(true);
  const [reciboSeleccionado, setReciboSeleccionado] = useState<MiRecibo | null>(null);
  const [openDetalle, setOpenDetalle] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await obtenerMisPagos();
      setDatos(data);
    } catch {
      toast.error("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  }

  async function verDetalle(idRecibo: number) {
    try {
      const recibo = await obtenerMiReciboDetalle(idRecibo);
      setReciboSeleccionado(recibo);
      setOpenDetalle(true);
    } catch {
      toast.error("Error al cargar el detalle del recibo");
    }
  }

  const colorEstatus = (estatus: string, vencido: boolean) => {
    if (vencido) return "bg-red-100 text-red-700";
    if (estatus === "PAGADO") return "bg-green-100 text-green-700";
    if (estatus === "PARCIAL") return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!datos) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200">
            <DollarSign className="h-8 w-8 text-emerald-700" />
          </div>
          Mis Pagos
        </h1>
        <p className="text-muted-foreground mt-1">Consulta tus recibos, pagos y saldos pendientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total facturado</p>
            <p className="text-2xl font-bold">{formatoMoneda(datos.totalAdeudo)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total pagado</p>
            <p className="text-2xl font-bold text-green-600">{formatoMoneda(datos.totalPagado)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
            <p className="text-2xl font-bold text-amber-600">{formatoMoneda(datos.saldoPendiente)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Recibos vencidos
            </p>
            <p className="text-2xl font-bold text-red-600">{datos.recibosVencidos}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" /> Mis recibos</CardTitle>
          <CardDescription>{datos.recibos.length} recibos en total</CardDescription>
        </CardHeader>
        <CardContent>
          {datos.recibos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No hay recibos registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Emision</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Conceptos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Estatus</TableHead>
                  <TableHead className="text-center">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.recibos.map((r) => (
                  <TableRow key={r.idRecibo}>
                    <TableCell className="font-mono text-xs">{r.folio ?? `#${r.idRecibo}`}</TableCell>
                    <TableCell className="text-sm">{new Date(r.fechaEmision).toLocaleDateString("es-MX")}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(r.fechaVencimiento).toLocaleDateString("es-MX")}
                      {r.vencido && <span className="block text-xs text-red-600">Vencido {r.diasVencido}d</span>}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {r.detalles.map((d) => d.concepto ?? d.descripcion).join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatoMoneda(r.total)}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={r.saldo > 0 ? "text-red-600" : "text-green-600"}>
                        {formatoMoneda(r.saldo)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={colorEstatus(r.estatus, r.vencido)}>{r.estatus}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline" onClick={() => verDetalle(r.idRecibo)}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDetalle} onOpenChange={setOpenDetalle}>
        <DialogContent className="sm:max-w-[70vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Detalle del recibo
            </DialogTitle>
            <DialogDescription>
              {reciboSeleccionado?.folio && <span className="font-mono">{reciboSeleccionado.folio}</span>}
            </DialogDescription>
          </DialogHeader>

          {reciboSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Emision</p>
                  <p className="font-medium">{new Date(reciboSeleccionado.fechaEmision).toLocaleDateString("es-MX")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="font-medium">{new Date(reciboSeleccionado.fechaVencimiento).toLocaleDateString("es-MX")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold">{formatoMoneda(reciboSeleccionado.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className={`font-bold ${reciboSeleccionado.saldo > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatoMoneda(reciboSeleccionado.saldo)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Conceptos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reciboSeleccionado.detalles.map((d) => (
                      <TableRow key={d.idReciboDetalle}>
                        <TableCell>
                          <div className="font-medium">{d.concepto}</div>
                          <div className="text-xs text-muted-foreground">{d.descripcion}</div>
                        </TableCell>
                        <TableCell className="text-right">{d.cantidad}</TableCell>
                        <TableCell className="text-right">{formatoMoneda(d.precioUnitario)}</TableCell>
                        <TableCell className="text-right font-medium">{formatoMoneda(d.importe)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-1 text-sm bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatoMoneda(reciboSeleccionado.subtotal)}</span></div>
                {reciboSeleccionado.descuento > 0 && (
                  <div className="flex justify-between text-green-600"><span>Descuento</span><span>-{formatoMoneda(reciboSeleccionado.descuento)}</span></div>
                )}
                {reciboSeleccionado.recargos > 0 && (
                  <div className="flex justify-between text-red-600"><span>Recargos</span><span>+{formatoMoneda(reciboSeleccionado.recargos)}</span></div>
                )}
                <div className="flex justify-between font-bold pt-1 border-t"><span>Total</span><span>{formatoMoneda(reciboSeleccionado.total)}</span></div>
              </div>

              {reciboSeleccionado.pagos && reciboSeleccionado.pagos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" /> Pagos aplicados
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Folio pago</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Metodo</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reciboSeleccionado.pagos.map((p) => (
                        <TableRow key={p.idPago}>
                          <TableCell className="font-mono text-xs">{p.folioPago ?? `#${p.idPago}`}</TableCell>
                          <TableCell className="text-sm">{new Date(p.fechaPago).toLocaleDateString("es-MX")}</TableCell>
                          <TableCell><Badge variant="outline"><CreditCard className="w-3 h-3 mr-1" />{p.medioPago}</Badge></TableCell>
                          <TableCell className="text-xs">{p.referencia ?? "—"}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{formatoMoneda(p.montoAplicado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
