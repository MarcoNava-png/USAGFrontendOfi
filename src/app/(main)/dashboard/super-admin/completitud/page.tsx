"use client"

import { useEffect, useMemo, useState } from "react"

import Link from "next/link"

import { ArrowLeft, ClipboardCheck, RefreshCw, AlertTriangle, Check, Minus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { tenantAdminService, type CompletitudTenant } from "@/services/tenant-admin-service"

const ITEMS: { key: string; label: string }[] = [
  { key: "campus", label: "Campus" },
  { key: "planes", label: "Planes" },
  { key: "materias", label: "Materias" },
  { key: "materiaPlan", label: "Mat. en plan" },
  { key: "periodos", label: "Periodos" },
  { key: "docentes", label: "Docentes" },
  { key: "conceptosPago", label: "Conceptos pago" },
  { key: "plantillasCobro", label: "Plantillas cobro" },
  { key: "configCalificaciones", label: "Config. calif." },
  { key: "parciales", label: "Parciales" },
]

function pctColor(p: number) {
  if (p >= 80) return "text-green-600"
  if (p >= 30) return "text-amber-600"
  return "text-red-600"
}

function barColor(p: number) {
  if (p >= 80) return "bg-green-600"
  if (p >= 30) return "bg-amber-500"
  return "bg-red-500"
}

export default function CompletitudPage() {
  const [data, setData] = useState<CompletitudTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    load(false)
  }, [])

  async function load(refrescar: boolean) {
    try {
      refrescar ? setRefreshing(true) : setLoading(true)
      const res = await tenantAdminService.getCompletitud(refrescar)
      setData(res)
      if (refrescar) toast.success("Datos actualizados")
    } catch (err) {
      toast.error("Error al cargar la completitud")
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const agremiados = useMemo(() => data.filter((d) => d.codigo !== "USAG"), [data])
  const enCero = agremiados.filter((d) => d.porcentaje === 0).length
  const conMigraciones = agremiados.filter((d) => d.migracionesPendientes).length
  const promedio = agremiados.length
    ? Math.round(agremiados.reduce((a, d) => a + d.porcentaje, 0) / agremiados.length)
    : 0

  const ordered = useMemo(() => {
    const usag = data.filter((d) => d.codigo === "USAG")
    const rest = agremiados
      .slice()
      .sort((a, b) => b.porcentaje - a.porcentaje || a.nombre.localeCompare(b.nombre))
    return [...usag, ...rest]
  }, [data, agremiados])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/super-admin/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Completitud de configuración
          </h1>
          <p className="text-muted-foreground">
            Estado de los 10 rubros obligatorios que cada escuela debe configurar
          </p>
        </div>
        <Button variant="outline" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Escuelas agremiadas", value: agremiados.length, color: "" },
          { label: "En 0% de configuración", value: enCero, color: "text-red-600" },
          { label: "Con migraciones pendientes", value: conMigraciones, color: "text-amber-600" },
          { label: "Promedio de avance", value: `${promedio}%`, color: pctColor(promedio) },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${k.color}`}>{loading ? "—" : k.value}</p>
              <p className="text-sm text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px] sticky left-0 bg-background">Escuela</TableHead>
                    <TableHead className="w-40">Avance</TableHead>
                    {ITEMS.map((it) => (
                      <TableHead key={it.key} className="text-center whitespace-nowrap px-2">
                        <span className="text-[11px]">{it.label}</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordered.map((t) => (
                    <TableRow key={t.idTenant}>
                      <TableCell className="sticky left-0 bg-background">
                        <div className="font-medium leading-tight">{t.nombre}</div>
                        <div className="text-xs text-muted-foreground">{t.codigo}</div>
                      </TableCell>
                      <TableCell>
                        {t.error ? (
                          <span className="text-xs text-red-600">Sin acceso</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full ${barColor(t.porcentaje)}`}
                                style={{ width: `${t.porcentaje}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold w-10 text-right ${pctColor(t.porcentaje)}`}>
                              {t.porcentaje}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                      {ITEMS.map((it) => {
                        const v = t.items?.[it.key] ?? 0
                        return (
                          <TableCell key={it.key} className="text-center px-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded ${
                                    v > 0 ? "bg-green-100 text-green-700" : "bg-red-50 text-red-400"
                                  }`}
                                >
                                  {v > 0 ? <Check className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {it.label}: {v > 0 ? `${v} registrado(s)` : "sin configurar"}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center">
                        {t.migracionesPendientes ? (
                          <Badge variant="outline" className="border-amber-400 text-amber-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Migrar
                          </Badge>
                        ) : t.porcentaje === 100 ? (
                          <Badge className="bg-green-100 text-green-800">Completa</Badge>
                        ) : t.porcentaje === 0 ? (
                          <Badge variant="destructive">Sin iniciar</Badge>
                        ) : (
                          <Badge variant="secondary">En proceso</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
