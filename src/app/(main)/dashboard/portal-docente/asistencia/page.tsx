"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Loader2,
  Save,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getAsistenciaPorFecha,
  getMisGrupos,
  getResumenAsistencia,
  registrarAsistencia,
} from "@/services/docente-portal-service"
import type { GrupoMateriaDocente, ResumenAsistencia as ResumenType } from "@/types/docente-portal"
import { toast } from "sonner"

import { SelectGrupo } from "./_components/select-grupo"
import {
  type AsistenciaRow,
  type EstadoAsistencia,
  TablaAsistencia,
  buildRowsFromApi,
} from "./_components/tabla-asistencia"
import { ResumenAsistenciaTable } from "./_components/resumen-asistencia"

export default function AsistenciaDocentePage() {
  const [grupos, setGrupos] = useState<GrupoMateriaDocente[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState<string>("")
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<AsistenciaRow[]>([])
  const [resumen, setResumen] = useState<ResumenType[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [loadingAsistencia, setLoadingAsistencia] = useState(false)
  const [loadingResumen, setLoadingResumen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("captura")

  // Cargar grupos
  useEffect(() => {
    getMisGrupos()
      .then(setGrupos)
      .catch(() => toast.error("Error al cargar grupos"))
      .finally(() => setLoadingGrupos(false))
  }, [])

  // Cargar asistencia cuando cambia grupo o fecha
  const loadAsistencia = useCallback(async () => {
    if (!selectedGrupo || !fecha) return
    setLoadingAsistencia(true)
    try {
      const data = await getAsistenciaPorFecha(Number(selectedGrupo), fecha)
      setRows(buildRowsFromApi(data))
    } catch {
      toast.error("Error al cargar la asistencia")
      setRows([])
    } finally {
      setLoadingAsistencia(false)
    }
  }, [selectedGrupo, fecha])

  useEffect(() => {
    loadAsistencia()
  }, [loadAsistencia])

  // Cargar resumen cuando cambia grupo o tab
  useEffect(() => {
    if (tab !== "resumen" || !selectedGrupo) return
    setLoadingResumen(true)
    getResumenAsistencia(Number(selectedGrupo))
      .then(setResumen)
      .catch(() => toast.error("Error al cargar resumen"))
      .finally(() => setLoadingResumen(false))
  }, [tab, selectedGrupo])

  const handleEstadoChange = (idInscripcion: number, estado: EstadoAsistencia) => {
    setRows((prev) =>
      prev.map((r) => (r.idInscripcion === idInscripcion ? { ...r, estado } : r))
    )
  }

  const handleSave = async () => {
    if (!selectedGrupo || rows.length === 0) return
    setSaving(true)
    try {
      const result = await registrarAsistencia({
        idGrupoMateria: Number(selectedGrupo),
        fecha,
        asistencias: rows.map((r) => ({
          idInscripcion: r.idInscripcion,
          presente: r.estado === "presente",
          justificada: r.estado === "justificada",
          motivoJustificacion: "",
        })),
      })
      toast.success(result.mensaje)
    } catch {
      toast.error("Error al guardar la asistencia")
    } finally {
      setSaving(false)
    }
  }

  const handleMarcarTodos = (estado: EstadoAsistencia) => {
    setRows((prev) => prev.map((r) => ({ ...r, estado })))
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
              Asistencia
            </h1>
            <p className="text-muted-foreground mt-1">Registra la asistencia de tus alumnos</p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <BookOpen className="h-3 w-3 mr-1" />
            Docente
          </Badge>
        </div>
        <Separator />
      </div>

      {/* Selectores */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-orange-600" />
            Seleccionar Grupo y Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <SelectGrupo
              grupos={grupos}
              value={selectedGrupo}
              onValueChange={setSelectedGrupo}
            />
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full sm:w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs Captura / Resumen */}
      {selectedGrupo && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="captura">
              <ClipboardList className="h-4 w-4 mr-2" />
              Captura
            </TabsTrigger>
            <TabsTrigger value="resumen">
              <CalendarDays className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="captura" className="space-y-4">
            {loadingAsistencia ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No hay estudiantes inscritos en este grupo</p>
              </div>
            ) : (
              <>
                {/* Acciones rapidas */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleMarcarTodos("presente")}>
                    Marcar todos presentes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleMarcarTodos("ausente")}>
                    Marcar todos ausentes
                  </Button>
                </div>

                <TablaAsistencia rows={rows} onChange={handleEstadoChange} />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Asistencia
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="resumen">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-5 w-5 text-orange-600" />
                  Resumen de Asistencia
                </CardTitle>
                <CardDescription>
                  Porcentaje de asistencia acumulada por alumno
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingResumen ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  </div>
                ) : (
                  <ResumenAsistenciaTable data={resumen} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
