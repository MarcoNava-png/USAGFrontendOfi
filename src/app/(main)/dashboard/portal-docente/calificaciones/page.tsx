"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Loader2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  crearParcial,
  getDetalles,
  getMisGrupos,
  getParciales,
  upsertDetalle,
} from "@/services/docente-portal-service"
import {
  getEstadoCaptura,
  solicitarProrroga,
  type EstadoCaptura,
} from "@/services/ventana-captura-service"
import type {
  CalificacionDetalleItem,
  GrupoMateriaDocente,
  ParcialStatus,
} from "@/types/docente-portal"
import { CalendarClock, Lock, LockOpen } from "lucide-react"
import { toast } from "sonner"

import { SelectGrupoParcial } from "./_components/select-grupo-parcial"
import { EvaluacionFormDialog, type EvaluacionFormValues } from "./_components/evaluacion-form"

const tipoLabels: Record<number, string> = { 0: "Tarea", 1: "Examen", 2: "Proyecto" }

const fmtFecha = (d?: string | null) =>
  d ? new Date(d).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : ""

export default function CalificacionesDocentePage() {
  const [grupos, setGrupos] = useState<GrupoMateriaDocente[]>([])
  const [parciales, setParciales] = useState<ParcialStatus[]>([])
  const [detalles, setDetalles] = useState<CalificacionDetalleItem[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState("")
  const [selectedParcial, setSelectedParcial] = useState("")
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [loadingParciales, setLoadingParciales] = useState(false)
  const [loadingDetalles, setLoadingDetalles] = useState(false)
  const [abriendo, setAbriendo] = useState(false)
  const [estadoCaptura, setEstadoCaptura] = useState<EstadoCaptura | null>(null)

  // Cargar grupos
  useEffect(() => {
    getMisGrupos()
      .then(setGrupos)
      .catch(() => toast.error("Error al cargar grupos"))
      .finally(() => setLoadingGrupos(false))
  }, [])

  // Cargar parciales cuando cambia grupo
  useEffect(() => {
    if (!selectedGrupo) {
      setParciales([])
      setSelectedParcial("")
      return
    }
    setLoadingParciales(true)
    setSelectedParcial("")
    getParciales(Number(selectedGrupo))
      .then(setParciales)
      .catch(() => toast.error("Error al cargar parciales"))
      .finally(() => setLoadingParciales(false))
  }, [selectedGrupo])

  // Cargar detalles cuando cambia parcial
  const loadDetalles = useCallback(async () => {
    if (!selectedGrupo || !selectedParcial) {
      setDetalles([])
      return
    }
    setLoadingDetalles(true)
    try {
      const result = await getDetalles(Number(selectedGrupo), Number(selectedParcial))
      setDetalles(result.items)
    } catch {
      toast.error("Error al cargar detalles")
      setDetalles([])
    } finally {
      setLoadingDetalles(false)
    }
  }, [selectedGrupo, selectedParcial])

  useEffect(() => {
    loadDetalles()
  }, [loadDetalles])

  const currentParcial = parciales.find((p) => String(p.parcialId) === selectedParcial)
  const isOpen = currentParcial?.status === "Abierto"
  const isSinAbrir = currentParcial?.status === "Sin abrir"

  const loadEstadoCaptura = useCallback(() => {
    if (!selectedGrupo || !selectedParcial) {
      setEstadoCaptura(null)
      return
    }
    getEstadoCaptura(Number(selectedGrupo), Number(selectedParcial))
      .then(setEstadoCaptura)
      .catch(() => setEstadoCaptura(null))
  }, [selectedGrupo, selectedParcial])

  useEffect(() => {
    loadEstadoCaptura()
  }, [loadEstadoCaptura])

  const handleSolicitarProrroga = async () => {
    if (!selectedGrupo || !selectedParcial) return
    const motivo = window.prompt("Motivo de la solicitud de prórroga (opcional):") ?? undefined
    try {
      await solicitarProrroga(Number(selectedGrupo), Number(selectedParcial), motivo)
      toast.success("Solicitud de prórroga enviada")
      loadEstadoCaptura()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? "No se pudo enviar la solicitud")
    }
  }

  const handleAbrirParcial = async () => {
    if (!selectedGrupo || !selectedParcial) return
    setAbriendo(true)
    try {
      await crearParcial({
        grupoMateriaId: Number(selectedGrupo),
        parcialId: Number(selectedParcial),
        inscripcionId: 0,
      })
      toast.success("Parcial abierto correctamente")
      // Reload parciales
      const updated = await getParciales(Number(selectedGrupo))
      setParciales(updated)
    } catch {
      toast.error("Error al abrir parcial")
    } finally {
      setAbriendo(false)
    }
  }

  const handleAgregarEvaluacion = async (values: EvaluacionFormValues) => {
    if (!currentParcial?.calificacionParcialId || !selectedGrupo) return
    try {
      await upsertDetalle({
        calificacionParcialId: currentParcial.calificacionParcialId,
        grupoMateriaId: Number(selectedGrupo),
        inscripcionId: 0,
        tipoEvaluacionEnum: Number(values.tipoEvaluacion),
        tipoEvaluacionName: tipoLabels[Number(values.tipoEvaluacion)] || "Tarea",
        nombre: values.nombre,
        pesoEvaluacion: values.pesoEvaluacion,
        maxPuntos: values.maxPuntos,
        puntos: 0,
      })
      toast.success("Evaluacion agregada")
      loadDetalles()
    } catch {
      toast.error("Error al agregar evaluacion")
    }
  }

  if (loadingGrupos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  // Group detalles by evaluation name to show unique evaluations
  const evaluaciones = detalles.reduce<
    { nombre: string; tipo: string; pesoEvaluacion: number; maxPuntos: number }[]
  >((acc, d) => {
    if (!acc.find((e) => e.nombre === d.nombre)) {
      acc.push({
        nombre: d.nombre,
        tipo: d.tipoEvaluacionName,
        pesoEvaluacion: d.pesoEvaluacion,
        maxPuntos: d.maxPuntos,
      })
    }
    return acc
  }, [])

  const sumaPesos = evaluaciones.reduce((s, e) => s + e.pesoEvaluacion, 0)

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
              Calificaciones
            </h1>
            <p className="text-muted-foreground mt-1">Captura y administra calificaciones parciales</p>
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
            <GraduationCap className="h-5 w-5 text-orange-600" />
            Seleccionar Grupo y Parcial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingParciales ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Cargando parciales...</span>
            </div>
          ) : (
            <SelectGrupoParcial
              grupos={grupos}
              parciales={parciales}
              selectedGrupo={selectedGrupo}
              selectedParcial={selectedParcial}
              onGrupoChange={setSelectedGrupo}
              onParcialChange={setSelectedParcial}
            />
          )}
        </CardContent>
      </Card>

      {/* Ventana de captura (central) */}
      {selectedGrupo && selectedParcial && estadoCaptura && (
        <Card className={`border-2 ${estadoCaptura.puedeCapturar ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              {estadoCaptura.puedeCapturar ? (
                <LockOpen className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className={`font-semibold ${estadoCaptura.puedeCapturar ? "text-green-800" : "text-red-800"}`}>
                  {estadoCaptura.puedeCapturar ? "Captura abierta" : "Captura cerrada"}
                </p>
                <p className="text-sm text-muted-foreground">{estadoCaptura.mensaje}</p>
                {estadoCaptura.tieneProrrogaAprobada && estadoCaptura.fechaLimiteProrroga && (
                  <p className="text-sm text-green-700 flex items-center gap-1 mt-0.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Prórroga aprobada hasta {fmtFecha(estadoCaptura.fechaLimiteProrroga)}
                  </p>
                )}
              </div>
            </div>
            {!estadoCaptura.puedeCapturar && (
              estadoCaptura.prorrogaPendiente ? (
                <Badge variant="outline" className="text-amber-600 border-amber-300">Prórroga pendiente de autorización</Badge>
              ) : (
                <Button variant="outline" onClick={handleSolicitarProrroga} className="border-[#14356F] text-[#14356F]">
                  <CalendarClock className="h-4 w-4 mr-1" />
                  Solicitar prórroga
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado del parcial y acciones */}
      {selectedParcial && currentParcial && (
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{currentParcial.nombre}</CardTitle>
                <CardDescription>
                  Estado:{" "}
                  <Badge
                    variant="outline"
                    className={
                      isOpen
                        ? "text-emerald-600 border-emerald-300"
                        : isSinAbrir
                        ? "text-gray-500 border-gray-300"
                        : "text-red-600 border-red-300"
                    }
                  >
                    {currentParcial.status}
                  </Badge>
                  {evaluaciones.length > 0 && (
                    <span className="ml-3 text-sm">
                      Suma de pesos:{" "}
                      <span className={sumaPesos === 100 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                        {sumaPesos}%
                      </span>
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isSinAbrir && (
                  <Button
                    onClick={handleAbrirParcial}
                    disabled={abriendo}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {abriendo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Abrir Parcial
                  </Button>
                )}
                {isOpen && <EvaluacionFormDialog onSubmit={handleAgregarEvaluacion} />}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetalles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : evaluaciones.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {isSinAbrir
                    ? "Abre el parcial para comenzar a agregar evaluaciones"
                    : "Agrega evaluaciones para comenzar la captura de calificaciones"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Evaluacion</th>
                        <th className="p-3 text-center font-medium">Tipo</th>
                        <th className="p-3 text-center font-medium">Peso</th>
                        <th className="p-3 text-center font-medium">Max Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluaciones.map((ev) => (
                        <tr key={ev.nombre} className="border-b">
                          <td className="p-3 font-medium">{ev.nombre}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary">{ev.tipo}</Badge>
                          </td>
                          <td className="p-3 text-center">{ev.pesoEvaluacion}%</td>
                          <td className="p-3 text-center">{ev.maxPuntos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
