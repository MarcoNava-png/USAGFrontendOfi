"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { MorosidadRango } from "@/types/dashboard";

const chartConfig = {
  montoTotal: {
    label: "Monto",
    color: "var(--chart-4)",
  },
  estudiantes: {
    label: "Estudiantes",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

interface MorosidadChartProps {
  data: MorosidadRango[];
}

export function MorosidadChart({ data }: MorosidadChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Morosidad por Antigüedad</CardTitle>
        <CardDescription>Distribución de deuda vencida</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} layout="vertical" accessibilityLayer>
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              dataKey="rango"
              type="category"
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "montoTotal") return [`$${Number(value).toLocaleString("es-MX")}`, "Monto"];
                    return [String(value), "Estudiantes"];
                  }}
                />
              }
            />
            <Bar
              dataKey="montoTotal"
              fill="var(--color-montoTotal)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
