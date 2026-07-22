"use client";

import { MapPin, Clock, Tag, HandCoins } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarteraVencida } from "@/types/dashboard";

const money = (n: number) => `$${(n ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

function Barra({ label, sub, valor, max, color }: { label: string; sub?: string; valor: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((valor / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 tabular-nums font-semibold">{money(valor)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function CarteraVencidaSection({ data }: { data?: CarteraVencida }) {
  if (!data) return null;

  const maxCampus = Math.max(1, ...data.porCampus.map((x) => x.deuda));
  const maxConcepto = Math.max(1, ...data.porConcepto.map((x) => x.importe));
  const maxRecaudo = Math.max(1, ...data.recaudadoMesPorCampus.map((x) => x.deuda));
  const maxAnt = Math.max(1, ...data.porAntiguedad.map((x) => x.deuda));

  const antColor: Record<string, string> = {
    "1-30 días": "bg-amber-400",
    "31-60 días": "bg-orange-500",
    "61-90 días": "bg-rose-500",
    "90+ días": "bg-red-700",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-rose-600" />
          Cartera Vencida — ¿Dónde está la deuda?
        </CardTitle>
        <CardDescription>Deuda vencida repartida por campus, antigüedad y concepto · y dónde se recuperó este mes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Deuda vencida</div>
            <div className="text-xl font-bold text-rose-600">{money(data.totalVencida)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Alumnos</div>
            <div className="text-xl font-bold">{data.totalAlumnos}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Recuperado del mes</div>
            <div className="text-xl font-bold text-emerald-600">{money(data.recaudadoMesTotal)}</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4" /> Por campus
            </div>
            {data.porCampus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin deuda vencida 🎉</p>
            ) : (
              data.porCampus.map((c) => (
                <Barra key={c.campus} label={c.campus} sub={`${c.alumnos} alumno(s)`} valor={c.deuda} max={maxCampus} color="bg-rose-500" />
              ))
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Clock className="h-4 w-4" /> Por antigüedad
            </div>
            {data.porAntiguedad.map((a) => (
              <Barra key={a.rango} label={a.rango} sub={`${a.recibos} recibo(s)`} valor={a.deuda} max={maxAnt} color={antColor[a.rango] ?? "bg-orange-500"} />
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Tag className="h-4 w-4" /> Por concepto
            </div>
            {data.porConcepto.map((c) => (
              <Barra key={c.concepto} label={c.concepto} valor={c.importe} max={maxConcepto} color="bg-indigo-500" />
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <HandCoins className="h-4 w-4" /> Recuperado este mes (dónde se pagó)
            </div>
            {data.recaudadoMesPorCampus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos este mes.</p>
            ) : (
              data.recaudadoMesPorCampus.map((c) => (
                <Barra key={c.campus} label={c.campus} valor={c.deuda} max={maxRecaudo} color="bg-emerald-500" />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
