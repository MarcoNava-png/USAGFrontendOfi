"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { IngresoDiario } from "@/types/dashboard";

const chartConfig = {
  monto: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface IngresosSemanaChartProps {
  data: IngresoDiario[];
}

export function IngresosSemanaChart({ data }: IngresosSemanaChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por Día</CardTitle>
        <CardDescription>Últimos 7 días</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="dia"
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
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.fecha) {
                      return new Date(payload[0].payload.fecha + "T12:00:00").toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      });
                    }
                    return String(_);
                  }}
                  formatter={(value) => [`$${Number(value).toLocaleString("es-MX")}`, "Ingresos"]}
                />
              }
            />
            <Bar
              dataKey="monto"
              fill="var(--color-monto)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
