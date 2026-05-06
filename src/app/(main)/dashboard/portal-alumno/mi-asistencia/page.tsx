"use client";

import { useEffect, useState } from "react";

import { CalendarCheck, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { obtenerMiAsistencia } from "@/services/portal-alumno-service";
import type { MiAsistencia } from "@/types/portal-alumno";

export default function MiAsistenciaPage() {
  const [datos, setDatos] = useState<MiAsistencia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await obtenerMiAsistencia();
      setDatos(data);
    } catch {
      toast.error("Error al cargar la asistencia");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!datos) return null;

  const colorPorcentaje = (p: number) => {
    if (p >= 90) return "text-green-600";
    if (p >= 80) return "text-blue-600";
    if (p >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const estatusColor = (estatus: string) => {
    const upper = estatus.toUpperCase();
    if (upper === "PRESENTE") return "bg-green-100 text-green-700";
    if (upper === "AUSENTE") return "bg-red-100 text-red-700";
    if (upper === "RETARDO") return "bg-amber-100 text-amber-700";
    if (upper === "JUSTIFICADA") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
            <CalendarCheck className="h-8 w-8 text-green-700" />
          </div>
          Mi Asistencia
        </h1>
        <p className="text-muted-foreground mt-1">Consulta tu historial de asistencia por materia</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen general</CardTitle>
          <CardDescription>{datos.totalClases} clases registradas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Porcentaje de asistencia</span>
              <span className={`text-2xl font-bold ${colorPorcentaje(datos.porcentajeGeneral)}`}>
                {datos.porcentajeGeneral.toFixed(1)}%
              </span>
            </div>
            <Progress value={Number(datos.porcentajeGeneral)} className="h-3" />
            {datos.porcentajeGeneral < 80 && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Tu porcentaje esta por debajo del minimo recomendado (80%)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{datos.asistencias}</p>
              <p className="text-xs text-muted-foreground">Asistencias</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">{datos.faltas}</p>
              <p className="text-xs text-muted-foreground">Faltas</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-700">{datos.retardos}</p>
              <p className="text-xs text-muted-foreground">Retardos</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{datos.justificadas}</p>
              <p className="text-xs text-muted-foreground">Justificadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por materia</CardTitle>
        </CardHeader>
        <CardContent>
          {datos.materias.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No hay registros de asistencia</div>
          ) : (
            <Tabs defaultValue={`mat-${datos.materias[0].idMateria}`}>
              <TabsList className="flex-wrap h-auto">
                {datos.materias.map((m) => (
                  <TabsTrigger key={m.idMateria} value={`mat-${m.idMateria}`}>
                    <span className="truncate max-w-[150px]">{m.nombreMateria}</span>
                    <Badge variant="outline" className={`ml-2 ${colorPorcentaje(m.porcentaje)}`}>{m.porcentaje.toFixed(0)}%</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              {datos.materias.map((m) => (
                <TabsContent key={m.idMateria} value={`mat-${m.idMateria}`}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-green-50 p-2 rounded"><span className="font-bold text-green-700">{m.asistencias}</span> asistencias</div>
                      <div className="bg-red-50 p-2 rounded"><span className="font-bold text-red-700">{m.faltas}</span> faltas</div>
                      <div className="bg-amber-50 p-2 rounded"><span className="font-bold text-amber-700">{m.retardos}</span> retardos</div>
                      <div className="bg-blue-50 p-2 rounded"><span className="font-bold text-blue-700">{m.justificadas}</span> justificadas</div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Estatus</TableHead>
                          <TableHead>Observacion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {m.detalles.slice(0, 30).map((d, idx) => (
                          <TableRow key={`${m.idMateria}-${idx}`}>
                            <TableCell>{new Date(d.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                            <TableCell><Badge className={estatusColor(d.estatus)}>{d.estatus}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{d.observacion ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
