"use client"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CalificacionDetalleItem } from "@/types/docente-portal"

interface EstudianteRow {
  inscripcionId: number
  matricula: string
  nombreCompleto: string
}

interface TablaCalificacionesProps {
  estudiantes: EstudianteRow[]
  evaluaciones: { nombre: string; maxPuntos: number; pesoEvaluacion: number }[]
  calificaciones: CalificacionDetalleItem[]
  onPuntosChange: (inscripcionId: number, evaluacionNombre: string, puntos: number) => void
  readOnly?: boolean
}

export type { EstudianteRow }

export function TablaCalificaciones({
  estudiantes,
  evaluaciones,
  calificaciones,
  onPuntosChange,
  readOnly,
}: TablaCalificacionesProps) {
  const getPuntos = (inscripcionId: number, evaluacionNombre: string): string => {
    const cal = calificaciones.find(
      (c) =>
        c.nombre === evaluacionNombre &&
        calificaciones.filter((x) => x.nombre === evaluacionNombre).length > 0
    )
    // Find by matching CalificacionParcialId pattern - in practice we match by name+inscripcion
    const match = calificaciones.find((c) => {
      // CalificacionDetalle doesn't directly have inscripcionId - it's via CalificacionParcial
      // For the docente portal, we'll group by evaluation name
      return c.nombre === evaluacionNombre
    })
    return match ? String(match.puntos) : ""
  }

  if (evaluaciones.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Agrega evaluaciones para comenzar a capturar calificaciones
      </p>
    )
  }

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 sticky left-0 bg-background">#</TableHead>
            <TableHead className="w-32 sticky left-10 bg-background">Matricula</TableHead>
            <TableHead className="sticky left-[168px] bg-background">Nombre</TableHead>
            {evaluaciones.map((ev) => (
              <TableHead key={ev.nombre} className="text-center min-w-[120px]">
                <div className="space-y-0.5">
                  <div className="font-medium">{ev.nombre}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {ev.pesoEvaluacion}% / {ev.maxPuntos}pts
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {estudiantes.map((est, idx) => (
            <TableRow key={est.inscripcionId}>
              <TableCell className="text-muted-foreground sticky left-0 bg-background">
                {idx + 1}
              </TableCell>
              <TableCell className="font-mono text-sm sticky left-10 bg-background">
                {est.matricula}
              </TableCell>
              <TableCell className="sticky left-[168px] bg-background">
                {est.nombreCompleto}
              </TableCell>
              {evaluaciones.map((ev) => (
                <TableCell key={ev.nombre} className="text-center">
                  <Input
                    type="number"
                    min={0}
                    max={ev.maxPuntos}
                    step={0.5}
                    className="w-20 mx-auto text-center"
                    disabled={readOnly}
                    placeholder="—"
                    onChange={(e) =>
                      onPuntosChange(est.inscripcionId, ev.nombre, Number(e.target.value))
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
