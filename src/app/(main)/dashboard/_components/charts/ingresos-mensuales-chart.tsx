"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { IngresoMensual } from "@/types/dashboard";

const chartConfig = {
  monto: {
    label: "Ingresos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface IngresosMensualesChartProps {
  data: IngresoMensual[];
}

export function IngresosMensualesChart({ data }: IngresosMensualesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Ingresos</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} accessibilityLayer>
            <defs>
              <linearGradient id="fillIngresosMensuales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-monto)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-monto)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => [`$${Number(value).toLocaleString("es-MX")}`, "Ingresos"]}
                />
              }
            />
            <Area
              dataKey="monto"
              type="natural"
              fill="url(#fillIngresosMensuales)"
              stroke="var(--color-monto)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
