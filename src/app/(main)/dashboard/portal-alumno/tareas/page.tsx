"use client"

import { useEffect, useState } from "react"

import {
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Loader2,
  NotebookPen,
  Upload,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getTareasAlumno } from "@/services/docente-portal-service"
import type { TareaAlumno } from "@/types/docente-portal"
import { toast } from "sonner"

import { SubirEntregaDialog } from "./_components/subir-entrega-dialog"

export default function TareasAlumnoPage() {
  const [tareas, setTareas] = useState<TareaAlumno[]>([])
  const [loading, setLoading] = useState(true)
  const [entregando, setEntregando] = useState<TareaAlumno | null>(null)

  const loadTareas = async () => {
    try {
      const data = await getTareasAlumno()
      setTareas(data)
    } catch {
      toast.error("Error al cargar las tareas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTareas()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              Mis Tareas
            </h1>
            <p className="text-muted-foreground mt-1">Consulta y entrega tus tareas asignadas</p>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <GraduationCap className="h-3 w-3 mr-1" />
            Alumno
          </Badge>
        </div>
        <Separator />
      </div>

      {tareas.length === 0 ? (
        <div className="text-center py-12">
          <NotebookPen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium">Sin tareas asignadas</h3>
          <p className="text-muted-foreground mt-1">No tienes tareas pendientes por el momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tareas.map((tarea) => {
            const vencida = new Date(tarea.fechaLimite) < new Date() && !tarea.entregada
            const diasRestantes = Math.ceil(
              (new Date(tarea.fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )

            return (
              <Card key={tarea.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{tarea.titulo}</h3>
                        {tarea.entregada ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Entregada
                          </Badge>
                        ) : vencida ? (
                          <Badge variant="destructive">Vencida</Badge>
                        ) : diasRestantes <= 3 ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <Clock className="h-3 w-3 mr-1" />
                            {diasRestantes} dias
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">{tarea.nombreMateria}</span>
                        {tarea.codigoGrupo && (
                          <>
                            <span>&middot;</span>
                            <span>{tarea.codigoGrupo}</span>
                          </>
                        )}
                      </div>

                      {tarea.descripcion && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {tarea.descripcion}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Limite: {new Date(tarea.fechaLimite).toLocaleDateString("es-MX")}
                        </span>
                        <span>{tarea.puntosMaximos} pts</span>
                        {tarea.nombreProfesor && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {tarea.nombreProfesor}
                          </span>
                        )}
                      </div>

                      {tarea.calificacion != null && (
                        <div className="mt-2 p-2 bg-muted/50 rounded">
                          <span className="text-sm font-medium">
                            Calificacion: {tarea.calificacion}/{tarea.puntosMaximos}
                          </span>
                          {tarea.retroalimentacion && (
                            <p className="text-sm text-muted-foreground mt-1">{tarea.retroalimentacion}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {!tarea.entregada && !vencida && (
                        <Button
                          size="sm"
                          onClick={() => setEntregando(tarea)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Entregar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {entregando && (
        <SubirEntregaDialog
          idTarea={entregando.id}
          titulo={entregando.titulo}
          open={!!entregando}
          onOpenChange={(open) => !open && setEntregando(null)}
          onSuccess={loadTareas}
        />
      )}
    </div>
  )
}
