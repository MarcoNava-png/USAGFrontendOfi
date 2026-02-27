"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  deletePlaneacion,
  getMisGrupos,
  getPlaneaciones,
} from "@/services/docente-portal-service"
import type { GrupoMateriaDocente, PlaneacionDocente } from "@/types/docente-portal"
import { toast } from "sonner"

import { SelectGrupo } from "../asistencia/_components/select-grupo"
import { UploadPlaneacion } from "./_components/upload-planeacion"
import { ListaPlaneaciones } from "./_components/lista-planeaciones"

export default function PlaneacionesDocentePage() {
  const [grupos, setGrupos] = useState<GrupoMateriaDocente[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState("")
  const [planeaciones, setPlaneaciones] = useState<PlaneacionDocente[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [loadingPlaneaciones, setLoadingPlaneaciones] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Resolver base URL para descarga de archivos
  const apiBaseUrl = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "").replace("/api", "")
    : ""

  useEffect(() => {
    getMisGrupos()
      .then(setGrupos)
      .catch(() => toast.error("Error al cargar grupos"))
      .finally(() => setLoadingGrupos(false))
  }, [])

  const loadPlaneaciones = useCallback(async () => {
    if (!selectedGrupo) {
      setPlaneaciones([])
      return
    }
    setLoadingPlaneaciones(true)
    try {
      const data = await getPlaneaciones(Number(selectedGrupo))
      setPlaneaciones(data)
    } catch {
      toast.error("Error al cargar planeaciones")
      setPlaneaciones([])
    } finally {
      setLoadingPlaneaciones(false)
    }
  }, [selectedGrupo])

  useEffect(() => {
    loadPlaneaciones()
  }, [loadPlaneaciones])

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await deletePlaneacion(id)
      toast.success("Planeacion eliminada")
      loadPlaneaciones()
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
              Planeaciones
            </h1>
            <p className="text-muted-foreground mt-1">Sube y administra tus planeaciones por materia</p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <BookOpen className="h-3 w-3 mr-1" />
            Docente
          </Badge>
        </div>
        <Separator />
      </div>

      {/* Selector de grupo */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-orange-600" />
            Seleccionar Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SelectGrupo
            grupos={grupos}
            value={selectedGrupo}
            onValueChange={setSelectedGrupo}
          />
        </CardContent>
      </Card>

      {selectedGrupo && (
        <>
          {/* Upload */}
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-orange-600" />
                Subir Planeacion
              </CardTitle>
              <CardDescription>
                Sube archivos PDF, DOC, DOCX, JPG o PNG (max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadPlaneacion
                idGrupoMateria={Number(selectedGrupo)}
                onSuccess={loadPlaneaciones}
              />
            </CardContent>
          </Card>

          {/* Lista */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-orange-600" />
                Planeaciones Subidas
                <Badge variant="secondary" className="ml-2">
                  {planeaciones.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPlaneaciones ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : (
                <ListaPlaneaciones
                  planeaciones={planeaciones}
                  onDelete={handleDelete}
                  deleting={deleting}
                  baseUrl={apiBaseUrl}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
