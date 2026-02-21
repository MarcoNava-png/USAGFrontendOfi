"use client";

import { useState, useMemo } from "react";

import { DollarSign, Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCommissionReport,
  type ComisionReporteDto,
  type UsuarioComisionDto,
} from "@/services/applicants-service";
import { usePermissions } from "@/hooks/use-permissions";
import { SYSTEM_ROLES } from "@/types/permissions";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

function getDefaultDates() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    desde: firstDay.toISOString().split("T")[0],
    hasta: now.toISOString().split("T")[0],
  };
}

function UserCommissionCard({ user }: { user: UsuarioComisionDto }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              {user.nombreUsuario}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {user.totalRegistros} aspirante(s) registrado(s) | Pagos recibidos: {formatCurrency(user.totalPagosRecibidos)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Comisión total</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(user.totalComision)}</p>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1 rounded bg-blue-50 p-2 text-center">
            <p className="text-[10px] text-blue-600 font-medium">Por registros</p>
            <p className="text-sm font-semibold text-blue-800">{formatCurrency(user.comisionRegistros)}</p>
          </div>
          <div className="flex-1 rounded bg-green-50 p-2 text-center">
            <p className="text-[10px] text-green-600 font-medium">Por pagos</p>
            <p className="text-sm font-semibold text-green-800">{formatCurrency(user.comisionPagos)}</p>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-left">ID</th>
                <th className="py-2 text-left">Aspirante</th>
                <th className="py-2 text-left">Fecha Registro</th>
                <th className="py-2 text-left">Estatus</th>
                <th className="py-2 text-right">Pagado</th>
                <th className="py-2 text-right">Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {user.detalle.map((d) => (
                <tr key={d.idAspirante} className="hover:bg-gray-50">
                  <td className="py-1.5">{d.idAspirante}</td>
                  <td className="py-1.5 font-medium">{d.nombreCompleto}</td>
                  <td className="py-1.5">{new Date(d.fechaRegistro).toLocaleDateString("es-MX")}</td>
                  <td className="py-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      d.estatus === "Inscrito" ? "bg-green-100 text-green-700" :
                      d.estatus === "Rechazado" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {d.estatus}
                    </span>
                  </td>
                  <td className="py-1.5 text-right">{formatCurrency(d.totalPagado)}</td>
                  <td className="py-1.5 text-right font-semibold text-green-700">{formatCurrency(d.comisionGenerada)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      )}
    </Card>
  );
}

export default function CommissionsPage() {
  const defaults = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaults.desde);
  const [fechaHasta, setFechaHasta] = useState(defaults.hasta);
  const [comisionRegistro, setComisionRegistro] = useState(100);
  const [porcentajePago, setPorcentajePago] = useState(5);
  const [report, setReport] = useState<ComisionReporteDto | null>(null);
  const [loading, setLoading] = useState(false);
  const { primaryRole, isAdmin } = usePermissions();

  const isAdmisionesRole = useMemo(() => {
    const role = primaryRole?.toLowerCase();
    return role === SYSTEM_ROLES.ADMISIONES && !isAdmin;
  }, [primaryRole, isAdmin]);

  const canEditParams = useMemo(() => {
    const role = primaryRole?.toLowerCase();
    return isAdmin || role === SYSTEM_ROLES.DIRECTOR || role === SYSTEM_ROLES.FINANZAS;
  }, [primaryRole, isAdmin]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const data = await getCommissionReport({
        fechaDesde: new Date(fechaDesde).toISOString(),
        fechaHasta: new Date(fechaHasta + "T23:59:59").toISOString(),
        comisionPorRegistro: comisionRegistro,
        porcentajePorPago: porcentajePago,
      });
      setReport(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al calcular comisiones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="@container/main flex flex-col gap-4 space-y-4 md:gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))" }}
          >
            <DollarSign className="h-8 w-8" style={{ color: "#14356F" }} />
          </div>
          {isAdmisionesRole ? "Mis Comisiones" : "Reporte de Comisiones"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmisionesRole
            ? "Consulta tus comisiones por registro de aspirantes y pagos recibidos"
            : "Calcula comisiones por registro de aspirantes y porcentaje de pagos recibidos"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Parámetros del cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-2 ${canEditParams ? "md:grid-cols-4" : "md:grid-cols-2"} gap-4`}>
            <div className="space-y-1">
              <Label className="text-xs">Fecha desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="text-xs" />
            </div>
            {canEditParams && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Comisión por registro ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={comisionRegistro}
                    onChange={(e) => setComisionRegistro(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">% comisión sobre pagos</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={porcentajePago}
                    onChange={(e) => setPorcentajePago(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-4">
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="text-white"
              style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {loading ? "Calculando..." : "Calcular comisiones"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          <div className={`grid gap-4 ${isAdmisionesRole ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardDescription className="text-green-600">
                  {isAdmisionesRole ? "Mi Comisión Total" : "Total Comisiones"}
                </CardDescription>
                <CardTitle className="text-3xl text-green-700">
                  {formatCurrency(report.totalComisionesGlobal)}
                </CardTitle>
              </CardHeader>
            </Card>
            {!isAdmisionesRole && (
              <Card
                className="border-2"
                style={{ borderColor: "rgba(20, 53, 111, 0.2)", background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.05), rgba(30, 74, 143, 0.1))" }}
              >
                <CardHeader className="pb-2">
                  <CardDescription style={{ color: "#1e4a8f" }}>Usuarios con comisión</CardDescription>
                  <CardTitle className="text-3xl" style={{ color: "#14356F" }}>
                    {report.comisiones.length}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-600">
                  {isAdmisionesRole ? "Mis aspirantes registrados" : "Total aspirantes en periodo"}
                </CardDescription>
                <CardTitle className="text-3xl text-blue-700">
                  {report.comisiones.reduce((sum, u) => sum + u.totalRegistros, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {isAdmisionesRole ? "Detalle de mis comisiones" : "Detalle por usuario"}
            </h2>
            {report.comisiones.length === 0 ? (
              <Card className="py-8">
                <p className="text-center text-gray-500">
                  {isAdmisionesRole
                    ? "No tienes registros de aspirantes en el periodo seleccionado"
                    : "No hay registros de aspirantes en el periodo seleccionado"}
                </p>
              </Card>
            ) : (
              report.comisiones.map((user) => (
                <UserCommissionCard key={user.usuarioId} user={user} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
