"use client";

import { useEffect, useState } from "react";

import { BookOpen, User, MapPin, Clock, CalendarDays, Award } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { obtenerMisMaterias } from "@/services/portal-alumno-service";
import type { MisMaterias } from "@/types/portal-alumno";

const DIAS_ORDEN = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

const abreviaDia = (nombre: string) => {
  if (!nombre) return "-";
  const n = nombre.trim().toUpperCase();
  if (n.startsWith("LUN")) return "LUN";
  if (n.startsWith("MAR")) return "MAR";
  if (n.startsWith("MIE") || n.startsWith("MIÉ")) return "MIE";
  if (n.startsWith("JUE")) return "JUE";
  if (n.startsWith("VIE")) return "VIE";
  if (n.startsWith("SAB") || n.startsWith("SÁB")) return "SAB";
  if (n.startsWith("DOM")) return "DOM";
  return n.slice(0, 3);
};

export default function MisMateriasPage() {
  const [datos, setDatos] = useState<MisMaterias | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await obtenerMisMaterias();
      setDatos(data);
    } catch {
      toast.error("Error al cargar materias");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200">
            <BookOpen className="h-8 w-8 text-indigo-700" />
          </div>
          Mis Materias
        </h1>
        <p className="text-muted-foreground mt-1">
          Materias en las que estás inscrito
          {datos.periodoAcademico ? ` · ${datos.periodoAcademico}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-indigo-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total materias</p>
            <p className="text-2xl font-bold">{datos.totalMaterias}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">En curso</p>
            <p className="text-2xl font-bold text-amber-600">{datos.materiasEnCurso}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-emerald-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Con calificación final</p>
            <p className="text-2xl font-bold text-emerald-600">{datos.materiasConCalificacionFinal}</p>
          </CardContent>
        </Card>
      </div>

      {datos.materias.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No tienes materias inscritas en el período actual
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {datos.materias.map((m) => {
            const horariosOrdenados = [...m.horarios].sort((a, b) => {
              const diaA = DIAS_ORDEN.indexOf(abreviaDia(a.diaSemana));
              const diaB = DIAS_ORDEN.indexOf(abreviaDia(b.diaSemana));
              if (diaA !== diaB) return diaA - diaB;
              return a.horaInicio.localeCompare(b.horaInicio);
            });

            return (
              <Card key={m.idInscripcion} className="border-l-4 border-indigo-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{m.claveMateria}</span>
                        <span>{m.nombreMateria}</span>
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {m.docente ?? "Sin asignar"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {m.aula ?? "Sin aula"}
                        </span>
                        {m.numeroCuatrimestre != null && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" /> Cuatri {m.numeroCuatrimestre}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="outline">Grupo {m.grupoCodigo || "-"}</Badge>
                      {m.creditos > 0 && (
                        <Badge className="bg-indigo-100 text-indigo-700">
                          <Award className="w-3 h-3 mr-1" /> {m.creditos} créditos
                        </Badge>
                      )}
                      {m.calificacionFinal != null && (
                        <Badge
                          className={
                            m.calificacionFinal >= 6
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          Final: {m.calificacionFinal}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {horariosOrdenados.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">Sin horarios cargados</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Día</TableHead>
                          <TableHead>Horario</TableHead>
                          <TableHead>Aula</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {horariosOrdenados.map((h) => (
                          <TableRow key={h.idHorario}>
                            <TableCell className="font-medium">{h.diaSemana}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-sm">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                {h.horaInicio} - {h.horaFin}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{h.aula ?? "Sin aula"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
