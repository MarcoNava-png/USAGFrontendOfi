"use client"

import { useEffect, useMemo, useState } from "react"

import { useParams, useRouter } from "next/navigation"

import { ArrowLeft, Save, GraduationCap, Loader2, FileText } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  getHistorialCohorte,
  guardarFinalDirecto,
  type HistorialCohorte,
  type CuatrimestreHistorial,
  type FinalDirectoItem,
} from "@/services/calificaciones-service"

const ordinal = (n: number) => `${n}º`

export default function HistorialGrupoPage() {
  const params = useParams()
  const router = useRouter()
  const idGrupo = Number(params.idGrupo)

  const [data, setData] = useState<HistorialCohorte | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edits, setEdits] = useState<Record<string, string>>({})

  useEffect(() => {
    if (idGrupo) load()
  }, [idGrupo])

  async function load() {
    try {
      setLoading(true)
      const res = await getHistorialCohorte(idGrupo)
      setData(res)
      setEdits({})
    } catch (err: any) {
      toast.error(err?.response?.data?.Error ?? "No se pudo cargar el historial del grupo")
    } finally {
      setLoading(false)
    }
  }

  const escala = data?.escalaMaxima ?? 10
  const minima = data?.minimaAprobatoria ?? 7

  const key = (idEst: number, idGm: number) => `${idEst}-${idGm}`

  // índice (idEst-idGm) -> {idInscripcion, original}
  const cellIndex = useMemo(() => {
    const map = new Map<string, { idInscripcion: number; original: number | null }>()
    data?.cuatrimestres.forEach((c) =>
      c.alumnos.forEach((a) =>
        a.calificaciones.forEach((cel) => {
          map.set(key(a.idEstudiante, cel.idGrupoMateria), {
            idInscripcion: cel.idInscripcion,
            original: cel.calificacionFinal,
          })
        }),
      ),
    )
    return map
  }, [data])

  function cellValue(idEst: number, idGm: number): string {
    const k = key(idEst, idGm)
    if (k in edits) return edits[k]
    const info = cellIndex.get(k)
    return info?.original !== null && info?.original !== undefined ? String(info.original) : ""
  }

  function onCellChange(idEst: number, idGm: number, raw: string) {
    setEdits((prev) => ({ ...prev, [key(idEst, idGm)]: raw }))
  }

  const dirtyCount = Object.keys(edits).length

  function colorClass(v: string): string {
    if (v === "") return ""
    const n = Number(v)
    if (isNaN(n)) return "border-red-400 text-red-600"
    return n >= minima ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
  }

  function promedioAlumno(c: CuatrimestreHistorial, idEst: number): string {
    const vals: number[] = []
    for (const m of c.materias) {
      const v = cellValue(idEst, m.idGrupoMateria)
      if (v !== "" && !isNaN(Number(v))) vals.push(Number(v))
    }
    if (!vals.length) return "-"
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  async function handleSave() {
    if (!data || dirtyCount === 0) return
    const porMateria = new Map<number, FinalDirectoItem[]>()
    let invalidos = 0

    for (const k of Object.keys(edits)) {
      const raw = edits[k].trim()
      const [idEstStr, idGmStr] = k.split("-")
      const idEst = Number(idEstStr)
      const idGm = Number(idGmStr)
      if (raw === "") continue
      const n = Number(raw)
      if (isNaN(n) || n < 0 || n > escala) {
        invalidos++
        continue
      }
      const info = cellIndex.get(k)
      const item: FinalDirectoItem = {
        inscripcionId: info?.idInscripcion ?? 0,
        idEstudiante: idEst,
        calificacionFinal: n,
      }
      const arr = porMateria.get(idGm) ?? []
      arr.push(item)
      porMateria.set(idGm, arr)
    }

    if (invalidos > 0) {
      toast.error(`${invalidos} calificación(es) fuera del rango 0-${escala}. Corrige antes de guardar.`)
      return
    }
    if (porMateria.size === 0) {
      toast.info("No hay calificaciones nuevas para guardar.")
      return
    }

    try {
      setSaving(true)
      let guardadas = 0
      for (const [idGm, items] of porMateria) {
        const res = await guardarFinalDirecto({ grupoMateriaId: idGm, items })
        guardadas += res.guardadas
      }
      toast.success(`${guardadas} calificación(es) guardada(s)`)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.Error ?? "Error al guardar las calificaciones")
    } finally {
      setSaving(false)
    }
  }

  const avanceCuatri = (c: CuatrimestreHistorial) => {
    const total = c.alumnos.length * c.materias.length
    if (!total) return 0
    let cap = 0
    c.alumnos.forEach((a) =>
      c.materias.forEach((m) => {
        if (cellValue(a.idEstudiante, m.idGrupoMateria) !== "") cap++
      }),
    )
    return Math.round((cap / total) * 100)
  }

  const defaultOpen = data && data.cuatrimestres.length > 0 ? [`c-${data.cuatrimestres[0].numeroCuatrimestre}`] : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Historial académico del grupo
          </h1>
          {data && (
            <p className="text-sm text-muted-foreground">
              {data.nombreGrupo} · {data.planEstudios}
              {data.campus ? ` · ${data.campus}` : ""}
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving || dirtyCount === 0}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
        </Button>
      </div>

      {!loading && data && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">Escala 0–{escala}</Badge>
          <Badge variant="outline">Mínima aprobatoria: {minima}</Badge>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" /> Aprobada
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-300" /> Reprobada
          </span>
          <span className="text-muted-foreground">· Las bajas se muestran atenuadas</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.cuatrimestres.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No se encontró historial para esta cohorte. Genera los cuatrimestres anteriores e inscribe a los alumnos.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-2">
          {data.cuatrimestres.map((c) => (
            <AccordionItem
              key={c.numeroCuatrimestre}
              value={`c-${c.numeroCuatrimestre}`}
              className="border rounded-lg px-3"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold">{ordinal(c.numeroCuatrimestre)} cuatrimestre</span>
                  <span className="text-xs text-muted-foreground">
                    {c.nombreGrupo} · {c.periodo}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {c.materias.length} mat · {c.alumnos.length} alum
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${avanceCuatri(c) === 100 ? "border-green-400 text-green-600" : ""}`}
                  >
                    {avanceCuatri(c)}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto pb-2">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="sticky left-0 z-10 bg-muted/60 text-left px-3 py-2 min-w-[220px] border-b">
                          Alumno
                        </th>
                        {c.materias.map((m) => (
                          <th
                            key={m.idGrupoMateria}
                            className="px-2 py-2 border-b text-center align-bottom min-w-[120px] max-w-[160px]"
                          >
                            <div className="text-[11px] font-semibold leading-tight whitespace-normal" title={m.nombre}>
                              {m.nombre || m.clave}
                            </div>
                            {m.clave && <div className="text-[10px] text-muted-foreground mt-0.5">{m.clave}</div>}
                          </th>
                        ))}
                        <th className="px-2 py-2 border-b text-center min-w-[64px]">Prom.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.alumnos.map((a) => (
                        <tr key={a.idEstudiante} className={`hover:bg-muted/30 ${a.esBaja ? "opacity-60" : ""}`}>
                          <td className="sticky left-0 z-10 bg-background px-3 py-1.5 border-b">
                            <div className="font-medium leading-tight flex items-center gap-1">
                              {a.nombreCompleto}
                              {a.esBaja && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0">
                                  Baja
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{a.matricula}</div>
                          </td>
                          {c.materias.map((m) => {
                            const v = cellValue(a.idEstudiante, m.idGrupoMateria)
                            return (
                              <td key={m.idGrupoMateria} className="px-1 py-1 border-b text-center">
                                <Input
                                  value={v}
                                  onChange={(e) => onCellChange(a.idEstudiante, m.idGrupoMateria, e.target.value)}
                                  inputMode="decimal"
                                  className={`h-8 w-16 mx-auto text-center px-1 ${colorClass(v)}`}
                                />
                              </td>
                            )
                          })}
                          <td className="px-2 py-1 border-b text-center font-semibold">
                            {promedioAlumno(c, a.idEstudiante)}
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
      )}

      {!loading && data && data.cuatrimestres.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Al guardar, estas calificaciones alimentan el kardex, la boleta y el acta del alumno.
        </p>
      )}
    </div>
  )
}
