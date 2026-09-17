"use client";

import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SeguroEstudianteDto } from "@/services/seguro-service";

function fmtFecha(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function VigenciaBadge({ estado }: { estado: string }) {
  if (estado === "Vigente") return <Badge className="bg-green-600 hover:bg-green-600 text-white">Vigente</Badge>;
  if (estado === "Vencida") return <Badge variant="destructive">Vencida</Badge>;
  return <Badge variant="secondary">Sin póliza</Badge>;
}

export function SeguroCard({ seguro, loading }: { seguro: SeguroEstudianteDto | null; loading?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Seguro escolar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : !seguro ? (
          <p className="text-sm text-muted-foreground">Sin seguro registrado.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <VigenciaBadge estado={seguro.estadoVigencia} />
              <Badge variant={seguro.pagado ? "default" : "outline"}>{seguro.estadoPago}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Aseguradora</dt>
                <dd>{seguro.aseguradora}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">N° de póliza</dt>
                <dd className="font-medium">{seguro.numeroPoliza ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Vigencia desde</dt>
                <dd>{fmtFecha(seguro.vigenciaDesde)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Vigencia hasta</dt>
                <dd>{fmtFecha(seguro.vigenciaHasta)}</dd>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
