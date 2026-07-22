"use client";

import Link from "next/link";

import { ArrowRight, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CapturaCalificacionesCard() {
  return (
    <Card className="border-2" style={{ borderColor: "rgba(20, 53, 111, 0.2)" }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#14356F" }}>
          <CalendarClock className="h-5 w-5" />
          Captura de Calificaciones
        </CardTitle>
        <CardDescription>
          Consulta el estado de la captura por parcial y supervisa el avance de los docentes de tu campus.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard/captura-calificaciones">
          <Button className="text-white" style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}>
            Ver avance de captura
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
