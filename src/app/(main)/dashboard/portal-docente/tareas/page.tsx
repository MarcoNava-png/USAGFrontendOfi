"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Eye,
  Loader2,
  NotebookPen,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  eliminarTarea,
  getMisGrupos,
  getTareas,
} from "@/services/docente-portal-service"
import type { GrupoMateriaDocente, TareaDocente } from "@/types/docente-portal"
import { toast } from "sonner"

import { SelectGrupo } from "../asistencia/_components/select-grupo"
import { CrearTareaDialog } from "./_components/crear-tarea-dialog"
import { EntregasTareaDialog } from "./_components/entregas-tarea-dialog"

export default function TareasDocentePage() {
  const [grupos, setGrupos] = useState<GrupoMateriaDocente[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState("")
  const [tareas, setTareas] = useState<TareaDocente[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [loadingTareas, setLoadingTareas] = useState(false)
  const [selectedTarea, setSelectedTarea] = useState<TareaDocente | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    getMisGrupos()
      .then(setGrupos)
      .catch(() => toast.error("Error al cargar grupos"))
      .finally(() => setLoadingGrupos(false))
  }, [])

  const loadTareas = useCallback(async () => {
    if (!selectedGrupo) {
      setTareas([])
      return
    }
    setLoadingTareas(true)
    try {
      const data = await getTareas(Number(selectedGrupo))
      setTareas(data)
    } catch {
      toast.error("Error al cargar tareas")
      setTareas([])
    } finally {
      setLoadingTareas(false)
    }
  }, [selectedGrupo])

  useEffect(() => {
    loadTareas()
  }, [loadTareas])

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await eliminarTarea(id)
      toast.success("Tarea eliminada")
      loadTareas()
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setDeleting(null)
    }
  }

  if (loadingGrupos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/portal-docente">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-orange-800 dark:from-orange-400 dark:to-orange-600 bg-clip-text text-transparent">
              Tareas
            </h1>
            <p className="text-muted-foreground mt-1">Crea tareas y revisa entregas de tus alumnos</p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <BookOpen className="h-3 w-3 mr-1" />
            Docente
          </Badge>
        </div>
        <Separator />
      </div>

      {/* Selector y boton crear */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="h-5 w-5 text-orange-600" />
            Seleccionar Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <SelectGrupo
              grupos={grupos}
              value={selectedGrupo}
              onValueChange={setSelectedGrupo}
            />
            {selectedGrupo && (
              <CrearTareaDialog
                idGrupoMateria={Number(selectedGrupo)}
                onSuccess={loadTareas}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      {selectedGrupo && (
        <div>
          {loadingTareas ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-12">
              <NotebookPen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay tareas creadas para este grupo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tareas.map((tarea) => {
                const vencida = new Date(tarea.fechaLimite) < new Date()
                return (
                  <Card key={tarea.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{tarea.titulo}</h3>
                            {vencida && <Badge variant="destructive" className="text-xs">Vencida</Badge>}
                            {tarea.totalPendientes > 0 && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                {tarea.totalPendientes} sin revisar
                              </Badge>
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
                            <span>{tarea.totalEntregas} entregas</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTarea(tarea)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Entregas
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(tarea.id)}
                            disabled={deleting === tarea.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deleting === tarea.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Dialog entregas */}
      {selectedTarea && (
        <EntregasTareaDialog
          tarea={selectedTarea}
          open={!!selectedTarea}
          onOpenChange={(open) => !open && setSelectedTarea(null)}
          onUpdate={loadTareas}
        />
      )}
    </div>
  )
}
