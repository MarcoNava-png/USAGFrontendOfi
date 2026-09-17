"use client"

import { useEffect, useMemo, useState } from "react"

import { useRouter } from "next/navigation"

import { ClipboardList, Search, GraduationCap, RefreshCw, Users } from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getGeneracionesParaCaptura, type GeneracionCaptura } from "@/services/calificaciones-service"
import { getCampusList } from "@/services/campus-service"
import { getStudyPlans } from "@/services/catalogs-service"
import { Campus } from "@/types/campus"
import { StudyPlan } from "@/types/catalog"

const STORAGE_KEY = "captura-historial-filtros-v2"

export default function CapturaHistorialPage() {
  const router = useRouter()
  const [campusList, setCampusList] = useState<Campus[]>([])
  const [planes, setPlanes] = useState<StudyPlan[]>([])
  const [campusId, setCampusId] = useState<string>("all")
  const [planId, setPlanId] = useState<string>("all")
  const [busqueda, setBusqueda] = useState("")
  const [generaciones, setGeneraciones] = useState<GeneracionCaptura[]>([])
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [camp, pl] = await Promise.all([getCampusList(), getStudyPlans()])
        setCampusList(camp.items ?? [])
        setPlanes(pl)
        try {
          const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null")
          if (saved) {
            setCampusId(saved.campusId ?? "all")
            setPlanId(saved.planId ?? "all")
            setBusqueda(saved.busqueda ?? "")
          }
        } catch {}
      } catch {
        toast.error("No se pudieron cargar los catálogos")
      } finally {
        setInitLoading(false)
      }
    })()
  }, [])

  const planesFiltrados = useMemo(() => {
    if (campusId === "all") return planes
    return planes.filter((p) => p.idCampus?.toString() === campusId)
  }, [planes, campusId])

  useEffect(() => {
    if (initLoading) return
    if (planId !== "all" && !planesFiltrados.some((p) => p.idPlanEstudios.toString() === planId)) {
      setPlanId("all")
    }
  }, [campusId])

  useEffect(() => {
    if (initLoading) return
    load()
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ campusId, planId, busqueda }))
    } catch {}
  }, [campusId, planId, initLoading])

  async function load() {
    try {
      setLoading(true)
      const data = await getGeneracionesParaCaptura({
        idCampus: campusId !== "all" ? Number(campusId) : undefined,
        idPlan: planId !== "all" ? Number(planId) : undefined,
      })
      setGeneraciones(data)
    } catch {
      toast.error("No se pudieron cargar las generaciones")
    } finally {
      setLoading(false)
    }
  }

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return generaciones
    return generaciones
      .map((g) => ({
        ...g,
        grupos: g.grupos.filter(
          (x) =>
            x.nombreGrupo.toLowerCase().includes(q) ||
            (x.codigoGrupo ?? "").toLowerCase().includes(q),
        ),
      }))
      .filter(
        (g) =>
          g.etiqueta.toLowerCase().includes(q) ||
          g.planEstudios.toLowerCase().includes(q) ||
          g.campus.toLowerCase().includes(q) ||
          g.grupos.length > 0,
      )
  }, [generaciones, busqueda])

  function barColor(p: number) {
    if (p >= 100) return "bg-green-600"
    if (p > 0) return "bg-amber-500"
    return "bg-muted-foreground/30"
  }

  function abrir(idGrupo: number) {
    router.push(`/dashboard/academic-management/historial-grupo/${idGrupo}`)
  }

  const totalGrupos = filtradas.reduce((a, g) => a + g.grupos.length, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Captura de historial de calificaciones
          </h1>
          <p className="text-muted-foreground">
            Cada generación con todos sus cuatrimestres. Entra a cada uno, captura y continúa con el siguiente.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={campusId} onValueChange={setCampusId}>
              <SelectTrigger className="md:w-56">
                <SelectValue placeholder="Campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los campus</SelectItem>
                {campusList.map((c) => (
                  <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="md:w-80">
                <SelectValue placeholder="Plan de estudios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                {planesFiltrados.map((p) => (
                  <SelectItem key={p.idPlanEstudios} value={String(p.idPlanEstudios)}>
                    {p.nombrePlanEstudios}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar generación o grupo…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading || initLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No hay generaciones para los filtros seleccionados.
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtradas.length} generación(es) · {totalGrupos} cuatrimestre(s)
          </p>
          <Accordion type="multiple" defaultValue={filtradas.slice(0, 1).map((_, i) => `g-${i}`)} className="space-y-2">
            {filtradas.map((g, gi) => (
              <AccordionItem key={gi} value={`g-${gi}`} className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-left pr-2">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">{g.etiqueta}</div>
                      <div className="text-xs text-muted-foreground">
                        {g.planEstudios} · {g.campus}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {g.totalGrupos} cuatri
                    </Badge>
                    {g.cuatrimestresPendientes > 0 ? (
                      <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
                        {g.cuatrimestresPendientes} pendiente(s)
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-green-100 text-green-800">Completa</Badge>
                    )}
                    <div className="hidden sm:flex items-center gap-2 w-32">
                      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${barColor(g.avance)}`} style={{ width: `${g.avance}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{g.avance}%</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto pb-1">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="text-left font-medium px-2 py-1">Cuatrimestre</th>
                          <th className="text-center font-medium px-2 py-1">Alumnos</th>
                          <th className="text-center font-medium px-2 py-1">Materias</th>
                          <th className="text-left font-medium px-2 py-1 min-w-[160px]">Avance</th>
                          <th className="text-right font-medium px-2 py-1">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.grupos.map((x) => (
                          <tr
                            key={x.idGrupo}
                            className="border-t cursor-pointer hover:bg-muted/40"
                            onClick={() => abrir(x.idGrupo)}
                          >
                            <td className="px-2 py-2">
                              <span className="font-medium">
                                {x.numeroCuatrimestre ? `${x.numeroCuatrimestre}º` : "—"}
                              </span>{" "}
                              <span className="text-muted-foreground">{x.nombreGrupo}</span>
                              <span className="text-[11px] text-muted-foreground ml-1">· {x.periodo}</span>
                            </td>
                            <td className="px-2 py-2 text-center">{x.totalAlumnos}</td>
                            <td className="px-2 py-2 text-center">{x.totalMaterias}</td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full ${barColor(x.porcentaje)}`} style={{ width: `${x.porcentaje}%` }} />
                                </div>
                                <span className="text-xs font-semibold w-8 text-right">{x.porcentaje}%</span>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <Button
                                size="sm"
                                variant={x.porcentaje === 100 ? "outline" : "default"}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  abrir(x.idGrupo)
                                }}
                              >
                                <GraduationCap className="h-4 w-4 mr-1" />
                                {x.porcentaje === 100 ? "Revisar" : "Capturar"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}
    </div>
  )
}
