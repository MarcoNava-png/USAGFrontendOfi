"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Gift,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFinanzasIndicadores } from "@/services/dashboard-service";
import { FinanzasDashboard as FinanzasDashboardType, FinanzasIndicadores } from "@/types/dashboard";

import { IngresosSemanaChart } from "../charts/ingresos-semana-chart";
import { IngresosMensualesChart } from "../charts/ingresos-mensuales-chart";
import { RecibosStatusChart } from "../charts/recibos-status-chart";
import { MorosidadChart } from "../charts/morosidad-chart";
import { MetodoPagoChart } from "../charts/metodo-pago-chart";
import { AlertCard } from "../shared/alert-card";
import { QuickActions } from "../shared/quick-actions";
import { StatCard, StatGrid } from "../shared/stat-card";

interface FinanzasDashboardProps {
  data: FinanzasDashboardType;
}

export function FinanzasDashboard({ data }: FinanzasDashboardProps) {
  const [indicadores, setIndicadores] = useState<FinanzasIndicadores | null>(null);
  const [loadingIndicadores, setLoadingIndicadores] = useState(true);

  useEffect(() => {
    getFinanzasIndicadores()
      .then(setIndicadores)
      .catch(console.error)
      .finally(() => setLoadingIndicadores(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
              Panel de Finanzas
            </h1>
            <p className="text-muted-foreground mt-1">Control financiero y cobranza</p>
          </div>
          <Badge variant="outline" className="text-emerald-600 border-emerald-600">
            <DollarSign className="h-3 w-3 mr-1" />
            Finanzas
          </Badge>
        </div>
        <Separator />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Ingresos
        </h2>
        <StatGrid columns={4}>
          <StatCard
            title="Ingresos Hoy"
            value={`$${data.ingresosDia.toLocaleString("es-MX")}`}
            icon={DollarSign}
            gradient="from-emerald-500 to-emerald-600"
            link="/dashboard/cashier"
          />
          <StatCard
            title="Ingresos Semana"
            value={`$${data.ingresosSemana.toLocaleString("es-MX")}`}
            icon={TrendingUp}
            gradient="from-green-500 to-green-600"
            link="/dashboard/payments"
          />
          <StatCard
            title="Ingresos Mes"
            value={`$${data.ingresosMes.toLocaleString("es-MX")}`}
            icon={CreditCard}
            gradient="from-teal-500 to-teal-600"
            link="/dashboard/payments"
          />
          <StatCard
            title="Pagos Hoy"
            value={data.pagosHoy}
            description="Transacciones"
            icon={Receipt}
            gradient="from-cyan-500 to-cyan-600"
            link="/dashboard/cashier"
          />
        </StatGrid>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Cartera Vencida
        </h2>
        <StatGrid columns={3}>
          <StatCard
            title="Deuda Vencida"
            value={`$${data.deudaTotal.toLocaleString("es-MX")}`}
            icon={AlertTriangle}
            gradient="from-red-500 to-red-600"
            link="/dashboard/invoices"
          />
          <StatCard
            title="Estudiantes Morosos"
            value={data.totalMorosos}
            icon={Users}
            gradient="from-amber-500 to-amber-600"
            link="/dashboard/invoices"
          />
          <StatCard
            title="Estudiantes con Beca"
            value={data.estudiantesConBeca}
            description={`$${data.totalBecasDelMes.toLocaleString("es-MX")} en becas`}
            icon={Gift}
            gradient="from-purple-500 to-purple-600"
          />
        </StatGrid>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-blue-600" />
          Estado de Recibos
        </h2>
        <StatGrid columns={3}>
          <StatCard
            title="Pendientes"
            value={data.recibosPendientes}
            icon={Clock}
            gradient="from-blue-500 to-blue-600"
            link="/dashboard/invoices"
          />
          <StatCard
            title="Vencidos"
            value={data.recibosVencidos}
            icon={XCircle}
            gradient="from-red-500 to-red-600"
            link="/dashboard/invoices"
          />
          <StatCard
            title="Pagados (Mes)"
            value={data.recibosPagados}
            icon={CheckCircle}
            gradient="from-emerald-500 to-emerald-600"
            link="/dashboard/invoices"
          />
        </StatGrid>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
          Indicadores Gráficos
        </h2>
        {loadingIndicadores ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : indicadores ? (
          <div className="grid gap-6 md:grid-cols-2">
            <IngresosSemanaChart data={indicadores.ingresosPorDia} />
            <IngresosMensualesChart data={indicadores.ingresosMensuales} />
            <RecibosStatusChart data={indicadores.distribucionRecibos} />
            <MorosidadChart data={indicadores.morosidadPorRango} />
            <MetodoPagoChart data={indicadores.ingresosPorMetodoPago} />
          </div>
        ) : null}
      </div>

      {data.topMorosos.length > 0 && (
        <Card className="border-2 border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  Deuda Vencida
                </CardTitle>
                <CardDescription>Estudiantes con recibos vencidos</CardDescription>
              </div>
              <Link href="/dashboard/invoices">
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Adeudo</TableHead>
                  <TableHead className="text-center">Recibos</TableHead>
                  <TableHead className="text-right">Días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topMorosos.map((moroso: any) => (
                  <TableRow key={moroso.idEstudiante}>
                    <TableCell className="font-mono text-sm">{moroso.matricula}</TableCell>
                    <TableCell className="text-sm">{moroso.nombreCompleto}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{moroso.carrera || "—"}</TableCell>
                    <TableCell className="text-sm">{moroso.grupo || "—"}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      ${moroso.montoAdeudado.toLocaleString("es-MX")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive" className="text-xs">{moroso.recibosVencidos || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={moroso.diasVencido > 30 ? "destructive" : "secondary"}>
                        {moroso.diasVencido} días
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <AlertCard
          alerts={data.alertas}
          title="Alertas Financieras"
          description="Recibos y situaciones por atender"
        />
        <QuickActions actions={data.accionesRapidas} />
      </div>
    </div>
  );
}
