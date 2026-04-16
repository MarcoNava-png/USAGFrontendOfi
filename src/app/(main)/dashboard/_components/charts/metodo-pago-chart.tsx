"use client";

import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { IngresoMetodoPago } from "@/types/dashboard";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface MetodoPagoChartProps {
  data: IngresoMetodoPago[];
}

export function MetodoPagoChart({ data }: MetodoPagoChartProps) {
  const chartData = data.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length],
  }));

  const totalIngresos = data.reduce((acc, item) => acc + item.monto, 0);

  const chartConfig = data.reduce(
    (acc, item, i) => {
      acc[item.metodoPago] = {
        label: item.metodoPago,
        color: COLORS[i % COLORS.length],
      };
      return acc;
    },
    { monto: { label: "Monto" } } as ChartConfig,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por Método de Pago</CardTitle>
        <CardDescription>Mes actual</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [`$${Number(value).toLocaleString("es-MX")}`, String(name)]}
                  hideLabel
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="monto"
              nameKey="metodoPago"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                          ${(totalIngresos / 1000).toFixed(0)}k
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="metodoPago" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
