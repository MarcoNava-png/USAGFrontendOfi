"use client";

import { useEffect, useState } from "react";

import { BookOpen, TrendingUp, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { obtenerMisCalificaciones } from "@/services/portal-alumno-service";
import type { MisCalificaciones, MiMateriaCalificacion } from "@/types/portal-alumno";

export default function MisCalificacionesPage() {
  const [datos, setDatos] = useState<MisCalificaciones | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await obtenerMisCalificaciones();
      setDatos(data);
    } catch {
      toast.error("Error al cargar las calificaciones");
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

  const colorCalif = (calif?: number) => {
    if (calif === undefined || calif === null) return "text-gray-500";
    if (calif >= 8) return "text-green-600";
    if (calif >= 6) return "text-blue-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
            <BookOpen className="h-8 w-8 text-purple-700" />
          </div>
          Mis Calificaciones
        </h1>
        <p className="text-muted-foreground mt-1">Consulta tu historial academico y evaluaciones</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Promedio general</p>
                <p className={`text-3xl font-bold ${colorCalif(datos.promedioGeneral)}`}>
                  {datos.promedioGeneral?.toFixed(2) ?? "—"}
                </p>
              </div>
              <Award className="w-10 h-10 text-purple-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aprobadas</p>
                <p className="text-3xl font-bold text-green-600">{datos.materiasAprobadas}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reprobadas</p>
                <p className="text-3xl font-bold text-red-600">{datos.materiasReprobadas}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En curso</p>
                <p className="text-3xl font-bold text-blue-600">{datos.materiasEnCurso}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materias</CardTitle>
          <CardDescription>Historial de calificaciones por materia</CardDescription>
        </CardHeader>
        <CardContent>
          {datos.materias.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No hay calificaciones registradas</div>
          ) : (
            <div className="space-y-4">
              {datos.materias.map((m) => (
                <MateriaCalificacionCard key={`${m.idMateria}-${m.grupoCodigo}`} materia={m} colorCalif={colorCalif} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MateriaCalificacionCard({ materia, colorCalif }: { materia: MiMateriaCalificacion; colorCalif: (c?: number) => string }) {
  return (
    <Card className="border-l-4" style={{
      borderLeftColor: materia.estatus === "APROBADA" ? "#16a34a" : materia.estatus === "REPROBADA" ? "#dc2626" : "#2563eb"
    }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">{materia.nombreMateria}</CardTitle>
            <CardDescription className="mt-1">
              <span className="font-mono text-xs">{materia.claveMateria}</span>
              {materia.nombreDocente && ` • ${materia.nombreDocente}`}
              {materia.grupoCodigo && ` • Grupo ${materia.grupoCodigo}`}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Final</p>
            <p className={`text-3xl font-bold ${colorCalif(materia.calificacionFinal)}`}>
              {materia.calificacionFinal?.toFixed(2) ?? "—"}
            </p>
            <Badge variant={materia.estatus === "APROBADA" ? "default" : materia.estatus === "REPROBADA" ? "destructive" : "secondary"} className="mt-1">
              {materia.estatus.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {materia.parciales.length > 0 && (
          <Tabs defaultValue={`parcial-${materia.parciales[0].idParciales}`}>
            <TabsList>
              {materia.parciales.map((p) => (
                <TabsTrigger key={p.idParciales} value={`parcial-${p.idParciales}`}>
                  Parcial {p.numeroParcial}
                  {p.calificacion !== undefined && p.calificacion !== null && (
                    <span className={`ml-2 font-bold ${colorCalif(p.calificacion)}`}>
                      {p.calificacion.toFixed(2)}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {materia.parciales.map((p) => (
              <TabsContent key={p.idParciales} value={`parcial-${p.idParciales}`}>
                {!p.publicado ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Calificaciones aun no publicadas
                  </div>
                ) : p.evaluaciones.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Sin evaluaciones capturadas
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evaluacion</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Peso</TableHead>
                        <TableHead className="text-center">Maximo</TableHead>
                        <TableHead className="text-center">Puntos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {p.evaluaciones.map((e) => (
                        <TableRow key={e.idCalificacionDetalle}>
                          <TableCell className="font-medium">{e.descripcion}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{e.tipo}</Badge></TableCell>
                          <TableCell className="text-center">{e.peso}%</TableCell>
                          <TableCell className="text-center">{e.puntajeMaximo}</TableCell>
                          <TableCell className="text-center font-bold">{e.puntaje?.toFixed(2) ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
