"use client";

import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DistribucionRecibos } from "@/types/dashboard";

const COLORS: Record<string, string> = {
  Pendiente: "var(--chart-1)",
  Parcial: "var(--chart-2)",
  Pagado: "var(--chart-3)",
  Vencido: "var(--chart-4)",
  Cancelado: "var(--chart-5)",
  Bonificado: "var(--chart-6, hsl(280 65% 60%))",
};

interface RecibosStatusChartProps {
  data: DistribucionRecibos[];
}

export function RecibosStatusChart({ data }: RecibosStatusChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: COLORS[item.estatus] || "var(--chart-1)",
  }));

  const totalRecibos = data.reduce((acc, item) => acc + item.cantidad, 0);

  const chartConfig = data.reduce(
    (acc, item) => {
      acc[item.estatus] = {
        label: item.estatus,
        color: COLORS[item.estatus] || "var(--chart-1)",
      };
      return acc;
    },
    { cantidad: { label: "Recibos" } } as ChartConfig,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Recibos</CardTitle>
        <CardDescription>Por estatus actual</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [`${value} recibos`, String(name)]}
                  hideLabel
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="cantidad"
              nameKey="estatus"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {totalRecibos.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
                          Recibos
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="estatus" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
